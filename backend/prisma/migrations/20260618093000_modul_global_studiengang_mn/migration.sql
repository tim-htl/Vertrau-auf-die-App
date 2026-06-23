-- Modul wird universitäts-global (eindeutig über die Moses-Modulnummer) und
-- hängt nicht mehr an genau einem Bereich. Stattdessen verknüpft die neue
-- M:N-Tabelle studiengang_module ein Modul mit beliebig vielen Studiengängen.
-- Dadurch existiert ein reales Modul genau einmal, und user_module /
-- aktivitaeten.modulId zeigen auf das GETEILTE Modul (studiengangs-übergreifend).
--
-- Re-Seed: die bisherigen module/bereiche enthalten nur handgeseedete Demo-
-- Daten. Sie werden hier geleert und anschließend per `prisma db seed` aus den
-- echten Moses-Daten (21 Studiengänge, 1.946 Module) neu aufgebaut.

-- ── Reset Demo-Katalogdaten ─────────────────────────────────────────────────
DELETE FROM "user_module";
DELETE FROM "module";
DELETE FROM "bereiche";

-- ── module: von Bereich lösen, an Universität + Moses-Nummer knüpfen ─────────
ALTER TABLE "module" DROP CONSTRAINT "module_bereichId_fkey";
DROP INDEX "module_bereichId_name_key";
ALTER TABLE "module" DROP COLUMN "bereichId";

ALTER TABLE "module" ADD COLUMN "uniId" UUID NOT NULL;
ALTER TABLE "module" ADD COLUMN "nummer" TEXT NOT NULL;

ALTER TABLE "module" ADD CONSTRAINT "module_uniId_fkey"
  FOREIGN KEY ("uniId") REFERENCES "universitaeten"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "module_uniId_nummer_key" ON "module"("uniId", "nummer");

-- ── studiengang_module: M:N Studiengang ↔ Modul ─────────────────────────────
CREATE TABLE "studiengang_module" (
    "studiengangId" UUID NOT NULL,
    "modulId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studiengang_module_pkey" PRIMARY KEY ("studiengangId", "modulId")
);

CREATE INDEX "studiengang_module_modulId_idx" ON "studiengang_module"("modulId");

ALTER TABLE "studiengang_module" ADD CONSTRAINT "studiengang_module_studiengangId_fkey"
  FOREIGN KEY ("studiengangId") REFERENCES "studiengaenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "studiengang_module" ADD CONSTRAINT "studiengang_module_modulId_fkey"
  FOREIGN KEY ("modulId") REFERENCES "module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── RLS: studiengang_module ist Katalogdaten → öffentlich lesbar ────────────
-- Konsistent mit Cluster 2 (universitaeten/studiengaenge/bereiche/module/locations).
ALTER TABLE "studiengang_module" ENABLE ROW LEVEL SECURITY;

CREATE POLICY studiengang_module_read_all ON "studiengang_module"
FOR SELECT TO anon, authenticated
USING (true);
