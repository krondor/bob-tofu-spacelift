# 04 - Guardrails, Multi-Cloud & Response Contract

## Defense-in-Depth Guardrails
1. **Credentials (Strongest):** Short-lived, read-only credentials scoped to the task. Prefer OIDC/workload identity over static secrets.
2. **Spacelift Controls:** RBAC, spaces, policies (plan/approval/login), and PR reviews govern deployment.
3. **Bob Hooks:** Deterministic `PreToolUse` blocks destructive shell commands and MCP mutations (exit code 2). `PostToolUse` triggers formatting and validation.
4. **Context Hygiene:** Keep context lean; run subagents for noisy discovery (e.g. repo scanning) and return summaries only.

## Multi-Cloud Agnosticism
- Confirm target cloud provider (AWS, Azure, GCP) or read from `AGENTS.md`.
- `terraform-skill` defaults to AWS; request target-cloud equivalents when working with Azure or GCP.
- Cloud provider MCP servers (AWS Agent Toolkit, Azure MCP Server, Google Cloud MCP) are optional and read-only by default.

## Response Contract
Every substantive response must include:
1. Current phase and spec ID.
2. Actions taken or proposed diff.
3. Grounded evidence/sources (docs URLs, command output, MCP results).
4. Risk assessment and rollback path.
5. Concrete next step requiring user approval.
