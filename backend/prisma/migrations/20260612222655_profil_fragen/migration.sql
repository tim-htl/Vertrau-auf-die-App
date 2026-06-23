-- CreateTable
CREATE TABLE "profil_fragen" (
    "id" UUID NOT NULL,
    "text" TEXT NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "sortierung" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profil_fragen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profil_frage_antworten" (
    "profileId" UUID NOT NULL,
    "frageId" UUID NOT NULL,
    "antwort" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profil_frage_antworten_pkey" PRIMARY KEY ("profileId","frageId")
);

-- CreateIndex
CREATE UNIQUE INDEX "profil_fragen_text_key" ON "profil_fragen"("text");

-- AddForeignKey
ALTER TABLE "profil_frage_antworten" ADD CONSTRAINT "profil_frage_antworten_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profil_frage_antworten" ADD CONSTRAINT "profil_frage_antworten_frageId_fkey" FOREIGN KEY ("frageId") REFERENCES "profil_fragen"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Gleiche Struktur wie 20260519125747_rls_policies: nur SELECT-Policies,
-- alle Writes laufen über das Backend (service_role umgeht RLS).

ALTER TABLE profil_fragen          ENABLE ROW LEVEL SECURITY;
ALTER TABLE profil_frage_antworten ENABLE ROW LEVEL SECURITY;

-- Fragen-Katalog: wie alle Katalog-Tabellen auch für anon lesbar
-- (Onboarding-Flexibilität). Inaktive Fragen filtert das Backend.
CREATE POLICY profil_fragen_read_all ON profil_fragen
FOR SELECT TO anon, authenticated
USING (true);

-- Antworten: öffentlicher Profilinhalt, wie profiles/user_module
-- für alle eingeloggten User lesbar.
CREATE POLICY profil_frage_antworten_read_all ON profil_frage_antworten
FOR SELECT TO authenticated
USING (true);
