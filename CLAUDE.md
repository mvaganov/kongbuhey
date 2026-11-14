# Kongbuhey (공부해): Korean study web app
Static client-side SPA in webapp/ (no build, no server). Node 22 CLI tooling for data and tests.
Goal: pass an in-person exam on 40 fixed Hangul study texts. Study-loop value beats engine polish.

## Do not read whole files (huge): data.js, homonyms.js, schema_summary.json, studytexts.js,
verified_sentences.js, scratch/, audit/, history/, exhaustive_output*.txt
- Look up units: run `node select.js --help` (first ~100 lines), then `node select.js --locate <id|korean>`
- Edit units only through select.js UPDATE/INSERT (they validate). Never hand-edit data.js rows.
- verified_sentences.js: find with `node verified_sentences.js --locate ...`, then Read with offset/limit.

## Verify
- Fast: `node test/<name>_test.js` (1 to 3 s each). Data/schema: `node test.js` Stages 0-3.
- Do NOT run `node test.js` Stage 4 or full `exhaustive.js` unless asked. Sample with `node exhaustive.js --range 0-40`.
- Done = named tests pass + eslint clean. State what you ran.

## Rules
- No Hangul literals in generator/concord logic: put knowledge in data.js tags/SemanticData.
- A bug fix starts with a failing fixture in test/golden_sentences.json (once it exists).
- Modules are browser-safe (no fs/path) under korean/ and webapp/.
- One branch per task. Ask before schema changes to data.js or the 12-column layout.
- Do not add CLI flags, linters or tooling unless asked. Do not create plan/report .md files unless asked.