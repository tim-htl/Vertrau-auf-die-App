import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { formatProfileForClient } from "../lib/profile.js";

const syncBodySchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
});

// POST /auth/sync
// Called by the frontend right after a successful Supabase sign-in or sign-up.
// Creates a matching Profile row if none exists yet; returns the profile.
export async function authRoutes(app: FastifyInstance) {
  app.post("/auth/sync", async (req) => {
    const user = await app.requireAuth(req);

    const parsed = syncBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      const err = new Error("Invalid body");
      (err as Error & { statusCode?: number }).statusCode = 400;
      throw err;
    }

    const fallbackName = user.email?.split("@")[0] ?? "Neuer Nutzer";
    const desiredName = parsed.data.name ?? fallbackName;

    const profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        name: desiredName,
      },
    });

    return { profile: formatProfileForClient(profile) };
  });
}
