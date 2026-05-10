# AGENTS Team Custom

This file defines repository-specific working rules for `FAMILY-PHOTO-GALLARY`.

## Scope

- Apply these rules to all code, docs, and config changes in this repository.
- If a rule here conflicts with `AGENTS.md`, this file wins for this repository.

## Delivery standard

- Ship complete, runnable outcomes for the requested scope.
- Keep changes minimal and focused; avoid unrelated refactors.
- Reuse existing patterns and naming before adding new abstractions.

## Required checks

- Run `npm run test` before finishing when code changes are made.
- If test scripts are placeholders or missing, state that explicitly and run a basic smoke check instead (for example `node -e "console.log('ok')"`).
- Include commands run and pass/fail result in the final report.

## Git workflow

- Branch naming: `feature/<topic>`, `fix/<topic>`, `chore/<topic>`.
- Commit format: `<type>: <short description>` where type is one of `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.
- Stage only files related to the current request.
- Do not amend existing commits unless explicitly requested.

## PR checklist

- Problem and approach are explained in 3-5 lines.
- User-visible behavior changes are listed clearly.
- Validation evidence is included (commands and key results).
- Risks and rollback plan are documented for non-trivial changes.

## UI/UX baseline

- Mobile-first layout support is required.
- Keep color/typography tokens centralized when building UI.
- Avoid generic template look; ensure visual intent is clear.

## Safety

- Never run destructive git/file operations without explicit approval.
- Never revert unrelated user changes.
- If unexpected workspace changes appear during work, stop and ask.
