# AGENTS.md

Shared contract for humans and agents using the `tofu-spacelift` Bob mode in this repository.
Keep it short, accurate and reviewed like code. Update it when conventions change or a recurring correction is discovered.
**Do not store secrets, personal data or real account names here.**

---

## Project

<!-- TODO: One-paragraph description of what infrastructure this repo manages, which environments it covers, and why OpenTofu on Spacelift was chosen. -->

**Layout:**

```
specs/          Spec-driven work: spec.md, plan.md, tasks.md per feature
.agents/skills/ Vendored skills (read-only third-party content)
.bob/           Bob config: custom mode, hooks, MCP example
LICENSES/       License text for vendored third-party content
```

---

## Required tools and versions

<!-- TODO: Fill in the exact versions your organization standardizes on. -->

| Tool | Minimum version | Notes |
|---|---|---|
| `tofu` | `>= 1.6.0` | Replace with your pinned version |
| `spacectl` | `>= 1.26.0` | Required for native OpenTofu stack migration |
| `tflint` | latest | Run before every PR |
| `checkov` or `trivy` | latest | Security scanning; pick one and record it here |
| `node` | `>= 18` | For Bob hook scripts |

---

## Commands

Run these from the repo root. Do not run `apply` or `destroy` locally; that happens in Spacelift.

```sh
# Format all HCL
tofu fmt -recursive

# Validate (no backend required)
tofu validate -no-color

# Init without a backend (for local lint/validate)
tofu init -backend=false

# Lint
tflint --recursive

# Security scan (adjust for checkov or trivy)
checkov -d .
```

---

## Spacelift context

<!-- TODO: Fill in your organization's Spacelift account and structure. -->

| Field | Value |
|---|---|
| Account URL | `https://<account-name>.app.spacelift.io` (US: `https://<account-name>.app.us.spacelift.io`) |
| Default space | `<!-- TODO: e.g. root or your team space -->` |
| Stack naming convention | `<!-- TODO: e.g. <env>-<service>-<region> -->` |
| Stack-to-path mapping | `<!-- TODO: describe which stack runs which root module -->` |

MCP connection: copy `.bob/mcp.json.example` to `.bob/mcp.json`, add your account name, and authenticate via OAuth. Start with `?tools=query,provider` (read-only). `.bob/mcp.json` is git-ignored; do not commit it unless your team agrees the account name is not sensitive.

---

## Spec-driven workflow

1. **Specify** (`specs/<NNN-name>/spec.md`): goals, scope, constraints, risks, rollback, testable acceptance criteria.
2. **Plan** (`specs/<NNN>/plan.md`): technical approach, Spacelift changes, migration order, test strategy.
3. **Tasks** (`specs/<NNN>/tasks.md`): small checklist, each item one reviewable PR, tagged read-only / plan-only / mutating.
4. **Implement**: one task at a time, validate after each.
5. **Verify**: map every acceptance criterion to evidence for the PR.

The Bob mode enforces this order. No `.tf` or `.hcl` files are written until the spec is approved.

---

## Git and PR conventions

<!-- TODO: Update with your organization's branching model and review rules. -->

- **Branch naming:** `<type>/<spec-id>-<slug>` (e.g. `feat/001-inventory`, `fix/003-lock-versions`).
- **No direct commits to `main`.** Open a PR for every change, including spec updates.
- **Commit style:** Conventional Commits, referencing the spec and task id.
- **PR description must include:** spec link, tasks covered, plan/validation evidence, risk and rollback, reviewer checklist.
- **Minimum approvers:** `<!-- TODO: e.g. 1 platform peer + 1 security review for mutating changes -->`.
- **CODEOWNERS:** `<!-- TODO: add CODEOWNERS and a PR template once reviewers are identified -->`.
- Peers review the spec before the code. Leave handoff notes in the spec folder.

---

## Security rules

- No secrets, tokens, `.env` files, `.tfvars` with sensitive values, state files or plan files in git or in agent context.
- Agents use short-lived, read-only, task-scoped credentials only. Never reuse a human's credentials.
- Prefer OIDC or workload identity over static secrets. Flag any use of static client secrets for security review.
- Spacelift `mutate`, `intent create/update/delete`, `runTrigger`, `runConfirm` and stack deletes require a fresh explicit `YES` or `CONFIRM` each time.
- `<!-- TODO: add your organization's change-control and evidence-retention requirements here -->`.

---

## Skills available

| Skill | Location | Source | Version | Notes |
|---|---|---|---|---|
| `terraform-skill` | `.agents/skills/terraform-skill` (symlinked from `.bob/skills/terraform-skill`) | [antonbabenko/terraform-skill](https://github.com/antonbabenko/terraform-skill) Apache-2.0 | v1.17.1 | Third-party installer layout. Covers Terraform and OpenTofu 1.6+. Not Spacelift-aware. Update via `npx skills add` + PR. |
| `spacelift` | `.bob/skills/spacelift` | [spacelift-io/claude-plugins](https://github.com/spacelift-io/claude-plugins) MIT | v0.1.0 | Bob-native install. Load before MCP work. Authored for Claude Code; confirm tool names with `discover`. |
| `spacelift-policy-writer` | `.bob/skills/spacelift-policy-writer` | [spacelift-io/claude-plugins](https://github.com/spacelift-io/claude-plugins) MIT | v0.1.0 | Bob-native install. Load before authoring or changing Rego policies. |

All three are pinned in `skills-lock.json`. Treat all as third-party, read-only. Update via `npx skills add` + PR.

---

## Definition of done

A migration task is done when:

- [ ] `tofu plan` shows zero unexpected diff for the migrated stack.
- [ ] The Spacelift stack vendor shows OpenTofu (not Terraform + workflow_tool).
- [ ] All policies enforced (plan, approval, login) still pass.
- [ ] Every change reached production through a reviewed, merged PR.
- [ ] No agent-initiated apply or destroy ran outside Spacelift.
- [ ] The spec acceptance criteria are mapped to evidence in the PR.
- [ ] Per-cloud differences are recorded in this file.
- [ ] `<!-- TODO: add your organization's additional DoD items (e.g. change ticket closed, scan results archived) -->`.
