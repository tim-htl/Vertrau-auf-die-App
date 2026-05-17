import type { FastifyPluginAsync, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import { supabaseAdmin } from "./supabase.js";

export type AuthUser = {
  id: string;
  email: string | null;
};

declare module "fastify" {
  interface FastifyRequest {
    user?: AuthUser;
  }
  interface FastifyInstance {
    requireAuth: (req: FastifyRequest) => Promise<AuthUser>;
  }
}

// Verifies the Supabase access token on incoming requests.
// Attaches `request.user` when a valid Bearer token is present;
// leaves it undefined otherwise. Routes that need auth call
// `app.requireAuth(req)` to enforce it.
const authPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (req) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) return;

    const token = header.slice("Bearer ".length).trim();
    if (!token) return;

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return;

    req.user = { id: data.user.id, email: data.user.email ?? null };
  });

  app.decorate("requireAuth", async (req: FastifyRequest): Promise<AuthUser> => {
    if (!req.user) {
      const err = new Error("Unauthorized");
      (err as Error & { statusCode?: number }).statusCode = 401;
      throw err;
    }
    return req.user;
  });
};

export default fp(authPlugin, { name: "auth" });
