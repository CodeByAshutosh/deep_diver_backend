import "dotenv/config";

export const config = {
  port: Number(process.env.PORT || 3000),
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET!,
  openRouterKey: process.env.OPENROUTER_API_KEY!,
  publicBaseUrl: process.env.PUBLIC_BASE_URL!,
  storageDir: process.env.STORAGE_DIR || "generated",
};