import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

// Initialize PostgreSQL driver adapter for Prisma 7 + Supabase
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting 14-Module Headless CMS seed...");

  // 1. Clean existing tables (in order of foreign-key dependencies)
  await prisma.activityLog.deleteMany();
  await prisma.analyticsEvent.deleteMany();
  await prisma.contactMessage.deleteMany();
  await prisma.resume.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.certification.deleteMany();
  await prisma.education.deleteMany();
  await prisma.project.deleteMany();
  await prisma.employment.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.skillCategory.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.seoSetting.deleteMany();
  await prisma.siteSetting.deleteMany();
  await prisma.adminUser.deleteMany();

  // 2. Seed AdminUser (For Part 2.2 - Secret Admin Dashboard Login)
  const defaultPassword = "AdminSecret2026!";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  await prisma.adminUser.create({
    data: {
      email: "admin@example.com", // Change this in production
      name: "Sumit Dev Nath",
      passwordHash: hashedPassword,
    },
  });
  console.log("✅ AdminUser seeded (Email: admin@example.com)");

  // 3. Seed Singleton Profile (ID 1)
  await prisma.profile.create({
    data: {
      id: 1,
      headline: "Full-Stack Software Engineer & Tech Associate",
      aboutMe:
        "Experienced Full-Stack Software Engineer specializing in modern scalable web applications using the PENN stack (PostgreSQL, Express, Next.js, Node.js). Skilled in building responsive user interfaces, robust backend APIs, and integrating AI/LLM capabilities into production environments.",
      location: "Dhaka, Bangladesh",
    },
  });
  console.log("✅ Profile seeded.");

  // 4. Seed SEO Settings (Singleton ID 1)
  await prisma.seoSetting.create({
    data: {
      id: 1,
      metaTitle: "Sumit Dev Nath | Full-Stack Software Engineer",
      metaDesc:
        "Portfolio and Headless CMS of Sumit Dev Nath, Full-Stack Engineer specializing in Next.js, Express, PostgreSQL, and AI integrations.",
      keywords: [
        "Sumit Dev Nath",
        "Full-Stack Engineer",
        "PENN Stack",
        "Next.js",
        "Dhaka",
        "Bangladesh",
        "Software Engineer",
      ],
    },
  });
  console.log("✅ SEO Settings seeded.");

  // 5. Seed Site Settings (Singleton ID 1)
  await prisma.siteSetting.create({
    data: {
      id: 1,
      siteName: "Sumit Dev Nath - Portfolio",
      maintenanceMode: false,
      githubUrl: "https://github.com",
      linkedinUrl: "https://linkedin.com",
    },
  });
  console.log("✅ Site Settings seeded.");

  // 6. Seed Skill Categories & Skills
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

  // 7. Seed Employment
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

  // 8. Seed Projects (Case Studies)
  await prisma.project.createMany({
    data: [
      {
        title: "Multi-Tenant EdTech ERP Platform",
        slug: "edtech-erp-platform",
        description:
          "A comprehensive multi-tenant SaaS ERP system for academic institutions supporting Edexcel and Dhaka Board curriculums, role-based access control, and class/section scheduling.",
        tags: [
          "Next.js 16",
          "Prisma ORM",
          "PostgreSQL",
          "TypeScript",
          "Tailwind CSS",
        ],
        isFeatured: true,
        isPublished: true,
        order: 1,
      },
      {
        title: "BIRL Corporate Web Architecture & Portal",
        slug: "birl-corporate-portal",
        description:
          "High-performance corporate web portal optimized for mobile responsiveness and SEO, featuring dynamic content delivery and custom landing page architectures.",
        tags: ["React 19", "Vite", "Tailwind CSS", "SEO Optimization"],
        isFeatured: true,
        isPublished: true,
        order: 2,
      },
    ],
  });
  console.log("✅ Projects seeded.");

  // 9. Seed Education
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

  // 10. Seed Certifications
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

  // 11. Seed Active Resume Placeholder
  await prisma.resume.create({
    data: {
      versionName: "Sumit-Dev-Nath-Resume-2026.pdf",
      fileUrl: "https://example.com/placeholder-resume.pdf",
      isActive: true,
    },
  });
  console.log("✅ Active Resume placeholder seeded.");

  // 12. Seed Initial Activity Log
  await prisma.activityLog.create({
    data: {
      action: "SYSTEM_SEED",
      entity: "Database",
      details:
        "Initialized 14-module database schema with starter portfolio content.",
    },
  });
  console.log("✅ Audit Activity Log seeded.");

  console.log("🎉 14-Module CMS Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
