# Kongbuhey (공부해): Handoff

Updated 2026-11-20. Rules, commands and the flag-review loop are in `CLAUDE.md`; this file is state and priorities.

## State
**Flashcards (`flashcards/`, the study app, untested on a phone):** localStorage state `kb.fc.v1.*` (deck, notes, opts, flags, stats).
- Cards mode: tap to reveal; 5 self-scores (-2..+2) reposition the card; Back undoes; Remove keeps the score. Example-sentence units
  link to their cards. Markdown notes, reverse mode, flag export (same JSON as the webapp), backup/restore, sort by last seen/last correct
  ("seen" = shown as a card or used in a spoken sentence; "correct" = positive score).
- Units mode (`units.js`): mobile port of the webapp's Unit Selector.
- Deck rules: `deck.js` (`test/flashcard_deck_test.js`). UI flows: `test/browser_load_test.js`. The deck canvas animation is untested (jsdom).
- Deploy: repo Settings > Pages > branch `main`, `/ (root)`; open `https://mvaganov.github.io/kongbuhey/flashcards/`. Scores are per browser.

**fc2 (`fc2/`, the study game, slices 1-3 built 2026-11-16/17; slice 3 untested on a phone):** keeps `flashcards/` as the comparison.
- Rules: `fc2/game.js` (pure; `test/fc2_game_test.js`, a `test.js` stage). Effects: `fx.js`. UI: `app.js`.
  All tuning numbers are the `T` table at the top of `game.js`.
- Loop: Shop pull unlocks units in course order (class packs first, PriorityScore low to high: easiest first) -> learn in-session until
  RecognitionScore 3 -> the unit "grows" and earns idle coins -> ripe after an interval set by LongTermRecognition
  (4h / 20h / 3d / 7d) -> harvest (the spaced review) banks progress to the next tier -> wilts after 3 intervals (miss = lose a tier,
  capped at 20 at-risk units, the rest are dormant). Coins never depend on the self-score picked.
- Trials: the harvest that would promote a unit is an objective question, not a self-scored card. By tier: Korean -> meaning (4 choices),
  listening -> meaning (6, falls back to reading without speech synthesis), meaning -> Korean (6). Pass promotes and pays a bonus; fail sends
  the unit back to learning and the trial returns when it is next ripe. Distractors: unlocked units of the same part of speech first.
- Daily quests (3 per local day plus a chest) and Ascend (bank 10+ new stars as seals: +2% coins each, resets coins and upgrades).
- Data: unit progress and notes go to the webapp unit store (`KongbuheyAppDB`, via `webapp/db.js`), so the spreadsheet shows them.
  Game state (coins, xp, owned, upgrades, cosmetics, flags) is localStorage `kb.fc2.v1.*`. First launch imports `kb.fc.v1.*`.
- Sentence test: examples are built from unlocked units only by default (Menu option). Each example has a 🎯 test: forward = Korean enlarged + 4
  English choices, reverse = English + 4 Korean sentences; distractors are other sentences from the same units. Right = 2 "Correct" answers for every unlocked
  unit in the sentence and 3 for the card's unit (units waiting on a promotion trial are skipped; a second answer on a ripe unit pays as practice), with a
  sentence-clear show (coin and XP particles, learning pill counting up, a sliding chip per unit; `bonusShow` in `app.js`); wrong = "Missed it" for the card.
- Number sound board: Lv 0 shop unlock (10 냥), hear 0-12 native or Sino-Korean, tap it; a tapped number is spoken in the question's system (native 0 = 공).
- **Checking screens fast:** `fc2/index.html?debug` lists scenes, `?debug=trial-listen` etc. opens a ready-made state (separate storage `kb.fc2.dbg.*`, real
  save untouched). Scenes are in `fc2/debug.js`; `test/fc2_ui_test.js` (jsdom, runs in the default `node test.js`) renders every scene. New screen = new scene.
- Listening trial: unlocked by play, not by a setting. A unit must reach ★ (meaning trial passed), be harvested once at ★ (20 h interval), then be ripe again:
  the next review is the listening trial (about 2 days after earning ★). Needs the "Listening trials" option and speech synthesis. Fast path: `?debug=trial-listen`.
- Not built: a free-play sound board, undo, Units picker.
- Deploy: same Pages site, `https://mvaganov.github.io/kongbuhey/fc2/`.

**Webapp (`webapp/`):** Unit Selector & Details, spreadsheet over all units, practice sets, text importer, Verified Sentences (544
templates), Decks view. Its Practice tab is legacy (Gemini-built), superseded by `flashcards/`.

**Known gaps:**
- Browser vs Node differ on unit 400 (너무) in ~2 of 39 sampled batches: the browser emits "너무 + action verb", Node does not. Cause
  unknown. Check InSet/tier state, then diff generator inputs.
- String-level validators (`validateAdverbConcord` etc.) accept "너무 주문할 수 있습니다"; only unit-level checks catch it.
- Fresh clones lack gitignored `studytexts.js`, so Stage 5 and the leak scan skip.
- `korean/concord/index.js:32` logs a TypeError in Chrome on every page: in the browser `concordExports` is built by spreading `window`
  into itself, and `Object.assign` stops at the read-only `window` key. Harmless (the values are already globals) but it is console noise
  that jsdom does not report.

## Private text overlay (copyright)
Textbook `OriginalKo`/Title text lives in gitignored `local/verified_originals.js` (keyed by template id); `verified_sentences.js` rows
are label-only. Loader: `korean/generation/verified_originals.js`. `tools/text_analyzer.js` splits private text into the overlay on ingest.
Guard: `test/verified_originals_test.js`. Remaining exposure: slot `Surface` strings still encode textbook sentences eojeol by eojeol (a
hygiene test caps known leaks). History was rewritten with `git filter-repo`; old commits may survive in GitHub caches and forks.

## Non-obvious files
```
select.js, test.js      first-class tools: unit query/edit CLI, test runner
data/                   constants, units, templates, homonym resolver (each also a CLI), generated schema_summary.json
                        (homonyms.js also holds the big dictionary; split it out later)
korean/index.js         Node facade over korean/ (the browser loads korean/ modules directly)
tools/exhaustive.js     seeded generation sweep (smoke test, not an oracle)    tools/text_analyzer.js  passage analysis CLI
ingest.js, schema_analysis.js, verify_sentences_cli.js   still at root, not yet sorted
tools/vs_tune.js        Verified Sentence CLI: show/list/gen/check templates, edit slot filters and template Rules (writes the data file)
tools/merge_units.js    merge duplicate units: alias=canonical pairs -> alias rows, remapped templates/homonyms (see Decisions)
```
- **Add a verified sentence:** put one sentence per line in a text file (optional `| <grammar ids>` the line must cover), then
  `node tools/vs_tune.js ingest <file> --dry-run`, then without `--dry-run`. Project-authored sentences use source `minimal` (kept inline,
  open-licensed); textbook text goes through `tools/text_analyzer.js --add-verified` so it lands in `local/`. Rejections are analyzer gaps.

## Priorities (in order)
1. Play `fc2/` on the phone (and `flashcards/` to compare) and send balance and pacing notes. Semester starts ~2026-12-01; early units (class2011 to class2112) first.
2. New study modes on top of `shared/`: reverse sound board (hear Korean, pick from a button matrix) and multiple-choice comprehension.
3. Study, flag, triage, fix (CLAUDE.md loop). Freeze generator scope once the loop works.
4. Android packaging.
5. Goal: paste K-pop lyrics or a movie script into the web app and get a curriculum from the units it recognizes. Needs the ingest/homonym
   resolution logic (`data/homonyms.js`, `tools/text_analyzer.js`) usable in the browser.
6. TODO (owner request 2026-11-20): API round-trip tests for the other data tools, like `test/select_test.js` (temp copy of the data file
   beside the original, edit through the tool's API, assert it still loads, only the target changed, `--dry-run` writes nothing, real
   files untouched). Cover `data/verified_sentences.js` CLI and writers (`tools/vs_tune.js` beyond its edit round-trip, `tools/text_analyzer.js`
   `--add-verified`), `tools/merge_units.js` (needs a data-file option first; it writes the real files today), `data/homonyms.js update`,
   `ingest.js`, `tools/triage_flags.js`. Same pattern: write the test, then make it fail on a known bug before trusting it.
7. Stretch, paused 2026-11-15: Tatoeba sentences (structures differ too much from the class). Status in `docs/tatoeba_selection_plan.md`.

## Decisions
- Keep the free AST generator (`korean/generation/unit_sentence_generator.js`); its large functions may be replaced, refactored or deleted
  later, decided once verified-sentence generation is strong. Do not refactor it before then.
- `data/verified_sentences.js` drives generation today; its data will improve as sentences are tested and semantic tag constraints relax.
- Duplicate units (2026-11-20): ids are array positions and progress is keyed by id, so duplicates are not deleted. `tools/merge_units.js`
  turns each into an alias row (PartofSpeech `Alias`, SemanticData.aliasOf); POS-filtered pools skip it, the analyzer indexer skips it,
  fc2 folds its progress/owned/notes into the canonical unit on load (`FC2Store.foldAliases`), flashcards drops it. The canonical keeps its
  own tags (a union passes AND-filters neither duplicate passed), gains missing SemanticData keys, and takes the earliest pack Source.
  Sense splits the analyzer cannot tell apart were merged into the unit it emits (는데 893/894/956/957/1044/1045 -> 620; 거예요 1019/1020 -> 460).
  Kept separate as true homonyms: 내다 1216/1281, 찾다 554/1306, 보다 149/976, 겠다 837/838, 는데요 1292/1293. Stage 1 fails on any reference
  to an alias. The webapp still lists alias rows (POS Alias) so they stay inspectable.
- Template order for a unit: fewest slots first, then grammar difficulty (`generateVerifiedSentencesForUnit`).

## Verified-sentence tuning workflow (agreed 2026-11-20, in progress)
Goal: varied, short, not-wrong sentences. Loop per batch of 20-30 templates, lowest unit ids first (SUOBI00, SUOBI01):
1. A mid-tier agent (Sonnet) runs `tools/vs_tune.js show/tags --dry-run/slot --check` per slot; keeps a filter change only if every newly
   admitted sentence is natural; uses `deny`/`noTags` rules for a few bad candidates; records anything no rule kind can express as a
   `gap` rule (`vs_tune.js gaps` lists them). Strict defaults also admit nonsense (vs_367 verb slot): tightening is part of the job.
2. Every bad sentence found becomes a golden fixture (`test/golden_sentences.json`, status open) written by the agents: the owner cannot judge Korean.
3. A stronger agent (Opus) implements the dominant gap classes as generator features, flips fixtures to fixed, and spot-checks the batch.
4. Owner reviews and commits/pushes; next batch.
Known blockers: the analyzer rejects -자, -(으)ㄹ게요, -니, 줘요, 고파서 (12 of 15 pilot sentences in `local/minimal_pilot.txt`), so
"one short sentence per grammar unit" waits on analyzer work. Known gap: time-word tense vs predicate tense (내일 ... 잤어요 passes).

## fc2 reload safety, error panel, sentence steering (2026-11-19)
- `fc2/store.js` (pure, tested in `test/fc2_game_test.js`): unit progress is mirrored to localStorage (`kb.fc2.v1.prog`) and merged with the IndexedDB copy on load (newer timestamp wins, DB healed). The session (combo, round, learning queue) is saved and restored if under 3 h old. `save()` is debounced for the mirror; `flush()` runs on pagehide/visibilitychange.
- Errors from storage/DB/global handlers show a copyable `#errbox` (`window.fc2ReportError`); corrupt saves are kept under `<key>.corrupt`. Debug scene `error-box`.
- Sentence generation options: `preferUnitIds` (Set) and `slotBias {retries, reject(unit)}`. Honored by the verified generator (`pickCandidateFromPool`) and the AST generator (`setPickSteering` in `argument_concord.js`, applied to unit-row picks only). fc2 passes a bias that redraws a slot up to twice when the unit is stronger than the owned-set mean.
- Sentence-test distractors share the sentence's nouns (Noun/Pronoun units) where possible; opening a test marks lastSeen for every unit in the target and choices.
- Quiz speed (2026-11-19): profiling showed the slot-bias redraws cost ~0 ms; time is candidate generation (~0.35 s per quiz now, was ~0.6 s). Quizzes are pre-built in idle gaps (`prefetchSoon`, cached as `sentence.preTest`), and taps are ignored for `STEST_GUARD_MS` (450 ms) after a quiz opens (tests set `app.stest.readyAt = 0`).

## Progress safety and recovery (2026-11-19)
- Incident: a player lost all unit progress on refresh (units stayed unlocked, scores reset). Leading suspect: the `?debug` page has its own save with no unit database, and a stale-cache fallback wrote an empty mirror over it. Not confirmed. Fixes: the mirror is never written when `store.js` is missing and never replaced by an empty one; rolling automatic snapshots (`kb.fc2.*.snaps`, 6 kept, richest pinned) in `store.js`.
- Menu > Data > Recover progress lists every source (unit database, this page's copy, snapshots, the other save: normal vs `?debug`, old flashcards) with counts; Restore keeps the more advanced copy of each unit (`FC2Store.bestOf`).
- Map > tap a unit > 🛠 Edit values: score (field), star level (dropdown), harvests to next star (field), Set-to-now buttons for last correct / last seen. Idle income is derived from the star level, so it is read only.
- Cheat mode (Map, run-time only): tap a unit = +1 score (stamps never-answered units), "Mature all" shifts every unit's TimeStampLastCorrect/LastSeen back N minutes. Menu > Data > Force save writes and reads back game, progress copy, session and the unit database. The backup no longer includes flagged sentences (separate ⬇ Flags export); quiz/card sentences are never persisted (only flagged ones are).
