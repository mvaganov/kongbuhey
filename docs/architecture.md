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
- **Hangul constants scheme (agreed 2026-11-22, migration in progress).** Every Hangul literal that engine code depends on lives in
  `data/hangul_constants.js` (`HANGUL_CONSTANTS`, loaded right after `data/constants.js`). Each entry's comment states the rule and either
  `Data fix: <tag or SemanticData field>` or `Mechanics` (grammar machinery that legitimately lives in code). Regexes are built from these
  constants with `new RegExp(...)` at module load; no Hangul inside regex literals.
  - **Naming:** a table moves whole, under ONE name for what the code does with it (not one name per word). A lone literal gets a
    use-specific name `<AREA>_<RULE>_<ROLE>`; two rules that test the same spelling get two names, because their reasons, and so their
    future fixes, differ. `AREA` is the owning function or module.
  - **Scope:** engine code (`korean/`, `shared/`). Exempt by decision: tools (`tools/`, `test/`, root CLIs), user interface (`fc2/`,
    `flashcards/`, `webapp/`), data files, and error/log message text. Magic unit ids (`g.id === 645`, `units[66]`,
    `[322, 1383].includes(g.unitId)`) count as the same kind of debt.
  - **Tool: `tools/hangul_literals.js`.** Default lists every literal (`file:line function kind text`); `--summary` (the scale),
    `--by-file`, `--by-function` (with the lines each function spans, comment header included), `--compare` (single-value comparisons
    and unit ids, with chains marked), `--tables` (every table: size, name, free-floating or inside which function). Kinds: `compare`
    (a word tested against one value: the most valuable to move into `data.js` tags), `table`, `regex`, `unit-id`, `other`. `[chainN]`
    marks a run of single-value tests on the same subject (`a === 'x' || a === 'y'`, or consecutive ifs with identical bodies): a
    ready-made table.
  - **Enforcement:** `--check` runs in `node test.js` Stage 0 as a per-file ratchet against `test/hangul_literals_baseline.json`: a file
    with more literals than its baseline fails (a new file must have none); a file with fewer also fails until the gain is locked in.
  - **Lowering the baseline (manual, on purpose).** After a cleanup, verify (`node test.js --full`: the bench's output fingerprint proves
    behavior is unchanged), then run `node tools/hangul_literals.js --save-baseline` yourself and commit `test/hangul_literals_baseline.json`
    in the same commit as the cleanup. The failing message says this. There is no `--accept-lower` flag and none should be added: an
    automatic accept lets a regression hide behind an unrelated drop. Never run `--save-baseline` to silence a rise.
  - **Migration order, per function or table group** (each step verified by `node tools/bench_generation.js` and `node test.js`):
    1. Chains -> a table: rewrite `a === 'x' || a === 'y'` / repeated identical ifs as one array or Set lookup. Do this first whenever the
       code can be refactored to use a table instead of individual constants.
    2. Inline tables inside functions -> hoisted to module level (also stops rebuilding them on every call).
    3. Module-level ("free-floating") tables -> moved into `hangul_constants.js` whole, under one name.
    4. Remaining single comparisons -> named constants, or better, a tag in `data.js` (then delete the code path).
    5. Regexes -> `new RegExp` from named fragments. Most error-prone; give these to a stronger model.
    Model fit: steps 2-3 are mechanical (Haiku can do uniform cases); step 1 is safe for Haiku only when every branch is the same test on
    the same subject with an identical body (what `[chainN]` marks); anything with differing bodies, mixed tests or side effects, and
    steps 4-5, need Sonnet or better. A behaviour change in generation fails the bench's output fingerprint; analyzer code is covered by
    Stage 5 and the analyzer suites, not the bench.
  - **This file and the tool are the place to look for quick code-quality wins:** read the entry names, pick one marked `Data fix`,
    add the tag to the units, replace the spelling test with a tag test, delete the entry, lower the baseline.
  - **Scale on 2026-11-22** (after the pilot, moving rule tables to `data/`, moving 84 module-level tables whole into
    `hangul_constants.js`, and hoisting 221 inline tables plus 92 chains out of `unit_sentence_generator.js`, `verified_sentence_generator.js`
    and `morphology.js`; current numbers: `node tools/hangul_literals.js --summary`): 2,461 literals in 28 files (47 more are exempt error
    text), down from 7,030. What remains is mostly `compare` (about 980: one word tested against one value, in `if` chains with
    different bodies) and `other` (793: return values, arguments, replacements), then regex 260 and unit-id 130. The tables are done
    except 2 that reference `K`.
  - **AUTONAMED entries are a backlog for a cheaper agent.** Hoisted entries named `<FILE>_<FUNCTION>_<SUBJECT>_ONE_OF` (and `_LIST_<METHOD>`)
    carry an `AUTONAMED` comment: the name is mechanical (file, function, the variable tested), not the rule. Renaming one means reading
    its words and use, choosing `<AREA>_<RULE>_<ROLE>`, and replacing the `Unclassified` note with `Data fix` or `Mechanics`.
    `grep -c AUTONAMED data/hangul_constants.js` is the count left. Entries that came from a named constant keep that name.
  - **Chains.** `a === 'x' || a === 'y'` and `s.endsWith('x') || s.endsWith('y')` (also the `!`/`&&` forms) became
    `HC.NAME.includes(a)` / `HC.NAME.some(w => s.endsWith(w))`. Not converted: consecutive `if`s with identical bodies, chains with an
    inline comment, and one chain in `unit_sentence_generator.js`.

## 2. Data model
- `data/data.js`: one array of unit rows, columns named by `DATA_SCHEMA`. **A unit id is its array position**, and progress everywhere is
  keyed by id, so units are never deleted or reordered. Duplicates become alias rows (`PartofSpeech` `Alias`, `SemanticData.aliasOf`);
  readers resolve them (`resolveAliasUnit`, `FC2Store.foldAliases`). Enforced: Stage 1 (sequential ids, no references to aliases).
- Tags are stored as `Set`s (`hasTag`). **Unit rows are not mutated at runtime** by any page; the generation caches below rely on that and
  key on the units array's identity, so a full data reload is safe but an in-place row edit would need a cache reset.
- Rule tables that are data, not logic, live in `data/` beside the units, loaded by the pages as classic scripts and kept browser-safe
  by ESLint: `verb_suffix_rules.js` (the analyzer's verb ending table), `pronunciation_rules.js`, `verb_argument_specs.js`
  (moved from `korean/` 2026-11-22). A `korean/` file that is mostly a table belongs here too.
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
- **Layering:** `game.js` (pure rules, tuning table `T`), `store.js` (pure persistence helpers), `queue.js` (pure queue), `controller.js`
  (game flow, no DOM), `fx.js` (effects canvas, sound, haptics), `debug.js` (scenes), `app.js` (the view). Pure modules are tested directly
  in `test/fc2_game_test.js`.
- **Controller and view.** `FC2Core` (`controller.js`) owns the state (`g`, `prog`, `session`, `card`, `opts`, `notes`, `recent`) and every
  game-flow step: picking cards, self-scores (`answerSelf`: -2 "much more practice", -1 wrong, 0 "one more practice", +1 right, +2 "boring,
  move on"), trials, sentence tests, rounds, idle coins, pulls, upgrades, quests, ascension, the number board, backup/restore. Its
  environment is injected: units, clock (`sec`/`ms`/`day`), `random`, `generate`, `templateIds`, `canSpeak`, `persist` hooks,
  `onSentences`. Core methods return what happened (coins, level-ups, events); `app.js` only renders and plays effects
  (`settleEffects`). Reason: one copy of the game rules for the phone and for headless QA. Enforced: `test/fc2_trace_test.js` replays a
  scripted game in jsdom with a fixed clock and seed and compares every state change and effect call to `test/fc2_trace_golden.json`
  (`--record` rewrites it after an intended change).
- **Headless simulator** (`tools/fc2_sim.js`): the same `FC2Core` with a simulated clock, seeded random, the Node sentence generator and no
  persistence. `run` plays a batch with a policy (`correct`, `wrong`, `mixed` = a seeded learner who improves with practice) and prints a
  summary (level/coins/stars over time, pulls in order, trials, quizzes, repeated sentences, endings, final words, failed checks), one JSON
  line per card to `--log`; `step`/`script` drive it by commands; `--save` writes a backup the phone restores (Menu > Backup / restore);
  `--state` carries a game between calls. Every sentence goes through `validateSentenceString` and every state through invariants (coins,
  score/tier ranges, unique owned ids, xp). ~1 s per 200 cards, so use it before asking the owner to play-test.
  Enforced: `test/fc2_sim_test.js` (default: determinism, scripted session, backup round trip, policies, checks; `--full`: 200-card runs
  for every policy with zero check failures).
- **Examples Critical Path** (`examplesCriticalPath` in `verified_sentence_generator.js`, Shop "From" option `G.EXAMPLES_PACK`, simulator
  `--pull-from examples` / `critical-path`): a verified template is usable when its grammar units are unlocked and each word slot has an
  unlocked unit that fits. The path greedily unlocks the unit with the most progress, where filling one of a template's n missing
  requirements is worth 4^(1-n). From the core grammar: 23 usable templates after 40 unlocks and 204 after 300 (course order: 1 and 1).
  Enforced: `test/fc2_sim_test.js` (monotone, beats course order, pulls through the controller), fc2 UI test (Shop option, reveal).
- **Inventory slots** (2026-11-26): one slot per level above 1 (`G.slotsOf` grows `g.slots` on read, so old saves need no migration; slots
  never shrink). An empty slot is specialized once (`T.SLOT_KINDS`: retired shelf, focus, audio, sparkle, name, victory, freeze); the Shop's
  Unspecialize resets one for rising coins. Rules in `game.js` (`specialize`, `retire`, `touchStreak` freezes, focus in `nextCard`,
  `addressable`/`addressSentence`), actions in `FC2Core` (`retire` removes the unit from `classify()`, so it never comes up as a card and is not
  credited by sentence tests; `addressOne` turns one addressable example into "Name 씨, ..." and `buildSentenceTest` addresses the wrong
  answers the same way; `pickCard` sets `card.listen` / `card.victory`). Sim: `slot`, `retire`, `unretire` commands. Tests: `fc2_game_test`
  (rules), `fc2_sim_test` (controller), `fc2_ui_test` (Slots tab, 🎒 on a card, sparkle, victory HTML, Unspecialize).
- **Parity rule:** a new gameplay feature goes into `FC2Core` (not `app.js`), gets a simulator command or batch behaviour, and a
  `test/fc2_sim_test.js` case. Exempt from full parity: speech, sound, haptics, animation, layout. Stub them instead (e.g. `canSpeak`
  decides whether listening trials exist; the simulator answers them like reading trials).
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
- **Flag files** (`]name` in the repo root) say "something must happen before the next commit"; the pre-commit hook refuses commits
  while one exists and `node test.js` names any flag it wrote. `grep 'writeFlag' tools/*.js` to see what writes them (`tools/flags.js`
  owns the format and the registered actions that resolve them: `node tools/flags.js list`, `node tools/flags.js resolve`).
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
