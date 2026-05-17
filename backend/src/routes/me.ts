import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const updateMeSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    geburtsdatum: z.coerce.date().nullable(),
    kurzbeschreibung: z.string().trim().max(500).nullable(),
    bilder: z.array(z.string().url()).max(10),
    hobbies: z.array(z.string().trim().min(1).max(40)).max(20),
    uniName: z.string().trim().max(120).nullable(),
    studiengangName: z.string().trim().max(120).nullable(),
  })
  .partial();

export async function meRoutes(app: FastifyInstance) {
  app.get("/me", async (req) => {
    const user = await app.requireAuth(req);
    const profile = await prisma.profile.findUnique({ where: { id: user.id } });

    if (!profile) {
      const err = new Error("Profile not found. Call POST /auth/sync first.");
      (err as Error & { statusCode?: number }).statusCode = 404;
      throw err;
    }

    return { profile };
  });

  app.patch("/me", async (req) => {
    const user = await app.requireAuth(req);

    const parsed = updateMeSchema.safeParse(req.body);
    if (!parsed.success) {
      const err = new Error("Invalid body: " + JSON.stringify(parsed.error.flatten().fieldErrors));
      (err as Error & { statusCode?: number }).statusCode = 400;
      throw err;
    }

    const profile = await prisma.profile.update({
      where: { id: user.id },
      data: parsed.data,
    });

    return { profile };
  });
}
