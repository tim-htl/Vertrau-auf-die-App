import { apiFetch } from "../lib/api";
import { supabase } from "../lib/supabase";
import type { GetUploadUrlResponse, StorageBucket } from "../types/api";

// Bild-Upload. Flow (siehe backend/src/routes/storage.ts):
//   1. Backend stellt eine presigned Upload-URL aus (POST /storage/upload-url)
//   2. Client lädt die Datei DIREKT zu Supabase Storage hoch
//   3. Rückgabe: öffentliche URL (avatars/aktivitaet-cover) ODER der Storage-
//      Pfad (chat-media — privat, das Backend signiert ihn beim Lesen).
//
// Für React Native: das lokale Bild (file://-URI) wird als ArrayBuffer
// gelesen und über uploadToSignedUrl hochgeladen.

function contentType(extension: string): string {
  const ext = extension.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "heic") return "image/heic";
  return "application/octet-stream";
}

// Leitet die Dateiendung aus einem lokalen URI ab (Fallback: jpg).
function extensionFromUri(uri: string): string {
  const match = /\.([a-z0-9]{1,5})(?:\?|$)/i.exec(uri);
  const ext = match?.[1]?.toLowerCase();
  return ext && /^(jpg|jpeg|png|webp|heic)$/.test(ext) ? ext : "jpg";
}

// Lädt ein lokales Bild hoch. Rückgabe: öffentliche URL (avatars/
// aktivitaet-cover) bzw. der Storage-Pfad (chat-media).
export async function uploadBild(
  localUri: string,
  bucket: StorageBucket = "avatars",
  extras: { aktivitaetId?: string; chatId?: string } = {}
): Promise<string> {
  const extension = extensionFromUri(localUri);

  // 1. presigned URL vom Backend
  const { path, token, publicUrl } = await apiFetch<GetUploadUrlResponse>(
    "/storage/upload-url",
    { method: "POST", body: { bucket, extension, ...extras } }
  );

  // 2. lokale Datei als ArrayBuffer lesen
  const arraybuffer = await fetch(localUri).then((r) => r.arrayBuffer());

  // 3. direkt zu Supabase hochladen
  const { error } = await supabase.storage
    .from(bucket)
    .uploadToSignedUrl(path, token, arraybuffer, {
      contentType: contentType(extension),
    });
  if (error) throw new Error(`Upload fehlgeschlagen: ${error.message}`);

  // chat-media ist privat → keine öffentliche URL. Der Pfad wird gespeichert,
  // das Backend signiert ihn beim Lesen (GET /chats/:id/messages).
  if (bucket === "chat-media") return path;

  if (!publicUrl) throw new Error("Keine öffentliche URL erhalten.");
  return publicUrl;
}
