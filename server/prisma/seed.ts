import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// 1. Create the PostgreSQL driver adapter using your Supabase DATABASE_URL
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

// 2. Pass the adapter into PrismaClient
const prisma = new PrismaClient({ adapter });
async function main() {
  console.log("🌱 Starting database seed...");

  // 1. Clean existing tables (in order of relations to prevent foreign-key errors)
  await prisma.skill.deleteMany();
  await prisma.skillCategory.deleteMany();
  await prisma.employment.deleteMany();
  await prisma.education.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.profile.deleteMany();

  // 2. Seed Profile
  await prisma.profile.create({
    data: {
      id: 1,
      headline: "Full-Stack Software Engineer & Tech Associate",
      aboutMe:
        "Experienced Full-Stack Software Engineer specializing in modern scalable web applications using the PENN stack (PostgreSQL, Express, Next.js, Node.js). Skilled in building responsive user interfaces, robust backend APIs, and integrating AI/LLM capabilities into production environments.",
    },
  });
  console.log("✅ Profile seeded.");

  // 3. Seed Skill Categories & Skills
  const categoriesWithSkills = [
    {
      name: "Frontend",
      order: 1,
      skills: [
        "React.js",
        "Next.js (App Router)",
        "TypeScript",
        "Tailwind CSS",
        "Shadcn/ui",
        "Radix UI",
      ],
    },
    {
      name: "Backend",
      order: 2,
      skills: [
        "Node.js",
        "Express.js",
        "Server Actions",
        "REST APIs",
        "Prisma ORM",
        "PostgreSQL",
        "NextAuth.js",
        "Clerk",
      ],
    },
    {
      name: "State & Forms",
      order: 3,
      skills: ["React Hook Form", "Zod (schema validation)"],
    },
    {
      name: "Languages",
      order: 4,
      skills: ["JavaScript (ES6+)", "TypeScript", "SQL", "Java", "Python"],
    },
    {
      name: "Testing & Tools",
      order: 5,
      skills: [
        "Playwright",
        "Postman",
        "Git",
        "GitHub",
        "VS Code",
        "IntelliJ IDEA",
        "ClickUp",
      ],
    },
    {
      name: "DevOps & Deployment",
      order: 6,
      skills: [
        "Docker",
        "Kubernetes",
        "Vite",
        "Vercel",
        "Coolify (self-hosted deployment)",
      ],
    },
    {
      name: "AI/LLM",
      order: 7,
      skills: [
        "Google Gemini SDK (@google/genai)",
        "Ollama (local LLMs)",
        "prompt design",
        "structured JSON output",
      ],
    },
  ];

  for (const cat of categoriesWithSkills) {
    const createdCategory = await prisma.skillCategory.create({
      data: {
        name: cat.name,
        order: cat.order,
      },
    });

    for (const skillName of cat.skills) {
      await prisma.skill.create({
        data: {
          name: skillName,
          categoryId: createdCategory.id,
        },
      });
    }
  }
  console.log("✅ Skills & Categories seeded.");

  // 4. Seed Employment
  await prisma.employment.createMany({
    data: [
      {
        role: "Full-Stack Software Engineer & Tech Associate",
        organization: "Bay Institute of Renaissance Limited (BIRL)",
        duration: "Nov 2025 - Present",
        responsibilities: [
          "Architected and developed scalable web applications using Next.js, React 19, and TypeScript.",
          "Built responsive landing pages and SEO-optimized user interfaces with modern UI libraries.",
          "Integrated real-time features and backend services using Node.js, PostgreSQL, and Prisma ORM.",
        ],
        order: 1,
      },
    ],
  });
  console.log("✅ Employment seeded.");

  // 5. Seed Education
  await prisma.education.createMany({
    data: [
      {
        degree: "Bachelor of Science in Computer Science & Engineering",
        institute: "University of Dhaka",
        duration: "2021 - 2025",
        order: 1,
      },
    ],
  });
  console.log("✅ Education seeded.");

  // 6. Seed Certifications
  await prisma.certification.create({
    data: {
      name: "Foundations of Bioinformatics & Unix/Linux",
      institute: "Centre for Bioinformatics Learning Advancement",
      duration: "2026",
      description:
        "Completed foundational coursework in Unix/Linux command line, Python for biological data analysis, and statistical modeling.",
      order: 1,
    },
  });
  console.log("✅ Certifications seeded.");

  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
