# Manual SQL scripts

Hier liegen SQL-Dateien, die **nicht** über Prisma-Migrationen laufen können,
weil sie Schemas außerhalb von `public` anfassen (typischerweise `storage`,
`auth`), für die unsere Pooler-Verbindung keine Schreibrechte hat.

## Ausführung

1. Im Supabase Dashboard → linke Sidebar → **SQL Editor**.
2. Klicke auf **„New query"**.
3. Inhalt der gewünschten `.sql`-Datei einfügen.
4. **„Run"** klicken.

Alle Skripte hier sind **idempotent** — sie können mehrfach ohne
Datenverlust ausgeführt werden.

## Inhalt

| Datei | Zweck | Wann ausführen |
|---|---|---|
| `storage-setup.sql` | Erstellt die drei Storage-Buckets (`avatars`, `aktivitaet-cover`, `chat-media`) + ihre RLS-Policies auf `storage.objects` | Einmalig vor Phase 3b (Upload-Endpoint). Wieder ausführen, wenn sich Bucket-Konfig oder Policies ändern. |
