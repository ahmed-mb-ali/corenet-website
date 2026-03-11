import { db } from "../config/database.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

export default async function settingsRoutes(fastify) {
  fastify.addHook("preHandler", authenticate);

  // GET /api/settings/team
  fastify.get("/team", async (request, reply) => {
    const users = await db("users")
      .where({ tenant_id: request.currentUser.tenant_id })
      .select("id", "name", "email", "phone", "role", "priority", "is_active", "gcal_id")
      .orderBy("priority", "asc");
    return reply.send(users);
  });

  // PATCH /api/settings/team/:id/priority (admin only)
  fastify.patch("/team/:id/priority", { preHandler: requireAdmin }, async (request, reply) => {
    const { priority } = request.body;
    await db("users")
      .where({ id: request.params.id, tenant_id: request.currentUser.tenant_id })
      .update({ priority });
    return reply.send({ success: true });
  });
}
