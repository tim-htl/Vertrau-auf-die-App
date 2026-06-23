import type { FastifyInstance } from "fastify";
import type { Location } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

// Location-Katalog: kuratierte Orte für den 1:1-„Treffen vorschlagen"-Flow
// (zu zweit). Read-only; befüllt via scripts/seed-locations.ts. Auth ist
// erforderlich (wie überall), die Daten selbst sind aber nicht userspezifisch.

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

function formatLocation(l: Location) {
  return {
    id: l.id,
    name: l.name,
    beschreibung: l.beschreibung,
    kategorie: l.kategorie,
    bilder: l.bilder,
    adresseStrasse: l.adresseStrasse,
    adressePlzOrt: l.adressePlzOrt,
    koordinaten: { lat: l.koordinatenLat, lng: l.koordinatenLng },
    isPartner: l.isPartner,
  };
}

export async function locationRoutes(app: FastifyInstance) {
  // GET /locations — alle kuratierten Orte, alphabetisch.
  app.get("/locations", async (req) => {
    await app.requireAuth(req);
    const locations = await prisma.location.findMany({
      orderBy: { name: "asc" },
    });
    return { locations: locations.map(formatLocation) };
  });

  // GET /locations/:id — einzelner Ort (für die Detailseite).
  app.get<{ Params: { id: string } }>("/locations/:id", async (req) => {
    await app.requireAuth(req);
    if (!UUID_REGEX.test(req.params.id)) {
      throw badRequest("Invalid location id format: expected UUID.");
    }
    const location = await prisma.location.findUnique({
      where: { id: req.params.id },
    });
    if (!location) throw notFound("Location nicht gefunden.");
    return { location: formatLocation(location) };
  });
}
