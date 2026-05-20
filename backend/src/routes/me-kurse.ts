import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

// Verwaltung der vom eingeloggten User belegten Module.
// Tabelle dahinter: user_module (Profile × Modul mit optionalem semester).

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const enrollBodySchema = z.object({
  modulId: z.string().uuid("modulId must be a UUID"),
  semester: z.number().int().min(1).max(30).nullable().optional(),
});

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

export async function meKurseRoutes(app: FastifyInstance) {
  // GET /me/kurse — alle belegten Module mit Bereichs-Pfad bis zur Uni.
  app.get("/me/kurse", async (req) => {
    const user = await app.requireAuth(req);

    const enrollments = await prisma.userModul.findMany({
      where: { profileId: user.id },
      orderBy: [{ semester: "asc" }, { modul: { name: "asc" } }],
      include: {
        modul: {
          include: {
            bereich: {
              select: {
                id: true,
                name: true,
                path: true,
                studiengang: {
                  select: {
                    id: true,
                    name: true,
                    abschluss: true,
                    universitaet: { select: { id: true, name: true, kuerzel: true } },
                  },
                },
              },
            },
            _count: { select: { belegtVon: true } },
          },
        },
      },
    });

    return {
      kurse: enrollments.map((e) => ({
        modulId: e.modulId,
        name: e.modul.name,
        ects: e.modul.ects,
        code: e.modul.code,
        semester: e.semester,
        bereich: e.modul.bereich,
        anzahlTeilnehmer: e.modul._count.belegtVon,
      })),
    };
  });

  // POST /me/kurse — Modul belegen. Idempotent: erneuter Aufruf für dasselbe
  // Modul aktualisiert das Semester. Vermeidet, dass das Frontend zwischen
  // "neu anlegen" und "Semester ändern" unterscheiden muss.
  app.post("/me/kurse", async (req) => {
    const user = await app.requireAuth(req);

    const parsed = enrollBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest(
        "Invalid body: " + JSON.stringify(parsed.error.flatten().fieldErrors)
      );
    }

    // FK-Check vorab — sauberer 404 statt kryptischer Prisma-FK-Fehler.
    const modul = await prisma.modul.findUnique({
      where: { id: parsed.data.modulId },
      select: { id: true },
    });
    if (!modul) throw notFound("Modul nicht gefunden.");

    const semester = parsed.data.semester ?? null;
    const enrollment = await prisma.userModul.upsert({
      where: { profileId_modulId: { profileId: user.id, modulId: parsed.data.modulId } },
      update: { semester },
      create: { profileId: user.id, modulId: parsed.data.modulId, semester },
    });

    return {
      enrollment: { modulId: enrollment.modulId, semester: enrollment.semester },
    };
  });

  // DELETE /me/kurse/:modulId — Modul abwählen. Idempotent: gibt 204 auch
  // dann zurück, wenn es noch nie belegt wurde (kein 404 für "war eh nicht
  // da" — vereinfacht Frontend-Logik).
  app.delete<{ Params: { modulId: string } }>(
    "/me/kurse/:modulId",
    async (req, reply) => {
      const user = await app.requireAuth(req);
      if (!UUID_REGEX.test(req.params.modulId)) {
        throw badRequest("Invalid modul id format: expected UUID.");
      }

      await prisma.userModul.deleteMany({
        where: { profileId: user.id, modulId: req.params.modulId },
      });

      reply.code(204).send();
    }
  );
}
