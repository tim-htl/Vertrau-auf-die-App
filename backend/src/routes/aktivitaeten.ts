import type { FastifyInstance } from "fastify";
import type { Aktivitaet, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

// Aktivitaet-Endpoints: vollständiger Lebenszyklus eines Gruppentreffens.
//
// Beim Erstellen wird automatisch ein GROUP-Chat angelegt und der Ersteller
// als Teilnehmer + Chat-Mitglied + Admin hinterlegt. Beitreten / Verlassen
// pflegt beide Mitgliedschafts-Tabellen synchron in einer Transaktion.

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

function ensureUuid(value: string, paramName: string): void {
  if (!UUID_REGEX.test(value)) {
    throw badRequest(`Invalid ${paramName} format: expected UUID.`);
  }
}

// ── Status-Berechnung (nicht in DB gespeichert, siehe 1d-Memo) ──────────────
type Status = "offen" | "voll" | "beendet";

function computeStatus(
  beendetAt: Date | null,
  startAt: Date,
  dauerMinuten: number,
  teilnehmerCount: number,
  maxPlaetze: number
): Status {
  const endTime = new Date(startAt.getTime() + dauerMinuten * 60_000);
  if (beendetAt && beendetAt <= new Date()) return "beendet";
  if (endTime <= new Date()) return "beendet";
  if (teilnehmerCount >= maxPlaetze) return "voll";
  return "offen";
}

// ── Validation schemas ──────────────────────────────────────────────────────

const baseFields = {
  titel: z.string().trim().min(1).max(120),
  beschreibung: z.string().trim().min(1).max(2000),
  bilder: z.array(z.string().url()).min(1).max(10),
  adresseStrasse: z.string().trim().min(1),
  adressePlzOrt: z.string().trim().min(1),
  ortKurz: z.string().trim().min(1).max(80),
  koordinatenLat: z.number(),
  koordinatenLng: z.number(),
  startAt: z.coerce.date(),
  dauerMinuten: z.number().int().min(15).max(24 * 60),
  maxPlaetze: z.number().int().min(2).max(1000),
  sichtbarkeit: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  official: z.boolean().default(false),
  modulId: z.string().uuid().nullable().optional(),
  locationId: z.string().uuid().nullable().optional(),
};

const createAktivitaetSchema = z.object({
  ...baseFields,
  // Personen, die direkt eingeladen werden sollen. PRIVATE-Treffen brauchen
  // initial mindestens jemand zum Einladen, ist aber im API nicht erzwungen
  // (Admin kann später per POST /einladungen nachsenden).
  initialInvitations: z.array(z.string().uuid()).max(50).default([]),
});

const updateAktivitaetSchema = z
  .object({
    titel: baseFields.titel,
    beschreibung: baseFields.beschreibung,
    bilder: baseFields.bilder,
    adresseStrasse: baseFields.adresseStrasse,
    adressePlzOrt: baseFields.adressePlzOrt,
    ortKurz: baseFields.ortKurz,
    koordinatenLat: baseFields.koordinatenLat,
    koordinatenLng: baseFields.koordinatenLng,
    startAt: baseFields.startAt,
    dauerMinuten: baseFields.dauerMinuten,
    maxPlaetze: baseFields.maxPlaetze,
    sichtbarkeit: baseFields.sichtbarkeit,
    locationId: baseFields.locationId,
    beendetAt: z.coerce.date().nullable(),
  })
  .partial();

const inviteSchema = z.object({
  profileId: z.string().uuid(),
});

const updateEinladungSchema = z.object({
  status: z.enum(["ACCEPTED", "DECLINED"]),
});

const transferSchema = z.object({
  newAdminId: z.string().uuid(),
});

const listQuerySchema = z.object({
  upcoming: z.enum(["true", "false"]).optional(),
  official: z.enum(["true", "false"]).optional(),
  modulId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

// ── Output-Formatierung ─────────────────────────────────────────────────────

type AktivitaetWithRelations = Prisma.AktivitaetGetPayload<{
  include: {
    admin: { select: { id: true; name: true; bilder: true } };
    teilnehmer: {
      include: { profile: { select: { id: true; name: true; bilder: true } } };
    };
    modul: { select: { id: true; name: true; ects: true } };
    location: { select: { id: true; name: true; kategorie: true } };
    chat: { select: { id: true } };
    _count: { select: { teilnehmer: true; einladungen: true } };
  };
}>;

function formatAktivitaet(a: AktivitaetWithRelations) {
  return {
    id: a.id,
    titel: a.titel,
    beschreibung: a.beschreibung,
    bilder: a.bilder,
    adresseStrasse: a.adresseStrasse,
    adressePlzOrt: a.adressePlzOrt,
    ortKurz: a.ortKurz,
    koordinaten: { lat: a.koordinatenLat, lng: a.koordinatenLng },
    startAt: a.startAt,
    dauerMinuten: a.dauerMinuten,
    maxPlaetze: a.maxPlaetze,
    sichtbarkeit: a.sichtbarkeit,
    official: a.official,
    beendetAt: a.beendetAt,
    status: computeStatus(a.beendetAt, a.startAt, a.dauerMinuten, a._count.teilnehmer, a.maxPlaetze),
    anzahlTeilnehmer: a._count.teilnehmer,
    admin: { id: a.admin.id, name: a.admin.name, bild: a.admin.bilder[0] ?? null },
    teilnehmer: a.teilnehmer.map((t) => ({
      id: t.profile.id,
      name: t.profile.name,
      bild: t.profile.bilder[0] ?? null,
    })),
    modul: a.modul,
    location: a.location,
    chatId: a.chat?.id ?? null,
  };
}

const aktivitaetIncludes = {
  admin: { select: { id: true, name: true, bilder: true } },
  teilnehmer: {
    include: { profile: { select: { id: true, name: true, bilder: true } } },
  },
  modul: { select: { id: true, name: true, ects: true } },
  location: { select: { id: true, name: true, kategorie: true } },
  chat: { select: { id: true } },
  _count: { select: { teilnehmer: true, einladungen: true } },
} satisfies Prisma.AktivitaetInclude;

// ── Helpers ─────────────────────────────────────────────────────────────────

async function loadAktivitaet(id: string): Promise<AktivitaetWithRelations> {
  ensureUuid(id, "aktivitaet id");
  const aktivitaet = await prisma.aktivitaet.findUnique({
    where: { id },
    include: aktivitaetIncludes,
  });
  if (!aktivitaet) throw notFound("Aktivität nicht gefunden.");
  return aktivitaet;
}

async function assertAdmin(aktivitaet: Pick<Aktivitaet, "adminId">, profileId: string) {
  if (aktivitaet.adminId !== profileId) {
    throw forbidden("Only the activity admin can perform this action.");
  }
}

async function assertVisibleToUser(
  a: Pick<Aktivitaet, "id" | "sichtbarkeit" | "adminId">,
  profileId: string
) {
  if (a.sichtbarkeit === "PUBLIC") return;
  if (a.adminId === profileId) return;
  const memberOrInvited = await prisma.$transaction([
    prisma.aktivitaetTeilnehmer.findUnique({
      where: { aktivitaetId_profileId: { aktivitaetId: a.id, profileId } },
    }),
    prisma.aktivitaetEinladung.findUnique({
      where: { aktivitaetId_profileId: { aktivitaetId: a.id, profileId } },
    }),
  ]);
  if (!memberOrInvited[0] && !memberOrInvited[1]) {
    throw notFound("Aktivität nicht gefunden."); // verschleiert Existenz
  }
}

async function checkOfficialAllowed(profileId: string, official: boolean) {
  if (!official) return;
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { role: true },
  });
  if (!profile || (profile.role !== "EVENT_ADMIN" && profile.role !== "DEV_ADMIN")) {
    throw forbidden("Only event_admin or dev_admin may create official events.");
  }
}

// ── Routes ──────────────────────────────────────────────────────────────────

export async function aktivitaetRoutes(app: FastifyInstance) {
  // POST /aktivitaeten — Aktivität erstellen. Erzeugt in einer Transaktion:
  // Aktivitaet, zugehörigen GROUP-Chat, Admin als aktivitaet_teilnehmer +
  // chat_teilnehmer, optionale Einladungen für andere User.
  app.post("/aktivitaeten", async (req) => {
    const user = await app.requireAuth(req);
    const parsed = createAktivitaetSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest("Invalid body: " + JSON.stringify(parsed.error.flatten().fieldErrors));
    }

    await checkOfficialAllowed(user.id, parsed.data.official);

    // FK-Existenz vorab prüfen — sauberer 404 statt Prisma-FK-Fehler.
    if (parsed.data.modulId) {
      const m = await prisma.modul.findUnique({ where: { id: parsed.data.modulId }, select: { id: true } });
      if (!m) throw notFound("Modul nicht gefunden.");
    }
    if (parsed.data.locationId) {
      const l = await prisma.location.findUnique({ where: { id: parsed.data.locationId }, select: { id: true } });
      if (!l) throw notFound("Location nicht gefunden.");
    }
    if (parsed.data.initialInvitations.length > 0) {
      const profiles = await prisma.profile.findMany({
        where: { id: { in: parsed.data.initialInvitations } },
        select: { id: true },
      });
      if (profiles.length !== parsed.data.initialInvitations.length) {
        throw badRequest("One or more invited profileIds do not exist.");
      }
      // Selbst-Einladung würde unique constraint später knacken.
      if (parsed.data.initialInvitations.includes(user.id)) {
        throw badRequest("You cannot invite yourself.");
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const aktivitaet = await tx.aktivitaet.create({
        data: {
          titel: parsed.data.titel,
          beschreibung: parsed.data.beschreibung,
          bilder: parsed.data.bilder,
          adresseStrasse: parsed.data.adresseStrasse,
          adressePlzOrt: parsed.data.adressePlzOrt,
          ortKurz: parsed.data.ortKurz,
          koordinatenLat: parsed.data.koordinatenLat,
          koordinatenLng: parsed.data.koordinatenLng,
          startAt: parsed.data.startAt,
          dauerMinuten: parsed.data.dauerMinuten,
          maxPlaetze: parsed.data.maxPlaetze,
          sichtbarkeit: parsed.data.sichtbarkeit,
          official: parsed.data.official,
          modulId: parsed.data.modulId ?? null,
          locationId: parsed.data.locationId ?? null,
          adminId: user.id,
        },
      });

      const chat = await tx.chat.create({
        data: { typ: "GROUP", aktivitaetId: aktivitaet.id },
      });

      await tx.aktivitaetTeilnehmer.create({
        data: { aktivitaetId: aktivitaet.id, profileId: user.id },
      });

      await tx.chatTeilnehmer.create({
        data: { chatId: chat.id, profileId: user.id },
      });

      if (parsed.data.initialInvitations.length > 0) {
        await tx.aktivitaetEinladung.createMany({
          data: parsed.data.initialInvitations.map((profileId) => ({
            aktivitaetId: aktivitaet.id,
            profileId,
            invitedById: user.id,
          })),
        });
      }

      return aktivitaet.id;
    });

    const created = await loadAktivitaet(result);
    return { aktivitaet: formatAktivitaet(created) };
  });

  // GET /aktivitaeten — Liste mit Filtern. RLS sortiert PRIVATE-Aktivitäten
  // ohne Beteiligung schon weg, aber wir wenden hier zusätzlich App-Logik
  // für Filtern (upcoming/official/modulId) an.
  app.get("/aktivitaeten", async (req) => {
    const user = await app.requireAuth(req);
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw badRequest("Invalid query: " + JSON.stringify(parsed.error.flatten().fieldErrors));
    }
    const { upcoming, official, modulId, limit, offset } = parsed.data;

    // Sichtbarkeits-Filter (entspricht der RLS-Logik, hier nochmal explizit
    // damit RLS bei service_role-Anfragen — also unserem Backend — auch greift).
    const visibleFilter: Prisma.AktivitaetWhereInput = {
      OR: [
        { sichtbarkeit: "PUBLIC" },
        { adminId: user.id },
        { teilnehmer: { some: { profileId: user.id } } },
        { einladungen: { some: { profileId: user.id } } },
      ],
    };

    const filters: Prisma.AktivitaetWhereInput[] = [visibleFilter];
    if (upcoming === "true") filters.push({ startAt: { gte: new Date() } });
    if (official === "true") filters.push({ official: true });
    if (official === "false") filters.push({ official: false });
    if (modulId) filters.push({ modulId });

    const aktivitaeten = await prisma.aktivitaet.findMany({
      where: { AND: filters },
      orderBy: { startAt: "asc" },
      take: limit,
      skip: offset,
      include: aktivitaetIncludes,
    });

    return {
      aktivitaeten: aktivitaeten.map(formatAktivitaet),
      total: undefined as number | undefined, // optional: separate count-Query falls UI das braucht
    };
  });

  // GET /aktivitaeten/:id — Detail
  app.get<{ Params: { id: string } }>("/aktivitaeten/:id", async (req) => {
    const user = await app.requireAuth(req);
    const aktivitaet = await loadAktivitaet(req.params.id);
    await assertVisibleToUser(aktivitaet, user.id);
    return { aktivitaet: formatAktivitaet(aktivitaet) };
  });

  // PATCH /aktivitaeten/:id — nur Admin darf updaten
  app.patch<{ Params: { id: string } }>("/aktivitaeten/:id", async (req) => {
    const user = await app.requireAuth(req);
    const aktivitaet = await loadAktivitaet(req.params.id);
    await assertAdmin(aktivitaet, user.id);

    const parsed = updateAktivitaetSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest("Invalid body: " + JSON.stringify(parsed.error.flatten().fieldErrors));
    }

    // Wenn maxPlaetze sinkt: Konsistenzcheck (kann nicht unter aktuelle Teilnehmer-Zahl).
    if (parsed.data.maxPlaetze !== undefined && parsed.data.maxPlaetze < aktivitaet._count.teilnehmer) {
      throw badRequest(
        `maxPlaetze cannot be lower than current teilnehmer count (${aktivitaet._count.teilnehmer}).`
      );
    }

    if (parsed.data.locationId) {
      const l = await prisma.location.findUnique({
        where: { id: parsed.data.locationId },
        select: { id: true },
      });
      if (!l) throw notFound("Location nicht gefunden.");
    }

    await prisma.aktivitaet.update({
      where: { id: req.params.id },
      data: parsed.data,
    });

    const updated = await loadAktivitaet(req.params.id);
    return { aktivitaet: formatAktivitaet(updated) };
  });

  // POST /aktivitaeten/:id/join — nur PUBLIC, ohne Voll, ohne schon-drin.
  // PRIVATE-Aktivitäten verlangen explizit Einladungs-Annahme.
  app.post<{ Params: { id: string } }>("/aktivitaeten/:id/join", async (req) => {
    const user = await app.requireAuth(req);
    const aktivitaet = await loadAktivitaet(req.params.id);

    if (aktivitaet.sichtbarkeit === "PRIVATE") {
      throw forbidden("Private activities require an invitation acceptance, not /join.");
    }
    const endTime = new Date(aktivitaet.startAt.getTime() + aktivitaet.dauerMinuten * 60_000);
    if ((aktivitaet.beendetAt && aktivitaet.beendetAt <= new Date()) || endTime <= new Date()) {
      throw badRequest("Activity has already ended.");
    }
    if (aktivitaet._count.teilnehmer >= aktivitaet.maxPlaetze) {
      throw badRequest("Activity is full.");
    }
    const existing = await prisma.aktivitaetTeilnehmer.findUnique({
      where: { aktivitaetId_profileId: { aktivitaetId: aktivitaet.id, profileId: user.id } },
    });
    if (existing) throw badRequest("You are already a member of this activity.");

    if (!aktivitaet.chat) throw new Error("Internal: activity has no chat row.");
    const chatId = aktivitaet.chat.id;

    await prisma.$transaction([
      prisma.aktivitaetTeilnehmer.create({
        data: { aktivitaetId: aktivitaet.id, profileId: user.id },
      }),
      prisma.chatTeilnehmer.create({
        data: { chatId, profileId: user.id },
      }),
    ]);

    const updated = await loadAktivitaet(aktivitaet.id);
    return { aktivitaet: formatAktivitaet(updated) };
  });

  // POST /aktivitaeten/:id/leave — Teilnahme + Chat-Mitgliedschaft entfernen.
  // Admin kann nicht verlassen ohne vorher zu übertragen (Schema hat
  // ON DELETE RESTRICT auf adminId).
  app.post<{ Params: { id: string } }>("/aktivitaeten/:id/leave", async (req, reply) => {
    const user = await app.requireAuth(req);
    const aktivitaet = await loadAktivitaet(req.params.id);

    if (aktivitaet.adminId === user.id) {
      throw badRequest("Admins must transfer admin rights before leaving.");
    }
    const member = await prisma.aktivitaetTeilnehmer.findUnique({
      where: { aktivitaetId_profileId: { aktivitaetId: aktivitaet.id, profileId: user.id } },
    });
    if (!member) throw badRequest("You are not a member of this activity.");

    const chatId = aktivitaet.chat?.id;

    await prisma.$transaction([
      prisma.aktivitaetTeilnehmer.delete({
        where: { aktivitaetId_profileId: { aktivitaetId: aktivitaet.id, profileId: user.id } },
      }),
      ...(chatId
        ? [
            prisma.chatTeilnehmer.deleteMany({
              where: { chatId, profileId: user.id },
            }),
          ]
        : []),
    ]);

    reply.code(204).send();
  });

  // POST /aktivitaeten/:id/einladungen — Admin lädt jemanden ein.
  // Idempotent gegen frühere DECLINED/PENDING-Einladungen (re-invite),
  // verweigert ACCEPTED (User ist schon Mitglied).
  app.post<{ Params: { id: string } }>("/aktivitaeten/:id/einladungen", async (req) => {
    const user = await app.requireAuth(req);
    const aktivitaet = await loadAktivitaet(req.params.id);
    await assertAdmin(aktivitaet, user.id);

    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest("Invalid body: " + JSON.stringify(parsed.error.flatten().fieldErrors));
    }
    if (parsed.data.profileId === user.id) {
      throw badRequest("You cannot invite yourself.");
    }
    const targetExists = await prisma.profile.findUnique({
      where: { id: parsed.data.profileId },
      select: { id: true },
    });
    if (!targetExists) throw notFound("Profil nicht gefunden.");

    const existing = await prisma.aktivitaetEinladung.findUnique({
      where: {
        aktivitaetId_profileId: {
          aktivitaetId: aktivitaet.id,
          profileId: parsed.data.profileId,
        },
      },
    });
    if (existing?.status === "ACCEPTED") {
      throw badRequest("User is already a member of this activity.");
    }

    const einladung = await prisma.aktivitaetEinladung.upsert({
      where: {
        aktivitaetId_profileId: {
          aktivitaetId: aktivitaet.id,
          profileId: parsed.data.profileId,
        },
      },
      update: {
        status: "PENDING",
        decidedAt: null,
        invitedById: user.id,
      },
      create: {
        aktivitaetId: aktivitaet.id,
        profileId: parsed.data.profileId,
        invitedById: user.id,
      },
    });

    return { einladung };
  });

  // PATCH /me/einladungen/:aktivitaetId — Empfänger nimmt an oder lehnt ab.
  // Bei ACCEPTED zusätzlich Teilnehmer-Eintrag + Chat-Mitgliedschaft anlegen.
  app.patch<{ Params: { aktivitaetId: string } }>(
    "/me/einladungen/:aktivitaetId",
    async (req) => {
      const user = await app.requireAuth(req);
      ensureUuid(req.params.aktivitaetId, "aktivitaet id");

      const parsed = updateEinladungSchema.safeParse(req.body);
      if (!parsed.success) {
        throw badRequest("Invalid body: " + JSON.stringify(parsed.error.flatten().fieldErrors));
      }

      const einladung = await prisma.aktivitaetEinladung.findUnique({
        where: {
          aktivitaetId_profileId: {
            aktivitaetId: req.params.aktivitaetId,
            profileId: user.id,
          },
        },
      });
      if (!einladung) throw notFound("Einladung nicht gefunden.");
      if (einladung.status !== "PENDING") {
        throw badRequest("Invitation already decided.");
      }

      const aktivitaet = await loadAktivitaet(req.params.aktivitaetId);

      if (parsed.data.status === "ACCEPTED") {
        if (aktivitaet._count.teilnehmer >= aktivitaet.maxPlaetze) {
          throw badRequest("Activity is full.");
        }
        const endTime = new Date(aktivitaet.startAt.getTime() + aktivitaet.dauerMinuten * 60_000);
        if ((aktivitaet.beendetAt && aktivitaet.beendetAt <= new Date()) || endTime <= new Date()) {
          throw badRequest("Activity has already ended.");
        }
        if (!aktivitaet.chat) throw new Error("Internal: activity has no chat row.");

        await prisma.$transaction([
          prisma.aktivitaetEinladung.update({
            where: {
              aktivitaetId_profileId: {
                aktivitaetId: req.params.aktivitaetId,
                profileId: user.id,
              },
            },
            data: { status: "ACCEPTED", decidedAt: new Date() },
          }),
          prisma.aktivitaetTeilnehmer.create({
            data: { aktivitaetId: req.params.aktivitaetId, profileId: user.id },
          }),
          prisma.chatTeilnehmer.create({
            data: { chatId: aktivitaet.chat.id, profileId: user.id },
          }),
        ]);
      } else {
        await prisma.aktivitaetEinladung.update({
          where: {
            aktivitaetId_profileId: {
              aktivitaetId: req.params.aktivitaetId,
              profileId: user.id,
            },
          },
          data: { status: "DECLINED", decidedAt: new Date() },
        });
      }

      const result = await prisma.aktivitaetEinladung.findUnique({
        where: {
          aktivitaetId_profileId: {
            aktivitaetId: req.params.aktivitaetId,
            profileId: user.id,
          },
        },
      });
      return { einladung: result };
    }
  );

  // POST /aktivitaeten/:id/admin-transfer — neuen Admin bestimmen.
  // Neuer Admin muss bereits Teilnehmer sein. Alter Admin bleibt Teilnehmer.
  app.post<{ Params: { id: string } }>("/aktivitaeten/:id/admin-transfer", async (req) => {
    const user = await app.requireAuth(req);
    const aktivitaet = await loadAktivitaet(req.params.id);
    await assertAdmin(aktivitaet, user.id);

    const parsed = transferSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest("Invalid body: " + JSON.stringify(parsed.error.flatten().fieldErrors));
    }
    if (parsed.data.newAdminId === user.id) {
      throw badRequest("New admin must be a different user.");
    }
    const newAdminIsMember = await prisma.aktivitaetTeilnehmer.findUnique({
      where: {
        aktivitaetId_profileId: {
          aktivitaetId: aktivitaet.id,
          profileId: parsed.data.newAdminId,
        },
      },
    });
    if (!newAdminIsMember) {
      throw badRequest("New admin must already be a teilnehmer of the activity.");
    }

    await prisma.aktivitaet.update({
      where: { id: aktivitaet.id },
      data: { adminId: parsed.data.newAdminId },
    });

    const updated = await loadAktivitaet(aktivitaet.id);
    return { aktivitaet: formatAktivitaet(updated) };
  });

  // GET /me/einladungen — eigene noch offene Einladungen (für Inbox-Badge).
  app.get("/me/einladungen", async (req) => {
    const user = await app.requireAuth(req);
    const einladungen = await prisma.aktivitaetEinladung.findMany({
      where: { profileId: user.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: {
        aktivitaet: { include: aktivitaetIncludes },
        invitedBy: { select: { id: true, name: true, bilder: true } },
      },
    });
    return {
      einladungen: einladungen.map((e) => ({
        aktivitaet: formatAktivitaet(e.aktivitaet),
        invitedBy: e.invitedBy
          ? { id: e.invitedBy.id, name: e.invitedBy.name, bild: e.invitedBy.bilder[0] ?? null }
          : null,
        createdAt: e.createdAt,
      })),
    };
  });
}
