import fs from "fs";
import path from "path";
import { PRSlideSummary } from "../types";
import { config } from "../config";

export function generateHtmlSlides(
  summary: PRSlideSummary,
  opts: { owner: string; repo: string; prNumber: number }
): { filePath: string; publicUrl: string } {
  const fileName = `pr-${opts.owner}-${opts.repo}-${opts.prNumber}.html`;
  const outDir = path.join(process.cwd(), config.storageDir);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const filePath = path.join(outDir, fileName);
  const html = buildHtml(summary);
  fs.writeFileSync(filePath, html, "utf-8");

  const publicUrl = `${config.publicBaseUrl}/generated/${fileName}`;
  return { filePath, publicUrl };
}

function escapeHtml(str: string | undefined | null) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}


function buildHtml(summary: PRSlideSummary): string {
  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(summary.title)}</title>
  <link rel="stylesheet" href="https://unpkg.com/reveal.js/dist/reveal.css">
  <link rel="stylesheet" href="https://unpkg.com/reveal.js/dist/theme/black.css">
</head>
<body>
<div class="reveal">
  <div class="slides">

    <!-- Slide 1: Title + Overview -->
    <section>
      <h1>${escapeHtml(summary.title)}</h1>
      <p>${escapeHtml(summary.overview)}</p>
    </section>

    <!-- Slide 2: Key Changes -->
    <section>
      <h2>Key Changes</h2>
      <ul>
        ${(summary.keyChanges || []).map(c => `<li>${escapeHtml(c)}</li>`).join("")}
      </ul>
    </section>

    <!-- Slide 3: File Changes -->
    <section>
      <h2>File Changes</h2>
      <ul>
        ${(summary.fileChanges || [])
          .map(
            f => `
          <li>
            <strong>${escapeHtml(f.filePath)}</strong> — ${escapeHtml(
              f.changeType
            )}<br/>
            ${escapeHtml(f.summary)}
          </li>`
          )
          .join("")}
      </ul>
    </section>

    <!-- Slide 4: Risks -->
    <section>
      <h2>Risks & Impact</h2>
      <ul>
        ${(summary.risks || []).map(r => `<li>${escapeHtml(r)}</li>`).join("")}
      </ul>
    </section>

    <!-- Slide 5: Testing -->
    <section>
      <h2>Testing Notes</h2>
      <ul>
        ${(summary.testing || []).map(t => `<li>${escapeHtml(t)}</li>`).join("")}
      </ul>
    </section>

  </div>
</div>

<script src="https://unpkg.com/reveal.js/dist/reveal.js"></script>
<script>
  // @ts-ignore
  Reveal.initialize();
</script>
</body>
</html>
`;
}