# 03 - OpenTofu Refactoring & Git Collaboration

## Refactoring Discipline (Terraform to OpenTofu)
1. **Inventory First:** Identify Terraform version floor, providers, backend config, and connected Spacelift stacks.
2. **Compatibility Verification:** Check compatibility against OpenTofu migration docs for the specific version in use.
3. **Lockfile & Pinning:** Pin OpenTofu version constraint and regenerate `.terraform.lock.hcl` against registry.
4. **State Protection:** Ensure state is backed up before engine switching; never manually edit `.tfstate`.
5. **Zero-Diff Gate:** A post-migration `tofu plan` must show zero unexpected diff before applying.
6. **Promotion Order:** Migrate dev/sandbox stacks first before touching production.

## Git & Peer Review Protocol
- Work on dedicated feature branches: `<type>/<spec-id>-<slug>` (e.g. `feat/001-inventory`). Never commit to `main`.
- Use Conventional Commits referencing the spec/task ID.
- Propose commit messages and ask before committing; never push or merge without user direction.
- PRs must link the spec and include validation evidence, risk assessment, and rollback procedures.
- Leave durable handoff notes in the spec folder so sessions can resume cleanly without prior chat history.
