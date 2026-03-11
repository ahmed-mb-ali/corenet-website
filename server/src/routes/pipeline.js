import { db } from "../config/database.js";
import { authenticate } from "../middleware/auth.js";

export default async function pipelineRoutes(fastify) {
  fastify.addHook("preHandler", authenticate);

  // GET /api/pipeline — all stages with leads
  fastify.get("/", async (request, reply) => {
    const tenantId = request.currentUser.tenant_id;
    const pipeline = await db("pipelines").where({ tenant_id: tenantId, is_default: true }).first();
    if (!pipeline) return reply.code(404).send({ error: "No pipeline found" });

    const stages = await db("stages")
      .where({ pipeline_id: pipeline.id })
      .orderBy("position", "asc");

    const leads = await db("leads")
      .where({ "leads.tenant_id": tenantId })
      .leftJoin("users", "leads.assigned_to", "users.id")
      .leftJoin("bookings", "bookings.lead_id", "leads.id")
      .select(
        "leads.id", "leads.first_name", "leads.last_name", "leads.company",
        "leads.stage_id", "leads.status", "leads.created_at",
        "users.name as assigned_to_name",
        "bookings.date as booking_date",
        "bookings.start_time as booking_start"
      );

    const stagesWithLeads = stages.map((stage) => ({
      ...stage,
      leads: leads.filter((l) => l.stage_id === stage.id),
    }));

    return reply.send({ pipeline, stages: stagesWithLeads });
  });
}
