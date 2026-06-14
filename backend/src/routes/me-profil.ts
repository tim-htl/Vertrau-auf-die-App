import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

// Profilinhalte des eingeloggten Users, die als eigene Tabellen modelliert
// sind (nicht als Spalten auf profiles): Hobby-Auswahl (user_hobbies) und
// Profil-Frage-Antworten (profil_frage_antworten).
//
// Beide nutzen PUT = "ersetze die ganze Auswahl": Das Frontend schickt die
// komplette Liste, wir löschen die alte und schreiben die neue in EINER
// Transaktion. Passt zum UI (man bearbeitet die Auswahl als Ganzes) und ist
// idempotent.

const MAX_FRAGEN = 5;
const MAX_ANTWORT_LAENGE = 200;

const hobbiesBodySchema = z.object({
  hobbyIds: z.array(z.string().uuid("hobbyId must be a UUID")).max(50),
});

const fragenBodySchema = z.object({
  antworten: z
    .array(
      z.object({
        frageId: z.string().uuid("frageId must be a UUID"),
        antwort: z.string().trim().min(1).max(MAX_ANTWORT_LAENGE),
      })
    )
    .max(MAX_FRAGEN, `Höchstens ${MAX_FRAGEN} Fragen erlaubt.`),
});

function badRequest(message: string): Error {
  const err = new Error(message);
  (err as Error & { statusCode?: number }).statusCode = 400;
  return err;
}

export async function meProfilRoutes(app: FastifyInstance) {
  // PUT /me/hobbies — setzt die komplette Hobby-Auswahl des Users.
  app.put("/me/hobbies", async (req) => {
    const user = await app.requireAuth(req);

    const parsed = hobbiesBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest(
        "Invalid body: " + JSON.stringify(parsed.error.flatten().fieldErrors)
      );
    }

    // Duplikate entfernen, damit das Frontend sich nicht darum kümmern muss.
    const hobbyIds = [...new Set(parsed.data.hobbyIds)];

    // Existenz aller Hobby-Ids prüfen → sauberer 400 statt FK-Fehler.
    if (hobbyIds.length > 0) {
      const vorhanden = await prisma.hobby.count({ where: { id: { in: hobbyIds } } });
      if (vorhanden !== hobbyIds.length) {
        throw badRequest("Mindestens eine hobbyId existiert nicht.");
      }
    }

    await prisma.$transaction([
      prisma.userHobby.deleteMany({ where: { profileId: user.id } }),
      prisma.userHobby.createMany({
        data: hobbyIds.map((hobbyId) => ({ profileId: user.id, hobbyId })),
      }),
    ]);

    return { hobbyIds };
  });

  // PUT /me/fragen — setzt die kompletten Frage-Antworten. position =
  // Reihenfolge im Array (Anzeige-Reihenfolge auf dem Profil).
  app.put("/me/fragen", async (req) => {
    const user = await app.requireAuth(req);

    const parsed = fragenBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest(
        "Invalid body: " + JSON.stringify(parsed.error.flatten().fieldErrors)
      );
    }

    const antworten = parsed.data.antworten;

    // Keine doppelten Fragen.
    const frageIds = antworten.map((a) => a.frageId);
    if (new Set(frageIds).size !== frageIds.length) {
      throw badRequest("Eine Frage darf nur einmal beantwortet werden.");
    }

    // Existenz aller Frage-Ids prüfen.
    if (frageIds.length > 0) {
      const vorhanden = await prisma.profilFrage.count({ where: { id: { in: frageIds } } });
      if (vorhanden !== frageIds.length) {
        throw badRequest("Mindestens eine frageId existiert nicht.");
      }
    }

    await prisma.$transaction([
      prisma.profilFrageAntwort.deleteMany({ where: { profileId: user.id } }),
      prisma.profilFrageAntwort.createMany({
        data: antworten.map((a, i) => ({
          profileId: user.id,
          frageId: a.frageId,
          antwort: a.antwort,
          position: i,
        })),
      }),
    ]);

    return {
      antworten: antworten.map((a, i) => ({
        frageId: a.frageId,
        antwort: a.antwort,
        position: i,
      })),
    };
  });
}
