# Workflow — Project Documentation

Academic and design documentation for **Dayflow — Human Resource Management System**.

| Document | Purpose |
|---|---|
| [srs.md](srs.md) | Software Requirements Specification |
| [er-diagram.md](er-diagram.md) | Entity–relationship model of the nine tables |
| [use-case-diagram.md](use-case-diagram.md) | Actors and their use cases |
| [process-flows.md](process-flows.md) | Sequence and flow diagrams for the core processes |
| [database-design.md](database-design.md) | Table-by-table column reference |
| [api-reference.md](api-reference.md) | Every REST endpoint, with roles and payloads |
| [test-plan.md](test-plan.md) | Test cases and expected results |

Diagrams are written in Mermaid, which GitHub renders natively — no image files
to keep in sync with the code.

## Team structure

The repository is split into four areas so each member owns one:

| Folder | Responsibility |
|---|---|
| `frontend/` | React application — pages, components, styling, routing |
| `backend/` | Express API — routes, middleware, authentication, business rules |
| `database/` | Schema, connection, settings, seed data |
| `workflow/` | Requirements, diagrams, API reference, test plan |
