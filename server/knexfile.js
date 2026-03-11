import { config } from "dotenv";
config();

export default {
  development: {
    client: "pg",
    connection: process.env.DATABASE_URL,
    migrations: { directory: "./migrations" },
    seeds: { directory: "./seeds" },
  },
  production: {
    client: "pg",
    connection: { connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } },
    migrations: { directory: "./migrations" },
    seeds: { directory: "./seeds" },
  },
};
