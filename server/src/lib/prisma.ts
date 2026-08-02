import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Initialize the PostgreSQL driver adapter using your pooled Supabase URL
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// Export a single, shared PrismaClient instance for Express to use
export const prisma = new PrismaClient({ adapter });
