import { apiFetch } from "../lib/api";
import type { Location as UILocation } from "../data/locations";
import type {
  GetLocationResponse,
  GetLocationsResponse,
  LocationKatalog,
} from "../types/api";

// Datenschicht für den Location-Katalog (kuratierte Orte im 1:1-„Treffen
// vorschlagen"-Flow). Mappt das Backend-Shape auf das UI-Shape
// (data/locations.ts) — gleiches Muster wie api/aktivitaeten.ts.

const FALLBACK_BILD =
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=800";

function mapLocation(l: LocationKatalog): UILocation {
  const bilder = l.bilder.length > 0 ? l.bilder : [FALLBACK_BILD];
  return {
    id: l.id,
    name: l.name,
    coverbild: bilder[0],
    bilder,
    beschreibung: l.beschreibung,
    adresse: { strasse: l.adresseStrasse, plzOrt: l.adressePlzOrt },
    koordinaten: {
      latitude: l.koordinaten.lat,
      longitude: l.koordinaten.lng,
    },
  };
}

// GET /locations — alle kuratierten Orte.
export async function ladeLocations(): Promise<UILocation[]> {
  const res = await apiFetch<GetLocationsResponse>("/locations");
  return res.locations.map(mapLocation);
}

// GET /locations/:id — einzelner Ort (für die Detailseite).
export async function ladeLocation(id: string): Promise<UILocation> {
  const res = await apiFetch<GetLocationResponse>(`/locations/${id}`);
  return mapLocation(res.location);
}
