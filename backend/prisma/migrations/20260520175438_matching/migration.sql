-- CreateEnum
CREATE TYPE "LikeKind" AS ENUM ('LIKED', 'PASSED');

-- CreateTable
CREATE TABLE "likes" (
    "likerId" UUID NOT NULL,
    "likedId" UUID NOT NULL,
    "kind" "LikeKind" NOT NULL DEFAULT 'LIKED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "likes_pkey" PRIMARY KEY ("likerId","likedId")
);

-- CreateTable
CREATE TABLE "matches" (
    "profile1Id" UUID NOT NULL,
    "profile2Id" UUID NOT NULL,
    "chatId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("profile1Id","profile2Id")
);

-- CreateIndex
CREATE INDEX "likes_likedId_kind_idx" ON "likes"("likedId", "kind");

-- CreateIndex
CREATE UNIQUE INDEX "matches_chatId_key" ON "matches"("chatId");

-- CreateIndex
CREATE INDEX "matches_profile2Id_idx" ON "matches"("profile2Id");

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_likerId_fkey" FOREIGN KEY ("likerId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "likes" ADD CONSTRAINT "likes_likedId_fkey" FOREIGN KEY ("likedId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_profile1Id_fkey" FOREIGN KEY ("profile1Id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_profile2Id_fkey" FOREIGN KEY ("profile2Id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Shadow-DB-Kompatibilität ───────────────────────────────────────────────
-- Gleiche Logik wie in 20260519125747_rls_policies — Prismas Shadow-DB hat
-- das auth-Schema von Supabase nicht. Defensiver Stub, NUR wenn nicht da.
CREATE SCHEMA IF NOT EXISTS auth;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'auth' AND p.proname = 'uid'
  ) THEN
    CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE sql STABLE AS $func$ SELECT NULL::UUID $func$;
  END IF;
END $$;

-- ── RLS für die neuen Tabellen ─────────────────────────────────────────────
ALTER TABLE likes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;

-- likes: nur eigene Swipe-Entscheidungen lesbar. Insbesondere darf nicht
-- der "Geliked-Werdende" sehen, dass er geliked wurde — sonst wäre der
-- Match-Reveal-Effekt zerstört. Match selbst (Mutual-Like aufgelöst) ist
-- dagegen für beide Beteiligten sichtbar.
CREATE POLICY likes_read_own ON likes
FOR SELECT TO authenticated
USING ("likerId" = auth.uid());

-- matches: nur die beiden Match-Partner. Der Chat (im chats-Cluster) hat
-- seine eigene Policy über user_chat_ids() — das passt automatisch, weil
-- beide Match-Partner via chat_teilnehmer eingetragen sind.
CREATE POLICY matches_read_participant ON matches
FOR SELECT TO authenticated
USING ("profile1Id" = auth.uid() OR "profile2Id" = auth.uid());
