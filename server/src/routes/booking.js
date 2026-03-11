import { db } from "../config/database.js";
import { assignRep } from "../services/assignmentService.js";
import { createEvent } from "../services/calendarService.js";
import { sendConfirmationEmail, sendInternalNotification } from "../services/emailService.js";
import { sendBookingSMS } from "../services/smsService.js";

const TENANT_ID = "00000000-0000-0000-0000-000000000001";
const TIMEZONE = "Asia/Riyadh";
const SLOT_DURATION = 30; // minutes

function addMinutes(time, mins) {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default async function bookingRoutes(fastify) {
  // GET /api/booking/availability?month=2026-03
  fastify.get("/availability", async (request, reply) => {
    const { month } = request.query;
    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return reply.code(400).send({ error: "Invalid month format. Use YYYY-MM" });
    }

    const [year, mon] = month.split("-").map(Number);
    const startDate = new Date(year, mon - 1, 1);
    const endDate = new Date(year, mon, 0); // last day of month

    const reps = await db("users").where({ tenant_id: TENANT_ID, is_active: true });
    const workingHours = await db("availability")
      .whereIn("user_id", reps.map((r) => r.id))
      .where("is_blocked", false)
      .whereNotNull("day_of_week");

    const blockedDates = await db("availability")
      .whereIn("user_id", reps.map((r) => r.id))
      .where("is_blocked", true)
      .whereNotNull("block_date");

    const existingBookings = await db("bookings")
      .where("tenant_id", TENANT_ID)
      .where("status", "!=", "cancelled")
      .whereBetween("date", [startDate.toISOString().split("T")[0], endDate.toISOString().split("T")[0]]);

    const slots = {};

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay();
      const daySlots = [];

      for (const rep of reps) {
        const wh = workingHours.find((w) => w.user_id === rep.id && w.day_of_week === dayOfWeek);
        if (!wh) continue;

        const isBlocked = blockedDates.some((b) => b.user_id === rep.id && b.block_date?.toISOString?.().split("T")[0] === dateStr);
        if (isBlocked) continue;

        let current = wh.start_time.slice(0, 5);
        const endTime = wh.end_time.slice(0, 5);

        while (current < endTime) {
          const slotEnd = addMinutes(current, SLOT_DURATION);
          if (slotEnd > endTime) break;

          const conflict = existingBookings.some(
            (b) =>
              b.assigned_to === rep.id &&
              b.date?.toISOString?.().split("T")[0] === dateStr &&
              b.start_time.slice(0, 5) < slotEnd &&
              b.end_time.slice(0, 5) > current
          );

          if (!conflict && !daySlots.includes(current)) {
            daySlots.push(current);
          }
          current = slotEnd;
        }
      }

      if (daySlots.length > 0) {
        slots[dateStr] = daySlots.sort();
      }
    }

    return reply.send({ timezone: TIMEZONE, duration: SLOT_DURATION, slots });
  });

  // POST /api/booking
  fastify.post("/", {
    schema: {
      body: {
        type: "object",
        required: ["date", "startTime", "name", "email", "company"],
        properties: {
          date: { type: "string" },
          startTime: { type: "string" },
          name: { type: "string", minLength: 1 },
          email: { type: "string", format: "email" },
          company: { type: "string", minLength: 1 },
          phone: { type: "string" },
          message: { type: "string" },
        },
      },
    },
  }, async (request, reply) => {
    const { date, startTime, name, email, company, phone, message } = request.body;

    // Validate future date
    if (new Date(date) < new Date(new Date().toDateString())) {
      return reply.code(400).send({ error: "Date must be in the future" });
    }

    const endTime = addMinutes(startTime, SLOT_DURATION);

    // Find available rep
    const rep = await assignRep(TENANT_ID, date, `${startTime}:00`, `${endTime}:00`);
    if (!rep) {
      return reply.code(409).send({ error: "Slot no longer available. Please choose another time." });
    }

    // Get default pipeline + "New" stage
    const pipeline = await db("pipelines").where({ tenant_id: TENANT_ID, is_default: true }).first();
    const stage = await db("stages").where({ pipeline_id: pipeline.id, position: 1 }).first();

    // Split name
    const nameParts = name.trim().split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ") || null;

    // Create lead
    const [lead] = await db("leads")
      .insert({
        tenant_id: TENANT_ID,
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        company,
        message,
        source: "booking_widget",
        status: "new",
        assigned_to: rep.id,
        pipeline_id: pipeline.id,
        stage_id: stage.id,
      })
      .returning("*");

    // Create booking
    const [booking] = await db("bookings")
      .insert({
        tenant_id: TENANT_ID,
        lead_id: lead.id,
        assigned_to: rep.id,
        date,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        duration_minutes: SLOT_DURATION,
        status: "confirmed",
        confirmed_at: new Date(),
      })
      .returning("*");

    // Log activity
    await db("activities").insert({
      tenant_id: TENANT_ID,
      lead_id: lead.id,
      user_id: rep.id,
      type: "booking_created",
      note: `Meeting booked for ${formatDate(date)} at ${startTime}`,
      metadata: JSON.stringify({ bookingId: booking.id, repId: rep.id }),
    });

    // Integrations (non-blocking — Phase 3 will implement real versions)
    try {
      await createEvent(rep.google_access_token, rep.gcal_id, {
        summary: `Meeting with ${name} - ${company}`,
        description: message || "",
        start: `${date}T${startTime}:00+03:00`,
        end: `${date}T${endTime}:00+03:00`,
        attendeeEmail: email,
      });
    } catch (e) {
      console.warn("[booking] Calendar event creation failed:", e.message);
    }

    try {
      await sendConfirmationEmail(rep.google_access_token, {
        to: email, firstName, date: formatDate(date), time: startTime, duration: SLOT_DURATION,
      });
    } catch (e) {
      console.warn("[booking] Confirmation email failed:", e.message);
    }

    try {
      const smsId = await sendBookingSMS(rep.phone, {
        leadName: name, company, date: formatDate(date), time: startTime, phone, leadId: lead.id,
      });
      await db("bookings").where({ id: booking.id }).update({ sms_sent: true });
      await db("sms_logs").insert({
        tenant_id: TENANT_ID,
        booking_id: booking.id,
        user_id: rep.id,
        phone: rep.phone,
        message: `New meeting: ${name} - ${company} on ${date} at ${startTime}`,
        plivo_message_id: smsId,
        status: "sent",
        sent_at: new Date(),
      });
    } catch (e) {
      console.warn("[booking] SMS failed:", e.message);
    }

    return reply.code(201).send({
      success: true,
      bookingId: booking.id,
      message: "Meeting confirmed",
      details: {
        date,
        startTime,
        endTime,
        timezone: TIMEZONE,
      },
    });
  });
}
