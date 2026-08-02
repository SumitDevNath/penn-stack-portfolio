require("dotenv/config");
const { defineConfig, env } = require("prisma/config");

module.exports = defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    // Uses your Supabase direct connection (Port 5432) for migrations and db:push
    url: env("DIRECT_URL"),
  },
});
