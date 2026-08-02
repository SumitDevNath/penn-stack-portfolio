import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

const app = express();

// ── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL ?? "http://localhost:3000",
    credentials: true,
  })
);

// ── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json());

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// ── Health check ──────────────────────────────────────────────────────────────
// Also used as an uptime ping target to keep the Supabase free-tier from pausing
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Routes (uncomment as you build them) ─────────────────────────────────────
// import projectsRoute from "./routes/projects.route";
// import contactRoute from "./routes/contact.route";
// import authRoute from "./routes/auth.route";
// app.use("/api/projects", projectsRoute);
// app.use("/api/contact", contactRoute);
// app.use("/api/auth", authRoute);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.error(err.stack);
    res.status(500).json({ error: "Internal server error" });
  }
);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT ?? 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
