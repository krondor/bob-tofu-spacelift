// block-destructive.mjs
// PreToolUse hook: blocks destructive tofu/terraform commands run from the agent shell.
// Exit 2 denies the tool call. Errors cause exit 0 (fail open).

const BLOCKED = [
  /\bapply\b/,
  /\bdestroy\b/,
  /\bstate\s+(rm|remove|mv|move|push|replace-provider)\b/,
  /\bforce-unlock\b/,
  /\btaint\b/,
  /\buntaint\b/,
  /-auto-approve\b/,
];

let raw = "";
try {
  for await (const chunk of process.stdin) raw += chunk;
  const input = JSON.parse(raw);

  if (input.tool_name !== "execute_command") process.exit(0);

  const cmd = String(input.tool_input?.command ?? "");
  const hit = BLOCKED.find((re) => re.test(cmd));
  if (hit) {
    process.stderr.write(
      `Blocked: '${cmd}' matches a destructive command pattern (${hit}). ` +
      `Deployments run in Spacelift after a reviewed PR is merged. ` +
      `If you intended a local dry-run, use 'tofu plan' with read-only credentials and ask first.`
    );
    process.exitCode = 2;
  }
} catch {
  // fail open: unexpected input or parse error, let the tool proceed
  process.exit(0);
}
