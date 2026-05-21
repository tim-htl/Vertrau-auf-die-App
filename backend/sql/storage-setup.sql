-- Phase 3a — Supabase Storage Setup
--
-- AUSFÜHRUNG: Im Supabase Dashboard → "SQL Editor" → neue Query →
-- Inhalt dieser Datei einfügen → "Run".
--
-- WARUM nicht via Prisma migrate? Unsere Pooler-Connection läuft als
-- postgres.<project-ref> und hat keinen Schreibzugriff auf das storage-
-- Schema (gehört Supabase intern). Im Dashboard läuft die Query mit
-- erhöhten Rechten und kann storage.buckets sowie Policies auf
-- storage.objects pflegen.
--
-- IDEMPOTENT: kann mehrfach laufen — Buckets werden upgesertet, Policies
-- werden vor dem CREATE gedroppt.

-- ── Buckets ────────────────────────────────────────────────────────────────
-- avatars            — public, 5 MB, Bilder. Pfad: avatars/{userId}/...
-- aktivitaet-cover   — public, 5 MB, Bilder. Pfad: aktivitaet-cover/{aktivitaetId}/...
-- chat-media         — privat, 50 MB, Bild+Video. Pfad: chat-media/{chatId}/...

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',          'avatars',          true,  5242880,  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('aktivitaet-cover', 'aktivitaet-cover', true,  5242880,  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']),
  ('chat-media',       'chat-media',       false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime'])
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── Policies auf storage.objects ───────────────────────────────────────────
-- RLS ist auf storage.objects bei Supabase standardmäßig aktiviert.

-- Defensiv alte Policy-Namen entfernen (idempotent).
DROP POLICY IF EXISTS avatars_read                       ON storage.objects;
DROP POLICY IF EXISTS avatars_insert_own                 ON storage.objects;
DROP POLICY IF EXISTS avatars_update_own                 ON storage.objects;
DROP POLICY IF EXISTS avatars_delete_own                 ON storage.objects;
DROP POLICY IF EXISTS aktivitaet_cover_read              ON storage.objects;
DROP POLICY IF EXISTS aktivitaet_cover_insert_admin      ON storage.objects;
DROP POLICY IF EXISTS aktivitaet_cover_update_admin      ON storage.objects;
DROP POLICY IF EXISTS aktivitaet_cover_delete_admin      ON storage.objects;
DROP POLICY IF EXISTS chat_media_select                  ON storage.objects;
DROP POLICY IF EXISTS chat_media_insert                  ON storage.objects;
DROP POLICY IF EXISTS chat_media_update                  ON storage.objects;
DROP POLICY IF EXISTS chat_media_delete                  ON storage.objects;

-- ──────── avatars ────────────────────────────────────────────────────────
-- Lesen: jeder. Schreiben: nur eigene User-Folder (erste Pfad-Komponente
-- muss der eigenen auth.uid entsprechen).
CREATE POLICY avatars_read ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

CREATE POLICY avatars_insert_own ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY avatars_update_own ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY avatars_delete_own ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ──────── aktivitaet-cover ───────────────────────────────────────────────
-- Lesen: jeder. Schreiben: nur Admin der Aktivität, deren ID im Pfad steht.
CREATE POLICY aktivitaet_cover_read ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'aktivitaet-cover');

CREATE POLICY aktivitaet_cover_insert_admin ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'aktivitaet-cover'
  AND EXISTS (
    SELECT 1 FROM public.aktivitaeten
    WHERE id::text = (storage.foldername(name))[1]
      AND "adminId" = auth.uid()
  )
);

CREATE POLICY aktivitaet_cover_update_admin ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'aktivitaet-cover'
  AND EXISTS (
    SELECT 1 FROM public.aktivitaeten
    WHERE id::text = (storage.foldername(name))[1]
      AND "adminId" = auth.uid()
  )
);

CREATE POLICY aktivitaet_cover_delete_admin ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'aktivitaet-cover'
  AND EXISTS (
    SELECT 1 FROM public.aktivitaeten
    WHERE id::text = (storage.foldername(name))[1]
      AND "adminId" = auth.uid()
  )
);

-- ──────── chat-media (privat) ────────────────────────────────────────────
-- Lesen + Schreiben nur, wenn User Chat-Mitglied ist.
CREATE POLICY chat_media_select ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'chat-media'
  AND EXISTS (
    SELECT 1 FROM public.chat_teilnehmer
    WHERE "chatId"::text = (storage.foldername(name))[1]
      AND "profileId" = auth.uid()
  )
);

CREATE POLICY chat_media_insert ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'chat-media'
  AND EXISTS (
    SELECT 1 FROM public.chat_teilnehmer
    WHERE "chatId"::text = (storage.foldername(name))[1]
      AND "profileId" = auth.uid()
  )
);

CREATE POLICY chat_media_update ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'chat-media'
  AND EXISTS (
    SELECT 1 FROM public.chat_teilnehmer
    WHERE "chatId"::text = (storage.foldername(name))[1]
      AND "profileId" = auth.uid()
  )
);

CREATE POLICY chat_media_delete ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'chat-media'
  AND EXISTS (
    SELECT 1 FROM public.chat_teilnehmer
    WHERE "chatId"::text = (storage.foldername(name))[1]
      AND "profileId" = auth.uid()
  )
);
