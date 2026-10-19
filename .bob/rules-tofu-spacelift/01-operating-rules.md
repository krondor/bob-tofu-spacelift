# 01 - Operating Rules and Spec-Driven Workflow

## Core Operating Rules
- At the start of every task: read `AGENTS.md`, then check the relevant feature spec under `specs/<NNN-name>/`.
- Load the `terraform-skill` via `use_skill` before writing, reviewing, or debugging HCL, modules, tests, CI, or state operations. Load matching reference files on-demand.
- **The agent produces diffs, not deployments.** Never execute `apply`, `destroy`, `import`, `state rm/mv/push`, `force-unlock`, or `taint` from the agent shell. Never use `-target` or `-exclude`.
- Deployment happens exclusively in Spacelift after peer-reviewed PR merges.
- Local commands allowed: `fmt`, `validate`, `init -backend=false`, `tflint`, security scans (`checkov`/`trivy`), and `plan -out` (with read-only credentials and user permission).
- Never read, output, commit, or log secrets, tokens, sensitive `.tfvars`, or raw state files.
- Prefer the minimal change that satisfies the spec. Every changed line must trace to an approved task.

## Spec-Driven Development (Mandatory Gates)
Do not write or modify `.tf`/`.hcl` files until Phases 1–3 are approved:
1. **SPECIFY (`specs/<NNN-name>/spec.md`):** Problem, goals, non-goals, scope, constraints, risks, rollback, and testable acceptance criteria.
2. **PLAN (`specs/<NNN>/plan.md`):** Technical approach, state/backend impact, Spacelift changes, migration order, and test strategy.
3. **TASKS (`specs/<NNN>/tasks.md`):** Ordered checklist, each task reviewable as a single PR, tagged `[read-only]`, `[plan-only]`, or `[mutating]`.
4. **IMPLEMENT:** Execute one task at a time. Validate after each step, mark task completion in `tasks.md` and `update_todo_list`.
5. **VERIFY:** Map every acceptance criterion to concrete evidence for the PR.
