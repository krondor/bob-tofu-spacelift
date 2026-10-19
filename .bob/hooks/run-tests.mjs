// run-tests.mjs — standalone test runner for block-destructive.mjs
// Usage: node .bob/hooks/run-tests.mjs
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const cases = JSON.parse(readFileSync(new URL("./test-cases.json", import.meta.url), "utf8"));

let passed = 0;
let failed = 0;

for (const { label, expect, input } of cases) {
  const result = spawnSync("node", [".bob/hooks/block-destructive.mjs"], {
    input: JSON.stringify(input),
    encoding: "utf8",
  });
  const got = result.status;
  const ok = got === expect;
  if (ok) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    console.error(`        expected exit ${expect}, got ${got}`);
    if (result.stderr) console.error(`        stderr: ${result.stderr.trim()}`);
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
