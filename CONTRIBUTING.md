# Contributing

## Setup

```bash
corepack enable
corepack prepare pnpm@9.15.9 --activate
pnpm install
pnpm build
```

## Workflow

1. Start from a fresh `main` branch.
2. For product changes, update the relevant design document first.
3. Keep new business logic in a plugin's `lib/` or in `packages/shared`.
4. Do not add broad host permissions without a new ADR.
5. Run the full local check before opening a PR:

```bash
pnpm build
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm validate:manifests
pnpm audit --prod
```

## Extension conventions

- Manifest V3 only.
- Prefer `activeTab + scripting` over broad host permissions.
- Use a plugin-local message contract.
- Use namespaced storage.
- Keep browser API calls in `entrypoints/`.
- Keep testable logic in `lib/`.

## Commit style

Use Conventional Commits, for example:

```text
feat: add per-site dark mode state
fix: keep Firefox release artifact signed
docs: add release checklist
chore: pin publish CLIs
```

## Release

Read `docs/operations/release-checklist.md`.
