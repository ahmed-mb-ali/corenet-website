import { db } from "../config/database.js";

/**
 * Find the first available rep for a given date+time slot.
 * Priority 1 is checked first, then 2, etc.
 */
export async function assignRep(tenantId, date, startTime, endTime) {
  const reps = await db("users")
    .where({ tenant_id: tenantId, is_active: true })
    .orderBy("priority", "asc");

  const dayOfWeek = new Date(date).getDay();

  for (const rep of reps) {
    // Check working hours
    const workingHours = await db("availability")
      .where({ user_id: rep.id, day_of_week: dayOfWeek, is_blocked: false })
      .first();

    if (!workingHours) continue;

    const withinHours =
      startTime >= workingHours.start_time && endTime <= workingHours.end_time;
    if (!withinHours) continue;

    // Check if date is blocked
    const blocked = await db("availability")
      .where({ user_id: rep.id, block_date: date, is_blocked: true })
      .first();
    if (blocked) continue;

    // Check if rep already has a booking at this slot
    const conflict = await db("bookings")
      .where({ assigned_to: rep.id, date })
      .where("status", "!=", "cancelled")
      .whereRaw("start_time < ? AND end_time > ?", [endTime, startTime])
      .first();
    if (conflict) continue;

    // TODO (Phase 3): Check Google Calendar freebusy
    // For now: rep is free if no DB conflict

    return rep;
  }

  return null;
}
