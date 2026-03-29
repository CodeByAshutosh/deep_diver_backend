import fs from "fs";
import path from "path";
import { PRSlideSummary } from "../types.js";
import { config } from "../config.js";

export function generateHtmlSlides(
  summary: PRSlideSummary,
  opts: { owner: string; repo: string; prNumber: number }
): { filePath: string; publicUrl: string } {
  const fileName = `pr-${opts.owner}-${opts.repo}-${opts.prNumber}.html`;
  const outDir = path.join(process.cwd(), config.storageDir);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const filePath = path.join(outDir, fileName);
  const html = buildHtml(summary, opts);
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

function buildHtml(summary: PRSlideSummary, opts: { owner: string; repo: string; prNumber: number }): string {
  const fileCount = summary.fileChanges?.length || 0;
  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#a78bfa"];
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PR #${opts.prNumber} — ${escapeHtml(summary.title)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
    :root {
      --bg:#0a0e17;--surface:#111827;--surface2:#1a2235;--border:#1e293b;
      --accent:#3b82f6;--accent-glow:rgba(59,130,246,0.15);
      --green:#10b981;--green-glow:rgba(16,185,129,0.12);
      --red:#ef4444;--red-glow:rgba(239,68,68,0.12);
      --amber:#f59e0b;--amber-glow:rgba(245,158,11,0.12);
      --purple:#a78bfa;--purple-glow:rgba(167,139,250,0.12);
      --cyan:#22d3ee;--teal:#2dd4bf;--teal-glow:rgba(45,212,191,0.12);
      --orange:#fb923c;--orange-glow:rgba(251,146,60,0.12);
      --text:#e2e8f0;--text-dim:#94a3b8;--text-muted:#64748b;--code-bg:#0d1117;
    }
    *{margin:0;padding:0;box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{font-family:'Inter',-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.7;overflow-x:hidden}
    nav{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(10,14,23,0.85);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);padding:0 2rem;display:flex;align-items:center;height:56px}
    nav .logo{font-weight:800;font-size:0.85rem;letter-spacing:0.5px;color:var(--accent)}
    nav .sep{margin:0 0.75rem;color:var(--text-muted)}
    nav .pr{font-weight:500;font-size:0.85rem;color:var(--text-dim)}
    nav .dots{margin-left:auto;display:flex;gap:6px}
    nav .dot{width:8px;height:8px;border-radius:50%;background:var(--text-muted);cursor:pointer;transition:all 0.3s}
    nav .dot:hover,nav .dot.active{background:var(--accent);transform:scale(1.3)}
    .deck{scroll-snap-type:y mandatory;overflow-y:scroll;height:100vh}
    .slide{scroll-snap-align:start;min-height:100vh;padding:80px 2rem 3rem;display:flex;flex-direction:column;justify-content:center;max-width:1100px;margin:0 auto;position:relative}
    .sn{position:absolute;top:72px;left:2rem;font-size:0.65rem;font-weight:700;letter-spacing:2px;color:var(--accent);text-transform:uppercase;opacity:0.6}
    h1{font-size:clamp(2rem,5vw,3.5rem);font-weight:900;line-height:1.1;letter-spacing:-1.5px;margin-bottom:1.5rem}
    .hl{color:var(--accent)}.hr{color:var(--red)}.hg{color:var(--green)}.ha{color:var(--amber)}.hp{color:var(--purple)}.ht{color:var(--teal)}.ho{color:var(--orange)}
    h2{font-size:1.6rem;font-weight:700;margin-bottom:1rem;letter-spacing:-0.5px}
    h3{font-size:1.1rem;font-weight:600;margin-bottom:0.5rem}
    p{color:var(--text-dim);font-size:1.05rem;margin-bottom:1rem}
    p.lead{font-size:1.25rem;color:var(--text);font-weight:300}
    .cg{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.25rem;margin-top:1.5rem}
    .card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.5rem;transition:all 0.3s}
    .card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 8px 30px var(--accent-glow)}
    .card .icon{font-size:2rem;margin-bottom:0.75rem}
    .card h3{font-size:1rem}
    .card p{font-size:0.9rem;color:var(--text-muted)}
    .c-green{border-left:3px solid var(--green)}.c-red{border-left:3px solid var(--red)}.c-amber{border-left:3px solid var(--amber)}.c-blue{border-left:3px solid var(--accent)}.c-purple{border-left:3px solid var(--purple)}.c-teal{border-left:3px solid var(--teal)}.c-orange{border-left:3px solid var(--orange)}
    pre{background:var(--code-bg);border:1px solid var(--border);border-radius:10px;padding:1.25rem;overflow-x:auto;font-family:'JetBrains Mono',monospace;font-size:0.82rem;line-height:1.65;margin:1rem 0;position:relative}
    code{font-family:'JetBrains Mono',monospace}
    .badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:700;letter-spacing:0.5px}
    .badge.med{background:var(--accent-glow);color:var(--accent);border:1px solid rgba(59,130,246,0.3)}
    .tbl{width:100%;border-collapse:separate;border-spacing:0;margin:1.25rem 0;border-radius:10px;overflow:hidden;border:1px solid var(--border)}
    .tbl th{background:var(--surface2);padding:0.75rem 1rem;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);text-align:left}
    .tbl td{padding:0.75rem 1rem;font-size:0.9rem;border-top:1px solid var(--border);color:var(--text-dim)}
    .tbl tr:hover td{background:var(--surface)}
    .ann{background:var(--surface);border-left:3px solid var(--accent);padding:1rem 1.25rem;border-radius:0 8px 8px 0;margin:1rem 0;font-size:0.92rem}
    .ann.warn{border-left-color:var(--amber)}.ann.danger{border-left-color:var(--red)}.ann.tip{border-left-color:var(--green)}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:2rem}
    @media(max-width:768px){.two-col{grid-template-columns:1fr}}
    .pill-list{display:flex;flex-wrap:wrap;gap:8px;margin:0.75rem 0}
    .pill{background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:4px 14px;font-size:0.8rem;color:var(--text-dim);font-weight:500}
    .sf{position:absolute;bottom:1.5rem;left:2rem;right:2rem;display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-muted);letter-spacing:0.5px}
    @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    .slide>*{animation:fadeUp 0.6s ease-out both}
    .slide>*:nth-child(2){animation-delay:0.1s}.slide>*:nth-child(3){animation-delay:0.2s}.slide>*:nth-child(4){animation-delay:0.3s}.slide>*:nth-child(5){animation-delay:0.35s}
    .meter{width:100%;height:32px;background:var(--surface);border-radius:16px;border:1px solid var(--border);overflow:hidden;position:relative;margin:0.75rem 0}
    .meter-fill{height:100%;border-radius:16px;transition:width 1s ease}
    .meta-box{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0.75rem 1.25rem;font-size:0.85rem}
    .stat-val{font-weight:700;color:var(--accent)}
  </style>
</head>
<body>

<nav>
  <span class="logo">DEEP DIVER</span>
  <span class="sep">›</span>
  <span class="pr">PR #${opts.prNumber}</span>
  <div class="dots">
    <div class="dot active" onclick="document.getElementById('s1').scrollIntoView()"></div>
    <div class="dot" onclick="document.getElementById('s2').scrollIntoView()"></div>
    <div class="dot" onclick="document.getElementById('s3').scrollIntoView()"></div>
    <div class="dot" onclick="document.getElementById('s4').scrollIntoView()"></div>
    <div class="dot" onclick="document.getElementById('s5').scrollIntoView()"></div>
  </div>
</nav>

<div class="deck">

<!-- SLIDE 1: TITLE -->
<section class="slide" id="s1">
  <div class="sn">01 / 05</div>
  <h1>${escapeHtml(summary.title)}</h1>
  <p class="lead">${escapeHtml(summary.overview)}</p>
  <div class="pill-list" style="margin-top:1.5rem">
    ${(summary.keyChanges || []).slice(0, 4).map(c => `<span class="pill">✓ ${escapeHtml(c.substring(0, 30))}</span>`).join("")}
  </div>
  <div style="margin-top:2rem;display:flex;gap:1rem;flex-wrap:wrap">
    <div class="meta-box"><span style="color:var(--text-muted)">Repository</span><br><strong>${escapeHtml(opts.owner)}/${escapeHtml(opts.repo)}</strong></div>
    <div class="meta-box"><span style="color:var(--text-muted)">Files</span><br><strong class="stat-val">${fileCount} files</strong></div>
    <div class="meta-box"><span style="color:var(--text-muted)">Changes</span><br><strong class="stat-val">${summary.keyChanges?.length || 0}</strong></div>
  </div>
  <div class="sf"><span>↓ Scroll to continue</span><span>Deep Diver · Instant PR Analysis</span></div>
</section>

<!-- SLIDE 2: KEY CHANGES -->
<section class="slide" id="s2">
  <div class="sn">02 / 05</div>
  <h1>🎯 Key <span class="hl">Changes</span></h1>
  <p class="lead">Here's what this PR accomplishes:</p>
  <div class="cg">
    ${(summary.keyChanges || []).map((change, i) => {
      const colors_map = ['hg', 'hl', 'ha', 'hr', 'hp'];
      const color = colors_map[i % 5];
      return `
    <div class="card">
      <div class="icon">${['✨', '🔧', '📦', '🚀', '🔐'][i % 5]}</div>
      <p style="color:var(--text);margin:0">${escapeHtml(change)}</p>
    </div>`;
    }).join("")}
  </div>
  <div class="sf"><span></span><span>Key Impact Areas</span></div>
</section>

<!-- SLIDE 3: FILES CHANGED -->
<section class="slide" id="s3">
  <div class="sn">03 / 05</div>
  <h1>📁 Files <span class="hl">Modified</span></h1>
  <p class="lead">${fileCount} files changed in this PR:</p>
  <table class="tbl">
    <thead>
      <tr>
        <th>File</th>
        <th>Type</th>
        <th>Summary</th>
      </tr>
    </thead>
    <tbody>
      ${(summary.fileChanges || []).map(f => `
      <tr>
        <td style="font-family:JetBrains Mono;font-size:0.85rem">${escapeHtml(f.filePath)}</td>
        <td><span class="badge med">${escapeHtml(f.changeType)}</span></td>
        <td>${escapeHtml(f.summary)}</td>
      </tr>`).join("")}
    </tbody>
  </table>
  <div class="sf"><span></span><span>File-by-file breakdown</span></div>
</section>

<!-- SLIDE 4: RISKS & TESTING -->
<section class="slide" id="s4">
  <div class="sn">04 / 05</div>
  <h1>⚠️ Risks & <span class="hg">Testing</span></h1>
  <div class="two-col">
    <div>
      <h2 style="font-size:1.3rem;margin-bottom:1rem">Potential Risks</h2>
      ${(summary.risks || []).map(r => `
      <div class="ann danger" style="margin-bottom:0.75rem">
        <strong>→</strong> ${escapeHtml(r)}
      </div>`).join("")}
    </div>
    <div>
      <h2 style="font-size:1.3rem;margin-bottom:1rem">Testing Strategy</h2>
      ${(summary.testing || []).map(t => `
      <div class="ann tip" style="margin-bottom:0.75rem">
        <strong>✓</strong> ${escapeHtml(t)}
      </div>`).join("")}
    </div>
  </div>
  <div class="sf"><span></span><span>Risk assessment & validation</span></div>
</section>

<!-- SLIDE 5: SUMMARY -->
<section class="slide" id="s5">
  <div class="sn">05 / 05</div>
  <h1>✅ <span class="hg">Summary</span></h1>
  <p class="lead">This PR is a well-structured change with clear benefits.</p>
  <div style="margin-top:2rem;display:grid;grid-template-columns:1fr 1fr;gap:2rem">
    <div class="card c-green">
      <h3>✓ Recommendations</h3>
      <ul style="list-style:none;padding:0">
        <li style="margin:0.5rem 0">🔍 Review all file changes carefully</li>
        <li style="margin:0.5rem 0">🧪 Run full test suite locally</li>
        <li style="margin:0.5rem 0">📋 Verify documentation updates</li>
        <li style="margin:0.5rem 0">🚀 Ready to merge after approval</li>
      </ul>
    </div>
    <div class="card c-blue">
      <h3>📊 Quick Stats</h3>
      <div style="margin-top:1rem">
        <p style="margin:0.25rem 0"><strong>Total Changes:</strong> ${fileCount} files</p>
        <p style="margin:0.25rem 0"><strong>Key Changes:</strong> ${summary.keyChanges?.length || 0}</p>
        <p style="margin:0.25rem 0"><strong>Risks Identified:</strong> ${summary.risks?.length || 0}</p>
        <p style="margin:0.25rem 0"><strong>Test Coverage:</strong> ${summary.testing?.length || 0} scenarios</p>
      </div>
    </div>
  </div>
  <div class="sf"><span>Generated by Deep Diver</span><span>End of presentation</span></div>
</section>

</div>

<script>
  // Update active dot on scroll
  window.addEventListener('scroll', () => {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const scrollPosition = window.scrollY + window.innerHeight / 2;
    
    slides.forEach((slide, index) => {
      const rect = slide.getBoundingClientRect();
      if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
        dots.forEach(d => d.classList.remove('active'));
        dots[index]?.classList.add('active');
      }
    });
  });
</script>

</body>
</html>`;
}