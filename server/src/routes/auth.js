// TODO (Phase 4): Full Google OAuth implementation
// Placeholder for Phase 4

import { db } from "../config/database.js";
import { authenticate } from "../middleware/auth.js";

export default async function authRoutes(fastify) {
  // GET /auth/me
  fastify.get("/me", { preHandler: authenticate }, async (request, reply) => {
    const user = await db("users")
      .where({ id: request.currentUser.id })
      .select("id", "name", "email", "role", "priority", "is_active", "created_at")
      .first();
    return reply.send(user);
  });

  // POST /auth/login (dev-only: generate JWT for a user by email)
  fastify.post("/login", async (request, reply) => {
    if (process.env.NODE_ENV === "production") {
      return reply.code(404).send({ error: "Not found" });
    }
    const { email } = request.body;
    const user = await db("users").where({ email }).first();
    if (!user) return reply.code(401).send({ error: "User not found" });

    const token = fastify.jwt.sign({ userId: user.id, tenantId: user.tenant_id, role: user.role });
    return reply.send({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });
}
