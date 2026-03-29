import fetch from "node-fetch";
import { config } from "./config.js";
import { PRSlideSummary } from "./types.js";

export async function summarizePRForSlides(input: {
  title: string;
  description: string;
  files: {
    filename: string;
    status: string;
    patch?: string;
  }[];
}): Promise<PRSlideSummary> {
  // 1) STRONG, STRICT SYSTEM PROMPT
  const systemPrompt = `
You are a senior engineer creating a 10-slide technical presentation for an SDE2-level audience.

Your goal:
- Help a ramping-up engineer quickly understand the PR
- Explain not just "what changed" but "why it matters"
- Use mental models: data flow, components, dependencies, risks

You MUST return ONLY a single JSON object matching EXACTLY this TypeScript type:

interface PRSlideSummary {
  title: string;
  overview: string;
  keyChanges: string[];
  fileChanges: {
    filePath: string;
    changeType: "added" | "modified" | "deleted";
    summary: string;
  }[];
  risks: string[];
  testing: string[];
}

Guidance:
- In keyChanges, think in terms of system behavior, not just files.
- In fileChanges.summary, mention roles: controller, worker, API, DB, cache, etc.
- In risks/testing, think like an oncall: blast radius, failure modes, rollback.

Rules:
- Do NOT wrap the result in any other fields.
- Do NOT include markdown.
- Do NOT include explanations.
- Do NOT include comments.
- Do NOT include trailing commas.
- Return ONLY the JSON object.
`;

  // 2) INPUT TUNED FOR LARGE PRs (truncate patches)
  const MAX_PATCH_CHARS = 2000;

  const filesForPrompt = input.files
    .map((f) => {
      const patch = f.patch || "(no patch)";
      const truncatedPatch =
        patch.length > MAX_PATCH_CHARS
          ? patch.slice(0, MAX_PATCH_CHARS) + "\n...[truncated]..."
          : patch;

      return `
File: ${f.filename}
Status: ${f.status}
Patch:
${truncatedPatch}
`;
    })
    .join("\n\n");

  const userPrompt = `
PR title: ${input.title}
PR description: ${input.description || "(none)"}

Changed files (filename, status, patch):
${filesForPrompt}

Remember: Return ONLY the JSON object, nothing else.
`;

  // Helper to call OpenRouter
  async function callLLM(promptContent: string) {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.openRouterKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4.1", // stronger model for structure
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: promptContent },
        ],
        temperature: 0.2,
        max_output_tokens: 1200
      }),
    });

    const json: any = await resp.json();
    if (json.error) {
      console.error("LLM Error Response:", json);
      throw new Error("LLM did not return a valid response");
    }
    if (!json.choices || !json.choices[0]) {
      console.error("LLM returned no choices:", json);
      throw new Error("LLM returned an empty response");
    }

    const content = json.choices[0].message?.content;
    if (!content) {
      console.error("LLM returned no content:", json);
      throw new Error("LLM returned no content");
    }

    return content as string;
  }

  // 3) PRIMARY CALL
  let content: string;
  try {
    content = await callLLM(userPrompt);
  } catch (err) {
    console.error("Primary LLM call failed:", err);
    throw err;
  }

  // 4) TRY PARSING JSON
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (err) {
    console.warn("Primary JSON parse failed. Attempting repair...");
    console.warn("Broken JSON was:", content);

    // 5) JSON REPAIR PASS
    try {
      const repairResp = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.openRouterKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "anthropic/claude-3-sonnet",
            messages: [
              {
                role: "system",
                content:
                  "You are a strict JSON repair assistant. Fix the following broken JSON. Return ONLY valid JSON, no explanation, no markdown.",
              },
              { role: "user", content },
            ],
            temperature: 0,
            max_output_tokens: 1200,
          }),
        }
      );

      const repairJson: any = await repairResp.json();
      const repaired = repairJson.choices?.[0]?.message?.content;

      if (!repaired) {
        console.error("JSON repair returned no content:", repairJson);
        throw new Error("JSON repair returned no content");
      }

      try {
        parsed = JSON.parse(repaired);
      } catch (err2) {
        console.error("JSON repair failed to parse:", repaired);
        throw new Error("LLM returned invalid JSON and repair failed");
      }
    } catch (repairErr) {
      console.error("JSON repair step failed:", repairErr);
      throw new Error("LLM returned invalid JSON");
    }
  }

  // 6) FINAL VALIDATION + SAFE COERCION
  const safeSummary: PRSlideSummary = {
    title: parsed.title || input.title || "Pull Request Summary",
    overview: parsed.overview || "No overview provided.",
    keyChanges: Array.isArray(parsed.keyChanges) ? parsed.keyChanges : [],
    fileChanges: Array.isArray(parsed.fileChanges)
      ? parsed.fileChanges.map((fc: any) => ({
          filePath: fc.filePath || "unknown",
          changeType: fc.changeType || "modified",
          summary: fc.summary || "",
        }))
      : [],
    risks: Array.isArray(parsed.risks) ? parsed.risks : [],
    testing: Array.isArray(parsed.testing) ? parsed.testing : [],
  };

  return safeSummary;
}