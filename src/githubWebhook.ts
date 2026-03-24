import { Request, Response } from "express";
import crypto from "crypto";
import { config } from "./config";
import { processPullRequestEvent } from "./prAnalyzer";

function verifySignature(req: Request): boolean {
  const signature = req.headers["x-hub-signature-256"] as string | undefined;
  if (!signature) return false;

  const body = JSON.stringify(req.body);
  const hmac = crypto.createHmac("sha256", config.githubWebhookSecret);
  const digest = "sha256=" + hmac.update(body).digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function handleGitHubWebhook(req: Request, res: Response) {
    // ADD THESE LINES AT THE VERY TOP
    console.log("---- Incoming Webhook ----");
    console.log("Headers:", req.headers);
    console.log("Raw Body:", req.body);

    // your existing signature verification code here
  if (!verifySignature(req)) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.headers["x-github-event"];
  if (event !== "pull_request") {
    return res.status(200).send("Ignored");
  }

  const action = req.body.action;
  if (!["opened", "synchronize", "ready_for_review"].includes(action)) {
    return res.status(200).send("Action ignored");
  }

  try {
    await processPullRequestEvent(req.body);
    res.status(200).send("OK");
  } catch (err) {
    console.error("Error processing PR event", err);
    res.status(500).send("Error");
  }
}