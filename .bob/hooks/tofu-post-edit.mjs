// tofu-post-edit.mjs
// PostToolUse hook: after writing a .tf or .hcl file, runs 'tofu fmt' and
// 'tofu validate -no-color' and adds findings to model context via stdout.
// Exits 0 always (PostToolUse exit 2 is ignored; fail open by design).

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const EDIT_TOOLS = new Set([
  "write_file",
  "apply_diff",
  "search_and_replace",
  "insert_content",
]);
const HCL_RE = /\.(tf|hcl)$/;

let raw = "";
try {
  for await (const chunk of process.stdin) raw += chunk;
  const input = JSON.parse(raw);

  if (!EDIT_TOOLS.has(input.tool_name)) process.exit(0);

  const filePath = String(input.tool_input?.path ?? "");
  if (!HCL_RE.test(filePath)) process.exit(0);

  // Determine the directory containing the file
  const dir = filePath.includes("/")
    ? filePath.slice(0, filePath.lastIndexOf("/")) || "."
    : ".";

  // Check tofu is available
  const which = spawnSync("which", ["tofu"], { encoding: "utf8" });
  if (which.status !== 0) {
    process.stdout.write("tofu-post-edit: 'tofu' not found on PATH; skipping fmt/validate.\n");
    process.exit(0);
  }

  const findings = [];

  // fmt
  const fmt = spawnSync("tofu", ["fmt", "-diff", "-check", filePath], {
    encoding: "utf8",
    cwd: input.cwd ?? ".",
  });
  if (fmt.status !== 0) {
    findings.push(`tofu fmt: formatting issues in ${filePath}:\n${fmt.stdout}${fmt.stderr}`.trim());
  }

  // validate (needs initialized module; skip if .terraform is absent)
  const terraformDir = dir === "." ? ".terraform" : `${dir}/.terraform`;
  if (existsSync(terraformDir)) {
    const validate = spawnSync("tofu", ["validate", "-no-color"], {
      encoding: "utf8",
      cwd: dir,
    });
    if (validate.status !== 0) {
      findings.push(`tofu validate: ${validate.stdout}${validate.stderr}`.trim());
    }
  }

  if (findings.length > 0) {
    process.stdout.write(findings.join("\n\n") + "\n");
  }
} catch {
  // fail open
}
process.exit(0);
