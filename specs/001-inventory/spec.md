# Spec 001: Initial Infrastructure & Spacelift Stack Inventory

## 1. Problem & Objectives
- **Problem:** Need a complete baseline inventory of all Terraform/OpenTofu configurations, providers, remote state backends, and Spacelift stack bindings in this repository before initiating OpenTofu engine migrations.
- **Goals:**
  - Enumerate all root modules and shared modules in the workspace.
  - Identify Terraform version constraints (`required_version`) and provider requirements (`required_providers`).
  - Catalog Spacelift stacks, space assignments, attached contexts, and policy rules via read-only discovery.
- **Non-Goals:**
  - Modifying existing `.tf` configurations or stack settings.
  - Executing any live state operations or triggering Spacelift runs.

## 2. Scope & Constraints
- **Scope:** Repository root, subdirectories containing `.tf` files, and Spacelift read-only GraphQL endpoint.
- **Constraints:**
  - Read-only operations only (`[read-only]`).
  - No secret values, sensitive `.tfvars`, or raw state payloads recorded in the output.
  - Comply with least-privilege access (OAuth `mcp:read` scope).

## 3. Risks & Rollback
- **Risk:** Read-only inventory has zero risk of resource churn or state corruption.
- **Rollback:** Not applicable (non-mutating task).

## 4. Testable Acceptance Criteria
- [ ] Complete inventory table generated summarizing: module path, engine version constraint, providers, backend type, and Spacelift stack mapping.
- [ ] No uncommitted state files or secrets added to version control.
- [ ] Initial `AGENTS.md` stack-to-path mapping populated with findings.
