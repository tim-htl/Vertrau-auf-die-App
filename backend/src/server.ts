import Fastify from "fastify";
import cors from "@fastify/cors";
import sensible from "@fastify/sensible";
import { env } from "./lib/env.js";
import authPlugin from "./lib/auth.js";
import { healthRoutes } from "./routes/health.js";
import { authRoutes } from "./routes/auth.js";
import { meRoutes } from "./routes/me.js";
import { katalogRoutes } from "./routes/katalog.js";
import { personenRoutes } from "./routes/personen.js";
import { meKurseRoutes } from "./routes/me-kurse.js";
import { chatRoutes } from "./routes/chats.js";
import { aktivitaetRoutes } from "./routes/aktivitaeten.js";

async function buildServer() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === "development" ? "info" : "warn",
      transport:
        env.NODE_ENV === "development"
          ? { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } }
          : undefined,
    },
  });

  await app.register(cors, { origin: true });
  await app.register(sensible);
  await app.register(authPlugin);

  await app.register(healthRoutes);
  await app.register(authRoutes);
  await app.register(meRoutes);
  await app.register(katalogRoutes);
  await app.register(personenRoutes);
  await app.register(meKurseRoutes);
  await app.register(chatRoutes);
  await app.register(aktivitaetRoutes);

  return app;
}

async function start() {
  const app = await buildServer();
  try {
    await app.listen({ port: env.PORT, host: "0.0.0.0" });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
