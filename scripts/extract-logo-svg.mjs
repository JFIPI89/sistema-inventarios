import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const svgPath = path.join(root, "public", "brand", "horus-logo-official.svg");

function loadSvgFromTranscript() {
  const transcriptPath =
    "C:/Users/juanf/.cursor/projects/e-Proyectos-WEB-Sistema-de-inventarios/agent-transcripts/bf78b4b1-1d7b-43ad-9061-9041f75caee7/bf78b4b1-1d7b-43ad-9061-9041f75caee7.jsonl";
  const transcript = fs.readFileSync(transcriptPath, "utf8");
  const line = transcript
    .split("\n")
    .find((l) => l.includes("752") && l.includes("736.94"));
  if (!line) throw new Error("SVG v2 line not found in transcript");

  const row = JSON.parse(line);
  const text = row.message?.content?.[0]?.text ?? "";
  let m = text.match(/<svg xmlns=[\s\S]*<\/svg>/);
  if (!m) {
    const frag = text.match(/xmlns="http:\/\/www\.w3\.org\/2000\/svg"[\s\S]*?<\/svg>/);
    if (!frag) throw new Error("SVG not found in message");
    m = [`<svg ${frag[0]}`];
  }
  return m[0];
}

let svg = fs.existsSync(svgPath) ? fs.readFileSync(svgPath, "utf8") : "";
if (!svg.includes('viewBox="0 0 752 800"')) {
  svg = loadSvgFromTranscript();
  fs.mkdirSync(path.dirname(svgPath), { recursive: true });
  fs.writeFileSync(svgPath, svg);
}

const pathRe = /<path d="([^"]+)" fill="rgba?\(([^)]+)\)"\/>/g;
const paths = [];
let match;
while ((match = pathRe.exec(svg)) !== null) {
  const parts = match[2].split(",").map((s) => s.trim());
  const r = parts[0];
  const g = parts[1];
  const b = parts[2];
  paths.push({ d: match[1], r, g, b });
}

if (paths.length !== 4) {
  console.error(
    "Expected 4 paths, got",
    paths.length,
    paths.map((p) => `${p.r},${p.g},${p.b}`)
  );
  process.exit(1);
}

function classify(p) {
  const key = `${p.r},${p.g},${p.b}`;
  if (key === "1,1,1" || key === "9,9,9") return "ink";
  if (key === "74,74,74" || key === "74,74,75") return "detail";
  if (key === "158,158,157") return "mid";
  if (key === "248,248,248" || key === "253,253,253") return "base";
  const lum = Number(p.r) * 0.299 + Number(p.g) * 0.587 + Number(p.b) * 0.114;
  if (lum < 30) return "ink";
  if (lum < 100) return "detail";
  if (lum < 200) return "mid";
  return "base";
}

const byRole = { ink: null, detail: null, mid: null, base: null };
for (const p of paths) {
  const role = classify(p);
  if (byRole[role]) {
    console.error("Duplicate role", role, "for", `${p.r},${p.g},${p.b}`);
    process.exit(1);
  }
  byRole[role] = p.d;
}

if (!byRole.ink || !byRole.detail || !byRole.mid || !byRole.base) {
  console.error("Could not classify all paths", byRole);
  process.exit(1);
}

/** Isotipo only: full eagle, excluding bottom text band (validated vs SVG v2 paths). */
const MARK_HEIGHT = 620;

const libDir = path.join(root, "src", "lib", "brand");
fs.mkdirSync(libDir, { recursive: true });

const ts = `/** Official DISTRIBUIDORA HORUS logo paths (auto-extracted). */
export const HORUS_LOGO_VIEWBOX = { full: "0 0 752 800", mark: "0 0 752 ${MARK_HEIGHT}" } as const;

export type HorusLogoVariant = keyof typeof HORUS_LOGO_VIEWBOX;

export const pathInk = ${JSON.stringify(byRole.ink)};

export const pathDetail = ${JSON.stringify(byRole.detail)};

export const pathMid = ${JSON.stringify(byRole.mid)};

export const pathBase = ${JSON.stringify(byRole.base)};
`;

fs.writeFileSync(path.join(libDir, "horus-logo-paths.ts"), ts);
console.log("Wrote horus-logo-official.svg and horus-logo-paths.ts (4 layers, 752x800)");
