import { db } from "../config/database.js";
import { authenticate, requireAdmin } from "../middleware/auth.js";

export default async function settingsRoutes(fastify) {
  fastify.addHook("preHandler", authenticate);

  // GET /api/settings/team
  fastify.get("/team", async (request, reply) => {
    const users = await db("users")
      .where({ tenant_id: request.currentUser.tenant_id })
      .select("id", "name", "email", "phone", "role", "priority", "is_active", "gcal_id", "created_at")
      .orderBy("priority", "asc");
    return reply.send(users);
  });

  // POST /api/settings/team — create a new rep (admin only)
  fastify.post("/team", { preHandler: requireAdmin }, async (request, reply) => {
    const { name, email, phone, role = "rep" } = request.body;
    if (!name || !email) return reply.code(400).send({ error: "name and email are required" });

    // Get next priority
    const [{ max }] = await db("users")
      .where({ tenant_id: request.currentUser.tenant_id })
      .max("priority as max");
    const priority = (max || 0) + 1;

    const existing = await db("users")
      .where({ tenant_id: request.currentUser.tenant_id, email })
      .first();
    if (existing) return reply.code(409).send({ error: "A user with this email already exists" });

    const [user] = await db("users")
      .insert({
        tenant_id: request.currentUser.tenant_id,
        name, email, phone, role, priority,
        is_active: true,
      })
      .returning("id", "name", "email", "phone", "role", "priority", "is_active", "created_at");

    // Seed default availability Sun-Thu 9-17
    const availabilityRows = [];
    for (let day = 0; day <= 4; day++) {
      availabilityRows.push({
        user_id: user.id,
        day_of_week: day,
        start_time: "09:00:00",
        end_time: "17:00:00",
        is_blocked: false,
      });
    }
    await db("availability").insert(availabilityRows);

    return reply.code(201).send(user);
  });

  // PATCH /api/settings/team/:id — update rep details (admin only)
  fastify.patch("/team/:id", { preHandler: requireAdmin }, async (request, reply) => {
    const { name, email, phone, role, is_active, priority } = request.body;
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (role !== undefined) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;
    if (priority !== undefined) updates.priority = priority;
    updates.updated_at = new Date();

    await db("users")
      .where({ id: request.params.id, tenant_id: request.currentUser.tenant_id })
      .update(updates);

    const user = await db("users")
      .where({ id: request.params.id })
      .select("id", "name", "email", "phone", "role", "priority", "is_active")
      .first();
    return reply.send(user);
  });

  // DELETE /api/settings/team/:id — deactivate rep (admin only, cannot delete self)
  fastify.delete("/team/:id", { preHandler: requireAdmin }, async (request, reply) => {
    if (request.params.id === request.currentUser.id) {
      return reply.code(400).send({ error: "Cannot deactivate your own account" });
    }
    await db("users")
      .where({ id: request.params.id, tenant_id: request.currentUser.tenant_id })
      .update({ is_active: false, updated_at: new Date() });
    return reply.send({ success: true });
  });

  // PUT /api/settings/team/reorder — reorder priorities (admin only)
  fastify.put("/team/reorder", { preHandler: requireAdmin }, async (request, reply) => {
    const { order } = request.body; // [{ id, priority }]
    await Promise.all(
      order.map(({ id, priority }) =>
        db("users")
          .where({ id, tenant_id: request.currentUser.tenant_id })
          .update({ priority })
      )
    );
    return reply.send({ success: true });
  });
}
