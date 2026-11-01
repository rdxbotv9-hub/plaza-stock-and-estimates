import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

test("TanStack Start is pinned at or above Vercel's XSS fix in both dependency files", () => {
  const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
  const version = pkg.dependencies["@tanstack/react-start"];
  expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  const [major, minor, patch] = version.split(".").map(Number);
  const patched = major > 1 || (major === 1 && (minor > 168 || (minor === 168 && patch >= 60)));
  expect(patched).toBe(true);
  const lock = readFileSync(new URL("../bun.lock", import.meta.url), "utf8");
  expect(lock).toContain(`"@tanstack/react-start": "${version}"`);
  expect(lock).toContain(`"@tanstack/react-start@${version}"`);
});