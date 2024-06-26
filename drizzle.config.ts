import type { Config } from "drizzle-kit"

const { LOCAL_DB_PATH } = process.env

export default {
  schema: "./src/db/schema.ts",
  out: "./migrations",
  dialect: "sqlite",
  ...(LOCAL_DB_PATH
    ? { dbCredentials: { url: LOCAL_DB_PATH } }
    : {
        // TODO: get production credentials from wrangler.toml
      }),
} satisfies Config
