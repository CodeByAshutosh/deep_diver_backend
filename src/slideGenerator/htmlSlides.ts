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
  
  // Generate slide navigation dots
  const totalSlides = generateSlideCount(summary);
  const dots = Array.from({ length: totalSlides }, (_, i) => 
    `<div class="dot" onclick="document.getElementById('s${i+1}').scrollIntoView()"></div>`
  ).join("");

  const allSlides = generateSlides(summary, opts);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PR #${opts.prNumber} — ${escapeHtml(summary.title)}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
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
      --light-bg:#f8f9fa;--light-surface:#ffffff;--light-text:#1a202c;--light-border:#e2e8f0;
    }
    *{margin:0;padding:0;box-sizing:border-box}
    html{scroll-behavior:smooth}
    body{font-family:'Inter',-apple-system,sans-serif;background:var(--bg);color:var(--text);line-height:1.7;overflow-x:hidden}
    body.light-mode{background:var(--light-bg);color:var(--light-text)}
    
    /* HEADER STYLES */
    header{position:fixed;top:0;left:0;right:0;z-index:100;background:rgba(10,14,23,0.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);padding:0 2rem;display:flex;align-items:center;justify-content:space-between;height:70px;gap:2rem}
    body.light-mode header{background:rgba(248,249,250,0.92);border-bottom-color:var(--light-border)}
    
    .header-left{display:flex;align-items:center;gap:1.5rem;flex:1;min-width:0}
    .header-branding{display:flex;align-items:center;gap:0.75rem}
    .header-logo{font-weight:900;font-size:1.1rem;letter-spacing:-0.5px;color:var(--accent);background:linear-gradient(135deg,#3b82f6,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .header-separator{color:var(--text-muted);opacity:0.5}
    .header-pr{font-weight:600;font-size:0.9rem;color:var(--text-dim)}
    body.light-mode .header-pr{color:#4b5563}
    
    .header-message{display:none;font-size:0.85rem;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px}
    body.light-mode .header-message{color:#718096}
    
    .header-center{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;flex:1;min-width:200px}
    .dot{width:8px;height:8px;border-radius:50%;background:var(--text-muted);cursor:pointer;transition:all 0.3s;opacity:0.6}
    .dot:hover{opacity:1;transform:scale(1.2)}
    .dot.active{background:var(--accent);opacity:1;transform:scale(1.4);box-shadow:0 0 12px var(--accent-glow)}
    
    .header-right{display:flex;align-items:center;gap:1rem}
    .theme-toggle{background:var(--surface);border:1px solid var(--border);color:var(--text-dim);padding:6px 10px;border-radius:6px;cursor:pointer;transition:all 0.3s;font-size:1rem;display:flex;align-items:center;justify-content:center}
    .theme-toggle:hover{background:var(--surface2);color:var(--accent)}
    body.light-mode .theme-toggle{background:var(--light-surface);border-color:var(--light-border);color:#718096}
    body.light-mode .theme-toggle:hover{background:#e2e8f0;color:var(--accent)}
    
    .back-btn{background:var(--accent);color:white;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;font-weight:600;font-size:0.85rem;transition:all 0.3s;display:flex;align-items:center;gap:6px}
    .back-btn:hover{transform:translateX(-3px);box-shadow:0 4px 12px var(--accent-glow)}
    @media(max-width:768px){.back-btn{padding:6px 12px;font-size:0.8rem}.header-message{display:none}}
    
    /* MAIN CONTENT */
    .deck{margin-top:70px;scroll-snap-type:y mandatory;overflow-y:scroll;height:calc(100vh - 70px)}
    .slide{scroll-snap-align:start;min-height:100vh;padding:80px 2rem 3rem;display:flex;flex-direction:column;justify-content:center;max-width:1200px;margin:0 auto;position:relative}
    body.light-mode .slide{background:var(--light-bg)}
    
    .sn{position:absolute;top:80px;left:2rem;font-size:0.65rem;font-weight:700;letter-spacing:2px;color:var(--accent);text-transform:uppercase;opacity:0.6}
    h1{font-size:clamp(2rem,5vw,3.5rem);font-weight:900;line-height:1.1;letter-spacing:-1.5px;margin-bottom:1.5rem}
    .hl{color:var(--accent)}.hr{color:var(--red)}.hg{color:var(--green)}.ha{color:var(--amber)}.hp{color:var(--purple)}.ht{color:var(--teal)}.ho{color:var(--orange)}
    h2{font-size:1.6rem;font-weight:700;margin-bottom:1rem;letter-spacing:-0.5px}
    h3{font-size:1.1rem;font-weight:600;margin-bottom:0.5rem}
    p{color:var(--text-dim);font-size:1.05rem;margin-bottom:1rem}
    body.light-mode p{color:#4b5563}
    p.lead{font-size:1.25rem;color:var(--text);font-weight:300}
    body.light-mode p.lead{color:var(--light-text)}
    
    ul{list-style:none;padding-left:0}
    li{margin:0.75rem 0;padding-left:1.5rem;position:relative}
    li:before{content:"▸";position:absolute;left:0;color:var(--accent)}
    .cg{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1.25rem;margin-top:1.5rem}
    .card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:1.5rem;transition:all 0.3s}
    body.light-mode .card{background:var(--light-surface);border-color:var(--light-border)}
    .card:hover{border-color:var(--accent);transform:translateY(-2px);box-shadow:0 8px 30px var(--accent-glow)}
    .card .icon{font-size:2rem;margin-bottom:0.75rem}
    .card h3{font-size:1rem}
    .card p{font-size:0.9rem;color:var(--text-muted)}
    body.light-mode .card p{color:#718096}
    
    .c-green{border-left:3px solid var(--green)}.c-red{border-left:3px solid var(--red)}.c-amber{border-left:3px solid var(--amber)}.c-blue{border-left:3px solid var(--accent)}.c-purple{border-left:3px solid var(--purple)}.c-teal{border-left:3px solid var(--teal)}.c-orange{border-left:3px solid var(--orange)}
    
    pre{background:var(--code-bg);border:1px solid var(--border);border-radius:10px;padding:1.25rem;overflow-x:auto;font-family:'JetBrains Mono',monospace;font-size:0.82rem;line-height:1.65;margin:1rem 0;position:relative}
    body.light-mode pre{background:#f5f5f5;border-color:var(--light-border)}
    code{font-family:'JetBrains Mono',monospace;background:var(--surface2);padding:2px 6px;border-radius:4px;font-size:0.9em}
    body.light-mode code{background:#e2e8f0}
    pre code{background:none;padding:0}
    
    .badge{display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:20px;font-size:0.75rem;font-weight:700;letter-spacing:0.5px}
    .badge.med{background:var(--accent-glow);color:var(--accent);border:1px solid rgba(59,130,246,0.3)}
    .badge.success{background:var(--green-glow);color:var(--green)}
    .badge.danger{background:var(--red-glow);color:var(--red)}
    .badge.warning{background:var(--amber-glow);color:var(--amber)}
    
    .tbl{width:100%;border-collapse:separate;border-spacing:0;margin:1.25rem 0;border-radius:10px;overflow:hidden;border:1px solid var(--border)}
    body.light-mode .tbl{border-color:var(--light-border)}
    .tbl th{background:var(--surface2);padding:0.75rem 1rem;font-size:0.8rem;font-weight:600;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);text-align:left}
    body.light-mode .tbl th{background:#e2e8f0;color:#718096}
    .tbl td{padding:0.75rem 1rem;font-size:0.9rem;border-top:1px solid var(--border);color:var(--text-dim)}
    body.light-mode .tbl td{border-color:var(--light-border);color:#4b5563}
    .tbl tr:hover td{background:var(--surface)}
    body.light-mode .tbl tr:hover td{background:#f8f9fa}
    
    .ann{background:var(--surface);border-left:3px solid var(--accent);padding:1rem 1.25rem;border-radius:0 8px 8px 0;margin:1rem 0;font-size:0.92rem}
    body.light-mode .ann{background:#f8f9fa;border-color:var(--light-border)}
    .ann.warn{border-left-color:var(--amber)}.ann.danger{border-left-color:var(--red)}.ann.tip{border-left-color:var(--green)}.ann.info{border-left-color:var(--accent)}
    .two-col{display:grid;grid-template-columns:1fr 1fr;gap:2rem}
    @media(max-width:768px){.two-col{grid-template-columns:1fr}}
    
    .pill-list{display:flex;flex-wrap:wrap;gap:8px;margin:0.75rem 0}
    .pill{background:var(--surface2);border:1px solid var(--border);border-radius:20px;padding:4px 14px;font-size:0.8rem;color:var(--text-dim);font-weight:500}
    body.light-mode .pill{background:#e2e8f0;border-color:var(--light-border);color:#4b5563}
    
    .sf{position:absolute;bottom:1.5rem;left:2rem;right:2rem;display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-muted);letter-spacing:0.5px}
    @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
    .slide>*{animation:fadeUp 0.6s ease-out both}
    .slide>*:nth-child(2){animation-delay:0.1s}.slide>*:nth-child(3){animation-delay:0.2s}.slide>*:nth-child(4){animation-delay:0.3s}.slide>*:nth-child(5){animation-delay:0.35s}
    
    .meta-box{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:0.75rem 1.25rem;font-size:0.85rem}
    body.light-mode .meta-box{background:var(--light-surface);border-color:var(--light-border)}
    .stat-val{font-weight:700;color:var(--accent)}
  </style>
</head>
<body>

<header>
  <div class="header-left">
    <div class="header-branding">
      <span class="header-logo">🎯 Deep Diver</span>
      <span class="header-separator">›</span>
      <span class="header-pr">PR #${opts.prNumber}</span>
    </div>
    <div class="header-message">Turning PRs into learning lessons in minutes</div>
  </div>
  
  <div class="header-center">
    ${dots}
  </div>
  
  <div class="header-right">
    <button class="theme-toggle" id="themeToggle" title="Toggle dark/light mode">🌙</button>
    <button class="back-btn" onclick="goBack()" title="Go back to PR">← Back</button>
  </div>
</header>

<div class="deck">
${allSlides}
</div>

<script>
  hljs.highlightAll();
  
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  const isDarkMode = localStorage.getItem('deepDiver_darkMode') !== 'false';
  
  function updateTheme(dark) {
    if (dark) {
      document.body.classList.remove('light-mode');
      localStorage.setItem('deepDiver_darkMode', 'true');
      themeToggle.textContent = '🌙';
    } else {
      document.body.classList.add('light-mode');
      localStorage.setItem('deepDiver_darkMode', 'false');
      themeToggle.textContent = '☀️';
    }
  }
  
  // Initialize theme
  updateTheme(isDarkMode);
  themeToggle.addEventListener('click', () => {
    updateTheme(document.body.classList.contains('light-mode'));
  });
  
  // Scroll tracking for dots
  window.addEventListener('scroll', () => {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    let current = 0;
    
    slides.forEach((slide, index) => {
      const rect = slide.getBoundingClientRect();
      if (rect.top <= window.innerHeight / 2 && rect.bottom >= window.innerHeight / 2) {
        current = index;
      }
    });
    
    dots.forEach((d, i) => {
      if (i === current) d.classList.add('active');
      else d.classList.remove('active');
    });
  });
  
  // Back button
  function goBack() {
    const prNumber = '${opts.prNumber}';
    const owner = '${opts.owner}';
    const repo = '${opts.repo}';
    const prUrl = \`https://github.com/\${owner}/\${repo}/pull/\${prNumber}\`;
    window.location.href = prUrl;
  }
  
  // Dot click navigation
  document.querySelectorAll('.dot').forEach((dot, index) => {
    dot.addEventListener('click', () => {
      const slides = document.querySelectorAll('.slide');
      if (slides[index]) {
        slides[index].scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
</script>

</body>
</html>`;
}

function generateSlideCount(summary: PRSlideSummary): number {
  let count = 5; // Base slides (title, overview, files, risks, summary)
  if (summary.motivation) count++;
  if (summary.keyDiffs && summary.keyDiffs.length > 0) count += Math.ceil(summary.keyDiffs.length / 2);
  if (summary.performanceImpact && (summary.performanceImpact.improvements.length > 0 || summary.performanceImpact.degradations.length > 0)) count++;
  if (summary.securityConsiderations && summary.securityConsiderations.length > 0) count++;
  if (summary.breakingChanges && summary.breakingChanges.length > 0) count++;
  if (summary.learningPoints && summary.learningPoints.length > 0) count++;
  return Math.min(count, 15); // Cap at 15 slides
}

function generateSlides(summary: PRSlideSummary, opts: { owner: string; repo: string; prNumber: number }): string {
  let slides = "";
  let slideNum = 1;
  const fileCount = summary.fileChanges?.length || 0;

  // SLIDE 1: TITLE
  slides += `
<section class="slide" id="s1">
  <div class="sn">01 / ${String(generateSlideCount(summary)).padStart(2, '0')}</div>
  <h1>${escapeHtml(summary.title)}</h1>
  <p class="lead">${escapeHtml(summary.overview)}</p>
  <div class="pill-list" style="margin-top:1.5rem">
    ${(summary.keyChanges || []).slice(0, 4).map(c => `<span class="pill">✓ ${escapeHtml(c.substring(0, 30))}</span>`).join("")}
  </div>
  <div style="margin-top:2rem;display:flex;gap:1rem;flex-wrap:wrap">
    <div class="meta-box"><span style="color:var(--text-muted)">Repository</span><br><strong>${escapeHtml(opts.owner)}/${escapeHtml(opts.repo)}</strong></div>
    <div class="meta-box"><span style="color:var(--text-muted)">Files</span><br><strong class="stat-val">${fileCount}</strong></div>
    <div class="meta-box"><span style="color:var(--text-muted)">Changes</span><br><strong class="stat-val">${summary.keyChanges?.length || 0}</strong></div>
  </div>
  <div class="sf"><span>↓ Scroll to continue</span><span>Deep Diver · Instant PR Analysis</span></div>
</section>`;
  slideNum++;

  // SLIDE 2: MOTIVATION (if available)
  if (summary.motivation) {
    slides += `
<section class="slide" id="s${slideNum}">
  <div class="sn">${String(slideNum).padStart(2, '0')} / ${String(generateSlideCount(summary)).padStart(2, '0')}</div>
  <h1>💡 Why This <span class="hl">PR?</span></h1>
  <p class="lead">${escapeHtml(summary.motivation)}</p>
  ${summary.whyChanges ? `
  <h2 style="margin-top:2rem;font-size:1.3rem">Key Reasons</h2>
  <ul>
    ${summary.whyChanges.map(w => `<li>${escapeHtml(w)}</li>`).join("")}
  </ul>` : ""}
  <div class="sf"><span></span><span>Motivation & Context</span></div>
</section>`;
    slideNum++;
  }

  // SLIDE 3: KEY CHANGES
  slides += `
<section class="slide" id="s${slideNum}">
  <div class="sn">${String(slideNum).padStart(2, '0')} / ${String(generateSlideCount(summary)).padStart(2, '0')}</div>
  <h1>🎯 Key <span class="hl">Changes</span></h1>
  <p class="lead">What this PR accomplishes:</p>
  <div class="cg">
    ${(summary.keyChanges || []).map((change, i) => {
      const icons = ['✨', '🔧', '📦', '🚀', '🔐', '📊', '🔍', '⚡'];
      return `
    <div class="card">
      <div class="icon">${icons[i % icons.length]}</div>
      <p style="color:var(--text);margin:0">${escapeHtml(change)}</p>
    </div>`;
    }).join("")}
  </div>
  <div class="sf"><span></span><span>Core Changes</span></div>
</section>`;
  slideNum++;

  // SLIDES: CODE DIFFS
  if (summary.keyDiffs && summary.keyDiffs.length > 0) {
    const diffsPerSlide = 2;
    for (let i = 0; i < summary.keyDiffs.length; i += diffsPerSlide) {
      const diffBatch = summary.keyDiffs.slice(i, i + diffsPerSlide);
      slides += `
<section class="slide" id="s${slideNum}">
  <div class="sn">${String(slideNum).padStart(2, '0')} / ${String(generateSlideCount(summary)).padStart(2, '0')}</div>
  <h1>💻 Code <span class="hl">Diffs</span></h1>
  ${diffBatch.map((diff, idx) => `
  <div style="margin-bottom:1.5rem">
    <h3 style="color:var(--accent);margin-bottom:0.75rem">📄 ${escapeHtml(diff.filePath)}</h3>
    <p style="font-size:0.95rem;color:var(--text-dim);margin-bottom:0.75rem">${escapeHtml(diff.summary)}</p>
    <pre><code class="language-diff">${escapeHtml(diff.before || "")}</code></pre>
    ${diff.after ? `<pre><code class="language-diff">${escapeHtml(diff.after)}</code></pre>` : ""}
  </div>`).join("")}
  <div class="sf"><span></span><span>Implementation Details</span></div>
</section>`;
      slideNum++;
    }
  }

  // SLIDE: FILES CHANGED
  slides += `
<section class="slide" id="s${slideNum}">
  <div class="sn">${String(slideNum).padStart(2, '0')} / ${String(generateSlideCount(summary)).padStart(2, '0')}</div>
  <h1>📁 Files <span class="hl">Modified</span></h1>
  <p class="lead">${fileCount} files changed:</p>
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
        <td><span class="badge ${f.changeType === 'added' ? 'success' : f.changeType === 'deleted' ? 'danger' : 'med'}">${escapeHtml(f.changeType)}</span></td>
        <td>${escapeHtml(f.summary)}</td>
      </tr>`).join("")}
    </tbody>
  </table>
  <div class="sf"><span></span><span>All Modified Files</span></div>
</section>`;
  slideNum++;

  // SLIDE: DEPENDENCIES
  if (summary.dependencies && (summary.dependencies.added.length > 0 || summary.dependencies.removed.length > 0 || summary.dependencies.updated.length > 0)) {
    slides += `
<section class="slide" id="s${slideNum}">
  <div class="sn">${String(slideNum).padStart(2, '0')} / ${String(generateSlideCount(summary)).padStart(2, '0')}</div>
  <h1>📦 <span class="hl">Dependencies</span></h1>
  <div class="two-col">
    ${summary.dependencies.added.length > 0 ? `
    <div>
      <h3 style="color:var(--green);margin-bottom:1rem">✓ Added</h3>
      <ul>
        ${summary.dependencies.added.map(d => `<li style="font-family:JetBrains Mono;font-size:0.9rem">${escapeHtml(d)}</li>`).join("")}
      </ul>
    </div>` : ""}
    ${summary.dependencies.removed.length > 0 ? `
    <div>
      <h3 style="color:var(--red);margin-bottom:1rem">✗ Removed</h3>
      <ul>
        ${summary.dependencies.removed.map(d => `<li style="font-family:JetBrains Mono;font-size:0.9rem;text-decoration:line-through">${escapeHtml(d)}</li>`).join("")}
      </ul>
    </div>` : ""}
  </div>
  ${summary.dependencies.updated.length > 0 ? `
  <div style="margin-top:1.5rem">
    <h3 style="color:var(--amber);margin-bottom:1rem">↻ Updated</h3>
    <ul>
      ${summary.dependencies.updated.map(d => `<li style="font-family:JetBrains Mono;font-size:0.9rem">${escapeHtml(d)}</li>`).join("")}
    </ul>
  </div>` : ""}
  <div class="sf"><span></span><span>Dependencies Changes</span></div>
</section>`;
    slideNum++;
  }

  // SLIDE: PERFORMANCE
  if (summary.performanceImpact && (summary.performanceImpact.improvements.length > 0 || summary.performanceImpact.degradations.length > 0)) {
    slides += `
<section class="slide" id="s${slideNum}">
  <div class="sn">${String(slideNum).padStart(2, '0')} / ${String(generateSlideCount(summary)).padStart(2, '0')}</div>
  <h1>⚡ Performance <span class="hl">Impact</span></h1>
  <div class="two-col">
    <div>
      <h3 style="color:var(--green);margin-bottom:1rem">🚀 Improvements</h3>
      ${summary.performanceImpact.improvements.length > 0 ? `
      <ul>
        ${summary.performanceImpact.improvements.map(i => `<li>${escapeHtml(i)}</li>`).join("")}
      </ul>` : `<p style="color:var(--text-muted)">No degradations</p>`}
    </div>
    <div>
      <h3 style="color:var(--amber);margin-bottom:1rem">⚠️ Degradations</h3>
      ${summary.performanceImpact.degradations.length > 0 ? `
      <ul>
        ${summary.performanceImpact.degradations.map(d => `<li>${escapeHtml(d)}</li>`).join("")}
      </ul>` : `<p style="color:var(--text-muted)">None expected</p>`}
    </div>
  </div>
  <div class="sf"><span></span><span>Performance Analysis</span></div>
</section>`;
    slideNum++;
  }

  // SLIDE: SECURITY
  if (summary.securityConsiderations && summary.securityConsiderations.length > 0) {
    slides += `
<section class="slide" id="s${slideNum}">
  <div class="sn">${String(slideNum).padStart(2, '0')} / ${String(generateSlideCount(summary)).padStart(2, '0')}</div>
  <h1>🔒 Security <span class="hl">Considerations</span></h1>
  <ul>
    ${summary.securityConsiderations.map(s => `<li>${escapeHtml(s)}</li>`).join("")}
  </ul>
  <div class="ann warn" style="margin-top:2rem">
    <strong>⚠️ Note:</strong> Review these security considerations before approving.
  </div>
  <div class="sf"><span></span><span>Security Review</span></div>
</section>`;
    slideNum++;
  }

  // SLIDE: BREAKING CHANGES
  if (summary.breakingChanges && summary.breakingChanges.length > 0) {
    slides += `
<section class="slide" id="s${slideNum}">
  <div class="sn">${String(slideNum).padStart(2, '0')} / ${String(generateSlideCount(summary)).padStart(2, '0')}</div>
  <h1>🚨 Breaking <span class="hr">Changes</span></h1>
  ${summary.breakingChanges.map(bc => `
  <div class="ann danger">
    <strong>⚠️ Breaking Change:</strong> ${escapeHtml(bc)}
  </div>`).join("")}
  <div class="sf"><span></span><span>Backward Compatibility</span></div>
</section>`;
    slideNum++;
  }

  // SLIDE: LEARNING POINTS
  if (summary.learningPoints && summary.learningPoints.length > 0) {
    slides += `
<section class="slide" id="s${slideNum}">
  <div class="sn">${String(slideNum).padStart(2, '0')} / ${String(generateSlideCount(summary)).padStart(2, '0')}</div>
  <h1>📚 Learning <span class="hl">Points</span></h1>
  <p class="lead">What you can learn from this PR:</p>
  <ul>
    ${summary.learningPoints.map(lp => `<li>${escapeHtml(lp)}</li>`).join("")}
  </ul>
  <div class="ann tip" style="margin-top:2rem">
    <strong>💡 Tip:</strong> Read the code diffs carefully to understand the implementation patterns.
  </div>
  <div class="sf"><span></span><span>Educational Value</span></div>
</section>`;
    slideNum++;
  }

  // SLIDE: RISKS & TESTING
  slides += `
<section class="slide" id="s${slideNum}">
  <div class="sn">${String(slideNum).padStart(2, '0')} / ${String(generateSlideCount(summary)).padStart(2, '0')}</div>
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
  <div class="sf"><span></span><span>Risk Assessment</span></div>
</section>`;
  slideNum++;

  // FINAL SLIDE: SUMMARY
  slides += `
<section class="slide" id="s${slideNum}">
  <div class="sn">${String(slideNum).padStart(2, '0')} / ${String(generateSlideCount(summary)).padStart(2, '0')}</div>
  <h1>✅ <span class="hg">Summary</span></h1>
  <p class="lead">Complete PR Review</p>
  <div style="margin-top:2rem;display:grid;grid-template-columns:1fr 1fr;gap:2rem;margin-bottom:2rem">
    <div class="card c-green">
      <h3>✓ What's Good</h3>
      <ul>
        <li>Clear motivation and implementation</li>
        <li>Comprehensive test coverage</li>
        <li>Well-organized file changes</li>
        <li>Good documentation</li>
      </ul>
    </div>
    <div class="card c-blue">
      <h3>📊 Quick Stats</h3>
      <div style="margin-top:1rem">
        <p style="margin:0.25rem 0"><strong>Total Files:</strong> ${fileCount}</p>
        <p style="margin:0.25rem 0"><strong>Key Changes:</strong> ${summary.keyChanges?.length || 0}</p>
        <p style="margin:0.25rem 0"><strong>Risks:</strong> ${summary.risks?.length || 0}</p>
        <p style="margin:0.25rem 0"><strong>Tests:</strong> ${summary.testing?.length || 0}</p>
      </div>
    </div>
  </div>
  ${summary.rollbackPlan ? `
  <div class="ann info">
    <strong>🔄 Rollback Plan:</strong> ${escapeHtml(summary.rollbackPlan)}
  </div>` : ""}
  <div class="sf"><span>Generated by Deep Diver</span><span>End of presentation</span></div>
</section>`;

  return slides;
}