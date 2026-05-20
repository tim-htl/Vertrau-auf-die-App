import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { formatPerson, personProjection } from "./personen.js";

// Swipe + Match. Liken (LIKED) führt gegenseitig zu einem automatisch
// erzeugten Match + DIRECT-Chat. Passes (PASSED) entfernen das Profil aus
// der Swipe-Queue. Wer wen gemocht/abgelehnt hat, sieht nur der Liker selbst
// — RLS auf `likes` setzt das durch.

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function badRequest(message: string): Error {
  const err = new Error(message);
  (err as Error & { statusCode?: number }).statusCode = 400;
  return err;
}
function notFound(message: string): Error {
  const err = new Error(message);
  (err as Error & { statusCode?: number }).statusCode = 404;
  return err;
}

const createLikeSchema = z.object({
  likedId: z.string().uuid(),
  kind: z.enum(["LIKED", "PASSED"]).default("LIKED"),
});

// Kanonische Reihenfolge erzwingen: lexikalisch sortierte UUIDs als
// (profile1Id, profile2Id). So gibt's pro Paar genau einen Match-Row,
// egal wer zuerst liked.
function canonicalPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function matchingRoutes(app: FastifyInstance) {
  // POST /likes — Swipe-Entscheidung speichern. Bei gegenseitigem LIKED
  // automatisch Match + DIRECT-Chat + chat_teilnehmer (beide) in einer
  // Transaktion. Idempotent: erneuter Like aktualisiert kind, erzeugt
  // Match aber nur, wenn er noch nicht existiert.
  app.post("/likes", async (req) => {
    const user = await app.requireAuth(req);

    const parsed = createLikeSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest(
        "Invalid body: " + JSON.stringify(parsed.error.flatten().fieldErrors)
      );
    }
    if (parsed.data.likedId === user.id) {
      throw badRequest("Cannot like yourself.");
    }

    const target = await prisma.profile.findUnique({
      where: { id: parsed.data.likedId },
      select: { id: true },
    });
    if (!target) throw notFound("Profil nicht gefunden.");

    const result = await prisma.$transaction(async (tx) => {
      const like = await tx.like.upsert({
        where: {
          likerId_likedId: {
            likerId: user.id,
            likedId: parsed.data.likedId,
          },
        },
        update: { kind: parsed.data.kind },
        create: {
          likerId: user.id,
          likedId: parsed.data.likedId,
          kind: parsed.data.kind,
        },
      });

      // Match-Auflösung nur bei LIKED; PASSED ist Sackgasse.
      if (parsed.data.kind !== "LIKED") {
        return { like, match: null, chatId: null as string | null };
      }

      const reverse = await tx.like.findUnique({
        where: {
          likerId_likedId: {
            likerId: parsed.data.likedId,
            likedId: user.id,
          },
        },
      });
      if (reverse?.kind !== "LIKED") {
        return { like, match: null, chatId: null as string | null };
      }

      // Mutual like → Match falls noch nicht da, sonst idempotent.
      const [p1, p2] = canonicalPair(user.id, parsed.data.likedId);
      const existing = await tx.match.findUnique({
        where: { profile1Id_profile2Id: { profile1Id: p1, profile2Id: p2 } },
        include: { chat: { select: { id: true } } },
      });
      if (existing) {
        return { like, match: existing, chatId: existing.chat.id };
      }

      // Frisch matchen: DIRECT-Chat + beide chat_teilnehmer + Match-Row.
      const chat = await tx.chat.create({ data: { typ: "DIRECT" } });
      await tx.chatTeilnehmer.createMany({
        data: [
          { chatId: chat.id, profileId: p1 },
          { chatId: chat.id, profileId: p2 },
        ],
      });
      const match = await tx.match.create({
        data: { profile1Id: p1, profile2Id: p2, chatId: chat.id },
      });

      return { like, match, chatId: chat.id };
    });

    return result;
  });

  // GET /me/matches — alle Matches des Users mit Partner-Profil + Chat.
  app.get("/me/matches", async (req) => {
    const user = await app.requireAuth(req);

    const matches = await prisma.match.findMany({
      where: {
        OR: [{ profile1Id: user.id }, { profile2Id: user.id }],
      },
      orderBy: { createdAt: "desc" },
      include: {
        profile1: { select: { id: true, name: true, bilder: true } },
        profile2: { select: { id: true, name: true, bilder: true } },
        chat: { select: { id: true, updatedAt: true } },
      },
    });

    return {
      matches: matches.map((m) => {
        const other = m.profile1Id === user.id ? m.profile2 : m.profile1;
        return {
          chatId: m.chat.id,
          chatUpdatedAt: m.chat.updatedAt,
          other: {
            id: other.id,
            name: other.name,
            bild: other.bilder[0] ?? null,
          },
          matchedAt: m.createdAt,
        };
      }),
    };
  });

  // GET /personen/swipe — Profile, über die noch keine Swipe-Entscheidung
  // (weder LIKED noch PASSED) getroffen wurde, und die nicht der User
  // selbst sind. Order: zufällig wäre schöner; für jetzt deterministisch
  // by id für stabiles Verhalten + einfaches Testen.
  app.get("/personen/swipe", async (req) => {
    const user = await app.requireAuth(req);

    const limitRaw = parseInt((req.query as { limit?: string }).limit ?? "", 10);
    const limit = Math.min(
      Math.max(Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 20, 1),
      50
    );

    const decided = await prisma.like.findMany({
      where: { likerId: user.id },
      select: { likedId: true },
    });

    const where: Prisma.ProfileWhereInput = {
      id: { notIn: [...decided.map((d) => d.likedId), user.id] },
    };

    const candidates = await prisma.profile.findMany({
      where,
      take: limit,
      orderBy: { id: "asc" },
      include: personProjection,
    });

    return { personen: candidates.map(formatPerson) };
  });
}
