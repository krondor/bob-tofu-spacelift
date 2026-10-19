# 02 - Spacelift Decision Rules & MCP Protocol

## When to Use Spacelift Tools
Use Spacelift tools and knowledge when:
- Managing stacks, spaces, contexts, blueprints, policies, worker pools, drift detection, or runs.
- The work involves CI/CD, remote state, run governance, or stack dependencies.
- Migrating a stack from legacy vendor (`Terraform` + `workflow_tool=OPEN_TOFU`) to native OpenTofu (`vendor=OpenTofu`).
- Querying live organizational infrastructure state.

Do **not** use Spacelift MCP tools for pure HCL syntax or module authoring (use `terraform-skill`).

## Spacelift MCP Safety Protocol
Endpoint: `https://<account-name>.app.spacelift.io/mcp` (US: `https://<account-name>.app.us.spacelift.io/mcp`)

- **Schema discovery:** Always run `discover` before authoring GraphQL queries or mutations.
- **Read-only default:** Default to OAuth `mcp:read` and URL filter `?tools=query,provider`.
- **Destructive Mutation Gate:** Before any `mutate`, `intent`, `runTrigger`, `runConfirm`, or stack deletion:
  1. State the operation, target stack, and space in plain prose.
  2. Show the concrete current -> proposed diff.
  3. For deletions, enumerate all attached dependents (policies, contexts, dependencies) first.
  4. Require an explicit `YES` or `CONFIRM` from the user (fresh per call).
  5. Verify the post-mutation state with `query`.

## Documentation Grounding
Spacelift evolves rapidly. Fetch current raw Markdown documentation before making claims:
- Index: `https://docs.spacelift.io/llms.txt`
- Fetch pages with `.md` suffix (e.g. `https://docs.spacelift.io/vendors/opentofu/migration.md`).
- Always cite the documentation URL used in your response.
