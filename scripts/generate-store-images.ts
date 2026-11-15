import { chromium } from "@playwright/test";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { loadChromeStoreMetadata } from "./lib/store-metadata.ts";

type StoreImage = {
  width: number;
  height: number;
  file: string;
  html: string;
};

type PluginVisual = {
  color: string;
  accent: string;
  bullets: string[];
  content: string;
};

const root = process.cwd();

function discoverPlugins(): string[] {
  return readdirSync(path.join(root, "extensions"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .filter((plugin) => plugin !== "_template")
    .sort();
}

function readPackageVersion(plugin: string): string {
  const packageFile = path.join(root, "extensions", plugin, "package.json");
  const pluginPackage = JSON.parse(readFileSync(packageFile, "utf8")) as { version?: string };

  if (!pluginPackage.version) {
    throw new Error(`Missing version for ${plugin}`);
  }

  return pluginPackage.version;
}

function readIconDataUrl(plugin: string, manifestIcons: Record<string, string>): string {
  const iconPath = path.join(
    root,
    "extensions",
    plugin,
    "dist",
    "chrome-mv3",
    manifestIcons["128"] ?? manifestIcons["48"] ?? "",
  );
  const icon = readFileSync(iconPath);

  return `data:image/png;base64,${icon.toString("base64")}`;
}

function lines(count: number, className = "line"): string {
  const widths = [92, 78, 84, 68, 88, 74, 81, 62];

  return Array.from(
    { length: count },
    (_, index) =>
      `<div class="${className}" style="width:${widths[index % widths.length]}%"></div>`,
  ).join("");
}

const visuals: Record<string, PluginVisual> = {
  "dark-mode-lite": {
    color: "#111827",
    accent: "#60a5fa",
    bullets: ["One-click dark mode", "Adjustable strength", "Per-site preference"],
    content: `
      <div class="surface article">
        ${lines(7)}
      </div>
      <div class="dark-overlay"></div>
      <div class="floating-popup">
        <p class="popup-title">Dark Mode Lite</p>
        <div class="popup-row"><span>Enable</span><span class="switch on"></span></div>
        <label>Strength</label><div class="range"><span style="width:72%"></span></div>
      </div>
    `,
  },
  "tab-stash": {
    color: "#0f766e",
    accent: "#14b8a6",
    bullets: ["Stash the window", "Search and restore", "Local JSON backup"],
    content: `
      <div class="surface list">
        ${[
          "Documentation — API reference",
          "GitHub pull request #142",
          "Flight comparison",
          "CSS grid guide",
        ]
          .map(
            (title, index) =>
              `<div class="row"><span class="favicon">${index + 1}</span><span>${title}</span></div>`,
          )
          .join("")}
        <button class="cta">Restore all</button>
      </div>
    `,
  },
  "volume-booster": {
    color: "#c2410c",
    accent: "#f97316",
    bullets: ["Up to 300% gain", "Web Audio API", "Cross-origin warnings"],
    content: `
      <div class="surface audio">
        <div class="wave"><span style="height:32%"></span><span style="height:58%"></span><span style="height:78%"></span><span style="height:44%"></span><span style="height:86%"></span><span style="height:52%"></span></div>
        <div class="volume-slider"><span style="width:82%"></span></div>
        <p>Level: 240% · 3 media elements</p>
      </div>
    `,
  },
  "quick-translate": {
    color: "#15803d",
    accent: "#22c55e",
    bullets: ["Select to translate", "Current tab only", "Google Translate"],
    content: `
      <div class="surface article">
        ${lines(4)}
        <mark>selected source phrase</mark>
        ${lines(3)}
      </div>
      <div class="floating-popup bubble">
        <p class="popup-title">Quick Translate</p>
        <p class="translation">Translated result appears here.</p>
      </div>
    `,
  },
  "focus-lock": {
    color: "#6d28d9",
    accent: "#8b5cf6",
    bullets: ["Local blocklist", "Temporary unlock", "No data collection"],
    content: `
      <div class="surface blocked">
        <div class="lock">🔒</div>
        <p class="strong">This domain is locked</p>
        <p>Unlock for five minutes with your password.</p>
        <div class="input"></div>
      </div>
    `,
  },
  "newtab-dashboard": {
    color: "#1d4ed8",
    accent: "#3b82f6",
    bullets: ["Time and todos", "Personal shortcuts", "No search override"],
    content: `
      <div class="dashboard-grid">
        <div class="surface clock"><span class="tiny-label">Today</span><span class="clock-text">09:42</span></div>
        <div class="surface todos"><p class="tiny-label">Todos</p>${lines(3)}</div>
        <div class="surface shortcuts"><p class="tiny-label">Shortcuts</p><div class="chip-row"><span></span><span></span><span></span><span></span></div></div>
      </div>
    `,
  },
  "privacy-cleaner": {
    color: "#0f766e",
    accent: "#2dd4bf",
    bullets: ["Current origin only", "User-triggered cleanup", "No browsing history"],
    content: `
      <div class="surface form">
        <p class="strong">Clear example.com</p>
        ${["Cookies", "Local storage", "IndexedDB", "Cache"]
          .map(
            (label, index) =>
              `<div class="check-row"><span class="checkbox ${index < 3 ? "on" : ""}"></span><span>${label}</span></div>`,
          )
          .join("")}
        <button class="cta">Clean this site</button>
      </div>
    `,
  },
  "reading-progress": {
    color: "#b45309",
    accent: "#f59e0b",
    bullets: ["Thin scroll progress", "Top or bottom", "Color and offset controls"],
    content: `
      <div class="progress top"></div>
      <div class="surface article">
        ${lines(8)}
      </div>
    `,
  },
  "clipboard-history-lite": {
    color: "#4338ca",
    accent: "#6366f1",
    bullets: ["Explicit copies only", "Search and restore", "Local history cap"],
    content: `
      <div class="surface list">
        ${["Release checklist", "Support email draft", "API endpoint", "Meeting note"]
          .map(
            (text, index) =>
              `<div class="row"><span>${text}</span><span class="action">${index === 0 ? "Copied" : "Copy"}</span></div>`,
          )
          .join("")}
      </div>
    `,
  },
  "screenshot-annotator": {
    color: "#9f1239",
    accent: "#fb7185",
    bullets: ["Capture visible area", "Draw and annotate", "Local clipboard export"],
    content: `
      <div class="surface canvas">
        <div class="canvas-area"><span class="annotation"></span><span class="arrow"></span></div>
        <div class="toolbar"><span class="tool on"></span><span class="tool"></span><span class="tool"></span><span class="tool"></span></div>
      </div>
    `,
  },
  "font-switcher": {
    color: "#4338ca",
    accent: "#818cf8",
    bullets: ["Local system fonts", "Instant preview", "No font downloads"],
    content: `
      <div class="surface fonts">
        <div class="font-card"><span class="glyph" style="font-family:'Kaiti SC','KaiTi',serif">永</span><span>楷体</span></div>
        <div class="font-card"><span class="glyph" style="font-family:'SimSun','Songti SC',serif">永</span><span>宋体</span></div>
        <div class="font-card"><span class="glyph" style="font-family:'PingFang SC','Microsoft YaHei',sans-serif">永</span><span>黑体</span></div>
      </div>
    `,
  },
};

function baseStyles(): string {
  return `
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0; overflow: hidden; color: #1f1f1f;
        font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
        background:
          radial-gradient(circle at 12% 18%, rgba(66,133,244,.14), transparent 28%),
          radial-gradient(circle at 88% 82%, rgba(52,168,83,.13), transparent 30%),
          linear-gradient(145deg,#f8fafc,#e2e8f0);
      }
      .browser { position:absolute; inset:4%; background:#fff; border-radius:20px;
        box-shadow:0 24px 70px rgba(15,23,42,.18); overflow:hidden; border:1px solid #dbe2ea; }
      .toolbar { height:9%; min-height:34px; display:flex; align-items:center; gap:2%;
        padding:0 3%; background:#f1f3f4; border-bottom:1px solid #dfe3e8; }
      .dot { width:9px; height:9px; border-radius:50%; background:#c8ccd0; }
      .dot:nth-child(1){background:#f17b6f}.dot:nth-child(2){background:#f3c34d}.dot:nth-child(3){background:#5dbb6b}
      .url { flex:1; height:56%; display:flex; align-items:center; gap:8px; background:#fff;
        border-radius:99px; padding:0 14px; border:1px solid #dfe3e8; color:#5f6368; font-size:.72vw; }
      .icon { width:2.1vw; height:2.1vw; min-width:18px; min-height:18px; border-radius:6px; object-fit:cover; }
      .stage { position:relative; height:91%; padding:3%; background:#fff; }
      .surface { background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; }
      .line { height:1.1vw; min-height:6px; border-radius:99px; background:#d9e0e7; margin-bottom:1.35vw; }
      .article { position:relative; z-index:2; width:62%; height:72%; padding:2.4%; }
      mark { display:inline-block; width:36%; height:1.2vw; background:#ffe49c; border-radius:6px; margin-bottom:1.35vw; }
      .floating-popup { position:absolute; z-index:3; right:5%; top:14%; width:24%; background:#fff;
        border:1px solid #dbe2ea; border-radius:14px; padding:1.4%; box-shadow:0 18px 50px rgba(15,23,42,.16); }
      .popup-title { margin:0 0 2%; font-weight:750; font-size:.9vw; }
      .popup-row { display:flex; justify-content:space-between; align-items:center; font-size:.72vw; color:#5f6368; margin-bottom:5%; }
      .switch { width:3.5vw; height:1.6vw; min-width:30px; min-height:14px; border-radius:99px; background:#c8ccd0; position:relative; }
      .switch.on { background:#34a853; }
      .switch.on::after { content:""; position:absolute; right:2px; top:2px; width:calc(1.6vw - 4px); height:calc(1.6vw - 4px); background:#fff; border-radius:50%; }
      label { font-size:.7vw; color:#5f6368; }
      .range { height:.55vw; background:#e6eaee; border-radius:99px; margin-top:6%; }
      .range span { display:block; height:100%; width:72%; border-radius:99px; background:#1a73e8; }
      .list { width:58%; height:70%; padding:2%; display:flex; flex-direction:column; gap:1.1vw; }
      .row { display:flex; align-items:center; gap:12px; background:#fff; border:1px solid #e5eaf0;
        border-radius:10px; min-height:3.6vw; padding:0 5%; font-size:.82vw; color:#30343a; }
      .favicon { display:grid; place-items:center; width:1.7vw; height:1.7vw; border-radius:50%;
        background:#e6f4ea; color:#188038; font-size:.72vw; font-weight:700; }
      .cta { margin-top:auto; align-self:flex-start; background:#1a73e8; color:#fff; border:0;
        border-radius:99px; padding:.7vw 1.6vw; font-size:.8vw; font-weight:650; }
      .audio { width:58%; height:62%; padding:3%; display:flex; flex-direction:column; justify-content:space-between; }
      .wave { display:flex; align-items:flex-end; gap:1vw; height:52%; }
      .wave span { flex:1; background:#f97316; border-radius:8px; }
      .volume-slider { height:.8vw; background:#e6eaee; border-radius:99px; }
      .volume-slider span { display:block; height:100%; width:82%; border-radius:99px; background:#ea8600; }
      .audio p { margin:0; color:#5f6368; font-size:.78vw; }
      .bubble { top:44%; right:18%; width:30%; }
      .translation { margin:0; font-size:.82vw; line-height:1.5; color:#202124; }
      .blocked { width:54%; height:64%; margin:auto; display:grid; place-content:center; text-align:center; padding:3%; }
      .lock { font-size:3vw; margin-bottom:1vw; }
      .strong { font-weight:800; font-size:1.3vw; margin:0 0 1vw; }
      .blocked p:not(.strong) { color:#5f6368; font-size:.82vw; margin:0 0 2vw; }
      .input { width:70%; height:2.4vw; margin:auto; background:#fff; border:1px solid #dadce0; border-radius:8px; }
      .dashboard-grid { height:86%; display:grid; grid-template-columns:1fr 1.3fr; grid-template-rows:1fr 1.2fr; gap:1.6vw; }
      .clock,.todos,.shortcuts { padding:6%; display:flex; flex-direction:column; }
      .clock-text { font-size:2.9vw; font-weight:800; margin-top:auto; color:#1a73e8; }
      .tiny-label { margin:0 0 6%; font-size:.72vw; text-transform:uppercase; letter-spacing:.1em; color:#5f6368; }
      .chip-row { display:grid; grid-template-columns:repeat(2,1fr); gap:8%; margin-top:auto; }
      .chip-row span { height:2.8vw; border-radius:10px; background:#e8f0fe; }
      .form { width:44%; height:74%; margin:auto; padding:3%; display:flex; flex-direction:column; gap:2%; }
      .check-row { display:flex; align-items:center; gap:12px; font-size:.82vw; color:#30343a; }
      .checkbox { width:1.4vw; height:1.4vw; border:2px solid #dadce0; border-radius:4px; }
      .checkbox.on { background:#1a73e8; border-color:#1a73e8; }
      .form .cta { margin-top:auto; align-self:stretch; text-align:center; }
      .progress { position:absolute; left:6%; right:6%; height:6px; background:#f59e0b; border-radius:99px; }
      .progress.top { top:calc(4% + 3%); }
      .canvas { width:62%; height:68%; padding:2%; display:flex; flex-direction:column; gap:5%; }
      .canvas-area { position:relative; flex:1; background:#e8f0fe; border-radius:10px; overflow:hidden; }
      .annotation { position:absolute; left:18%; top:22%; width:38%; height:32%; border:4px solid #db2777; border-radius:8px; }
      .arrow { position:absolute; left:58%; top:62%; width:22%; height:4px; background:#db2777; transform:rotate(-25deg); }
      .toolbar { height:3vw; display:flex; align-items:center; gap:1vw; }
      .tool { width:1.6vw; height:1.6vw; border-radius:6px; background:#dadce0; }
      .tool.on { background:#db2777; }
      .fonts { width:60%; height:68%; padding:2.5%; display:grid; grid-template-columns:repeat(3,1fr); gap:1.4vw; }
      .font-card { background:#fff; border:1px solid #e5eaf0; border-radius:12px; display:grid;
        place-items:center; align-content:center; gap:.9vw; font-size:.85vw; color:#30343a; }
      .glyph { font-size:3.6vw; line-height:1; color:#4f46e5; }
      .ribbon { position:absolute; left:4%; right:4%; bottom:2%; height:8%; display:flex;
        align-items:center; justify-content:space-between; padding:0 2%; background:rgba(255,255,255,.82);
        border:1px solid rgba(255,255,255,.7); border-radius:99px; box-shadow:0 12px 30px rgba(15,23,42,.12); }
      .ribbon-title { font-weight:800; font-size:1vw; }
      .ribbon-summary { font-size:.74vw; color:#5f6368; max-width:72%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      @media (max-width: 660px) {
        .browser { inset:3%; border-radius:12px; }
        .ribbon { height:9%; bottom:1%; }
        .ribbon-title { font-size:10px; }
        .ribbon-summary { font-size:8px; max-width:64%; }
        .url { font-size:8px; }
        .popup-title { font-size:11px; }
        .row { font-size:9px; min-height:22px; }
        .cta { font-size:9px; padding:5px 10px; }
        .audio p,.check-row,.translation,.blocked p:not(.strong),.tiny-label { font-size:8px; }
        .strong { font-size:13px; }
        .clock-text { font-size:24px; }
        .input { height:16px; }
      }
    </style>
  `;
}

function screenshotHtml(
  plugin: string,
  title: string,
  summary: string,
  iconDataUrl: string,
  visual: PluginVisual,
): string {
  return `<!doctype html><html><head><meta charset="utf-8">${baseStyles()}</head><body>
    <div class="browser">
      <div class="toolbar">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <div class="url"><img class="icon" src="${iconDataUrl}" alt="" />https://example.com</div>
      </div>
      <div class="stage">${visual.content}</div>
    </div>
    <div class="ribbon">
      <span class="ribbon-title">${title}</span>
      <span class="ribbon-summary">${summary}</span>
    </div>
    <span data-plugin="${plugin}" style="display:none"></span>
  </body></html>`;
}

function promoHtml(
  title: string,
  summary: string,
  iconDataUrl: string,
  visual: PluginVisual,
  width: number,
  height: number,
): string {
  const compact = width < 500;

  return `<!doctype html><html><head><meta charset="utf-8"><style>
    * { box-sizing:border-box; margin:0; }
    body { width:${width}px; height:${height}px; overflow:hidden; color:#fff;
      font-family:system-ui,-apple-system,"Segoe UI",sans-serif;
      background:linear-gradient(135deg, ${visual.color}, ${visual.accent});
      display:flex; align-items:center; }
    .glow { position:absolute; width:${width * 0.75}px; height:${width * 0.75}px;
      right:-${width * 0.22}px; top:-${width * 0.25}px; border-radius:50%;
      background:radial-gradient(circle, rgba(255,255,255,.18), transparent 60%); }
    .layout { position:relative; display:flex; align-items:center; gap:${compact ? 14 : width * 0.055}px;
      padding:0 ${compact ? 22 : width * 0.065}px; width:100%; }
    .icon { width:${compact ? 62 : width * 0.13}px; height:${compact ? 62 : width * 0.13}px;
      border-radius:${compact ? 13 : width * 0.028}px; background:rgba(255,255,255,.18);
      padding:${compact ? 7 : width * 0.016}px; box-shadow:0 14px 40px rgba(0,0,0,.22); }
    .copy { flex:1; min-width:0; }
    .title { font-size:${compact ? 22 : width * 0.044}px; line-height:1.1; font-weight:850; letter-spacing:-.02em; }
    .summary { margin-top:${compact ? 6 : width * 0.012}px; font-size:${compact ? 10 : width * 0.018}px;
      line-height:1.4; color:rgba(255,255,255,.9); }
    .bullets { display:${compact ? "none" : "flex"}; gap:${width * 0.012}px; margin-top:${width * 0.025}px; flex-wrap:wrap; }
    .bullets span { padding:${width * 0.008}px ${width * 0.016}px; background:rgba(255,255,255,.16);
      border:1px solid rgba(255,255,255,.22); border-radius:99px; font-size:${width * 0.015}px; }
  </style></head><body><div class="glow"></div><div class="layout">
    <img class="icon" src="${iconDataUrl}" alt="" />
    <div class="copy"><div class="title">${title}</div><div class="summary">${summary}</div>
      <div class="bullets">${visual.bullets.map((bullet) => `<span>${bullet}</span>`).join("")}</div></div>
  </div></body></html>`;
}

function buildImages(
  plugin: string,
  title: string,
  summary: string,
  iconDataUrl: string,
  visual: PluginVisual,
): StoreImage[] {
  return [
    {
      width: 1280,
      height: 800,
      file: "screenshots/main-1280x800.png",
      html: screenshotHtml(plugin, title, summary, iconDataUrl, visual),
    },
    {
      width: 640,
      height: 400,
      file: "screenshots/secondary-640x400.png",
      html: screenshotHtml(plugin, title, summary, iconDataUrl, visual),
    },
    {
      width: 440,
      height: 280,
      file: "promo/small-440x280.png",
      html: promoHtml(title, summary, iconDataUrl, visual, 440, 280),
    },
    {
      width: 1400,
      height: 560,
      file: "promo/marquee-1400x560.png",
      html: promoHtml(title, summary, iconDataUrl, visual, 1400, 560),
    },
  ];
}

function updateChecklist(plugin: string): void {
  const checklistPath = path.join(root, "docs", "listings", plugin, "screenshots.md");

  writeFileSync(
    checklistPath,
    [
      `# ${plugin} — screenshots`,
      "",
      "Generated listing assets (re-run `pnpm generate:store-images <plugin>` after UI changes):",
      "",
      "- [x] 1280×800 main UI screenshot: `images/screenshots/main-1280x800.png`",
      "- [x] 640×400 secondary screenshot: `images/screenshots/secondary-640x400.png`",
      "- [x] 440×280 small promo tile: `images/promo/small-440x280.png`",
      "- [x] 1400×560 marquee promo tile: `images/promo/marquee-1400x560.png`",
      "- [x] Realistic but non-confidential page state",
      "- [x] No personal data in URL bar or page content",
      "",
    ].join("\n"),
  );
}

async function main(): Promise<void> {
  const requested = process.argv[2];
  const plugins = requested ? [requested] : discoverPlugins();

  if (requested && !plugins.includes(requested)) {
    throw new Error(`Unknown or unsupported plugin: ${requested}`);
  }

  const browser = await chromium.launch({ headless: true });

  try {
    for (const plugin of plugins) {
      const { metadata } = loadChromeStoreMetadata({
        plugin,
        packageName: `@hub/${plugin}`,
        version: readPackageVersion(plugin),
        root,
      });
      const visual = visuals[plugin];

      if (!visual) {
        throw new Error(`No store image visual configured for ${plugin}`);
      }

      const iconDataUrl = readIconDataUrl(plugin, metadata.manifest.icons);
      const imageDir = path.join(root, "docs", "listings", plugin, "images");

      rmSync(imageDir, { recursive: true, force: true });
      mkdirSync(imageDir, { recursive: true });

      for (const image of buildImages(
        plugin,
        metadata.listing.name,
        metadata.listing.summary,
        iconDataUrl,
        visual,
      )) {
        const page = await browser.newPage({
          viewport: { width: image.width, height: image.height },
          deviceScaleFactor: 1,
        });
        const target = path.join(imageDir, image.file);

        mkdirSync(path.dirname(target), { recursive: true });
        await page.setContent(image.html, { waitUntil: "networkidle" });
        await page.screenshot({
          path: target,
          clip: { x: 0, y: 0, width: image.width, height: image.height },
        });
        await page.close();
        console.log(`✓ ${plugin}/${image.file} (${image.width}×${image.height})`);
      }

      updateChecklist(plugin);
    }
  } finally {
    await browser.close();
  }
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
