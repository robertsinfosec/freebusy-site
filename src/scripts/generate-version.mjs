import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export function getDateTimePartsInTimeZone(date, timeZone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "2-digit",
    month: "numeric",
    day: "2-digit",
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  });

  const parts = dtf.formatToParts(date);
  const out = {};
  for (const part of parts) {
    if (part.type !== "literal") out[part.type] = part.value;
  }

  return {
    year2: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour),
    minute: Number(out.minute),
  };
}

export function buildVersionEastern(date = new Date()) {
  // SemVer-safe numeric identifiers:
  // - major: YY
  // - minor: MDD (month has no leading zero; day may be 2-digit but we emit as number)
  // - patch: HMM (hour has no leading zero; minutes are included, but we emit as number)
  // Time source: Eastern Time (America/New_York), DST-aware.

  const { year2, month, day, hour, minute } = getDateTimePartsInTimeZone(date, "America/New_York");
  const major = String(year2);
  const minor = String(month * 100 + day);
  const patch = String(hour * 100 + minute);
  return `${major}.${minor}.${patch}`;
}

export function isValidVersion(v) {
  // Accept our timestamp-based version: YY.MDD.HMM (numeric identifiers, no leading zeros)
  const parts = v.split(".");
  if (parts.length !== 3) return false;
  for (const p of parts) {
    if (!/^(0|[1-9]\d*)$/.test(p)) return false;
  }
  return true;
}

async function safeWriteFile(filePath, content) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, content, "utf8");
}

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const projectDir = path.resolve(scriptDir, "..");

  const generatedTs = path.join(projectDir, "src", "version.generated.ts");
  const publicVersionFile = path.join(projectDir, "public", "version.txt");

  const fallback = "0.0.0";

  try {
    const version = buildVersionEastern();
    if (!isValidVersion(version)) {
      throw new Error(`generated version did not validate: ${version}`);
    }

    await safeWriteFile(generatedTs, `export const BUILD_VERSION = ${JSON.stringify(version)};\n`);
    await safeWriteFile(publicVersionFile, `${version}\n`);

    console.info(`[version] wrote ${path.relative(projectDir, generatedTs)} export BUILD_VERSION`);
    console.info(`[version] wrote ${path.relative(projectDir, publicVersionFile)} = ${version}`);
  } catch (err) {
    console.warn("[version] failed to generate version; using fallback", err);
    await safeWriteFile(generatedTs, `export const BUILD_VERSION = ${JSON.stringify(fallback)};\n`);
    await safeWriteFile(publicVersionFile, `${fallback}\n`);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : null;
const invokedUrl = invokedPath ? pathToFileURL(invokedPath).href : null;

if (invokedUrl === import.meta.url) {
  await main();
}
