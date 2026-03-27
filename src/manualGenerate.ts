import { Request, Response } from "express";
import { fetchPullRequestDetails } from "./githubClient.js";
import { summarizePRForSlides } from "./summarizer.js";
import { generateSlides } from "./slideGenerator/index.js";

export async function manualGenerate(req: Request, res: Response) {
  try {
    const { repoUrl, prNumber } = req.body;

    if (!repoUrl || !prNumber) {
      return res.status(400).json({ error: "repoUrl and prNumber required" });
    }

    // Extract owner + repo from URL
    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (!match) {
      return res.status(400).json({ error: "Invalid GitHub repo URL" });
    }

    const owner = match[1];
    const repo = match[2];

    // 1. Fetch PR details (title, body, files)
    const pr = await fetchPullRequestDetails(owner, repo, Number(prNumber));

if (!pr) {
  return res.status(404).json({
    error: `Pull Request #${prNumber} not found in ${owner}/${repo}`
  });
}


    // 2. Summarize PR into 5-slide structure
    const summary = await summarizePRForSlides({
      title: pr.title,
      description: pr.body,
      files: pr.files,
    });

    // 3. Generate HTML slides (returns public URL)
    const publicUrl = await generateSlides(
      summary,
      owner,
      repo,
      Number(prNumber)
    );

    // 4. Respond with the slide deck URL
    return res.json({
      message: "Slides generated",
      url: publicUrl,
    });

  } catch (err) {
    console.error("manualGenerate error:", err);
    return res.status(500).json({ error: "Failed to generate slides" });
  }
}