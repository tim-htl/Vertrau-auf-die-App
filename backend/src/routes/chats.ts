import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

// Chat-Endpoints: Senden/Lesen von Nachrichten, Liste der Chats, Vorschläge.
// Auto-Erzeugung von Gruppen-Chats (aus Aktivität) passiert in 2e,
// Auto-Erzeugung von 1:1-Chats (aus Match) passiert in 2f. Hier behandeln
// wir nur den Lebenszyklus existierender Chats.

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

function forbidden(message: string): Error {
  const err = new Error(message);
  (err as Error & { statusCode?: number }).statusCode = 403;
  return err;
}

// Zentraler Membership-Check: User muss Teilnehmer dieses Chats sein.
// 403 statt 404, weil 404 die Existenz des Chats verriete (Information
// Disclosure). 403 sagt "kein Zugriff" ohne mehr zu preiszugeben.
async function assertChatMember(chatId: string, profileId: string) {
  if (!UUID_REGEX.test(chatId)) {
    throw badRequest("Invalid chat id format: expected UUID.");
  }
  const member = await prisma.chatTeilnehmer.findUnique({
    where: { chatId_profileId: { chatId, profileId } },
  });
  if (!member) throw forbidden("Not a member of this chat.");
  return member;
}

// ── Validation schemas ──────────────────────────────────────────────────────

const sendMessageSchema = z
  .object({
    text: z.string().trim().min(1).max(2000).optional(),
    mediaUrl: z.string().url().optional(),
    mediaTyp: z.enum(["IMAGE", "VIDEO"]).optional(),
  })
  .refine((d) => !!d.text || !!d.mediaUrl, {
    message: "Either text or mediaUrl must be provided.",
  })
  .refine((d) => !d.mediaUrl || !!d.mediaTyp, {
    message: "mediaTyp is required when mediaUrl is provided.",
  });

const sendProposalSchema = z
  .object({
    titel: z.string().trim().min(1).max(120),
    bilder: z.array(z.string().url()).max(10).optional(),
    startAt: z.coerce.date(),
    locationId: z.string().uuid().optional(),
    aktivitaetId: z.string().uuid().optional(),
    customAdresseStrasse: z.string().trim().min(1).optional(),
    customAdressePlzOrt: z.string().trim().min(1).optional(),
    customKoordinatenLat: z.number().optional(),
    customKoordinatenLng: z.number().optional(),
  })
  .refine(
    (d) => {
      const hasLocation = !!d.locationId;
      const hasAktivitaet = !!d.aktivitaetId;
      const hasCustom = !!(
        d.customAdresseStrasse &&
        d.customAdressePlzOrt &&
        typeof d.customKoordinatenLat === "number" &&
        typeof d.customKoordinatenLng === "number"
      );
      return [hasLocation, hasAktivitaet, hasCustom].filter(Boolean).length === 1;
    },
    {
      message:
        "Exactly one source must be set: locationId, aktivitaetId, or a complete customAdresse + customKoordinaten.",
    }
  );

const updateProposalSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"]),
});

// ── Routes ──────────────────────────────────────────────────────────────────

export async function chatRoutes(app: FastifyInstance) {
  // GET /me/chats — alle Chats des Users, sortiert nach letzter Aktivität.
  // Liefert: andere Teilnehmer (ohne sich selbst), letzte Nachricht,
  // lastReadAt + stumm pro Membership. Frontend leitet Unread-Status aus
  // "lastMessage.createdAt > lastReadAt" ab.
  app.get("/me/chats", async (req) => {
    const user = await app.requireAuth(req);

    const memberships = await prisma.chatTeilnehmer.findMany({
      where: { profileId: user.id },
      orderBy: { chat: { updatedAt: "desc" } },
      include: {
        chat: {
          include: {
            teilnehmer: {
              include: {
                profile: { select: { id: true, name: true, bilder: true } },
              },
            },
            aktivitaet: { select: { id: true, titel: true, bilder: true } },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
              select: {
                id: true,
                senderId: true,
                text: true,
                mediaTyp: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    return {
      chats: memberships.map((m) => ({
        id: m.chat.id,
        typ: m.chat.typ,
        aktivitaet: m.chat.aktivitaet
          ? {
              id: m.chat.aktivitaet.id,
              titel: m.chat.aktivitaet.titel,
              bild: m.chat.aktivitaet.bilder[0] ?? null,
            }
          : null,
        teilnehmer: m.chat.teilnehmer
          .filter((t) => t.profileId !== user.id)
          .map((t) => ({
            id: t.profile.id,
            name: t.profile.name,
            bild: t.profile.bilder[0] ?? null,
          })),
        lastMessage: m.chat.messages[0] ?? null,
        lastReadAt: m.lastReadAt,
        stumm: m.stumm,
        updatedAt: m.chat.updatedAt,
      })),
    };
  });

  // GET /chats/:id/messages?limit=50&cursor=<lastId> — Nachrichten-Paginierung,
  // neueste zuerst (typische Chat-UX: man lädt ältere via "nach oben scrollen").
  app.get<{ Params: { id: string }; Querystring: { limit?: string; cursor?: string } }>(
    "/chats/:id/messages",
    async (req) => {
      const user = await app.requireAuth(req);
      await assertChatMember(req.params.id, user.id);

      const rawLimit = parseInt(req.query.limit ?? "", 10);
      const limit = Math.min(Math.max(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : 50, 1), 200);
      const cursor = req.query.cursor;
      if (cursor && !UUID_REGEX.test(cursor)) {
        throw badRequest("Invalid cursor format: expected UUID.");
      }

      const messages = await prisma.message.findMany({
        where: { chatId: req.params.id },
        take: limit + 1,
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { createdAt: "desc" },
        include: {
          sender: { select: { id: true, name: true, bilder: true } },
          meetingProposal: true,
        },
      });

      const hasMore = messages.length > limit;
      const items = hasMore ? messages.slice(0, limit) : messages;
      const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

      return {
        messages: items.map((m) => ({
          id: m.id,
          senderId: m.senderId,
          sender: m.sender
            ? { id: m.sender.id, name: m.sender.name, bild: m.sender.bilder[0] ?? null }
            : null,
          text: m.text,
          mediaUrl: m.mediaUrl,
          mediaTyp: m.mediaTyp,
          meetingProposal: m.meetingProposal,
          createdAt: m.createdAt,
        })),
        nextCursor,
      };
    }
  );

  // POST /chats/:id/messages — Text- oder Medien-Nachricht senden.
  // Bumpt chat.updatedAt → Chat-Liste sortiert neueste oben.
  app.post<{ Params: { id: string } }>("/chats/:id/messages", async (req) => {
    const user = await app.requireAuth(req);
    await assertChatMember(req.params.id, user.id);

    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest(
        "Invalid body: " + JSON.stringify(parsed.error.flatten().fieldErrors)
      );
    }

    const message = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          chatId: req.params.id,
          senderId: user.id,
          text: parsed.data.text ?? null,
          mediaUrl: parsed.data.mediaUrl ?? null,
          mediaTyp: parsed.data.mediaTyp ?? null,
        },
      });
      // Chat-Aktivität markieren — wichtig für Sortierung der Chat-Liste.
      await tx.chat.update({
        where: { id: req.params.id },
        data: { updatedAt: new Date() },
      });
      return msg;
    });

    return { message };
  });

  // POST /chats/:id/read — markiert Chat als gelesen bis JETZT.
  // Idempotent: erneuter Aufruf aktualisiert lastReadAt nur weiter, kein Fehler.
  // Bumpt chat.updatedAt NICHT (Lesen ist keine Aktivität für andere).
  app.post<{ Params: { id: string } }>("/chats/:id/read", async (req) => {
    const user = await app.requireAuth(req);
    await assertChatMember(req.params.id, user.id);

    const updated = await prisma.chatTeilnehmer.update({
      where: { chatId_profileId: { chatId: req.params.id, profileId: user.id } },
      data: { lastReadAt: new Date() },
      select: { lastReadAt: true },
    });

    return { lastReadAt: updated.lastReadAt };
  });

  // POST /chats/:id/proposals — Treffen-Vorschlag in einem Chat senden.
  // Erzeugt Message + MeetingProposal in einer Transaktion. Drei Quell-Modi
  // (locationId | aktivitaetId | custom) — vom Schema-refine erzwungen.
  app.post<{ Params: { id: string } }>("/chats/:id/proposals", async (req) => {
    const user = await app.requireAuth(req);
    await assertChatMember(req.params.id, user.id);

    const parsed = sendProposalSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest(
        "Invalid body: " + JSON.stringify(parsed.error.flatten().fieldErrors)
      );
    }

    // FK-Existenzcheck — sauberer 404 statt kryptischer Prisma-FK-Fehler.
    if (parsed.data.locationId) {
      const loc = await prisma.location.findUnique({
        where: { id: parsed.data.locationId },
        select: { id: true },
      });
      if (!loc) throw notFound("Location nicht gefunden.");
    }
    if (parsed.data.aktivitaetId) {
      const akt = await prisma.aktivitaet.findUnique({
        where: { id: parsed.data.aktivitaetId },
        select: { id: true },
      });
      if (!akt) throw notFound("Aktivität nicht gefunden.");
    }

    const result = await prisma.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          chatId: req.params.id,
          senderId: user.id,
        },
      });
      const proposal = await tx.meetingProposal.create({
        data: {
          messageId: message.id,
          titel: parsed.data.titel,
          bilder: parsed.data.bilder ?? [],
          startAt: parsed.data.startAt,
          locationId: parsed.data.locationId ?? null,
          aktivitaetId: parsed.data.aktivitaetId ?? null,
          customAdresseStrasse: parsed.data.customAdresseStrasse ?? null,
          customAdressePlzOrt: parsed.data.customAdressePlzOrt ?? null,
          customKoordinatenLat: parsed.data.customKoordinatenLat ?? null,
          customKoordinatenLng: parsed.data.customKoordinatenLng ?? null,
        },
      });
      await tx.chat.update({
        where: { id: req.params.id },
        data: { updatedAt: new Date() },
      });
      return { message, proposal };
    });

    return result;
  });

  // PATCH /meeting-proposals/:id — Empfänger nimmt an oder lehnt ab.
  // Nicht der Absender (der hat's ja vorgeschlagen). Nur in PENDING-Status
  // änderbar — schon entschiedene Vorschläge sind unveränderlich.
  app.patch<{ Params: { id: string } }>("/meeting-proposals/:id", async (req) => {
    const user = await app.requireAuth(req);
    if (!UUID_REGEX.test(req.params.id)) {
      throw badRequest("Invalid proposal id format: expected UUID.");
    }

    const parsed = updateProposalSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest(
        "Invalid body: " + JSON.stringify(parsed.error.flatten().fieldErrors)
      );
    }

    const proposal = await prisma.meetingProposal.findUnique({
      where: { id: req.params.id },
      include: { message: { select: { senderId: true, chatId: true } } },
    });
    if (!proposal) throw notFound("Vorschlag nicht gefunden.");

    // Empfänger muss Chat-Member sein.
    await assertChatMember(proposal.message.chatId, user.id);
    if (proposal.message.senderId === user.id) {
      throw forbidden("You cannot accept or decline your own proposal.");
    }
    if (proposal.status !== "PENDING") {
      throw badRequest("Proposal has already been decided.");
    }

    const now = new Date();

    // Gruppentreffen-Einladung: Die Annahme macht den Empfänger zum Teilnehmer
    // und fügt ihn dem Gruppen-Chat hinzu (gleiche Logik wie PATCH
    // /me/einladungen). Reine 1:1-Vorschläge (locationId/custom) setzen
    // nur den Status — keine Aktivität, kein Beitritt.
    if (proposal.aktivitaetId && parsed.data.status === "ACCEPTED") {
      const aktivitaet = await prisma.aktivitaet.findUnique({
        where: { id: proposal.aktivitaetId },
        include: {
          chat: { select: { id: true } },
          _count: { select: { teilnehmer: true } },
        },
      });
      if (!aktivitaet) throw notFound("Aktivität nicht gefunden.");
      if (!aktivitaet.chat) throw new Error("Internal: activity has no chat row.");

      const endTime = new Date(
        aktivitaet.startAt.getTime() + aktivitaet.dauerMinuten * 60_000
      );
      if ((aktivitaet.beendetAt && aktivitaet.beendetAt <= now) || endTime <= now) {
        throw badRequest("Activity has already ended.");
      }

      // Idempotenz: schon Teilnehmer? → nur Status markieren, nicht doppelt
      // beitreten (und Voll-Check überspringen, da kein neuer Platz belegt wird).
      const alreadyMember = await prisma.aktivitaetTeilnehmer.findUnique({
        where: {
          aktivitaetId_profileId: { aktivitaetId: aktivitaet.id, profileId: user.id },
        },
      });
      if (!alreadyMember && aktivitaet._count.teilnehmer >= aktivitaet.maxPlaetze) {
        throw badRequest("Activity is full.");
      }

      const groupChatId = aktivitaet.chat.id;

      const updated = await prisma.$transaction(async (tx) => {
        const p = await tx.meetingProposal.update({
          where: { id: req.params.id },
          data: { status: "ACCEPTED", decidedAt: now },
        });
        // Backing-Einladung auf ACCEPTED. Sie existiert normalerweise (vom
        // Einladungs-Endpoint), wird aber defensiv per upsert behandelt.
        await tx.aktivitaetEinladung.upsert({
          where: {
            aktivitaetId_profileId: { aktivitaetId: aktivitaet.id, profileId: user.id },
          },
          update: { status: "ACCEPTED", decidedAt: now },
          create: {
            aktivitaetId: aktivitaet.id,
            profileId: user.id,
            invitedById: proposal.message.senderId,
            status: "ACCEPTED",
            decidedAt: now,
          },
        });
        if (!alreadyMember) {
          await tx.aktivitaetTeilnehmer.create({
            data: { aktivitaetId: aktivitaet.id, profileId: user.id },
          });
          await tx.chatTeilnehmer.upsert({
            where: {
              chatId_profileId: { chatId: groupChatId, profileId: user.id },
            },
            update: {},
            create: { chatId: groupChatId, profileId: user.id },
          });
        }
        return p;
      });

      return { proposal: updated };
    }

    // Ablehnung oder 1:1-Vorschlag (ohne Aktivität): nur Status setzen.
    // Bei Gruppentreffen-Ablehnung zusätzlich die Backing-Einladung ablehnen.
    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.meetingProposal.update({
        where: { id: req.params.id },
        data: { status: parsed.data.status, decidedAt: now },
      });
      if (proposal.aktivitaetId && parsed.data.status === "DECLINED") {
        await tx.aktivitaetEinladung.updateMany({
          where: { aktivitaetId: proposal.aktivitaetId, profileId: user.id },
          data: { status: "DECLINED", decidedAt: now },
        });
      }
      return p;
    });

    return { proposal: updated };
  });
}
