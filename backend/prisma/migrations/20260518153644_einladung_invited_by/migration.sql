-- AlterTable
ALTER TABLE "aktivitaet_einladungen" ADD COLUMN     "invitedById" UUID;

-- AddForeignKey
ALTER TABLE "aktivitaet_einladungen" ADD CONSTRAINT "aktivitaet_einladungen_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
