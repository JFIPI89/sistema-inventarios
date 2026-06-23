import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const transcript = fs.readFileSync(
  "C:/Users/juanf/.cursor/projects/e-Proyectos-WEB-Sistema-de-inventarios/agent-transcripts/bf78b4b1-1d7b-43ad-9061-9041f75caee7/bf78b4b1-1d7b-43ad-9061-9041f75caee7.jsonl",
  "utf8"
);
const line = transcript.split("\n").find((l) => l.includes("530.00 479.05"));
if (!line) throw new Error("SVG line not found");

const row = JSON.parse(line);
const text = row.message?.content?.[0]?.text ?? "";
const m = text.match(/<svg xmlns=[\s\S]*<\/svg>/);
if (!m) throw new Error("SVG not found in message");
const svg = m[0];

const outDir = path.join(__dirname, "..", "public", "brand");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "horus-logo-official.svg"), svg);

const pathRe = /<path d="([^"]+)" fill="rgb\((\d+),(\d+),(\d+)\)"\/>/g;
const paths = [];
let match;
while ((match = pathRe.exec(svg)) !== null) {
  paths.push({ d: match[1], r: match[2], g: match[3], b: match[4] });
}

const libDir = path.join(__dirname, "..", "src", "lib", "brand");
fs.mkdirSync(libDir, { recursive: true });

const ink = paths.find((p) => p.r === "9" && p.g === "9" && p.b === "9");
const detail = paths.find((p) => p.r === "74" && p.g === "74" && p.b === "75");
const base = paths.find((p) => p.r === "253" && p.g === "253" && p.b === "253");

if (!ink || !detail || !base) {
  console.error("Could not classify paths", paths.map((p) => `${p.r},${p.g},${p.b}`));
  process.exit(1);
}

const ts = `/** Official DISTRIBUIDORA HORUS logo paths (auto-extracted). */
export const HORUS_LOGO_VIEWBOX = { full: "0 0 595 800", mark: "0 0 595 480" } as const;

export type HorusLogoVariant = keyof typeof HORUS_LOGO_VIEWBOX;

export const pathInk = ${JSON.stringify(ink.d)};

export const pathDetail = ${JSON.stringify(detail.d)};

export const pathBase = ${JSON.stringify(base.d)};
`;

fs.writeFileSync(path.join(libDir, "horus-logo-paths.ts"), ts);
console.log("Wrote horus-logo-official.svg and horus-logo-paths.ts");
