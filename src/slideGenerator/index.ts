import { PRSlideSummary } from "../types.js";
import { generateHtmlSlides } from "./htmlSlides.js";

export async function generateSlides(
  summary: PRSlideSummary,
  owner: string,
  repo: string,
  prNumber: number
): Promise<string> {
  const { publicUrl } = generateHtmlSlides(summary, { owner, repo, prNumber });
  return publicUrl;
}
