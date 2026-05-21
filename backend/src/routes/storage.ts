import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { supabaseAdmin } from "../lib/supabase.js";

// Storage-Upload-Endpoints. Backend stellt presigned URLs aus, der Client
// uploadet direkt zu Supabase Storage — wir sehen das Bytes-Volumen also gar
// nicht. Pfad-Konvention pro Bucket erzwingt das Backend; die Storage-RLS
// (siehe backend/sql/storage-setup.sql) ist Defense-in-Depth gegen direkte
// Client-Operationen.

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_EXTENSIONS: Record<string, RegExp> = {
  avatars: /^(jpg|jpeg|png|webp|heic)$/i,
  "aktivitaet-cover": /^(jpg|jpeg|png|webp|heic)$/i,
  "chat-media": /^(jpg|jpeg|png|webp|heic|mp4|mov)$/i,
};

function badRequest(message: string): Error {
  const err = new Error(message);
  (err as Error & { statusCode?: number }).statusCode = 400;
  return err;
}
function notFound(message: string): Error {
  const err = new Error(message);
  (err as Error & { statusCode?: number }).statusCode = 404;
  return err;
}
function forbidden(message: string): Error {
  const err = new Error(message);
  (err as Error & { statusCode?: number }).statusCode = 403;
  return err;
}

const uploadUrlSchema = z
  .object({
    bucket: z.enum(["avatars", "aktivitaet-cover", "chat-media"]),
    aktivitaetId: z.string().uuid().optional(),
    chatId: z.string().uuid().optional(),
    extension: z.string().regex(/^[a-z0-9]{1,5}$/i).default("jpg"),
  })
  .refine(
    (d) => d.bucket !== "aktivitaet-cover" || !!d.aktivitaetId,
    { message: "aktivitaetId is required when bucket is 'aktivitaet-cover'.", path: ["aktivitaetId"] }
  )
  .refine(
    (d) => d.bucket !== "chat-media" || !!d.chatId,
    { message: "chatId is required when bucket is 'chat-media'.", path: ["chatId"] }
  );

export async function storageRoutes(app: FastifyInstance) {
  // POST /storage/upload-url — gibt eine presigned URL + Ziel-Pfad zurück.
  // Body je nach Bucket:
  //   { bucket: "avatars",          extension?: "jpg" }
  //   { bucket: "aktivitaet-cover", aktivitaetId: UUID, extension?: "jpg" }
  //   { bucket: "chat-media",       chatId: UUID,       extension?: "jpg" }
  //
  // Antwort:
  //   { bucket, path, uploadUrl, publicUrl (null für private chat-media) }
  app.post("/storage/upload-url", async (req) => {
    const user = await app.requireAuth(req);

    const parsed = uploadUrlSchema.safeParse(req.body);
    if (!parsed.success) {
      throw badRequest(
        "Invalid body: " + JSON.stringify(parsed.error.flatten().fieldErrors)
      );
    }
    const { bucket, aktivitaetId, chatId, extension } = parsed.data;

    const allowedExtPattern = ALLOWED_EXTENSIONS[bucket];
    if (!allowedExtPattern || !allowedExtPattern.test(extension)) {
      throw badRequest(
        `Extension '${extension}' not allowed for bucket '${bucket}'.`
      );
    }

    // Per-Bucket-Authorization. Wir entscheiden hier, welcher Pfad-Owner
    // verwendet wird — das Backend ist die einzige Stelle, an der diese
    // Logik vereint ist; Storage-RLS prüft das Gleiche zusätzlich
    // (Defense-in-Depth).
    let ownerSegment: string;
    if (bucket === "avatars") {
      ownerSegment = user.id;
    } else if (bucket === "aktivitaet-cover") {
      const aktivitaet = await prisma.aktivitaet.findUnique({
        where: { id: aktivitaetId! },
        select: { adminId: true },
      });
      if (!aktivitaet) throw notFound("Aktivität nicht gefunden.");
      if (aktivitaet.adminId !== user.id) {
        throw forbidden("Only the activity admin may upload cover images.");
      }
      ownerSegment = aktivitaetId!;
    } else {
      // chat-media
      const member = await prisma.chatTeilnehmer.findUnique({
        where: {
          chatId_profileId: { chatId: chatId!, profileId: user.id },
        },
      });
      if (!member) throw forbidden("Not a member of this chat.");
      ownerSegment = chatId!;
    }

    const path = `${ownerSegment}/${randomUUID()}.${extension.toLowerCase()}`;

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .createSignedUploadUrl(path);

    if (error || !data) {
      const err = new Error(`Storage error: ${error?.message ?? "no data"}`);
      (err as Error & { statusCode?: number }).statusCode = 500;
      throw err;
    }

    // Public-URL nur für public Buckets sinnvoll. Bei chat-media muss
    // der Client später eine signed-read-URL anfordern oder über unser
    // Backend lesen.
    const publicUrl =
      bucket === "chat-media"
        ? null
        : supabaseAdmin.storage.from(bucket).getPublicUrl(path).data.publicUrl;

    return {
      bucket,
      path,
      uploadUrl: data.signedUrl,
      token: data.token,
      publicUrl,
    };
  });
}
