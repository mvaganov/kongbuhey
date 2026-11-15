# Kongbuhey (공부해): Handoff

Updated 2026-11-15. Working rules and commands live in `CLAUDE.md`; this file is state, architecture and priorities.

## What it is
A study aid for one learner of Korean. Static client-side SPA (`webapp/`, vanilla JS, no build, runs from `file://`, IndexedDB with
LocalStorage/memory fallback) plus Node 22 CLI tooling. Every example sentence is generated from the lexicon, so generator
correctness is the product. The owner cannot judge Korean himself: correctness comes from sentences he flags and an LLM triages
(see "Flag-review loop" in `CLAUDE.md`), not from the generator validating itself.
Target: desktop first, Android later (not iOS), GitHub Pages for testing once content is decoupled (see Priorities).

## State
**Works:** Unit Selector & Details (generated sentences with per-morpheme pills, literal and natural English, TTS), spreadsheet over
2,045 language units with custom columns, saved practice sets, text importer + passage analyzer, Verified Sentences view
(544 templates), Decks view, a basic Practice-tab flashcard flow (Gemini-built, legacy; superseded by `flashcards/`).
**Flashcard app (new, standalone):** `flashcards/index.html` is separate from the webapp: no IndexedDB, state in localStorage (`kb.fc.v1.*`), same engine scripts plus `shared/`. Front/back cycle (tap empty space to reveal), 5 self-scores (-2..+2) that reposition the card, deck visualization canvas (tap a card to jump), markdown notes, reverse mode (English on the front), speak options, flag list with copy/download (same JSON as the webapp export; save into `flagged/` for `tools/triage_flags.js`), backup/restore, deck contents by Source. Pure deck rules: `flashcards/deck.js` (`test/flashcard_deck_test.js`); UI `app.js`; helpers `render.js`. Scores clamp to -6..+6. Not yet tried on a phone.
**Deploy to GitHub Pages:** repo Settings > Pages > Deploy from branch `main`, folder `/ (root)`; open `https://mvaganov.github.io/kongbuhey/flashcards/`. Scores live per browser; use Backup/restore to move them.
**Refactor:** shared browser/Node modules in `shared/` (`markdown.js`, `speech.js`, `sentence_adapter.js`, `unit_card.js`) back both the webapp and the flashcards; `webapp/selector.js` delegates to them.
**Webapp fixes:** Verified Sentences unit names are links opening a details popup; the single-choice slot banner no longer prints `#undefined`; Unit Selector keeps scroll, selects rows in place, Down/Up arrows walk all units (opening the next source), Space/Enter toggles In Set.
**New this session:** "⚐ Bad sentence" flag button, JSON export, `tools/triage_flags.js`, golden fixtures
(`test/golden_sentences.json`), ESLint (flat config, `no-undef` on), jsdom browser load test, 13x faster generation
(a per-call `require()` in `morphology.js` was the cause), dead code and obsolete audit artifacts purged.
**Fixed this session (found by ESLint and jsdom, invisible to the old tests):** undefined `hasTag`/`getNounUnit` in
`clausal_validation.js`; `select.js --strict` crash; in the browser, `spatial_concord`, `adverbial_concord`, `sentence_validator`
failed to load (duplicate top-level `const`) and `mood_concord`, `clausal_generator`, `clausal_validation` were missing from
`index.html`. The browser engine had been running without those concord modules.
**Known gaps:**
- Browser vs Node still differ on unit 400 (너무), ~2 of 39 sampled batches: the browser emits "너무 + action verb" sentences Node
  avoids. Cause not found. Check InSet/tier state, then diff the generator inputs.
- 178 ESLint `no-unused-vars` warnings = dead-code backlog (most in `test/collocation_test.js`, `test/grammar_mood_test.js`,
  `morphology.js`, `unit_sentence_generator.js`).
- String-level validators (`validateAdverbConcord` etc.) accept "너무 주문할 수 있습니다"; only unit-level checks catch it.
- Tests that read `studytexts.js` need the local file (gitignored); a fresh clone skips Stage 5.

## Layout
```
data.js                 2,045 units, 12 columns (Id, Korean, English, PartofSpeech, SemanticTags, Disambiguation, Conjugation,
                        Source, PriorityScore, FormalityLevel, HonorificRules, SemanticData, SyntaxFrame). Source = class2011..class2202
verified_sentences.js   544 sentence templates (OriginalKo + slots)        homonyms.js  surface-token resolver
select.js               SQL-like CLI for units (SELECT/UPDATE/INSERT, --locate)   ingest.js  passage ingestion pipeline
exhaustive.js           seeded generation sweep (smoke test, not an oracle)  text_analyzer.js / schema_analysis.js  analysis CLIs
korean.js               Node facade over korean/ (the browser does not use it)
korean/  core/ (primitives, morphology, stem_engine, numbers, lexicon_index)   concord/ (spatial, adverbial, mood, clausal,
         classifier, argument)   generation/ (unit_sentence_generator, verified_sentence_generator, sentence_ast, validator)
         analyzer/ (indexer, token/sentence/passage analyzers, SyntaxFrame, particles)   phonetics/  translation/  specs/  state.js
webapp/  index.html (40 ordered <script> tags), db.js, spreadsheet.js, selector.js, text_importer.js, verified_sentences_view.js,
         decks_view.js, app.js
shared/  markdown, speech, sentence_adapter, unit_card (webapp + flashcards)    flashcards/  standalone mobile app (index.html, app.js, deck.js, render.js, flashcards.css)
tools/triage_flags.js   flag inbox -> verdicts -> fixtures        test/  suites; golden_lib.js + golden_sentences.json
.claude/                settings.json + hooks/guard-big-reads.js        docs/  translation_architecture.md, kor_sentences.tsv
```

## Constraints worth remembering
- All linguistic knowledge lives in `data.js` tags/SemanticData; no Hangul literals or unit IDs in logic (a Stage 0 check enforces IDs).
- `korean/analyzer/**` and `korean/core/**` are browser-safe and console-free (ESLint enforces).
- Multi-word grammar is declared in `SyntaxFrame` as `/*js:matcher*/` closures, compiled by `analyzer/indexer.js` into `mweRules`
  and `verbalEndingRules` (longest form first); `sentence_analyzer.js` consumes them.
- TTS: native Korean voice only (multi-voice experiments shelved). English-readable transliteration rules: no doubled consonants,
  no trailing `h` in closed syllables, join syllables into words, `ㄹ+ㄹ` becomes `ll`.
- Gemini-era metric gaming: the old plan counted `].includes(` and Hangul `new Set([` literals; they moved rather than disappeared
  (Hangul `new Set([` lines 12 to 265). Judge refactors by behaviour and fixtures, not by grep counts.

## Priorities (in order)
1. Try `flashcards/` on the phone (GitHub Pages) and send requirement changes. Next semester starts about 2026-11-28; early-unit review (class2011 to class2112) needs it.
2. Planned study modes: reverse sound board (hear Korean, pick the match from a button matrix) and multiple-choice comprehension quizzes, built as separate modes on top of `shared/`.
3. Study, flag bad sentences, promote flags to golden fixtures (`tools/triage_flags.js`), fix the generator against them. Freeze generator scope once the loop works.
4. Android packaging later.
5. Stretch: Tatoeba sentences (below).

## Stretch goal: Tatoeba example sentences (paused, not ingested)
Decision 2026-11-15: Tatoeba sentence structures differ too much from what the class teaches; leave them out until the core study loop works.
Work already done (all outputs in gitignored `local/`, nothing in data.js):
- Plan: `docs/tatoeba_selection_plan.md`. Script: `tools/tatoeba_prefilter.js` (`--stage A|B|select|all`, deterministic, runs in seconds).
- Stage A: 15,966 -> 11,328 (length, Latin/digits, final punctuation, spelling-error patterns, names, duplicates).
- Stage B: analyzer bucketing; 2,613 sentences with 0 unknown units, 4,273 with 1 (some are analyzer gaps on inflected forms, e.g. 갔어, 있었죠, 문제). Diversity-capped to 700 candidates.
- Stage C: Haiku reject screen (547 ok/49 fix/104 reject), then Sonnet confirmation of 596 survivors -> 573 kept. Spot-check sheet: `local/tatoeba_spotcheck.md`.
- Not done: human spot check, export to `data/tatoeba_selected.tsv`, `ingest.js --source tatoeba --dry-run`, English via Tatoeba links/eng downloads.
- If resumed: Tatoeba is CC BY (attribution already in the About & Credits modal). Open question: how the generator/translator renders these as English.

