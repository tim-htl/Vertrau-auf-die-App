-- CreateEnum
CREATE TYPE "ChatTyp" AS ENUM ('DIRECT', 'GROUP');

-- CreateEnum
CREATE TYPE "MessageMediaTyp" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "LocationKategorie" AS ENUM ('CAFE', 'RESTAURANT', 'BAR', 'UNI', 'SPORT', 'PARK', 'KULTUR', 'ENTERTAINMENT', 'SONSTIGES');

-- AlterTable
ALTER TABLE "aktivitaeten" ADD COLUMN     "locationId" UUID;

-- CreateTable
CREATE TABLE "chats" (
    "id" UUID NOT NULL,
    "typ" "ChatTyp" NOT NULL,
    "aktivitaetId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_teilnehmer" (
    "chatId" UUID NOT NULL,
    "profileId" UUID NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastReadAt" TIMESTAMP(3),
    "stumm" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "chat_teilnehmer_pkey" PRIMARY KEY ("chatId","profileId")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "chatId" UUID NOT NULL,
    "senderId" UUID,
    "text" TEXT,
    "mediaUrl" TEXT,
    "mediaTyp" "MessageMediaTyp",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_proposals" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "titel" TEXT NOT NULL,
    "bilder" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "startAt" TIMESTAMP(3) NOT NULL,
    "status" "EinladungsStatus" NOT NULL DEFAULT 'PENDING',
    "decidedAt" TIMESTAMP(3),
    "locationId" UUID,
    "aktivitaetId" UUID,
    "customAdresseStrasse" TEXT,
    "customAdressePlzOrt" TEXT,
    "customKoordinatenLat" DOUBLE PRECISION,
    "customKoordinatenLng" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "beschreibung" TEXT NOT NULL,
    "kategorie" "LocationKategorie" NOT NULL,
    "bilder" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "adresseStrasse" TEXT NOT NULL,
    "adressePlzOrt" TEXT NOT NULL,
    "koordinatenLat" DOUBLE PRECISION NOT NULL,
    "koordinatenLng" DOUBLE PRECISION NOT NULL,
    "isPartner" BOOLEAN NOT NULL DEFAULT false,
    "aktiv" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "chats_aktivitaetId_key" ON "chats"("aktivitaetId");

-- CreateIndex
CREATE INDEX "chat_teilnehmer_profileId_idx" ON "chat_teilnehmer"("profileId");

-- CreateIndex
CREATE INDEX "messages_chatId_createdAt_idx" ON "messages"("chatId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_proposals_messageId_key" ON "meeting_proposals"("messageId");

-- CreateIndex
CREATE INDEX "locations_kategorie_aktiv_idx" ON "locations"("kategorie", "aktiv");

-- CreateIndex
CREATE UNIQUE INDEX "locations_name_adresseStrasse_key" ON "locations"("name", "adresseStrasse");

-- CreateIndex
CREATE INDEX "aktivitaeten_locationId_idx" ON "aktivitaeten"("locationId");

-- AddForeignKey
ALTER TABLE "aktivitaeten" ADD CONSTRAINT "aktivitaeten_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_aktivitaetId_fkey" FOREIGN KEY ("aktivitaetId") REFERENCES "aktivitaeten"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_teilnehmer" ADD CONSTRAINT "chat_teilnehmer_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_teilnehmer" ADD CONSTRAINT "chat_teilnehmer_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_proposals" ADD CONSTRAINT "meeting_proposals_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_proposals" ADD CONSTRAINT "meeting_proposals_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_proposals" ADD CONSTRAINT "meeting_proposals_aktivitaetId_fkey" FOREIGN KEY ("aktivitaetId") REFERENCES "aktivitaeten"("id") ON DELETE SET NULL ON UPDATE CASCADE;
