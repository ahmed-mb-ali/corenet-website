import { db } from "../config/database.js";
import { authenticate } from "../middleware/auth.js";

export default async function leadsRoutes(fastify) {
  fastify.addHook("preHandler", authenticate);

  // GET /api/leads
  fastify.get("/", async (request, reply) => {
    const { search, status, assigned_to, page = 1, limit = 20 } = request.query;
    const offset = (page - 1) * limit;
    const tenantId = request.currentUser.tenant_id;

    let query = db("leads")
      .where("leads.tenant_id", tenantId)
      .leftJoin("users", "leads.assigned_to", "users.id")
      .leftJoin("stages", "leads.stage_id", "stages.id")
      .select(
        "leads.*",
        "users.name as assigned_to_name",
        "stages.name as stage_name",
        "stages.color as stage_color"
      )
      .orderBy("leads.created_at", "desc")
      .limit(limit)
      .offset(offset);

    if (search) {
      query = query.where((q) =>
        q.whereILike("leads.first_name", `%${search}%`)
          .orWhereILike("leads.last_name", `%${search}%`)
          .orWhereILike("leads.email", `%${search}%`)
          .orWhereILike("leads.company", `%${search}%`)
      );
    }
    if (status) query = query.where("leads.status", status);
    if (assigned_to) query = query.where("leads.assigned_to", assigned_to);

    const [leads, [{ count }]] = await Promise.all([
      query,
      db("leads").where("tenant_id", tenantId).count("id as count"),
    ]);

    return reply.send({ leads, total: Number(count), page: Number(page), limit: Number(limit) });
  });

  // GET /api/leads/:id
  fastify.get("/:id", async (request, reply) => {
    const lead = await db("leads")
      .where({ "leads.id": request.params.id, "leads.tenant_id": request.currentUser.tenant_id })
      .leftJoin("users", "leads.assigned_to", "users.id")
      .leftJoin("stages", "leads.stage_id", "stages.id")
      .leftJoin("bookings", "bookings.lead_id", "leads.id")
      .select(
        "leads.*",
        "users.name as assigned_to_name",
        "stages.name as stage_name",
        "stages.color as stage_color",
        "bookings.date as booking_date",
        "bookings.start_time as booking_start",
        "bookings.status as booking_status"
      )
      .first();

    if (!lead) return reply.code(404).send({ error: "Lead not found" });

    const activities = await db("activities")
      .where("lead_id", lead.id)
      .leftJoin("users", "activities.user_id", "users.id")
      .select("activities.*", "users.name as user_name")
      .orderBy("activities.created_at", "desc");

    return reply.send({ lead, activities });
  });

  // PATCH /api/leads/:id
  fastify.patch("/:id", async (request, reply) => {
    const { stage_id, assigned_to, status, note } = request.body;
    const lead = await db("leads")
      .where({ id: request.params.id, tenant_id: request.currentUser.tenant_id })
      .first();
    if (!lead) return reply.code(404).send({ error: "Lead not found" });

    const updates = {};
    if (stage_id) updates.stage_id = stage_id;
    if (assigned_to) updates.assigned_to = assigned_to;
    if (status) updates.status = status;
    updates.updated_at = new Date();

    await db("leads").where({ id: lead.id }).update(updates);

    if (note) {
      await db("activities").insert({
        tenant_id: lead.tenant_id,
        lead_id: lead.id,
        user_id: request.currentUser.id,
        type: "note_added",
        note,
      });
    }

    if (stage_id && stage_id !== lead.stage_id) {
      const stage = await db("stages").where({ id: stage_id }).first();
      await db("activities").insert({
        tenant_id: lead.tenant_id,
        lead_id: lead.id,
        user_id: request.currentUser.id,
        type: "stage_changed",
        note: `Moved to ${stage?.name}`,
        metadata: JSON.stringify({ from: lead.stage_id, to: stage_id }),
      });
    }

    const updated = await db("leads").where({ id: lead.id }).first();
    return reply.send(updated);
  });
}
