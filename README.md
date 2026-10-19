# OpenTofu + Spacelift: Bob mode and skills

A shareable IBM Bob workspace setup for refactoring Terraform to OpenTofu and running it through Spacelift, using spec-driven development and peer-reviewed git workflows.

**Status: not yet run against a real stack.** The mode has been validated for YAML syntax only. The first pilot run is the real test. Read [Review and flag before you use it](#review-and-flag-before-you-use-it) first.

## What is in this repo

| Path | What it is |
|---|---|
| [`.bob/custom_modes.yaml`](.bob/custom_modes.yaml) | The custom mode `tofu-spacelift` ("OpenTofu + Spacelift"). Workspace scope: it loads automatically when this folder is open in Bob. |
| [`.agents/skills/terraform-skill/`](.agents/skills/terraform-skill) | The community [antonbabenko/terraform-skill](https://github.com/antonbabenko/terraform-skill) (Apache-2.0, v1.17.1). Vendored by a third-party installer; read-only. |
| `.bob/skills/terraform-skill` | Symlink → `.agents/skills/terraform-skill` (created by the `antonbabenko` installer). |
| [`.bob/skills/spacelift/`](.bob/skills/spacelift) | Spacelift's own `spacelift` skill (MIT, v0.1.0). Installed directly into `.bob/skills` by `npx skills add`. |
| [`.bob/skills/spacelift-policy-writer/`](.bob/skills/spacelift-policy-writer) | Spacelift's `spacelift-policy-writer` skill (MIT, v0.1.0). Same installer, Bob-native layout. |
| [`skills-lock.json`](skills-lock.json) | Records all three skills' sources and content hashes. |
| [`LICENSES/`](LICENSES) | Upstream license text for vendored third-party content. |
| [`AGENTS.md`](AGENTS.md) | Shared contract for humans and agents. Fill in your organization's conventions. |
| [`.bob/mcp.json.example`](.bob/mcp.json.example) | Example MCP config. Copy to `.bob/mcp.json` and add your account name. |
| `.bob/settings.json` | Bob hooks: blocks destructive commands, runs fmt/validate/scan after edits. |
| `.gitignore` | Keeps state, plans, `.tfvars`, `.env` and local noise out of git. |

Not included on purpose: Spacelift connection settings active in git (they need your account name — see `.bob/mcp.json.example`).

## Setup (per team member)

1. Clone the repo and open the folder in Bob. Trust the workspace when asked.
2. Select the mode **OpenTofu + Spacelift** in the mode picker. If it is missing, the YAML failed validation and Bob dropped the whole file. Check the slug (`tofu-spacelift`), group names and that the file is plain ASCII.
3. Connect the Spacelift MCP (optional but needed for live Spacelift data). Copy `.bob/mcp.json.example` to `.bob/mcp.json` and replace the account-name placeholder with your account. Then open Bob and authenticate via OAuth.

   ```json
   {
     "mcpServers": {
       "spacelift": {
         "type": "streamable-http",
         "url": "https://<account-name>.app.spacelift.io/mcp?tools=query,provider"
       }
     }
   }
   ```

   - US-hosted accounts use `https://<account-name>.app.us.spacelift.io/mcp`.
   - The first connection opens a browser for OAuth. Approve **`mcp:read` only**. Re-authenticate with `mcp:write` only when a spec task truly needs a change.
   - `?tools=` is an alpha Spacelift feature. It can only narrow what you get, never widen it.
   - Do not put tokens in this file. Do not add `mutate` or `intent` to `alwaysAllow`.
   - `.bob/mcp.json` is git-ignored. Commit it only if your team agrees the account name is not sensitive.
4. Leave Bob auto-approve **off for Execute and MCP** while using this mode.
5. Windows users: `.bob/skills/terraform-skill` is a symlink to `.agents/skills/terraform-skill`. Enable symlinks (`git config core.symlinks true` and Windows Developer Mode) before cloning, or re-run the installer (see [Updating the skill](#the-terraform-skill)) and select Bob, which recreates the link. As a last resort, copy the skill folder into `.bob/skills/`.
6. Fill in [`AGENTS.md`](AGENTS.md): replace all `<!-- TODO -->` blocks with your organization's conventions before running any real tasks.

## How to use the mode

The mode enforces a gated, spec-driven loop. It will not write infrastructure code until you approve the earlier phases.

1. **Specify**: `specs/<NNN-name>/spec.md` with goals, scope, constraints, risks, rollback and testable acceptance criteria.
2. **Plan**: `plan.md` with approach, state impact, Spacelift changes, migration order, validation.
3. **Tasks**: `tasks.md`, small ordered items, each one reviewable as a single PR, tagged read-only, plan-only or mutating.
4. **Implement**: one task at a time, validating after each, updating the spec when reality differs.
5. **Verify**: map every acceptance criterion to evidence for the PR.

Suggested first prompts:

- "Review and update `AGENTS.md` for this project." (recommended first step)
- "Start spec 001: inventory the Terraform versions, backends and providers in this repo. Read-only."
- "Spec the migration of Spacelift stack `<name>` from Terraform to native OpenTofu."
- "Review this module for Terraform-to-OpenTofu compatibility."

### When the mode uses Spacelift

It reaches for Spacelift knowledge and tools when you mention stacks, spaces, policies, runs, drift, contexts, blueprints, worker pools, `spacectl`, or how and where OpenTofu code runs. Pure HCL work stays with the terraform skill. If it cannot tell, it asks. For any Spacelift question it fetches current docs first (`https://docs.spacelift.io/llms.txt`, then the page URL with `.md` appended) and cites them.

### Git and peer workflow built into the mode

- Feature branches named `<type>/<spec-id>-<slug>`, never direct to `main`.
- Small Conventional Commits that reference the spec and task. The agent proposes messages and asks before committing. It never pushes, merges or approves PRs unless told.
- PRs link the spec and include evidence, risk and rollback. Peers review the spec before the code.
- Handoff notes live in the spec folder so a colleague or another agent can resume without chat history.

### What the agent will and will not do

- **Never from the agent shell:** `apply`, `destroy`, `import`, `state rm/mv/push`, `force-unlock`, `taint`, `-target`, `-exclude`. Deployment happens in Spacelift after a merged, reviewed PR.
- **Allowed locally:** `fmt`, `validate`, `init -backend=false`, linters and scanners, and `plan` with read-only credentials (it asks before planning against real state).
- **Spacelift writes** (`mutate`, `intent`, `runTrigger`, `runConfirm`, stack deletes) require a described operation, a diff, a dependents check for deletes, and a fresh `YES` or `CONFIRM` from you.

## The terraform skill

The skill at `.agents/skills/terraform-skill` is a general Terraform and OpenTofu best-practices skill. It diagnoses a failure mode first (identity churn, secret exposure, blast radius, CI drift, state corruption, and others), loads only the matching reference file, and ends answers with a five-part response contract (assumptions and versions, risk, remediation and tradeoffs, validation plan, rollback).

It is **not** OpenTofu-specific, **not** Spacelift-aware, and defaults its examples to AWS. The mode compensates by translating its CI/CD guidance into Spacelift concepts and by pointing to OpenTofu docs for OpenTofu-only features.

**How it was installed:** with `npx skills add https://github.com/antonbabenko/terraform-skill`, selecting Bob from the installer's agent list. That installer is unusual: it places the real files in `.agents/skills/terraform-skill` and creates a symlink at `.bob/skills/terraform-skill`. Do not rearrange these paths by hand; they are the third-party installer's layout, not a pattern this repo enforces.

**Updating the skill:** treat it as third-party. Do not edit its files. Re-run the same `npx skills add` command with Bob selected, review the diff and the `skills-lock.json` change, and land it through a PR. Put organization-specific rules in `AGENTS.md` or specs, not in the skill. Upstream issues: <https://github.com/antonbabenko/terraform-skill/issues>.

## The Spacelift skills

Two skills from Spacelift are installed in [`.bob/skills/`](.bob/skills/):

| Skill | What it does |
|---|---|
| `spacelift` | General Spacelift operations: stack queries, run management, mutation safety protocol. Load before MCP work. |
| `spacelift-policy-writer` | Rego policy authoring for Spacelift plan/approval/login/access policies. Load before writing or changing policies. |

**Source:** [github.com/spacelift-io/claude-plugins](https://github.com/spacelift-io/claude-plugins) (MIT, v0.1.0 when installed). Both are third-party: treat them as read-only.

**Layout:** the `npx skills add` installer for Bob-native skills places files directly in `.bob/skills/<name>/`. This is normal and differs from the `terraform-skill` layout which uses `.agents/skills` + a symlink (that is the `antonbabenko` installer's own convention).

**Note on MCP tool names:** these skills were authored for Claude Code and reference an MCP named `spacelift-local`. When using the hosted Spacelift `/mcp` server documented in this repo, confirm actual tool names with `discover` rather than assuming they match.

**Updating:** re-run `npx skills add https://github.com/spacelift-io/claude-plugins --agent bob --skill '*' --yes`, review the diff and `skills-lock.json` change, land it through a PR.

## Bob hooks

Two hooks ship with this repo in [`.bob/settings.json`](.bob/settings.json):

| Hook | Event | What it does |
|---|---|---|
| `block-destructive` | `PreToolUse` on `execute_command` | Blocks `apply`, `destroy`, `state rm`, `force-unlock`, `-auto-approve` if run from the agent shell. Exits 2 to deny the call. |
| `tofu-post-edit` | `PostToolUse` on file edits | After writing any `.tf` or `.hcl` file, runs `tofu fmt` and `tofu validate -no-color` (if `tofu` is on PATH) and adds findings to model context. |

Both hooks fail open (errors do not block the tool call). They run only in trusted workspaces. The hook scripts live in [`.bob/hooks/`](.bob/hooks/). Review them before relying on them.

**To test manually:**

```sh
# block-destructive: should exit 2 and print the deny message
printf '%s' '{"session_id":"test","cwd":".","hook_event_name":"PreToolUse","tool_name":"execute_command","tool_input":{"command":"tofu apply"},"tool_use_id":"t1"}' \
  | node .bob/hooks/block-destructive.mjs

# tofu-post-edit: should run fmt/validate and print any output (or nothing if clean)
printf '%s' '{"session_id":"test","cwd":".","hook_event_name":"PostToolUse","tool_name":"write_file","tool_input":{"path":"main.tf"},"tool_use_id":"t2"}' \
  | node .bob/hooks/tofu-post-edit.mjs
```

## Review and flag before you use it

### Unverified or not yet tested

- [ ] **The mode has never run a real task.** Only its YAML syntax was checked. Treat the first runs as testing the mode itself.
- [ ] **Teammate loading.** Confirm a second person's Bob picks up the workspace mode and the symlinked skill after cloning.
- [ ] **Hooks have only been unit-tested.** `block-destructive` was tested with representative JSON; `tofu-post-edit` depends on `tofu` being on PATH. Test both in a real Bob session before relying on them. Hooks fail open.
- [ ] **Re-running the installer** is the intended update path. Not yet tested: that a re-run cleanly replaces the files and updates `skills-lock.json` without disturbing the committed layout. Check the git diff after the first update.
- [ ] **Time-sensitive Spacelift facts** were checked against the docs when the mode was written (OpenTofu migration needs Spacelift Terraform provider v1.53.5 or later and `spacectl` v1.26.0 or later; the old `/intent/mcp` endpoint is removed after 1 August 2026; the `?tools=` parameter is alpha). The mode tells the agent to re-verify them. Do the same before relying on them.

### Security and compliance flags

- [ ] **Credentials are the strongest control.** Give agents short-lived, read-only credentials scoped to the task. Never share a human's credentials with an agent. Prefer OIDC or workload identity over static secrets.
- [ ] **Spacelift's Intent guide for Azure uses a service principal client secret.** Spacelift also documents OIDC for Azure and GCP. Have security review which path is acceptable for your environment before setting up Intent.
- [ ] **Token auth is not scope-limited.** A `spacectl profile export-token` bearer token carries the user's full RBAC access, unlike the OAuth `mcp:read` scope. Do not use it for agent sessions unless needed, and never store it in files.
- [ ] **Intent bypasses code review.** The mode restricts it to a sandbox space with an Intent policy. Confirm that space and policy exist before allowing it.
- [ ] **Regulated-environment requirements are not encoded.** Validation, change control, evidence retention and audit rules depend on your organization. The mode asks rather than assumes. Record answers in `AGENTS.md`.
- [ ] **Data handling.** Confirm your organization's policy on sending infrastructure code and Spacelift metadata to an AI service before real stacks are used. Keep state files, plan files, `.env` and `.tfvars` out of context and out of git.

### Third-party content and licensing

- [ ] The vendored skill is Apache-2.0 (license copied to [`LICENSES/terraform-skill-LICENSE`](LICENSES/terraform-skill-LICENSE)). Confirm your organization's open-source policy allows redistributing it inside an internal repo.
- [ ] **Spacelift's own skills are not included.** Spacelift publishes `spacelift` and `spacelift-policy-writer` (MIT, v0.1.0) in <https://github.com/spacelift-io/claude-plugins>. They are packaged for Claude Code, reference an MCP named `spacelift-local` (not the hosted `/mcp` server), and were not tested in Bob. Review them before vendoring, then add and pin them in `skills-lock.json`. The mode already knows to use them if present.
- [ ] No Azure, GCP or AWS MCP servers are configured. They are optional; see [Optional: cloud provider MCP servers](#optional-cloud-provider-mcp-servers) for what they add, the risks, and the rules for adding one.

### Content gaps to fill

- [ ] **Organization conventions**: naming, tagging, approved regions and modules, state backend standards, branching and review rules, minimum approvers. Put them in `AGENTS.md`.
- [ ] **`AGENTS.md` has placeholder sections.** Fill in your organization's conventions before running real tasks. The mode will also draft or update it interactively.
- [ ] **Spacelift account details**: account name, region, space layout, which stacks map to which paths.
- [ ] **No CI beyond Spacelift.** No PR template or `CODEOWNERS` exists. The mode suggests them, and you decide who the required reviewers are.

## Multi-cloud

This mode is cloud-agnostic. Tell the agent which cloud (Azure, GCP, AWS, or other) or add it to `AGENTS.md`. The terraform-skill defaults examples to AWS; the mode asks for the target-cloud equivalent.

Per cloud, record in each spec: provider (`azurerm`/`azapi`, `google`/`google-beta`, or `hashicorp/aws`), state backend and consumers, cloud auth path (Spacelift integration or OIDC), and required permissions.

Pilot exit criteria for each cloud:

- zero unexpected diff after the engine or vendor switch
- policies enforced
- every change merged through PR
- no agent-initiated deploys
- a short retrospective (time saved, errors caught, corrections that belong in `AGENTS.md`)

## Optional: cloud provider MCP servers

Spacelift's agentic-IaC article points to a vendor MCP server for each hyperscaler. **None is configured here, and none is needed to start.** This section records what each offers, whether it is worth adding, and the rules if you do. Details come from the vendor pages linked below; they change often, so re-check before relying on them.

### What each one is

| Cloud | Server (vendor page) | What it offers for IaC work | Controls the vendor documents |
|---|---|---|---|
| AWS | [Agent Toolkit for AWS](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/what-is-agent-toolkit.html): a managed AWS MCP Server, plus agent skills, Claude Code and Codex plugins, and rules files | Documentation and service-information search with no authentication. With IAM credentials: API calls, Python scripts and curated skills (service selection, least-privilege IAM, CloudFormation and CloudWatch troubleshooting) | IAM-based access control, CloudWatch metrics, and enterprise guardrails such as restricting agents to read-only operations or blocking specific actions |
| Azure | [Azure MCP Server](https://learn.microsoft.com/en-us/azure/developer/azure-mcp-server/overview) (code in `microsoft/mcp`; the older `Azure/azure-mcp` repo is archived) | Resource queries, plus Terraform-specific tools per the repo README: provider documentation, Azure Verified Modules, exporting resources to Terraform, and validating Terraform files or plans against Azure policies. Also an Azure Skills Plugin (26+ skills) | Entra ID authentication and Azure RBAC; tools are disabled by default in supported hosts; a `--read-only` start option; user confirmation for high-risk commands (disabling it is documented as not recommended); `namespace` mode to limit tools |
| Google Cloud | [Google Cloud remote MCP servers](https://docs.cloud.google.com/mcp/overview), with a list of supported products (it includes Cloud Asset Inventory in preview, IAM, Organization Policy and Recommender) | Read-side context that explains why applies fail: what exists, which org policies and IAM bindings apply | IAM policies to control MCP use, toolsets to limit tools, Model Armor scanning, audit logging. Google's non-Cloud remote servers cannot be governed by IAM policies |
| Spacelift | [Spacelift MCP](https://docs.spacelift.io/concepts/intelligence/spacelift-mcp) | Already used by the mode | OAuth scopes `mcp:read` / `mcp:write`, `?tools=` narrowing, RBAC and policies |

A separate Google option is the local `googleapis/gcloud-mcp` server (Apache-2.0). It runs `gcloud` commands under the active account, supports allow/deny lists, and describes itself as preview and not an officially supported Google product.

### Recommendation

1. **To start: do not add any.** Use Spacelift MCP read-only plus CLIs under read-only credentials.
2. **First candidates, only when a spec records a concrete gap:** Azure MCP Server in `--read-only` mode with a narrow namespace (for the Terraform tools), and a read-only Google toolset for Asset Inventory, Org Policy and IAM. AWS documentation search is the lowest-risk option when AWS is in scope.
3. **Avoid for now:** any server in a write-capable configuration, auto-approval, and servers using a human's standing credentials.

### Rules if you add one

- Record the gap in the spec first, and get security approval for the identity it will use.
- Run it read-only, on a dedicated read-only identity (service account impersonation, a reader role, or an IAM-restricted role), never a personal admin login.
- Add it as its own entry in `.bob/mcp.json`; never put it in `alwaysAllow`, and keep MCP auto-approve off.
- Limit the tool set (Azure `namespace` mode, Google toolsets) to what the spec needs.
- Add a Bob `PreToolUse` hook matching that server's tools (matchers can target `^mcp__<server>__`) to block write operations, after testing it.
- Record it in `AGENTS.md`: server, version, identity, scope, and what it may be used for.
- Pin or review any skills it ships the same way as `terraform-skill`.

## Maintaining this repo

- Change the mode through a PR. Keep `.bob/custom_modes.yaml` plain ASCII (no curly quotes or dashes) and keep the slug unique.
- Use only valid permission group names (`read`, `edit`, `execute`, `mcp`, `skill`, `todo`, `subagent`, `mode`). An unknown name silently grants nothing.
- Bump or re-verify the facts in the mode's Spacelift sections when Spacelift releases changes. Docs index: <https://docs.spacelift.io/llms.txt>.

## Sources

- Spacelift MCP: <https://docs.spacelift.io/concepts/intelligence/spacelift-mcp> and its [connecting guide](https://docs.spacelift.io/concepts/intelligence/spacelift-mcp/connecting)
- Native OpenTofu stack migration: <https://docs.spacelift.io/vendors/opentofu/migration>
- Spacelift guidance on agentic IaC: <https://spacelift.io/blog/claude-code-for-infrastructure-as-code>
- Spacelift plugins and skills: <https://github.com/spacelift-io/claude-plugins>
- Terraform and OpenTofu skill: <https://github.com/antonbabenko/terraform-skill>
- Optional cloud MCP servers: [AWS Agent Toolkit](https://docs.aws.amazon.com/agent-toolkit/latest/userguide/what-is-agent-toolkit.html), [Azure MCP Server](https://learn.microsoft.com/en-us/azure/developer/azure-mcp-server/overview), [Google Cloud MCP servers](https://docs.cloud.google.com/mcp/overview), [microsoft/mcp](https://github.com/microsoft/mcp), [googleapis/gcloud-mcp](https://github.com/googleapis/gcloud-mcp)
