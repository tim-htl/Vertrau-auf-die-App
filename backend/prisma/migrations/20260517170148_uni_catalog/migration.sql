/*
  Warnings:

  - You are about to drop the column `studiengangName` on the `profiles` table. All the data in the column will be lost.
  - You are about to drop the column `uniName` on the `profiles` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "Abschluss" AS ENUM ('BACHELOR', 'MASTER', 'STAATSEXAMEN', 'PROMOTION', 'SONSTIGES');

-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "studiengangName",
DROP COLUMN "uniName",
ADD COLUMN     "studiengangId" UUID;

-- CreateTable
CREATE TABLE "universitaeten" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "kuerzel" TEXT NOT NULL,
    "logoUrl" TEXT,
    "emailDomains" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "universitaeten_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studiengaenge" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "abschluss" "Abschluss" NOT NULL,
    "uniId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "studiengaenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bereiche" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "studiengangId" UUID NOT NULL,
    "parentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bereiche_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "module" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "ects" INTEGER,
    "code" TEXT,
    "bereichId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_module" (
    "profileId" UUID NOT NULL,
    "modulId" UUID NOT NULL,
    "semester" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_module_pkey" PRIMARY KEY ("profileId","modulId")
);

-- CreateIndex
CREATE UNIQUE INDEX "universitaeten_name_key" ON "universitaeten"("name");

-- CreateIndex
CREATE UNIQUE INDEX "universitaeten_kuerzel_key" ON "universitaeten"("kuerzel");

-- CreateIndex
CREATE UNIQUE INDEX "studiengaenge_uniId_name_abschluss_key" ON "studiengaenge"("uniId", "name", "abschluss");

-- CreateIndex
CREATE INDEX "bereiche_studiengangId_parentId_idx" ON "bereiche"("studiengangId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "bereiche_studiengangId_path_key" ON "bereiche"("studiengangId", "path");

-- CreateIndex
CREATE UNIQUE INDEX "module_bereichId_name_key" ON "module"("bereichId", "name");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_studiengangId_fkey" FOREIGN KEY ("studiengangId") REFERENCES "studiengaenge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "studiengaenge" ADD CONSTRAINT "studiengaenge_uniId_fkey" FOREIGN KEY ("uniId") REFERENCES "universitaeten"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bereiche" ADD CONSTRAINT "bereiche_studiengangId_fkey" FOREIGN KEY ("studiengangId") REFERENCES "studiengaenge"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bereiche" ADD CONSTRAINT "bereiche_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "bereiche"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "module" ADD CONSTRAINT "module_bereichId_fkey" FOREIGN KEY ("bereichId") REFERENCES "bereiche"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_module" ADD CONSTRAINT "user_module_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_module" ADD CONSTRAINT "user_module_modulId_fkey" FOREIGN KEY ("modulId") REFERENCES "module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
