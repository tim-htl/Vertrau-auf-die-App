-- Hobby-Katalog ersetzt die Freitext-Spalte profiles.hobbies.
-- Die Spalte war nie von echten Clients befüllt (Frontend lief bis hier
-- auf Mocks), daher droppen ohne Datenübernahme.

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "hobbies";

-- CreateTable
CREATE TABLE "hobbies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "sortierung" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hobbies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_hobbies" (
    "profileId" UUID NOT NULL,
    "hobbyId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_hobbies_pkey" PRIMARY KEY ("profileId","hobbyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "hobbies_name_key" ON "hobbies"("name");

-- AddForeignKey
ALTER TABLE "user_hobbies" ADD CONSTRAINT "user_hobbies_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_hobbies" ADD CONSTRAINT "user_hobbies_hobbyId_fkey" FOREIGN KEY ("hobbyId") REFERENCES "hobbies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── RLS ─────────────────────────────────────────────────────────────────────
-- Muster wie profil_fragen / user_module: nur SELECT-Policies, Writes
-- laufen über das Backend (service_role umgeht RLS).

ALTER TABLE hobbies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_hobbies ENABLE ROW LEVEL SECURITY;

-- Katalog: wie alle Katalog-Tabellen auch für anon lesbar.
CREATE POLICY hobbies_read_all ON hobbies
FOR SELECT TO anon, authenticated
USING (true);

-- Zuordnungen: öffentlicher Profilinhalt, wie user_module.
CREATE POLICY user_hobbies_read_all ON user_hobbies
FOR SELECT TO authenticated
USING (true);
