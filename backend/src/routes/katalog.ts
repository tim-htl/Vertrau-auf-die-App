import type { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma.js";

// Katalog-Endpoints liefern die statischen Referenzdaten der App
// (Universitäten, Studiengänge, Bereich-Baum, Module). Sie sind alle
// öffentlich — keine Auth nötig — damit das Onboarding bereits vor
// dem Sign-up die Dropdown-Listen befüllen kann. Konsistent mit den
// RLS-Policies aus Phase 1f (Cluster 2: anon + authenticated).

type BereichTreeNode = {
  id: string;
  name: string;
  path: string;
  kinder: BereichTreeNode[];
};

// Häufig fehlerhaft beim ersten Tipp-Versuch: prüfe Pfad-Param-Format.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function ensureUuid(value: string, paramName: string): void {
  if (!UUID_REGEX.test(value)) {
    const err = new Error(`Invalid ${paramName} format: expected UUID.`);
    (err as Error & { statusCode?: number }).statusCode = 400;
    throw err;
  }
}

function notFound(message: string): Error {
  const err = new Error(message);
  (err as Error & { statusCode?: number }).statusCode = 404;
  return err;
}

export async function katalogRoutes(app: FastifyInstance) {
  // GET /unis — alle Universitäten alphabetisch.
  app.get("/unis", async () => {
    const universitaeten = await prisma.universitaet.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        kuerzel: true,
        logoUrl: true,
        emailDomains: true,
      },
    });
    return { universitaeten };
  });

  // GET /unis/:id/studiengaenge — alle Studiengänge einer Uni.
  app.get<{ Params: { id: string } }>(
    "/unis/:id/studiengaenge",
    async (req) => {
      ensureUuid(req.params.id, "uni id");
      const uni = await prisma.universitaet.findUnique({
        where: { id: req.params.id },
        select: { id: true },
      });
      if (!uni) throw notFound("Universität nicht gefunden.");

      const studiengaenge = await prisma.studiengang.findMany({
        where: { uniId: req.params.id },
        orderBy: [{ name: "asc" }, { abschluss: "asc" }],
        select: { id: true, name: true, abschluss: true },
      });
      return { studiengaenge };
    }
  );

  // GET /studiengang/:id/moduldatenbank — alle Module des Studiengangs (flach,
  // alphabetisch) plus den Bereich-Baum als Curriculum-Gerüst. Module hängen
  // seit dem Moses-Import global an der Uni und sind via studiengang_module
  // M:N verknüpft — daher die flache Modulliste statt Modul-Blätter im Baum.
  app.get<{ Params: { id: string } }>(
    "/studiengang/:id/moduldatenbank",
    async (req) => {
      ensureUuid(req.params.id, "studiengang id");
      const studiengang = await prisma.studiengang.findUnique({
        where: { id: req.params.id },
        include: { universitaet: { select: { id: true, name: true, kuerzel: true } } },
      });
      if (!studiengang) throw notFound("Studiengang nicht gefunden.");

      const module = await prisma.modul.findMany({
        where: { studiengaenge: { some: { studiengangId: req.params.id } } },
        orderBy: { name: "asc" },
        select: { id: true, name: true, nummer: true, ects: true, code: true },
      });

      // Bereich-Baum (Pflicht/Wahl-Gerüst). Aktuell ohne Modul-Blätter; baut
      // sich aus parentId in-memory auf. Skaliert gut bis ein paar hundert Bereiche.
      const bereiche = await prisma.bereich.findMany({
        where: { studiengangId: req.params.id },
        orderBy: { path: "asc" },
      });

      const byId = new Map<string, BereichTreeNode>();
      for (const b of bereiche) {
        byId.set(b.id, { id: b.id, name: b.name, path: b.path, kinder: [] });
      }

      const roots: BereichTreeNode[] = [];
      for (const b of bereiche) {
        const node = byId.get(b.id)!;
        if (b.parentId) {
          const parent = byId.get(b.parentId);
          if (parent) parent.kinder.push(node);
          else roots.push(node); // Defensiv: Waise treated as root
        } else {
          roots.push(node);
        }
      }

      return {
        studiengang: {
          id: studiengang.id,
          name: studiengang.name,
          abschluss: studiengang.abschluss,
          universitaet: studiengang.universitaet,
        },
        module,
        bereiche: roots,
      };
    }
  );

  // GET /modul/:id — Detail mit ECTS, Code, den anbietenden Studiengängen und
  // der Teilnehmerliste (für die Frontend-Anzeige „wer belegt diesen Kurs auch").
  // Ein Modul kann zu mehreren Studiengängen gehören (M:N), daher `studiengaenge`.
  app.get<{ Params: { id: string } }>("/modul/:id", async (req) => {
    ensureUuid(req.params.id, "modul id");
    const modul = await prisma.modul.findUnique({
      where: { id: req.params.id },
      include: {
        studiengaenge: {
          include: {
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
        belegtVon: {
          take: 50, // Performance-Cap; Pagination nachrüsten wenn nötig
          include: {
            profile: {
              select: { id: true, name: true, bilder: true },
            },
          },
        },
        _count: { select: { belegtVon: true } },
      },
    });

    if (!modul) throw notFound("Modul nicht gefunden.");

    return {
      modul: {
        id: modul.id,
        name: modul.name,
        nummer: modul.nummer,
        ects: modul.ects,
        code: modul.code,
        studiengaenge: modul.studiengaenge.map((sm) => sm.studiengang),
        anzahlTeilnehmer: modul._count.belegtVon,
        teilnehmer: modul.belegtVon.map((eintrag) => ({
          id: eintrag.profile.id,
          name: eintrag.profile.name,
          bild: eintrag.profile.bilder[0] ?? null,
          semester: eintrag.semester,
        })),
      },
    };
  });

  // GET /hobbies — Hobby-Katalog (nur aktive), für Onboarding/Profil-Auswahl.
  // icon = Ionicons-Name, vom Frontend direkt renderbar.
  app.get("/hobbies", async () => {
    const hobbies = await prisma.hobby.findMany({
      where: { aktiv: true },
      orderBy: [{ sortierung: "asc" }, { name: "asc" }],
      select: { id: true, name: true, icon: true },
    });
    return { hobbies };
  });

  // GET /profil-fragen — Katalog der "witzigen" Profil-Fragen (nur aktive).
  app.get("/profil-fragen", async () => {
    const fragen = await prisma.profilFrage.findMany({
      where: { aktiv: true },
      orderBy: [{ sortierung: "asc" }],
      select: { id: true, text: true },
    });
    return { fragen };
  });
}
