// block-destructive.mjs
// PreToolUse hook: blocks destructive tofu/terraform commands run from the agent shell,
// and blocks Spacelift MCP mutation tools.
// Exit 2 denies the tool call. Errors cause exit 0 (fail open).

// ── execute_command rules ─────────────────────────────────────────────────────
//
// Strategy: require the command to name a tofu/terraform binary before matching
// subcommands, so `kubectl apply` or `apt-get remove` are never caught.
// Composition via `bash -c '...'`, `sh -c '...'`, `eval`, `&&`, `;`, or `|`
// is also blocked when the composed string contains a tofu/terraform invocation.
//
// Each entry is [label, regex]. Tested against the full command string.

const BLOCKED_COMMANDS = [
  // Direct binary invocations: tofu <subcommand> or terraform <subcommand>
  // Anchored so `not-tofu apply` does not match.
  ["apply",             /\b(tofu|terraform)\s+[^|&;#\n]*\bapply\b/],
  ["destroy",           /\b(tofu|terraform)\s+[^|&;#\n]*\bdestroy\b/],
  ["state-rm",          /\b(tofu|terraform)\s+state\s+(rm|remove|mv|move|push|replace-provider)\b/],
  ["force-unlock",      /\b(tofu|terraform)\s+force-unlock\b/],
  ["taint",             /\b(tofu|terraform)\s+(un)?taint\b/],
  ["-auto-approve",     /\b(tofu|terraform)\b[^|&;#\n]*-auto-approve\b/],
  ["import (direct)",   /\b(tofu|terraform)\s+import\b/],

  // Shell composition that wraps a tofu/terraform destructive call.
  // Catches: `bash -c 'tofu apply'`, `sh -c "terraform destroy"`, `eval "tofu apply"`,
  // as well as chained commands: `echo ok && tofu apply`.
  ["shell-wrapped apply",   /\b(bash|sh|zsh|eval)\b.*\b(tofu|terraform)\s+[^|&;#\n]*\bapply\b/],
  ["shell-wrapped destroy", /\b(bash|sh|zsh|eval)\b.*\b(tofu|terraform)\s+[^|&;#\n]*\bdestroy\b/],
  ["shell-wrapped state",   /\b(bash|sh|zsh|eval)\b.*\b(tofu|terraform)\s+state\s+(rm|remove|mv|move|push)\b/],
  ["chained apply",         /[|&;]\s*(tofu|terraform)\s+[^|&;#\n]*\bapply\b/],
  ["chained destroy",       /[|&;]\s*(tofu|terraform)\s+[^|&;#\n]*\bdestroy\b/],
];

// ── Spacelift MCP mutation rules ──────────────────────────────────────────────
//
// Bob tool names for MCP servers follow the pattern `mcp__<server>__<tool>`.
// We block mutate and intent* tools from any server whose name contains "spacelift".
// The user must issue an explicit YES or CONFIRM (enforced by mode instructions);
// this hook provides a deterministic second layer.

// Bob tool names: `mcp__<server>__<tool>`. The server segment may contain underscores
// when Bob truncates a long name (64-char limit), e.g. `mcp__spc_spacelift__mutate`.
// `[\w]*` matches word chars including underscores, keeping the match within the segment.
const BLOCKED_MCP_PATTERN = /^mcp__[\w]*spacelift[\w]*__(mutate|intent)/i;

// ─────────────────────────────────────────────────────────────────────────────

let raw = "";
try {
  for await (const chunk of process.stdin) raw += chunk;
  const input = JSON.parse(raw);

  const toolName = String(input.tool_name ?? "");

  // ── MCP mutation block ────────────────────────────────────────────────────
  if (BLOCKED_MCP_PATTERN.test(toolName)) {
    process.stderr.write(
      `Blocked: '${toolName}' is a Spacelift mutation tool. ` +
      `Spacelift mutations (mutate, intent) require a described operation, a diff, ` +
      `and an explicit YES or CONFIRM from the user before each call. ` +
      `Re-authenticate with mcp:write scope and confirm the operation explicitly.`
    );
    process.exitCode = 2;
    // do not call process.exit() — let Node flush stderr before exiting
  }
  // ── execute_command block ─────────────────────────────────────────────────
  else if (toolName === "execute_command") {
    const cmd = String(input.tool_input?.command ?? "");
    const hit = BLOCKED_COMMANDS.find(([, re]) => re.test(cmd));
    if (hit) {
      const [label] = hit;
      process.stderr.write(
        `Blocked: command matches destructive pattern '${label}'. ` +
        `Command: ${cmd.slice(0, 200)}. ` +
        `Deployments run in Spacelift after a reviewed PR is merged. ` +
        `For a local dry-run use 'tofu plan -out=<file>' with read-only credentials and ask first.`
      );
      process.exitCode = 2;
    }
  }
} catch {
  // fail open: unexpected input or parse error, let the tool proceed
  process.exit(0);
}
