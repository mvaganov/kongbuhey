# Kongbuhey (공부해): Handoff

Updated 2026-11-16. Rules, commands and the flag-review loop are in `CLAUDE.md`; this file is state and priorities.

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
- Loop: Shop pull unlocks units in course order (class packs first, PriorityScore high to low) -> learn in-session until
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
```

## Priorities (in order)
1. Play `fc2/` on the phone (and `flashcards/` to compare) and send balance and pacing notes. Semester starts ~2026-12-01; early units (class2011 to class2112) first.
2. New study modes on top of `shared/`: reverse sound board (hear Korean, pick from a button matrix) and multiple-choice comprehension.
3. Study, flag, triage, fix (CLAUDE.md loop). Freeze generator scope once the loop works.
4. Android packaging.
5. Goal: paste K-pop lyrics or a movie script into the web app and get a curriculum from the units it recognizes. Needs the ingest/homonym
   resolution logic (`data/homonyms.js`, `tools/text_analyzer.js`) usable in the browser.
6. Stretch, paused 2026-11-15: Tatoeba sentences (structures differ too much from the class). Status in `docs/tatoeba_selection_plan.md`.

## Decisions
- Keep the free AST generator (`korean/generation/unit_sentence_generator.js`); its large functions may be replaced, refactored or deleted
  later, decided once verified-sentence generation is strong. Do not refactor it before then.
- `data/verified_sentences.js` drives generation today; its data will improve as sentences are tested and semantic tag constraints relax.

## fc2 reload safety, error panel, sentence steering (2026-11-19)
- `fc2/store.js` (pure, tested in `test/fc2_game_test.js`): unit progress is mirrored to localStorage (`kb.fc2.v1.prog`) and merged with the IndexedDB copy on load (newer timestamp wins, DB healed). The session (combo, round, learning queue) is saved and restored if under 3 h old. `save()` is debounced for the mirror; `flush()` runs on pagehide/visibilitychange.
- Errors from storage/DB/global handlers show a copyable `#errbox` (`window.fc2ReportError`); corrupt saves are kept under `<key>.corrupt`. Debug scene `error-box`.
- Sentence generation options: `preferUnitIds` (Set) and `slotBias {retries, reject(unit)}`. Honored by the verified generator (`pickCandidateFromPool`) and the AST generator (`setPickSteering` in `argument_concord.js`, applied to unit-row picks only). fc2 passes a bias that redraws a slot up to twice when the unit is stronger than the owned-set mean.
- Sentence-test distractors share the sentence's nouns (Noun/Pronoun units) where possible; opening a test marks lastSeen for every unit in the target and choices.
- Quiz speed (2026-11-19): profiling showed the slot-bias redraws cost ~0 ms; time is candidate generation (~0.35 s per quiz now, was ~0.6 s). Quizzes are pre-built in idle gaps (`prefetchSoon`, cached as `sentence.preTest`), and taps are ignored for `STEST_GUARD_MS` (450 ms) after a quiz opens (tests set `app.stest.readyAt = 0`).
