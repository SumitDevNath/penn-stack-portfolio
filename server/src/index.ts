import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "./lib/prisma";
import { authenticateAdmin, AuthRequest } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "default-fallback-secret";

// ==========================================
// 1. GLOBAL MIDDLEWARES & RATE LIMITING
// ==========================================
app.use(helmet());
app.use(
  cors({
    origin: ["http://localhost:3000"], // Next.js App Router local address
    credentials: true,
  }),
);
app.use(express.json());

const publicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: "Too many requests, please try again later." },
});

app.use("/api/v1/public/", publicRateLimiter);

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "OK", service: "PENN Stack CMS API v1" });
});

// ==========================================
// 2. PUBLIC READ API (For Recruiter / Portfolio View)
// ==========================================

/**
 * GET /api/v1/public/portfolio
 * Consolidated public endpoint serving all read-only portfolio content
 */
app.get("/api/v1/public/portfolio", async (_req: Request, res: Response) => {
  try {
    const [
      profile,
      skills,
      employment,
      projects,
      education,
      certifications,
      activeResume,
      seo,
      siteSettings,
    ] = await Promise.all([
      prisma.profile.findFirst(),
      prisma.skillCategory.findMany({
        orderBy: { order: "asc" },
        include: { skills: true },
      }),
      prisma.employment.findMany({ orderBy: { order: "asc" } }),
      prisma.project.findMany({
        where: { isPublished: true },
        orderBy: { order: "asc" },
      }),
      prisma.education.findMany({ orderBy: { order: "asc" } }),
      prisma.certification.findMany({ orderBy: { order: "asc" } }),
      prisma.resume.findFirst({ where: { isActive: true } }),
      prisma.seoSetting.findFirst(),
      prisma.siteSetting.findFirst(),
    ]);

    // Log public page view analytics asynchronously
    prisma.analyticsEvent
      .create({
        data: { eventType: "PAGE_VIEW", path: "/" },
      })
      .catch((e: any) => console.error("Analytics logging error:", e));

    res.status(200).json({
      profile,
      skills,
      employment,
      projects,
      education,
      certifications,
      resume: activeResume,
      seo,
      siteSettings,
    });
  } catch (error) {
    console.error("❌ Error loading public portfolio:", error);
    res.status(500).json({ error: "Failed to fetch portfolio data." });
  }
});

/**
 * POST /api/v1/public/contact
 * Allows recruiters to send messages to your admin dashboard inbox
 */
app.post(
  "/api/v1/public/contact",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !message) {
        res
          .status(400)
          .json({ error: "Name, email, and message are required fields." });
        return;
      }

      const newMessage = await prisma.contactMessage.create({
        data: { name, email, subject, message },
      });

      res.status(201).json({ success: true, id: newMessage.id });
    } catch (error) {
      console.error("❌ Contact submission error:", error);
      res.status(500).json({ error: "Failed to submit contact message." });
    }
  },
);

// ==========================================
// 3. ADMIN AUTHENTICATION API
// ==========================================

/**
 * POST /api/v1/auth/login
 * Verifies admin email/password against Supabase and returns a JWT token
 */
app.post(
  "/api/v1/auth/login",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        res.status(400).json({ error: "Email and password are required." });
        return;
      }

      const admin = await prisma.adminUser.findUnique({ where: { email } });
      if (!admin) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        admin.passwordHash,
      );
      if (!isPasswordValid) {
        res.status(401).json({ error: "Invalid email or password." });
        return;
      }

      const token = jwt.sign(
        { id: admin.id, email: admin.email, name: admin.name },
        JWT_SECRET,
        { expiresIn: "7d" },
      );

      res.status(200).json({
        token,
        user: { id: admin.id, email: admin.email, name: admin.name },
      });
    } catch (error) {
      console.error("❌ Admin login error:", error);
      res.status(500).json({ error: "Authentication failed on server." });
    }
  },
);

// ==========================================
// 4. PROTECTED ADMIN CMS API (JWT Guarded)
// ==========================================

/**
 * GET /api/v1/admin/overview
 * Fetches dashboard statistics, messages, and audit logs
 */
app.get(
  "/api/v1/admin/overview",
  authenticateAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const [messages, activityLogs, totalViews, allProjectsCount] =
        await Promise.all([
          prisma.contactMessage.findMany({
            orderBy: { createdAt: "desc" },
            take: 10,
          }),
          prisma.activityLog.findMany({
            orderBy: { createdAt: "desc" },
            take: 15,
          }),
          prisma.analyticsEvent.count({ where: { eventType: "PAGE_VIEW" } }),
          prisma.project.count(),
        ]);

      res.status(200).json({
        stats: {
          totalViews,
          projects: allProjectsCount,
          unreadMessages: messages.length,
        },
        recentMessages: messages,
        recentLogs: activityLogs,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch admin overview." });
    }
  },
);

/**
 * PUT /api/v1/admin/profile
 * Updates About Me / Headline
 */
app.put(
  "/api/v1/admin/profile",
  authenticateAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { headline, aboutMe, location, avatarUrl } = req.body;

      const updated = await prisma.profile.upsert({
        where: { id: 1 },
        update: { headline, aboutMe, location, avatarUrl },
        create: { id: 1, headline, aboutMe, location, avatarUrl },
      });

      // Audit log entry
      await prisma.activityLog.create({
        data: {
          action: "UPDATE",
          entity: "Profile",
          details: `Updated profile headline: "${headline}"`,
        },
      });

      res.status(200).json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile." });
    }
  },
);

/**
 * POST /api/v1/admin/skills
 * Inserts a new skill into a category
 */
app.post(
  "/api/v1/admin/skills",
  authenticateAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { name, categoryId } = req.body;
      if (!name || !categoryId) {
        res
          .status(400)
          .json({ error: "Skill name and categoryId are required." });
        return;
      }

      const newSkill = await prisma.skill.create({
        data: { name, categoryId },
      });

      await prisma.activityLog.create({
        data: {
          action: "CREATE",
          entity: "Skill",
          details: `Added new skill: "${name}"`,
        },
      });

      res.status(201).json(newSkill);
    } catch (error) {
      res.status(500).json({ error: "Failed to add skill." });
    }
  },
);

/**
 * POST /api/v1/admin/employment
 * Inserts a new employment history entry
 */
app.post(
  "/api/v1/admin/employment",
  authenticateAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const { role, organization, duration, responsibilities } = req.body;
      if (!role || !organization || !duration) {
        res
          .status(400)
          .json({ error: "Role, organization, and duration are required." });
        return;
      }

      const job = await prisma.employment.create({
        data: {
          role,
          organization,
          duration,
          responsibilities: responsibilities || [],
        },
      });

      await prisma.activityLog.create({
        data: {
          action: "CREATE",
          entity: "Employment",
          details: `Added job: "${role}" at ${organization}`,
        },
      });

      res.status(201).json(job);
    } catch (error) {
      res.status(500).json({ error: "Failed to add employment record." });
    }
  },
);

/**
 * POST /api/v1/admin/projects
 * Inserts a new case study / project
 */
app.post(
  "/api/v1/admin/projects",
  authenticateAdmin,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const {
        title,
        slug,
        description,
        tags,
        liveUrl,
        githubUrl,
        isFeatured,
        isPublished,
      } = req.body;

      if (!title || !slug || !description) {
        res
          .status(400)
          .json({ error: "Title, slug, and description are required." });
        return;
      }

      const project = await prisma.project.create({
        data: {
          title,
          slug,
          description,
          tags: tags || [],
          liveUrl,
          githubUrl,
          isFeatured: isFeatured ?? false,
          isPublished: isPublished ?? true,
        },
      });

      await prisma.activityLog.create({
        data: {
          action: "CREATE",
          entity: "Project",
          details: `Created project case study: "${title}"`,
        },
      });

      res.status(201).json(project);
    } catch (error) {
      res.status(500).json({ error: "Failed to create project." });
    }
  },
);

// ==========================================
// 5. START SERVER
// ==========================================
const server = app.listen(PORT, () => {
  console.log(`🚀 Headless CMS API is live on http://localhost:${PORT}`);
  console.log(
    `🌐 Public API:  http://localhost:${PORT}/api/v1/public/portfolio`,
  );
  console.log(`🔐 Admin Login: http://localhost:${PORT}/api/v1/auth/login`);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  server.close(() => {
    console.log("🛑 Server gracefully closed.");
    process.exit(0);
  });
});
