import type { FastifyInstance } from "fastify";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { alterFromGeburtsdatum } from "../lib/profile.js";

// Lese-Endpoints für die Personen-Liste und Profil-Details anderer User.
// Alle Endpoints erfordern Authentifizierung (Cluster 1 RLS: nur
// authenticated lesen profiles). Pagination via Cursor — skaliert auch
// bei vielen tausend Profilen.

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Welche Profile-Felder & Joins das Frontend braucht — bei Liste und Detail
// gleich, damit der Swipe-Stack und die Detail-Anzeige aus demselben Shape
// arbeiten können.
export const personProjection = {
  studiengang: {
    select: {
      id: true,
      name: true,
      abschluss: true,
      universitaet: { select: { id: true, name: true, kuerzel: true } },
    },
  },
  belegteModule: {
    select: {
      semester: true,
      modul: {
        select: {
          id: true,
          name: true,
          ects: true,
        },
      },
    },
  },
} satisfies Prisma.ProfileInclude;

export type PersonRow = Prisma.ProfileGetPayload<{ include: typeof personProjection }>;

export function formatPerson(profile: PersonRow) {
  const { geburtsdatum, studiengang, belegteModule, ...rest } = profile;
  return {
    ...rest,
    alter: alterFromGeburtsdatum(geburtsdatum),
    uni: studiengang
      ? { id: studiengang.universitaet.id, name: studiengang.universitaet.name, kuerzel: studiengang.universitaet.kuerzel }
      : null,
    studiengang: studiengang
      ? { id: studiengang.id, name: studiengang.name, abschluss: studiengang.abschluss }
      : null,
    module: belegteModule.map((u) => ({
      id: u.modul.id,
      name: u.modul.name,
      ects: u.modul.ects,
      semester: u.semester,
    })),
  };
}

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

export async function personenRoutes(app: FastifyInstance) {
  // GET /personen?limit=20&cursor=<lastId> — Cursor-basierte Pagination.
  // Schließt den eingeloggten User selbst aus (Personen-Tab zeigt andere).
  app.get<{ Querystring: { limit?: string; cursor?: string } }>(
    "/personen",
    async (req) => {
      const user = await app.requireAuth(req);

      const rawLimit = parseInt(req.query.limit ?? "", 10);
      const limit = Math.min(
        Math.max(Number.isFinite(rawLimit) && rawLimit > 0 ? rawLimit : DEFAULT_LIMIT, 1),
        MAX_LIMIT
      );
      const cursor = req.query.cursor;
      if (cursor && !UUID_REGEX.test(cursor)) {
        throw badRequest("Invalid cursor format: expected UUID.");
      }

      const profiles = await prisma.profile.findMany({
        where: { id: { not: user.id } },
        take: limit + 1, // ein Extra-Eintrag, um nextCursor sicher zu setzen
        skip: cursor ? 1 : 0,
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: { id: "asc" },
        include: personProjection,
      });

      const hasMore = profiles.length > limit;
      const items = hasMore ? profiles.slice(0, limit) : profiles;
      const nextCursor = hasMore ? items[items.length - 1]?.id ?? null : null;

      return {
        personen: items.map(formatPerson),
        nextCursor,
      };
    }
  );

  // GET /personen/:id — Profil-Detail.
  app.get<{ Params: { id: string } }>("/personen/:id", async (req) => {
    await app.requireAuth(req);
    if (!UUID_REGEX.test(req.params.id)) {
      throw badRequest("Invalid person id format: expected UUID.");
    }

    const profile = await prisma.profile.findUnique({
      where: { id: req.params.id },
      include: personProjection,
    });

    if (!profile) throw notFound("Person nicht gefunden.");

    return { person: formatPerson(profile) };
  });
}
