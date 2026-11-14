# Kongbuhey (공부해): Korean study web app

Static client-side SPA in `webapp/` (no build step, no server; opens from `file://`). Node 22 CLI tooling for data and tests.
Purpose: study Korean from the course material. The sentence generator's quality is the product, and the owner cannot judge
Korean himself, so correctness comes from flagged-sentence fixtures, not from the generator checking itself.
Desktop first, Android later. Experiment in a small separate project, not in a branch.

## Commands
- `node test.js`: default suite, ~30 s (ESLint, data integrity, smoke generation, all test/ suites). Run before every commit.
- `node test.js --full`: adds the every-unit generation sweep (~20 s) and the jsdom browser load test (slow on some disks).
- `npm run lint`: ESLint only. 0 errors required; `no-unused-vars` warnings are a dead-code cleanup backlog.
- `node test/<name>_test.js`: one suite, 1-3 s. `node test/browser_load_test.js`: jsdom check of `webapp/index.html`.
- State what you ran. Done means named tests pass and lint is clean.

## Huge files: never load whole into context
`data.js`, `homonyms.js`, `verified_sentences.js`, `studytexts.js`, `schema_summary.json`, `exhaustive_output*.txt`.
A PreToolUse hook (`.claude/hooks/guard-big-reads.js`) rejects whole-file reads; ranged reads (`offset`/`limit` <= 120) are fine.
- Look up units: `node select.js --help` (first ~100 lines), then `node select.js --locate <id|korean>`.
- Change units through `select.js` UPDATE/INSERT (they validate). Hand-edit rows when changes don't require schema validation.
- Schema or column changes: write a short node codemod script, run it, show the diff stat. Ask before changing the 12-column layout.
- Templates: `node verified_sentences.js --locate ...`, then Read a small range.

## Flag-review loop (how sentence quality improves)
The app has a "⚐ Bad sentence" button; "⬇ Flags" exports JSON into `flagged/` (gitignored inbox).
1. `node tools/triage_flags.js` prints each pending flag with every unit used and whether the generator still reproduces it.
2. Judge each flag; the owner may flag false positives. Record it: `node tools/triage_flags.js verdict <#> confirmed|false_positive|unsure "reason"`.
3. `node tools/triage_flags.js promote` writes confirmed ones into `test/golden_sentences.json` (status `open` = known bug, does not fail the suite).
4. Fix the rule in data tags/SemanticData or the concord module, set the fixture's `status` to `fixed`, run `node test.js`.
Do not fix a flagged bug without a fixture. Do not mark a flag confirmed from memory: use the report.

## Rules
- No Hangul literals in generator/concord logic: put linguistic knowledge in `data.js` tags/SemanticData.
- `korean/` and `webapp/` are browser-safe: no `fs`, `path`, `child_process`, `process.env`, console output (ESLint enforces).
- `webapp/index.html` loads `korean/` as classic scripts. A new module must be wrapped in an IIFE `(function() { ... })();`
  (top-level `const` collides across scripts) and added to index.html in dependency order. `test/browser_load_test.js` checks both.
- Work on `main` with small commits; ask before `git push`. No branches or worktrees unless asked.
- Textbook-derived content stays local (`studytexts.js`, `local/` are gitignored). Never commit textbook text verbatim.
  `docs/kor_sentences.tsv` is open-licensed (Tatoeba, CC BY): keep the attribution when using it.
- Do not add linters, CLI flags or tooling unless asked. Do not create plan/report .md files unless asked.
