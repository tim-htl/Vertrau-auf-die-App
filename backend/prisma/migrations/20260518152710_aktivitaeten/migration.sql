-- CreateEnum
CREATE TYPE "AktivitaetSichtbarkeit" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "EinladungsStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "aktivitaeten" (
    "id" UUID NOT NULL,
    "titel" TEXT NOT NULL,
    "beschreibung" TEXT NOT NULL,
    "bilder" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "adresseStrasse" TEXT NOT NULL,
    "adressePlzOrt" TEXT NOT NULL,
    "ortKurz" TEXT NOT NULL,
    "koordinatenLat" DOUBLE PRECISION NOT NULL,
    "koordinatenLng" DOUBLE PRECISION NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "dauerMinuten" INTEGER NOT NULL,
    "maxPlaetze" INTEGER NOT NULL,
    "sichtbarkeit" "AktivitaetSichtbarkeit" NOT NULL DEFAULT 'PUBLIC',
    "beendetAt" TIMESTAMP(3),
    "official" BOOLEAN NOT NULL DEFAULT false,
    "adminId" UUID NOT NULL,
    "modulId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aktivitaeten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aktivitaet_teilnehmer" (
    "aktivitaetId" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aktivitaet_teilnehmer_pkey" PRIMARY KEY ("aktivitaetId","profileId")
);

-- CreateTable
CREATE TABLE "aktivitaet_einladungen" (
    "aktivitaetId" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "status" "EinladungsStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "decidedAt" TIMESTAMP(3),

    CONSTRAINT "aktivitaet_einladungen_pkey" PRIMARY KEY ("aktivitaetId","profileId")
);

-- CreateIndex
CREATE INDEX "aktivitaeten_sichtbarkeit_startAt_idx" ON "aktivitaeten"("sichtbarkeit", "startAt");

-- CreateIndex
CREATE INDEX "aktivitaeten_modulId_idx" ON "aktivitaeten"("modulId");

-- CreateIndex
CREATE INDEX "aktivitaet_einladungen_profileId_status_idx" ON "aktivitaet_einladungen"("profileId", "status");

-- AddForeignKey
ALTER TABLE "aktivitaeten" ADD CONSTRAINT "aktivitaeten_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktivitaeten" ADD CONSTRAINT "aktivitaeten_modulId_fkey" FOREIGN KEY ("modulId") REFERENCES "module"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktivitaet_teilnehmer" ADD CONSTRAINT "aktivitaet_teilnehmer_aktivitaetId_fkey" FOREIGN KEY ("aktivitaetId") REFERENCES "aktivitaeten"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktivitaet_teilnehmer" ADD CONSTRAINT "aktivitaet_teilnehmer_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktivitaet_einladungen" ADD CONSTRAINT "aktivitaet_einladungen_aktivitaetId_fkey" FOREIGN KEY ("aktivitaetId") REFERENCES "aktivitaeten"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aktivitaet_einladungen" ADD CONSTRAINT "aktivitaet_einladungen_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
