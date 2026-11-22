# Kongbuhey architecture review

How the system is built, why, and the invariants that keep it correct. Read before changing generation, fc2 storage or the test
harness. `CLAUDE.md` has the rules and commands, `handoff.md` the current state and priorities. Where a check enforces something,
it is named: trust the check over this prose. `docs/translation_architecture.md` is an older proposal (dual English output, engine
consolidation), not a description of the current code.

Last reviewed 2026-11-22.

## 1. Runtime model
- **Static pages, no server, no bundler.** `fc2/` (the study game, phone-first), `flashcards/` (earlier study app, kept for comparison)
  and `webapp/` (desktop admin/test tool) load `data/`, `korean/` and `shared/` as classic `<script>` tags. Every module is an IIFE that
  exports to `window` and, under Node, to `module.exports`, so the same file runs in the browser and in the tests/CLIs.
  Enforced: `test/browser_load_test.js` (IIFE wrapping, load order), `test/fc2_pages_test.js` (fc2 script tags, `window.FC2*` globals).
- **Browser-safe directories** (`korean/`, `shared/`, `fc2/`, `flashcards/`, `webapp/`): no `fs`, `process`, console output. ESLint enforces
  this only for `korean/analyzer/` and `korean/core/`.
- **The only build step is the stamp.** `tools/stamp.js` hashes everything `fc2/index.html` loads, writes `?v=<hash>` on each tag and
  generates `fc2/version.js`. It runs as the last step of a green `node test.js`. Reason: phones cached a stale `index.html` beside a fresh
  `app.js`; `app.js` still tolerates a missing optional module (`store()` / `NO_STORE`).
- **Goal: linguistic knowledge lives in data, not code.** Facts about particular words (which verbs take which objects, which adverbs
  need a negative predicate, which units are exceptions) belong in `data/data.js` tags and `SemanticData`, so a fix is a data edit with a
  fixture rather than a code change, and the generator and the analyzer agree. Multi-word grammar is declared as `SyntaxFrame` matcher closures.
  **This is the target, not the current state.** Measured 2026-11-22: ~2,600 lines under `korean/` contain Hangul literals (some are
  legitimate grammar mechanics such as ending and jamo tables; many are word lists and special cases), and ~32 comparisons against literal
  unit ids remain in `korean/generation/` and `korean/concord/` (e.g. `isUnitEligibleForSlot`). Stage 0 catches only the `unitId: <n>` and
  `unitById.get(<n>)` patterns.
  Treat every such literal as code debt with interest: it hides a rule from the data tools and from the owner, and it drifts from the data.
  Do not pay it down as a standalone sweep. When a change already touches how the code handles a word or rule, move that knowledge into the
  data in the same change, pinned by a fixture, and never add new literals.

## 2. Data model
- `data/data.js`: one array of unit rows, columns named by `DATA_SCHEMA`. **A unit id is its array position**, and progress everywhere is
  keyed by id, so units are never deleted or reordered. Duplicates become alias rows (`PartofSpeech` `Alias`, `SemanticData.aliasOf`);
  readers resolve them (`resolveAliasUnit`, `FC2Store.foldAliases`). Enforced: Stage 1 (sequential ids, no references to aliases).
- Tags are stored as `Set`s (`hasTag`). **Unit rows are not mutated at runtime** by any page; the generation caches below rely on that and
  key on the units array's identity, so a full data reload is safe but an in-place row edit would need a cache reset.
- `data/verified_sentences.js`: ~550 templates (compact rows, hydrated on first use). Textbook text (`OriginalKo`, titles) lives in
  gitignored `local/verified_originals.js` and is overlaid when present; public builds show labels only. Enforced:
  `test/verified_originals_test.js`.

## 3. Sentence generation
Entry point: `shared/sentence_adapter.js generateSentencesForUnit(unitId, count, options)`, which prefers
`korean/generation/verified_sentence_generator.js` (templates) and falls back to `unit_sentence_generator.js` (free AST generator).
- **Templates** are textbook sentences split into slots. Generation varies selected slots (the card's unit goes into its slot; other slots
  keep the textbook word unless relaxed) and validates the result; an error the original sentence also raises is waived (baseline waiver).
  Locked slots (fixed grammar forms) never vary.
- **Options** that matter: `onlyFromSet` + `allowedUnitIds` (only unlocked units), `seedOffset` (deterministic picks), `preferUnitIds`,
  `slotBias {retries, reject}` (redraw slot fillers the player already knows well; honored by both generators), `queueOrder` (below).
  Generation is deterministic for a given seed, code and data; `tools/bench_generation.js` relies on that.
- **"Time to use it" queue (fc2).** `fc2/queue.js` keeps one ordered list of template ids (front = longest unused, never-used first),
  stored as `g.vq`. fc2 card generation passes `queueOrder`; the generator walks matching templates in that order (buildable ones first
  when restricted to a set) and fc2 moves every generated template to the back. Without `queueOrder` (webapp, flashcards, fc2 quiz wrong
  answers) the older seeded easiest/challenging pick applies. Quiz wrong answers deliberately skip the queue: they never rotate it, so
  following it reused the same front templates (measured: 25 vs 35 templates seen per card). The Queue view (button beside "New examples")
  lists fitting templates, ready first, and reorders by buttons or drag.
- **Availability.** A template is buildable from the unlocked units when every grammar unit is unlocked and every other word slot has ANY
  unlocked unit that fits (fixed slots need their own unit). Generation relaxes slots whose textbook word is locked but another unlocked
  word fits (`slotsToRelax`).

### Generation caches and their invariants
All in `verified_sentence_generator.js`. Every one is exact (same output as uncached; checked by the bench's output fingerprint).
| Cache | Key / invalidation | Why |
|---|---|---|
| Template snapshot `getVerifiedTemplatesShared()` | rebuilt when `templateEdits` changes or the hardcoded data reloads | was a deep clone of all templates per call (41% of time) |
| Difficulty memo | WeakMap on the template object (+ units array) | was recomputed for every match on every card (24%) |
| Slot memo: match context + eligible units | WeakMap on the slot object (+ units array, + `isNegativeClause`) | slot candidate scans over all 2045 units (36%) |
| POS index | WeakMap on the units array | cold eligibility scans only visit the slot's part of speech |
| Template matches per unit | snapshot identity + units array | the matcher walked every template per call (~7% of quiz build) |
| Availability per template | template id; drops on `templateEdits`; new unlocks caught up incrementally | queue view and buildable-first ordering |
Rules that keep them exact:
- **Never mutate what `getVerifiedTemplatesShared()` or `findMatchingTemplatesForUnit()` returns.** Editors use `getAllVerifiedSentences()`
  / `getVerifiedSentenceById()`, which return copies. Enforced: `test/golden_sentences_test.js` (snapshot unchanged after a generation sweep,
  copies independent, an edit rebuilds the snapshot).
- **Every template mutation must bump `templateEdits`.** Today all of them end in `_saveStateToLocalStorage()`, `resetHardcodedVerifiedCache()`
  or `importVerifiedSentencesState()`, which bump it. A new mutator that bypasses these leaves every cache stale.
- Availability: `syncOwnedUnits(ids)` logs new unlocks (a removed unit resets the cache); any read catches its entry up by testing only the
  new units against the still-locked slots; `availabilityStep(budgetMs)` does the same for all templates in time slices (fc2 runs 6 ms
  slices 40 ms apart after each save: `syncAvail` / `availPump`). Enforced: fc2 UI test (no slot recomputed on unlock, incremental equals cold).
- Mood and adverb concord skip a forbidden form unless the text contains it literally; exact only while those word lists are plain text.
  Enforced: plain-text checks in `test/grammar_mood_test.js` and `test/adverb_test.js`.

## 4. fc2 (the game)
- **Layering:** `game.js` (pure rules, tuning table `T`), `store.js` (pure persistence helpers), `queue.js` (pure queue), `fx.js` (effects
  canvas, sound, haptics), `debug.js` (scenes), `app.js` (UI and wiring). Pure modules are tested directly in `test/fc2_game_test.js`.
- **Persistence (three layers, because one was not enough):**
  1. Unit progress goes to the webapp unit database (IndexedDB `KongbuheyAppDB` via `webapp/db.js`) so the spreadsheet shows it.
     `saveBulkUnitCellValues` does ONE read-modify-write per unit: the old per-cell get+put inside one transaction kept only the last
     cell, which silently lost scores (2026-11-20). Enforced: ordered fake IndexedDB test in `test/spreadsheet_ui_test.js`.
  2. A localStorage mirror (`kb.fc2.v1.prog`) of the same progress, merged on load (`FC2Store.mergeProg`: newer timestamp wins; database
     records missing progress columns are healed from the mirror). Never written when `store.js` is missing or the progress is empty.
     Writes are debounced; `flush()` runs on pagehide/visibilitychange.
  3. Rolling snapshots (6, richest pinned, with game state) and the session (combo, round, learning queue; restored if < 3 h old).
  Menu > Data has Recover progress (every source with counts), Force save (write + read back + report) and backup/restore.
- **`?debug` pages never save** (`EPHEMERAL`): scenes replace the whole game, and a debug page that saved wiped real progress once.
  Tests use `?debug&persist`. Enforced: fc2 UI test "debug pages never save".
- **Errors** from storage, the database and global handlers open a copyable panel (`reportError`, `#errbox`); corrupt saves are kept aside.
- **Responsiveness:** quizzes are pre-built in idle gaps (`prefetchSoon`), taps are ignored briefly after a quiz opens (`STEST_GUARD_MS`),
  the effects canvas clears on every screen change, and the availability sweep is time-sliced.

## 5. Quality loop and tests
- Correctness of Korean comes from fixtures, not self-checks: "⚐ Bad sentence" flags -> `tools/triage_flags.js` -> `test/golden_sentences.json`
  (open = known bug), plus slot fixtures and gap classes from `tools/vs_tune.js`. A bug is fixed only with a fixture.
- `node test.js` (~23 s): lint, data integrity, sampled generation, all suites (including the jsdom fc2 playthrough), then the stamp.
  `node test.js --full` adds the every-unit sweep, the browser load test, the CLI `--help` check and the generation bench.
- **Generation bench** (`tools/bench_generation.js`, ~10 s). Timings (module load, first use, cold/warm card, availability slices, fc2 quiz
  build in jsdom) are printed next to the baseline's and never fail: they vary by machine. What can fail is deterministic:
  - work counters (`getWorkStats()` in the generator): a second identical pass rebuilds no cache and repeats exactly the first pass's
    template attempts and AST fallbacks; an unlock recomputes no slot; a template edit rebuilds the snapshot once; and with unchanged data
    the seeded pass does no more work (attempts, fallbacks, cache fills) than the baseline. This catches a broken cache or a retry loop
    that grew, on any machine, where a timing threshold would be flaky.
  - a seeded output fingerprint (820 samples, hashes only). Same data + different output = generator behaviour changed.
  Both compare against `test/bench_baseline.json`; if a change is intended, re-save with `--save`. Changed data files skip the baseline
  comparisons with a message. Run it before and after any refactor of generation.
- UI tests that generate a lot run inside `quiet()` (stubs `prefetchSoon`, restores options), or background quiz building starves later
  steps' timers. Agents on a mounted folder run tests from a local copy (see `CLAUDE.md`).

## 6. Performance record
2026-11-22, Node on the dev laptop, owned = units 0..699, 3 sentences per card (current numbers: `node tools/bench_generation.js`).
| | Before | After |
|---|---|---|
| Card generation, warm / cold | 21.7 / 24 ms | ~3.3 / ~7.5 ms |
| First use (startup) | 244 ms | ~7 ms |
| fc2 quiz build (jsdom) | ~990 ms | ~40 ms (~53 ms after quiz wrong answers left the queue, for variety) |
| `node test.js` | ~50 s | ~23 s |
Done: the caches in section 3, POS decks and difficulty ranking built on demand (only the webapp Decks view reads them), the mood/adverb
literal pre-checks, fc2 computing generation options once per quiz.

**Measured and deliberately not done** (owner decision 2026-11-22: features are still in flux, so no intricate optimizations yet).
Warm sweep of 1,400 cards = 2.75 s:
1. 94 template+unit pairs that never pass validation cost ~30% (each card retries them). Idea: remember failures per session; better, fix
   their slot tags (they are also content bugs, e.g. 둘/셋/넷 in a 쓰다 template).
2. AST fallback ~46% (0.57 ms per call, 1.6 calls per card). Idea: reuse recent fallback sentences in quiz wrong-answer generation.
3. `PRONOUN_REPLACEMENTS` (35 data-driven regexes) on every morphology call. Idea: a literal pre-check derived from each rule.
4. Engine load ~60 ms (likely several times that on a phone), ~40% building ~2,900 forbidden forms in `state.initSemanticSets`. Idea: build
   lazily or precompute at stamp time.
None of these numbers come from a phone; profile there (Chrome remote debugging) before acting on 3 or 4.
