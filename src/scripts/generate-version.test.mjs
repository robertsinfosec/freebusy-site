import { describe, expect, it } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildVersionEastern, isValidVersion } from "./generate-version.mjs";

describe("generate-version", () => {
  it("encodes Eastern Time as SemVer-safe numeric identifiers (no leading zeros)", () => {
    // Jan 6, 2026 is in EST (UTC-5).
    // These UTC instants correspond to the listed Eastern local times.
    const cases = [
      ["2026-01-06T05:05:00Z", "26.106.5"], // 00:05 ET -> 5
      ["2026-01-06T05:10:00Z", "26.106.10"], // 00:10 ET -> 10
      ["2026-01-06T06:00:00Z", "26.106.100"], // 01:00 ET -> 100
      ["2026-01-06T13:05:00Z", "26.106.805"], // 08:05 ET -> 805
      ["2026-01-07T03:04:00Z", "26.106.2204"], // 22:04 ET -> 2204 (still Jan 6 ET)
    ];

    for (const [isoUtc, expected] of cases) {
      const version = buildVersionEastern(new Date(isoUtc));
      expect(version).toBe(expected);
      expect(isValidVersion(version)).toBe(true);
      expect(version).toMatch(/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/);
    }
  });

  it("does not zero-pad month (October example)", () => {
    // Oct 7, 2026 is in EDT (UTC-4): 13:04 ET == 17:04Z
    const version = buildVersionEastern(new Date("2026-10-07T17:04:00Z"));
    expect(version).toBe("26.1007.1304");
    expect(isValidVersion(version)).toBe(true);
  });

  it("keeps major SemVer-valid for years 2000–2009", () => {
    // 2005-01-06 00:05 ET == 2005-01-06 05:05Z
    const version = buildVersionEastern(new Date("2005-01-06T05:05:00Z"));
    expect(version).toBe("5.106.5");
    expect(isValidVersion(version)).toBe(true);
  });

  it("persists the generated version into deployable assets", async () => {
    // `pretest` runs the generator, so these should exist in normal runs.
    const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
    const projectDir = path.resolve(scriptsDir, "..");

    const generatedTs = path.join(projectDir, "src", "version.generated.ts");
    const publicVersion = path.join(projectDir, "public", "version.txt");

    const [tsText, publicText] = await Promise.all([
      fs.readFile(generatedTs, "utf8"),
      fs.readFile(publicVersion, "utf8"),
    ]);

    const match = tsText.match(/BUILD_VERSION\s*=\s*"([^"]+)"/);
    expect(match).not.toBeNull();
    const tsVersion = match?.[1];

    const publicVersionTrimmed = publicText.trim();

    expect(tsVersion).toBeTruthy();
    expect(publicVersionTrimmed).toBe(tsVersion);
    expect(isValidVersion(publicVersionTrimmed)).toBe(true);
  });
});
