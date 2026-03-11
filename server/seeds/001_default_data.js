const TENANT_ID = "00000000-0000-0000-0000-000000000001";
const PIPELINE_ID = "00000000-0000-0000-0000-000000000002";
const USER_A_ID = "00000000-0000-0000-0000-000000000010";
const USER_B_ID = "00000000-0000-0000-0000-000000000011";

export async function seed(knex) {
  // Clear in order (respecting FK constraints)
  await knex("sms_logs").del();
  await knex("activities").del();
  await knex("availability").del();
  await knex("bookings").del();
  await knex("leads").del();
  await knex("stages").del();
  await knex("pipelines").del();
  await knex("users").del();
  await knex("tenants").del();

  // Tenant
  await knex("tenants").insert({
    id: TENANT_ID,
    name: "Corenet",
    domain: "corenet.sa",
    plan: "pro",
    settings: JSON.stringify({}),
  });

  // Users
  await knex("users").insert([
    {
      id: USER_A_ID,
      tenant_id: TENANT_ID,
      email: "sales@corenet.sa",
      name: "Rep A",
      phone: "+966500000001",
      role: "admin",
      priority: 1,
      is_active: true,
    },
    {
      id: USER_B_ID,
      tenant_id: TENANT_ID,
      email: "sales2@corenet.sa",
      name: "Rep B",
      phone: "+966500000002",
      role: "rep",
      priority: 2,
      is_active: true,
    },
  ]);

  // Default pipeline
  await knex("pipelines").insert({
    id: PIPELINE_ID,
    tenant_id: TENANT_ID,
    name: "Sales Pipeline",
    is_default: true,
  });

  // Pipeline stages
  const stageNames = [
    { name: "New", color: "#3B82F6" },
    { name: "Contacted", color: "#8B5CF6" },
    { name: "Qualified", color: "#F59E0B" },
    { name: "Proposal Sent", color: "#EC4899" },
    { name: "Negotiation", color: "#EF4444" },
    { name: "Won", color: "#10B981" },
    { name: "Lost", color: "#6B7280" },
  ];

  await knex("stages").insert(
    stageNames.map((s, i) => ({
      pipeline_id: PIPELINE_ID,
      name: s.name,
      position: i + 1,
      color: s.color,
    }))
  );

  // Availability: Sun–Thu (0–4), 9:00–17:00 for both reps
  const availabilityRows = [];
  for (const userId of [USER_A_ID, USER_B_ID]) {
    for (let day = 0; day <= 4; day++) {
      availabilityRows.push({
        user_id: userId,
        day_of_week: day,
        start_time: "09:00:00",
        end_time: "17:00:00",
        is_blocked: false,
      });
    }
  }
  await knex("availability").insert(availabilityRows);
}
