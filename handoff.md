# Kongbuhey (공부해): Handoff

Updated 2026-11-14. Working rules and commands live in `CLAUDE.md`; this file is state, architecture and priorities.

## What it is
A study aid for one learner of Korean. Static client-side SPA (`webapp/`, vanilla JS, no build, runs from `file://`, IndexedDB with
LocalStorage/memory fallback) plus Node 22 CLI tooling. Every example sentence is generated from the lexicon, so generator
correctness is the product. The owner cannot judge Korean himself: correctness comes from sentences he flags and an LLM triages
(see "Flag-review loop" in `CLAUDE.md`), not from the generator validating itself.
Target: desktop first, Android later (not iOS), GitHub Pages for testing once content is decoupled (see Priorities).

## State
**Works:** Unit Selector & Details (generated sentences with per-morpheme pills, literal and natural English, TTS), spreadsheet over
2,045 language units with custom columns, saved practice sets, text importer + passage analyzer, Verified Sentences view
(544 templates), Decks view, a basic Practice-tab flashcard flow.
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
1. **Use the flag loop.** Generate, flag, triage, promote, fix. Freeze generator scope once the loop works end to end.
2. **Early-unit review mode.** Practice and audit class2011 to class2112 grammar and vocabulary over a few weeks (subway-friendly
   quizzes with recall tracking). The next semester starts about 2026-11-28. Needs the app's flashcard/practice flow, so plan it
   only after sentences are trusted.
3. **Decouple content from code (copyright).** Textbook-derived text must not be committed. Plan: `local/` (gitignored) plus the
   in-app importer for the learner's own material; commit only the lexicon and grammar knowledge. Open-licensed candidate sentences:
   `docs/kor_sentences.tsv` (Tatoeba, CC BY, contains errors such as 올께요; filter through the passage analyzer for "i+0" sentences
   and never treat as ground truth). Consider `git filter-repo` if textbook text is in history; make the repo private meanwhile.
4. GitHub Pages deploy (after 3), then Android.
5. Flashcard and quiz modes beyond the basic Practice tab: after sentence trust.

## Update: private text overlay, credits, Tatoeba plan
- Textbook `OriginalKo`/Title text now lives in gitignored `local/verified_originals.js` (keyed by template id, `{ko,title}`); `verified_sentences.js` rows are blank/label-only. Loader: `korean/generation/verified_originals.js`. `Source: tatoeba` rows keep inline text (`OPEN_LICENSED_SOURCES`).
- `text_analyzer.js` writer splits private text into the overlay on ingest, so ingest cannot re-leak it. First ingest will show one-time diff noise (K.* constants become literals).
- Remaining exposure: slot `Surface` strings still encode textbook sentences eojeol by eojeol. Options: accept; replace textbook templates over time with Tatoeba/own sentences and publish only those (recommended); strip Surface (big refactor). Git history still contains the old text.
- `test/verified_originals_test.js` (in test.js) guards this, with ceilings for known leaks.
- About & Credits modal in `webapp/index.html` (button in header; text edited in one place).
- Tatoeba selection plan: `docs/tatoeba_selection_plan.md`.
- Uncommitted: all of the above. Ask before committing.
