import express from "express";
import cors from "cors";
import path from "path";
import { config } from "./config.js";
import { handleGitHubWebhook } from "./githubWebhook.js";
import { manualGenerate } from "./manualGenerate.js";
import { listPullRequests } from "./githubClient.js";

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "OPTIONS"],
  credentials: false
}));
app.use(express.json());

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
app.get("/generate", async (req, res) => {
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

    return res.json({
      message: "Slides generated",
      url: publicUrl,
    });
  } catch (err) {
    console.error("GET /generate error:", err);
    const errorMsg = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: "Failed to generate slides", details: errorMsg });
  }
});

// Existing routes (POST)
app.post("/generate", manualGenerate);
app.post("/webhook", handleGitHubWebhook);

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