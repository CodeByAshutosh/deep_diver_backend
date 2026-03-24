import { PRSlideSummary } from "../types";
import { generateHtmlSlides } from "./htmlSlides";

export async function generateSlides(
  summary: PRSlideSummary,
  owner: string,
  repo: string,
  prNumber: number
): Promise<string> {
  const { publicUrl } = generateHtmlSlides(summary, { owner, repo, prNumber });
  return publicUrl;
}
