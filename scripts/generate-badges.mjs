import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { makeBadge } from "badge-maker";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = resolve(__dirname, "..");
const badgesDir = resolve(root, "badges");
const coverageSummaryPath = resolve(root, "coverage", "coverage-summary.json");

function parseArgs(argv) {
  const args = {
    skipCoverage: false,
    testsStatus: "passing",
  };

  for (const raw of argv) {
    if (raw === "--skip-coverage" || raw === "--tests-only") {
      args.skipCoverage = true;
      continue;
    }

    if (raw.startsWith("--testsStatus=")) {
      const value = raw.slice("--testsStatus=".length);
      if (value === "passing" || value === "failing") {
        args.testsStatus = value;
      }
    }
  }

  return args;
}

function coverageColor(pct) {
  if (pct >= 90) return "brightgreen";
  if (pct >= 80) return "green";
  if (pct >= 70) return "yellowgreen";
  if (pct >= 60) return "yellow";
  return "orange";
}

async function readCoveragePct() {
  try {
    const raw = await readFile(coverageSummaryPath, "utf8");
    const json = JSON.parse(raw);
    const pct = json?.total?.lines?.pct;
    if (!Number.isFinite(pct)) {
      return null;
    }
    return pct;
  } catch {
    return null;
  }
}

async function writeBadge(filename, label, message, color) {
  const svg = makeBadge({ label, message, color });
  await mkdir(badgesDir, { recursive: true });
  await writeFile(resolve(badgesDir, filename), svg, "utf8");
}

async function main() {
  const { skipCoverage, testsStatus } = parseArgs(process.argv.slice(2));

  if (!skipCoverage) {
    const pct = await readCoveragePct();
    if (pct === null) {
      await writeBadge("coverage.svg", "coverage", "n/a", "lightgrey");
    } else {
      await writeBadge("coverage.svg", "coverage", `${pct.toFixed(1)}%`, coverageColor(pct));
    }
  }

  const testsColor = testsStatus === "passing" ? "brightgreen" : "red";
  await writeBadge("tests.svg", "tests", testsStatus, testsColor);
  console.log(`Badges written to ${badgesDir}`);
}

main().catch((err) => {
  console.error("Failed to generate badges:", err);
  process.exit(1);
});
