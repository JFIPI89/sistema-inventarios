import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildHorusLogoSvg, FAVICON_LOGO_COLORS } from "../src/lib/brand/build-horus-logo-svg.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
writeFileSync(
  join(root, "public/brand/horus-icon.svg"),
  buildHorusLogoSvg(FAVICON_LOGO_COLORS, "mark")
);
console.log("Wrote public/brand/horus-icon.svg");
