-- Phase 1f — Row-Level-Security Policies (SELECT only).
--
-- Schreiboperationen (INSERT/UPDATE/DELETE) laufen über unser Backend mit
-- service_role-Key; dort umgeht Supabase RLS, weshalb es Phase 1f keine
-- Write-Policies braucht. Default-Deny von RLS blockt direkten Client-Write
-- automatisch.
--
-- Lese-Strategie pro Cluster:
--   Cluster 1 (profiles)        : authenticated darf alles lesen
--   Cluster 2 (Katalog, 5)      : anon + authenticated lesen frei
--   Cluster 3 (user_module)     : authenticated darf alles lesen (Profil-Anzeige
--                                 für andere User braucht Modul-Belegungen)
--   Cluster 4 (Treffen, 3)      : PUBLIC sichtbar für alle authenticated; PRIVATE
--                                 nur Admin/Teilnehmer/Eingeladene
--   Cluster 5 (Chat, 4)         : nur User mit chat_teilnehmer-Mitgliedschaft

-- ── Helper-Function ─────────────────────────────────────────────────────────
-- Gibt alle Chat-IDs zurück, in denen der aktuell eingeloggte User
-- Teilnehmer ist. SECURITY DEFINER, damit die Funktion RLS innerhalb ihrer
-- eigenen Query umgeht — sonst gäbe es Rekursion bei den chat_teilnehmer-
-- Policies. STABLE erlaubt dem Query-Planner Caching innerhalb einer
-- Transaktion.
CREATE OR REPLACE FUNCTION user_chat_ids()
RETURNS SETOF UUID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT "chatId" FROM chat_teilnehmer WHERE "profileId" = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION user_chat_ids() TO authenticated;

-- Defensiv: RLS auf allen Tabellen explizit aktivieren. Idempotent, falls
-- der Supabase-Automatik-Trigger ("Enable automatic RLS") es schon getan hat.
ALTER TABLE profiles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE universitaeten          ENABLE ROW LEVEL SECURITY;
ALTER TABLE studiengaenge           ENABLE ROW LEVEL SECURITY;
ALTER TABLE bereiche                ENABLE ROW LEVEL SECURITY;
ALTER TABLE module                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations               ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module             ENABLE ROW LEVEL SECURITY;
ALTER TABLE aktivitaeten            ENABLE ROW LEVEL SECURITY;
ALTER TABLE aktivitaet_teilnehmer   ENABLE ROW LEVEL SECURITY;
ALTER TABLE aktivitaet_einladungen  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_teilnehmer         ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_proposals       ENABLE ROW LEVEL SECURITY;

-- ── Cluster 1: profiles ─────────────────────────────────────────────────────
CREATE POLICY profiles_read_all ON profiles
FOR SELECT TO authenticated
USING (true);

-- ── Cluster 2: Katalog (5 Tabellen) ─────────────────────────────────────────
CREATE POLICY universitaeten_read_all ON universitaeten
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY studiengaenge_read_all ON studiengaenge
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY bereiche_read_all ON bereiche
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY module_read_all ON module
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY locations_read_all ON locations
FOR SELECT TO anon, authenticated
USING (true);

-- ── Cluster 3: user_module ──────────────────────────────────────────────────
CREATE POLICY user_module_read_all ON user_module
FOR SELECT TO authenticated
USING (true);

-- ── Cluster 4: Treffen (3 Tabellen) ─────────────────────────────────────────

-- aktivitaeten: public ODER Admin/Teilnehmer/Eingeladener
CREATE POLICY aktivitaeten_read ON aktivitaeten
FOR SELECT TO authenticated
USING (
  sichtbarkeit = 'PUBLIC'
  OR "adminId" = auth.uid()
  OR EXISTS (
    SELECT 1 FROM aktivitaet_teilnehmer t
    WHERE t."aktivitaetId" = aktivitaeten.id AND t."profileId" = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM aktivitaet_einladungen e
    WHERE e."aktivitaetId" = aktivitaeten.id AND e."profileId" = auth.uid()
  )
);

-- aktivitaet_teilnehmer: Teilnehmerliste sichtbar wenn ich die Aktivität sehen darf
CREATE POLICY aktivitaet_teilnehmer_read ON aktivitaet_teilnehmer
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM aktivitaeten a
    WHERE a.id = aktivitaet_teilnehmer."aktivitaetId"
      AND (
        a.sichtbarkeit = 'PUBLIC'
        OR a."adminId" = auth.uid()
        OR EXISTS (
          SELECT 1 FROM aktivitaet_teilnehmer t2
          WHERE t2."aktivitaetId" = a.id AND t2."profileId" = auth.uid()
        )
        OR EXISTS (
          SELECT 1 FROM aktivitaet_einladungen e
          WHERE e."aktivitaetId" = a.id AND e."profileId" = auth.uid()
        )
      )
  )
);

-- aktivitaet_einladungen: Empfänger, Einlader, oder Admin der Aktivität
CREATE POLICY aktivitaet_einladungen_read ON aktivitaet_einladungen
FOR SELECT TO authenticated
USING (
  "profileId" = auth.uid()
  OR "invitedById" = auth.uid()
  OR EXISTS (
    SELECT 1 FROM aktivitaeten a
    WHERE a.id = aktivitaet_einladungen."aktivitaetId"
      AND a."adminId" = auth.uid()
  )
);

-- ── Cluster 5: Chat (4 Tabellen, nutzen user_chat_ids()) ────────────────────

CREATE POLICY chats_read ON chats
FOR SELECT TO authenticated
USING (id IN (SELECT user_chat_ids()));

CREATE POLICY chat_teilnehmer_read ON chat_teilnehmer
FOR SELECT TO authenticated
USING ("chatId" IN (SELECT user_chat_ids()));

CREATE POLICY messages_read ON messages
FOR SELECT TO authenticated
USING ("chatId" IN (SELECT user_chat_ids()));

CREATE POLICY meeting_proposals_read ON meeting_proposals
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM messages m
    WHERE m.id = meeting_proposals."messageId"
      AND m."chatId" IN (SELECT user_chat_ids())
  )
);
