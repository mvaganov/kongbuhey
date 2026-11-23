# Kongbuhey (공부해): Korean study web app

Static client-side pages (no build step, no server; open from `file://`). Node 22 CLI tooling for data and tests.
Purpose: study Korean from the course material. The sentence generator's quality is the product, and the owner cannot judge
Korean himself, so correctness comes from flagged-sentence fixtures, not from the generator checking itself.
Phone-first: study happens in `flashcards/` (GitHub Pages); `webapp/` is the desktop test/admin tool. Android packaging later, not iOS.
Experiment in a small separate project, not in a branch.
**Read `docs/architecture.md` before changing generation, fc2 storage or the test harness**: runtime model, data model, generation
caches and the invariants that keep them exact, fc2 persistence layers, test architecture, performance record. Update it when a design changes.

## Commands
- `node test.js`: default suite, ~30 s on a local disk (ESLint, data integrity, smoke generation, all test/ suites, then the fc2 build stamp if all passed). Run before every commit.
- Agents running through `device_bash` on a mounted folder: file opens there are very slow (`require('jsdom')` took 25 s vs 0.4 s on the owner's host, so the suite took ~75 s). Run tests from a local copy instead (~30 s):
  `mkdir -p /tmp/kb && [ -d /tmp/kb/node_modules ] || cp -r node_modules /tmp/kb/` (once per session, ~45 s), then
  `rsync -a --delete --exclude .git --exclude node_modules ./ /tmp/kb/ && (cd /tmp/kb && node test.js)` (sync 0.3 s), then `node tools/stamp.js` in the real repo (the stamp inside the copy is discarded).
  Edit only in the real repo; never copy files back from `/tmp/kb`.
- `node test.js --full`: adds the every-unit generation sweep (~20 s), the jsdom browser load test (slow on some disks), the CLI `--help` check (~2 s) and the generation bench (~10 s); the fc2 UI playthrough already runs by default.
- `node tools/bench_generation.js`: generation timings (report only) plus deterministic checks against `test/bench_baseline.json`: work counters (caches stay warm, work does not grow) and a seeded output fingerprint. Run it before and after any generation refactor; `--save` only when the change is intended.
- `npm run lint`: ESLint only. 0 errors required; `no-unused-vars` warnings are a dead-code cleanup backlog.
- `node test/<name>_test.js`: one suite, 1-3 s. `node test/browser_load_test.js`: jsdom check of `webapp/index.html`.
- State what you ran. Done means named tests pass and lint is clean.
- Agent shells: start compound commands with `set -o pipefail` and check exit codes (`cmd | tail` reports tail's status; a failed
  step in `a && b` silently skips b). `node test.js` lists every CLI that exited non-zero since its last run.
- fc2 screens: `fc2/index.html?debug` lists scenes; `?debug=trial-listen` (etc.) opens a ready-made state in seconds, that NEVER SAVES (scenes replace the whole game; a `?debug` page that saved once wiped a player's progress, see docs/architecture.md). Tests load `?debug&persist` to exercise saving. Never send the owner to a `?debug` URL for real play.
  Scenes live in `fc2/debug.js`; `test/fc2_ui_test.js` renders every one in jsdom. A new fc2 screen gets a scene (with an `expect` selector) instead of a hand-built test setup or a phone check.
- A new script in `fc2/` must be added to `fc2/index.html`; `test/fc2_pages_test.js` (default suite, <1 s) fails if a tag is missing, duplicated or dangling, or if a `window.FC2*` global is used but never defined. A phone can cache a stale `index.html` next to a fresh `app.js`, so keep `app.js` tolerant of a missing optional module.
- Build stamp: `tools/stamp.js` hashes everything `fc2/index.html` loads, writes `?v=<hash>` onto every local script/css tag (so a phone never mixes stale and fresh files) and generates `fc2/version.js` (hash + build time, shown at the bottom of the Menu and in the error panel). `node test.js` runs it as its last step, only when every stage passed (the stamp of approval), so run the suite right before committing; `test/fc2_pages_test.js` checks the tags agree with `version.js`. Never hand-edit `version.js` or the `?v=` values. Add new fc2 script tags without `?v=`: the stamp adds it.

## Tools and endpoints (search the source for details)
Many CLIs exist; prefer one over ad-hoc scripts. Each source file is the source of truth: examples and use cases live there,
ideally in a `printHelp()` / `--help`, or in its header comment block. Keep this list to one phrase per tool; when you add or
change a tool, document it in its own file first. Every CLI answers `--help` fast (<500 ms), exits 0 and writes nothing: give a new
one a `printHelp()` or `require('./tools/cli_help.js').exitWithHeaderHelp(__filename)` (prints its header comment) as the first
statement. `test/cli_help_test.js` (in `node test.js --full`) finds CLIs by text search for `process.argv` and enforces this.
- `select.js`: query, UPDATE and INSERT language units, with schema validation.
- `ingest.js`: curriculum ingestion pipeline for a passage or `--text`.
- `verify_sentences_cli.js`: interactive per-unit review of generated verified sentences.
- `schema_analysis.js`: data.js taxonomy report; generates `data/schema_summary.json`.
- `data/verified_sentences.js --locate`: find templates.
- `tools/vs_tune.js`: verified-sentence templates: slot tags and rules, gaps, slot fixtures, `fixtures --unsure` (native-speaker
  review list, written to `local/native_review.txt`), `human <gid> right|wrong` to record the answers.
- `tools/triage_flags.js`: "⚐ Bad sentence" flags -> golden fixtures.
- `tools/ko_check.js`: LLM second opinion on Korean naturalness (catches grammar and register, misses pragmatic oddness; never
  a substitute for a fixture or native review).
- `tools/exhaustive.js`: exhaustive generation and validation dashboard.
- `tools/text_analyzer.js`: study-text morphology and curriculum-gap report.
- `tools/tatoeba_prefilter.js`: deterministic Tatoeba candidate filter.
- `tools/merge_units.js`: merge duplicate language units.
- `tools/stamp.js`: fc2 build stamp.
- `tools/save_inspect.js`: fc2 save file (Backup / restore text) questions; `gen` replays the game's sentence generation.
- `tools/fc2_sim.js`: headless fc2 (same `fc2/controller.js`), seeded, simulated time. QA a game change here before asking the owner to play:
  `node tools/fc2_sim.js run --cards 200 --days 3 --policy mixed [--load save.json] [--save out.json]`, or `step --do "pull; card; answer 1"`.
- `tools/bench_generation.js`: generation speed and output-unchanged check (baseline `test/bench_baseline.json`).
- `tools/hangul_literals.js`: Hangul literals and magic unit ids in engine code (list, `--summary`, `--by-file`, `--by-function`, `--compare`, `--tables`); `--check` is a Stage 0 ratchet. New Hangul goes in `data/hangul_constants.js`.
- `tools/only_expansion.js` (library): INSERT queues words that may fit `only`-list slots (`vs_tune.js expansions`).
- `tools/exit_log.js` (library): logs every CLI's non-zero exit; `node test.js` prints them (a new CLI copies the `watch()` line).
- External APIs (OpenAI-compatible, keys in gitignored `local/keys.env`): `https://api.exaone.ai/v1` model `k-exaone_v2.5`
  (free), `https://api.upstage.ai/v1` model `solar-pro4` (paid).

## Huge files: never load whole into context
`data/data.js`, `data/homonyms.js`, `data/verified_sentences.js`, `data/schema_summary.json` (generated by `schema_analysis.js`),
`local/studytexts.js`, `exhaustive_output*.txt`.
A PreToolUse hook (`.claude/hooks/guard-big-reads.js`) rejects whole-file reads; ranged reads (`offset`/`limit` <= 120) are fine.
- Look up units: `node select.js --help` (first ~100 lines), then `node select.js --locate <id|korean>`.
- Change language units through `select.js` UPDATE/INSERT (they validate). Hand-edit rows when changes don't require schema validation.
- Schema or column changes: write a short node codemod script, run it, show the diff stat. Ask before changing `DATA_SCHEMA` columns.
- Templates: `node data/verified_sentences.js --locate ...`, then Read a small range.

## Flag-review loop (how sentence quality improves)
The app has a "⚐ Bad sentence" button; "⬇ Flags" exports JSON into `flagged/` (gitignored inbox).
1. `node tools/triage_flags.js` prints each pending flag with every unit used and whether the generator still reproduces it.
2. Judge each flag; the owner may flag false positives. Record it: `node tools/triage_flags.js verdict <#> confirmed|false_positive|unsure "reason"`.
3. `node tools/triage_flags.js promote` writes confirmed ones into `test/golden_sentences.json` (status `open` = known bug, does not fail the suite).
4. Fix the rule in data tags/SemanticData or the concord module, set the fixture's `status` to `fixed`, run `node test.js`.
Do not fix a flagged bug without a fixture. Do not mark a flag confirmed from memory: use the report.

## Rules
- No NEW Hangul literals or unit IDs in generator/concord logic: put linguistic knowledge in `data.js` tags/SemanticData. Existing ones are code debt (`docs/architecture.md` section 1, Hangul constants scheme): move a rule into the data when a change already touches it. Stage 0 fails if any engine file gains a Hangul literal or magic unit id (`tools/hangul_literals.js --check`).
- Multi-word grammar is declared in `SyntaxFrame` as `/*js:matcher*/` closures, compiled by `korean/analyzer/indexer.js`.
- Judge refactors by behaviour and fixtures, not by grep counts.
- TTS uses a native Korean voice only. English transliteration rules are pinned by `test/english_phonemes_test.js`.
- Everything `webapp/index.html` or `flashcards/index.html` loads (`korean/`, `webapp/`, `flashcards/`, `shared/`) is browser-safe: no `fs`, `path`, `child_process`, `process.env`, console output.
  ESLint enforces this only for `korean/analyzer/` and `korean/core/` so far.
- `shared/` holds browser+Node modules used by both `webapp/` and `flashcards/` (markdown, speech, sentence adapter, unit card).
- `flashcards/index.html` is a standalone page (own localStorage state) whose `korean/` script list must match `webapp/index.html` (browser_load_test checks it).
- `webapp/index.html` loads `korean/` as classic scripts. A new module must be wrapped in an IIFE `(function() { ... })();`
  (top-level `const` collides across scripts) and added to index.html in dependency order. `test/browser_load_test.js` checks both.
- fc2 game flow lives in `fc2/controller.js` (`FC2Core`); `app.js` is the view. New gameplay goes in the core with a `tools/fc2_sim.js`
  command and a `test/fc2_sim_test.js` case (speech, sound, visuals: stubs only). See `docs/architecture.md` section 4.
- Work on `main` with small commits; ask before `git push`. No branches or worktrees unless asked.
- Textbook-derived content stays in gitignored `local/` (`studytexts.js`, `verified_originals.js`). Never commit textbook text verbatim.
  `docs/kor_sentences.tsv` is open-licensed (Tatoeba, CC BY): keep the attribution when using it.

## Checks over prose
Deterministic checks (ESLint rules, `test.js` stages, hooks, golden fixtures) are how this project states intent; prose here and in
`handoff.md` drifts (this file once claimed the wrong column count and wider ESLint coverage than existed). So:
- When a rule exists only as prose, a bug class could have been caught mechanically, or a check is noisy or slow, say so and propose
  the check: what it enforces, where it runs, runtime cost, false-positive risk.
- Adding a test case to an existing suite to guard your own change needs no permission. New linters/rules, test stages, hooks,
  dependencies, CLI flags and new .md files need agreement first: propose, then wait.
- A check that only warns is not enforcement. Prefer error-or-delete over a growing warning count.

## Feedback on the owner's workflow
The owner is cost-conscious, and that is why he invests in learning good agentic-development habits: a habit fixed once is
cheaper than the same mistake repeated across sessions. Spending a few tokens to point out a costly pattern is worth it.
When finishing a task, end with **Workflow note:** one or two sentences naming something concrete that cost time or caused a wrong turn
(an ambiguous request, a misleading doc, a missing check, a confusing file or folder name) and the specific change that would prevent it.
Be direct; skip the note when there is nothing real to say. Propose larger changes (restructuring, new checks, process) as a short plan.
