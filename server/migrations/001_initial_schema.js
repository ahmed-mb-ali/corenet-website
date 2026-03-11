export async function up(knex) {
  // Enable uuid extension
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  await knex.schema.createTable("tenants", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.string("name", 255).notNullable();
    t.string("domain", 255);
    t.string("plan", 50).defaultTo("starter");
    t.jsonb("settings").defaultTo("{}");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("users", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("tenant_id").references("id").inTable("tenants").notNullable().onDelete("CASCADE");
    t.string("email", 255).notNullable();
    t.string("name", 255).notNullable();
    t.string("phone", 50);
    t.string("role", 50).defaultTo("rep");
    t.integer("priority").defaultTo(1);
    t.text("google_access_token");
    t.text("google_refresh_token");
    t.string("gcal_id", 255);
    t.boolean("is_active").defaultTo(true);
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
    t.unique(["tenant_id", "email"]);
  });

  await knex.schema.createTable("pipelines", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("tenant_id").references("id").inTable("tenants").notNullable().onDelete("CASCADE");
    t.string("name", 255).notNullable();
    t.boolean("is_default").defaultTo(false);
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("stages", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("pipeline_id").references("id").inTable("pipelines").notNullable().onDelete("CASCADE");
    t.string("name", 255).notNullable();
    t.integer("position").notNullable();
    t.string("color", 7).defaultTo("#3B82F6");
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("leads", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("tenant_id").references("id").inTable("tenants").notNullable().onDelete("CASCADE");
    t.string("first_name", 255).notNullable();
    t.string("last_name", 255);
    t.string("email", 255).notNullable();
    t.string("phone", 50);
    t.string("company", 255);
    t.text("message");
    t.string("source", 100).defaultTo("booking_widget");
    t.string("status", 50).defaultTo("new");
    t.uuid("assigned_to").references("id").inTable("users");
    t.uuid("pipeline_id").references("id").inTable("pipelines");
    t.uuid("stage_id").references("id").inTable("stages");
    t.timestamp("created_at").defaultTo(knex.fn.now());
    t.timestamp("updated_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("bookings", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("tenant_id").references("id").inTable("tenants").notNullable().onDelete("CASCADE");
    t.uuid("lead_id").references("id").inTable("leads").notNullable().onDelete("CASCADE");
    t.uuid("assigned_to").references("id").inTable("users");
    t.date("date").notNullable();
    t.time("start_time").notNullable();
    t.time("end_time").notNullable();
    t.integer("duration_minutes").defaultTo(30);
    t.string("gcal_event_id", 255);
    t.string("status", 50).defaultTo("confirmed");
    t.boolean("sms_sent").defaultTo(false);
    t.timestamp("confirmed_at");
    t.timestamp("cancelled_at");
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("availability", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("user_id").references("id").inTable("users").notNullable().onDelete("CASCADE");
    t.integer("day_of_week");
    t.time("start_time");
    t.time("end_time");
    t.boolean("is_blocked").defaultTo(false);
    t.date("block_date");
    t.string("block_reason", 255);
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("activities", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("tenant_id").references("id").inTable("tenants").notNullable().onDelete("CASCADE");
    t.uuid("lead_id").references("id").inTable("leads").notNullable().onDelete("CASCADE");
    t.uuid("user_id").references("id").inTable("users");
    t.string("type", 50).notNullable();
    t.text("note");
    t.jsonb("metadata").defaultTo("{}");
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });

  await knex.schema.createTable("sms_logs", (t) => {
    t.uuid("id").primary().defaultTo(knex.raw("gen_random_uuid()"));
    t.uuid("tenant_id").references("id").inTable("tenants").notNullable().onDelete("CASCADE");
    t.uuid("booking_id").references("id").inTable("bookings");
    t.uuid("user_id").references("id").inTable("users").notNullable();
    t.string("phone", 50).notNullable();
    t.text("message").notNullable();
    t.string("plivo_message_id", 255);
    t.string("status", 50).defaultTo("pending");
    t.timestamp("sent_at");
    t.timestamp("created_at").defaultTo(knex.fn.now());
  });
}

export async function down(knex) {
  await knex.schema.dropTableIfExists("sms_logs");
  await knex.schema.dropTableIfExists("activities");
  await knex.schema.dropTableIfExists("availability");
  await knex.schema.dropTableIfExists("bookings");
  await knex.schema.dropTableIfExists("leads");
  await knex.schema.dropTableIfExists("stages");
  await knex.schema.dropTableIfExists("pipelines");
  await knex.schema.dropTableIfExists("users");
  await knex.schema.dropTableIfExists("tenants");
}
