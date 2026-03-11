import { db } from "../config/database.js";
import { authenticate } from "../middleware/auth.js";

export default async function availabilityRoutes(fastify) {
  fastify.addHook("preHandler", authenticate);

  // GET /api/availability
  fastify.get("/", async (request, reply) => {
    const userId = request.currentUser.id;
    const [workingHours, blockedDates] = await Promise.all([
      db("availability").where({ user_id: userId, is_blocked: false }).orderBy("day_of_week"),
      db("availability").where({ user_id: userId, is_blocked: true }).orderBy("block_date"),
    ]);
    return reply.send({ workingHours, blockedDates });
  });

  // PUT /api/availability/working-hours
  fastify.put("/working-hours", async (request, reply) => {
    const userId = request.currentUser.id;
    const hours = request.body; // [{ dayOfWeek, startTime, endTime, enabled }]

    await db("availability").where({ user_id: userId, is_blocked: false }).del();

    const rows = hours
      .filter((h) => h.enabled)
      .map((h) => ({
        user_id: userId,
        day_of_week: h.dayOfWeek,
        start_time: h.startTime,
        end_time: h.endTime,
        is_blocked: false,
      }));

    if (rows.length > 0) await db("availability").insert(rows);
    return reply.send({ success: true });
  });

  // POST /api/availability/block
  fastify.post("/block", async (request, reply) => {
    const { date, reason } = request.body;
    const [row] = await db("availability")
      .insert({
        user_id: request.currentUser.id,
        is_blocked: true,
        block_date: date,
        block_reason: reason,
      })
      .returning("*");
    return reply.code(201).send(row);
  });

  // DELETE /api/availability/block/:id
  fastify.delete("/block/:id", async (request, reply) => {
    await db("availability")
      .where({ id: request.params.id, user_id: request.currentUser.id, is_blocked: true })
      .del();
    return reply.send({ success: true });
  });
}
