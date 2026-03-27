import express from "express";
import cors from "cors";
import path from "path";
import { config } from "./config";
import { handleGitHubWebhook } from "./githubWebhook";
import { manualGenerate } from "./manualGenerate";
import { listPullRequests } from "./githubClient";

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

// -----------------------------
// Existing routes
// -----------------------------
app.post("/generate", manualGenerate);
app.post("/webhook", handleGitHubWebhook);

app.use(
  "/generated",
  express.static(path.join(process.cwd(), config.storageDir))
);

app.get("/", (_req, res) => {
  res.send("PR Slides server is running");
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server listening on port 3000");
});