import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { env } from "./config/env.js";
import { db } from "./config/database.js";

import bookingRoutes from "./routes/booking.js";
import leadsRoutes from "./routes/leads.js";
import pipelineRoutes from "./routes/pipeline.js";
import availabilityRoutes from "./routes/availability.js";
import authRoutes from "./routes/auth.js";
import settingsRoutes from "./routes/settings.js";

const fastify = Fastify({ logger: true });

// Plugins
await fastify.register(cors, {
  origin: [env.frontendUrl, "http://localhost:3000"],
  credentials: true,
});

await fastify.register(jwt, { secret: env.jwtSecret });

// Routes
await fastify.register(authRoutes, { prefix: "/auth" });
await fastify.register(bookingRoutes, { prefix: "/api/booking" });
await fastify.register(leadsRoutes, { prefix: "/api/leads" });
await fastify.register(pipelineRoutes, { prefix: "/api/pipeline" });
await fastify.register(availabilityRoutes, { prefix: "/api/availability" });
await fastify.register(settingsRoutes, { prefix: "/api/settings" });

// Health check
fastify.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

// Start
const start = async () => {
  try {
    await db.raw("SELECT 1"); // verify DB connection
    console.log("✓ Database connected");
    await fastify.listen({ port: env.port, host: "0.0.0.0" });
    console.log(`✓ Server running on port ${env.port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
