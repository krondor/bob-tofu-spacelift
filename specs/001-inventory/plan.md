# Plan 001: Initial Infrastructure & Spacelift Stack Inventory

## 1. Technical Approach
1. **Local Repository Scan:**
   - Scan for all `.tf` and `.hcl` files using `glob`.
   - Parse `terraform` configuration blocks (`required_version`, `required_providers`, and `backend`).
   - Catalog dependencies and module hierarchies.
2. **Spacelift Remote Discovery (if MCP configured):**
   - Call `discover` to verify Spacelift GraphQL schema.
   - Run read-only `query` to enumerate stacks, their vendor type (`TERRAFORM` vs `OPEN_TOFU`), administrative status, space hierarchy, and tracked VCS branch/paths.
3. **Consolidation:**
   - Map local root modules to Spacelift stack slugs.
   - Record findings in `specs/001-inventory/inventory-report.md`.

## 2. Blast Radius & Dependencies
- **Blast Radius:** Zero (read-only filesystem and API queries).
- **Dependencies:** None.

## 3. Documentation References
- Spacelift Stacks: `https://docs.spacelift.io/concepts/stack.md`
- OpenTofu Migration Guide: `https://opentofu.org/docs/intro/migration/`
