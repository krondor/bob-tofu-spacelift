#!/usr/bin/env node
// install.mjs - installs the tofu-spacelift Bob mode and its assets into a target
// workspace's .bob/ folder, without cloning this repo into that workspace.
//
// Usage (from the target workspace):
//   npx github:krondor/bob-tofu-spacelift
//   node /path/to/bob-tofu-spacelift/scripts/install.mjs [target-dir] [options]
//
// Options:
//   --dry-run          Print what would change; write nothing.
//   --force            Replace an existing tofu-spacelift block in custom_modes.yaml.
//   --with-templates   Also copy AGENTS.md and specs/001-inventory (only if absent).
//   --git-exclude      Add installed paths to the target's .git/info/exclude
//                      (local-only ignore: keeps `git status` clean, nothing committed).
//
// Merge rules: custom_modes.yaml and .bob/settings.json are merged, never overwritten.
// Rules, hooks and skills are managed assets and are overwritten (that is the update path).

import {
  cpSync, existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, statSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SLUG = "tofu-spacelift";
const SRC = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positional = args.filter((a) => !a.startsWith("--"));
const DRY = flags.has("--dry-run");
const FORCE = flags.has("--force");
const TARGET = resolve(positional[0] ?? process.cwd());

if (resolve(TARGET) === SRC) {
  console.error("Refusing to install into the source repo itself. Pass a target workspace directory.");
  process.exit(1);
}
if (!existsSync(TARGET) || !statSync(TARGET).isDirectory()) {
  console.error(`Target is not a directory: ${TARGET}`);
  process.exit(1);
}

const installed = []; // paths relative to TARGET, for --git-exclude
const log = (msg) => console.log(`${DRY ? "[dry-run] " : ""}${msg}`);

function ensureDir(p) {
  if (!DRY) mkdirSync(p, { recursive: true });
}

// Copy a file or directory. dereference resolves symlinks (terraform-skill is a symlink in the source repo).
function copy(srcRel, destRel) {
  const src = join(SRC, srcRel);
  const dest = join(TARGET, destRel);
  if (!existsSync(src)) {
    console.error(`Missing source asset: ${srcRel}`);
    process.exit(1);
  }
  ensureDir(dirname(dest));
  if (!DRY) cpSync(src, dest, { recursive: true, dereference: true, force: true });
  installed.push(destRel);
  log(`copy   ${destRel}`);
}

// ── custom_modes.yaml: text-level merge (no YAML parser dependency) ─────────────
function installModes() {
  const rel = ".bob/custom_modes.yaml";
  const dest = join(TARGET, rel);
  const srcText = readFileSync(join(SRC, rel), "utf8").replace(/\r\n/g, "\n");
  const srcBlock = srcText.split("\n").slice(1).join("\n").trimEnd(); // everything after "customModes:"
  installed.push(rel);

  if (!existsSync(dest)) {
    ensureDir(dirname(dest));
    if (!DRY) writeFileSync(dest, srcText);
    return log(`create ${rel}`);
  }

  const destText = readFileSync(dest, "utf8").replace(/\r\n/g, "\n");
  if (/^customModes:\s*(\[\s*\])?\s*$/m.test(destText) && !/^\s+- slug:/m.test(destText)) {
    if (!DRY) writeFileSync(dest, srcText);
    return log(`fill   ${rel} (was empty)`);
  }
  if (!/^customModes:\s*$/m.test(destText) || !/^ {2}- /m.test(destText) || /^(?!customModes:)\S/m.test(destText)) {
    console.error(`${rel} has an unexpected layout. Add the mode manually from ${join(SRC, rel)}.`);
    process.exit(1);
  }

  const start = destText.search(new RegExp(`^ {2}- slug: ${SLUG}\\s*$`, "m"));
  if (start === -1) {
    if (!DRY) writeFileSync(dest, `${destText.trimEnd()}\n${srcBlock}\n`);
    return log(`append ${rel} (added ${SLUG})`);
  }
  if (!FORCE) return log(`skip   ${rel} (${SLUG} already present; use --force to replace it)`);
  const rest = destText.slice(start + 1);
  const next = rest.search(/^ {2}- /m);
  const end = next === -1 ? destText.length : start + 1 + next;
  if (!DRY) writeFileSync(dest, `${destText.slice(0, start)}${srcBlock}\n${destText.slice(end)}`);
  log(`replace ${rel} (${SLUG} block)`);
}

// ── .bob/settings.json: merge hook groups, preserve everything else ─────────────
function installSettings() {
  const rel = ".bob/settings.json";
  const dest = join(TARGET, rel);
  const srcHooks = JSON.parse(readFileSync(join(SRC, rel), "utf8")).hooks ?? {};
  let doc = {};
  if (existsSync(dest)) {
    try {
      doc = JSON.parse(readFileSync(dest, "utf8"));
    } catch (e) {
      console.error(`${rel} is not valid JSON (${e.message}). Fix it, then re-run.`);
      process.exit(1);
    }
  }
  doc.hooks ??= {};
  let added = 0;
  for (const [event, groups] of Object.entries(srcHooks)) {
    const have = (doc.hooks[event] ??= []);
    const seen = new Set(have.map((g) => JSON.stringify(g)));
    for (const g of groups) {
      if (!seen.has(JSON.stringify(g))) {
        have.push(g);
        added++;
      }
    }
  }
  installed.push(rel);
  if (added === 0) return log(`ok     ${rel} (hooks already present)`);
  ensureDir(dirname(dest));
  if (!DRY) writeFileSync(dest, `${JSON.stringify(doc, null, 2)}\n`);
  log(`merge  ${rel} (+${added} hook group${added === 1 ? "" : "s"})`);
}

// ── optional: local-only git ignore ────────────────────────────────────────────
function gitExclude() {
  const gitDir = join(TARGET, ".git");
  if (!existsSync(gitDir) || !statSync(gitDir).isDirectory()) {
    return log("skip   --git-exclude (target has no .git directory)");
  }
  const file = join(gitDir, "info", "exclude");
  const current = existsSync(file) ? readFileSync(file, "utf8") : "";
  const wanted = [...new Set([...installed, ".bob/mcp.json"])].map((p) =>
    existsSync(join(TARGET, p)) && statSync(join(TARGET, p)).isDirectory() ? `${p}/` : p,
  );
  const missing = wanted.filter((p) => !current.split("\n").includes(p));
  if (missing.length === 0) return log("ok     .git/info/exclude (already up to date)");
  if (!DRY) {
    mkdirSync(dirname(file), { recursive: true });
    appendFileSync(file, `${current && !current.endsWith("\n") ? "\n" : ""}# tofu-spacelift Bob assets (local only)\n${missing.join("\n")}\n`);
  }
  log(`exclude .git/info/exclude (+${missing.length} entries)`);
}

// ── run ────────────────────────────────────────────────────────────────────────
console.log(`Source: ${SRC}\nTarget: ${TARGET}\n`);

installModes();
copy(`.bob/rules-${SLUG}`, `.bob/rules-${SLUG}`);
copy(".bob/hooks", ".bob/hooks");
installSettings();
copy(".bob/skills/spacelift", ".bob/skills/spacelift");
copy(".bob/skills/spacelift-policy-writer", ".bob/skills/spacelift-policy-writer");
copy(".bob/skills/terraform-skill", ".bob/skills/terraform-skill"); // symlink resolved to real files
copy("LICENSES", ".bob/licenses/tofu-spacelift"); // upstream license text for vendored skills
copy(".bob/mcp.json.example", ".bob/mcp.json.example");

if (flags.has("--with-templates")) {
  for (const [from, to] of [["AGENTS.md", "AGENTS.md"], ["specs/001-inventory", "specs/001-inventory"]]) {
    if (existsSync(join(TARGET, to))) log(`skip   ${to} (already exists)`);
    else copy(from, to);
  }
}

if (flags.has("--git-exclude")) gitExclude();

const nodeMajor = Number(process.versions.node.split(".")[0]);
console.log(`\nDone. Next steps in ${TARGET}:`);
console.log("  1. Reopen the folder in Bob and trust the workspace (hooks only run in trusted workspaces).");
console.log("  2. Pick the mode 'OpenTofu + Spacelift'.");
console.log("  3. Optional: copy .bob/mcp.json.example to .bob/mcp.json and set your Spacelift account name.");
if (!flags.has("--with-templates")) console.log("  4. Optional: re-run with --with-templates to add AGENTS.md and a starter spec.");
if (nodeMajor < 18) console.log("  Warning: hooks need Node >= 18.");
