import express from "express";
import cors from "cors";
import path from "path";
import { config } from "./config.js";
import { handleGitHubWebhook } from "./githubWebhook.js";
import { manualGenerate } from "./manualGenerate.js";
import { listPullRequests } from "./githubClient.js";
import authRouter from "./auth.js";
import { authMiddleware, adminMiddleware } from "./middleware/auth.js";
import { rateLimitMiddleware } from "./middleware/rateLimit.js";
import { apiUsage, auditLogs } from "./auth.js";
import crypto from "crypto";

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  credentials: false
}));
app.use(express.json());

// Auth routes (no auth required)
app.use("/auth", authRouter);

// -----------------------------
// NEW: List PRs for a repo
// -----------------------------
app.get("/prs", async (req, res) => {
  try {
    const repoUrl = req.query.repoUrl as string;
    if (!repoUrl) {
      return res.status(400).json({ error: "repoUrl is required" });
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ error: "Invalid GitHub repo URL" });
    }

    const owner = match[1];
    const repo = match[2];

    const prs = await listPullRequests(owner, repo);

    return res.json({
      owner,
      repo,
      prs,
    });
  } catch (err) {
    console.error("GET /prs error:", err);
    return res.status(500).json({ error: "Failed to list PRs" });
  }
});

// NEW: Generate slides for a specific PR (GET endpoint)
app.get("/generate", authMiddleware, rateLimitMiddleware, async (req, res) => {
  try {
    const { owner, repo, prNumber } = req.query;
    
    if (!owner || !repo || !prNumber) {
      return res.status(400).json({ error: "owner, repo, and prNumber are required" });
    }

    // Call manualGenerate logic directly
    const { fetchPullRequestDetails } = await import("./githubClient.js");
    const { summarizePRForSlides } = await import("./summarizer.js");
    const { mockSummarizePRForSlides } = await import("./mockSummarizer.js");
    const { generateSlides } = await import("./slideGenerator/index.js");

    // 1. Fetch PR details
    const pr = await fetchPullRequestDetails(owner as string, repo as string, Number(prNumber));

    if (!pr) {
      return res.status(404).json({
        error: `Pull Request #${prNumber} not found in ${owner}/${repo}`
      });
    }

    // 2. Summarize PR
    let summary;
    try {
      summary = await summarizePRForSlides({
        title: pr.title,
        description: pr.body,
        files: pr.files,
      });
    } catch (llmErr) {
      console.warn("LLM summarization failed, using mock summarizer:", llmErr);
      summary = await mockSummarizePRForSlides({
        title: pr.title,
        description: pr.body,
        files: pr.files,
      });
    }

    // 3. Generate slides
    const publicUrl = await generateSlides(
      summary,
      owner as string,
      repo as string,
      Number(prNumber)
    );

    const slidesRemaining = res.locals.slidesRemaining;

    // Track usage
    if (!apiUsage[req.user!.userId]) {
      apiUsage[req.user!.userId] = [];
    }
    apiUsage[req.user!.userId].push({
      id: crypto.randomUUID(),
      userId: req.user!.userId,
      repoOwner: owner as string,
      repoName: repo as string,
      prNumber: Number(prNumber),
      slidesGenerated: 1,
      tokensUsed: 0,
      generatedAt: new Date(),
    });

    // Log action
    auditLogs.push({
      id: crypto.randomUUID(),
      userId: req.user!.userId,
      action: "generate_slides",
      details: `Generated slides for ${owner}/${repo}#${prNumber}`,
      timestamp: new Date(),
    });

    return res.json({
      message: "Slides generated",
      url: publicUrl,
      slidesRemaining,
    });
  } catch (err) {
    console.error("GET /generate error:", err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Failed to generate slides", details: errorMsg });
  }
});

// Existing routes (POST - now with auth)
app.post("/generate", authMiddleware, rateLimitMiddleware, manualGenerate);
app.post("/webhook", handleGitHubWebhook);

// Admin analytics endpoint
app.get("/admin/analytics", authMiddleware, adminMiddleware, async (_req, res) => {
  const { users } = await import("./auth.js");
  
  const totalUsers = Object.keys(users).length;
  const activeUsers = Object.values(users).filter(
    (u) => new Date().getTime() - u.lastLogin.getTime() < 7 * 24 * 60 * 60 * 1000
  ).length;
  
  let totalSlides = 0;
  let totalTokens = 0;
  Object.values(apiUsage).forEach((usage) => {
    totalSlides += usage.length;
    totalTokens += usage.reduce((sum, u) => sum + u.tokensUsed, 0);
  });

  res.json({
    stats: {
      totalUsers,
      activeUsers,
      totalSlides,
      totalTokens,
      estimatedCost: (totalTokens / 1000) * 0.01,
    },
    users: Object.values(users),
    usage: Object.entries(apiUsage).map(([userId, usage]) => ({ userId, usage })),
    auditLogs: auditLogs.slice(-100),
  });
});


app.use(
  "/generated",
  express.static(path.join(process.cwd(), config.storageDir))
);

app.get("/", (_req, res) => {
  res.send("PR Slides server is running");
});

const PORT = 3000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on port ${PORT}`);
  console.log("Environment:", { nodeEnv: process.env.NODE_ENV });
});

// Handle server errors
server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  process.exit(1);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});