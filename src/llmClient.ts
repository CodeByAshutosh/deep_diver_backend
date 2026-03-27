import fetch from "node-fetch";
import { PRSlideSummary } from "./types.js";
import { config } from "./config.js";
import { json } from "body-parser";

export async function summarizePRForSlides(input: {
  title: string;
  description: string;
  files: {
    filename: string;
    status: string;
    patch?: string;
  }[];
}): Promise<PRSlideSummary> {
  const systemPrompt = `
You are a senior engineer summarizing a pull request for a slide deck.
Return JSON matching this TypeScript type:

interface FileChangeSummary {
  filePath: string;
  changeType: "added" | "modified" | "deleted";
  highLevelSummary: string;
  keyPoints: string[];
  risksOrConcerns?: string[];
}

interface PRSlideSummary {
  title: string;
  overview: string;
  keyChanges: string[];
  fileSummaries: FileChangeSummary[];
  testingNotes?: string[];
  breakingChanges?: string[];
}
`;

  const userPrompt = `
PR title: ${input.title}
PR description: ${input.description || "(none)"}

Changed files (filename, status, patch):
${input.files
  .map(
    (f) => `
File: ${f.filename}
Status: ${f.status}
Patch:
${f.patch || "(no patch)"}
`
  )
  .join("\n\n")}

Return ONLY valid JSON, no markdown, no explanation.
`;

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openRouterKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "anthropic/claude-3-sonnet",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.2,
    }),
  });

  const json: any = await resp.json();
  const content = json.choices[0].message.content;
  const parsed = JSON.parse(content) as PRSlideSummary;
  return parsed;
}