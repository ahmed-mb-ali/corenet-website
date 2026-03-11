import knex from "knex";
import { env } from "./env.js";

export const db = knex({
  client: "pg",
  connection: env.nodeEnv === "production"
    ? { connectionString: env.databaseUrl, ssl: { rejectUnauthorized: false } }
    : env.databaseUrl,
  pool: { min: 2, max: 10 },
});
