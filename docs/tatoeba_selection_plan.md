# Plan: selecting Tatoeba sentences for ingestion

Input: `docs/kor_sentences.tsv` (15,966 rows, `id<TAB>kor<TAB>text`; no English, no author column).
Output: `data/tatoeba_selected.tsv` (open-licensed, committable with attribution), then `node ingest.js --file data/tatoeba_selected.tsv --source tatoeba`.
License: CC BY 2.0 FR. Attribution is in the app's About & Credits modal; keep the Tatoeba id per sentence.

## Principle
Selection is a deterministic script. Only *validity* judgment needs a model, and that is where cheap models are weakest, because a false "ok" is invisible to you. So: script does the bulk, a model does a bounded review, a human spot-checks.

## Stages
**A. Script prefilter** (`tools/tatoeba_prefilter.js`, no LLM). Corpus profile: ~13.3k of 16k pass the basics.
- Keep 5-20 Hangul syllables, ends with . ? !, no Latin letters (105 rows) or digits (450 rows).
- Drop duplicates (normalized), quotes/parentheticals, proper names (heuristic: capitalised romanization, known name list).
- Drop known misspelling patterns (e.g. 올께요, 할께, 됬, 몇일, 않돼) and other spacing/spelling errors the validator already knows.
- Drop sentences containing words absent from data.js unless the lexicon gap is deliberate (report them separately: they are vocabulary candidates).
- Write `local/tatoeba_stageA.tsv` plus a drop-reason report.

**B. Usefulness bucketing** (script). Run each survivor through the passage analyzer (`text_analyzer.js`).
- i+0: fully covered by existing units (good review material).
- i+1: exactly one unknown unit (best learning value).
- Discard 2+ unknown; cap per-grammar-pattern so 300 near-identical "~해요" sentences do not dominate.
- Target about 500-800 candidates total (tunable).

**C. Validity review (LLM).** Batches of ~50, structured output `id, verdict(ok|fix|reject), reason, fixed_text`. Natural, correct, standalone, no offensive/sensitive content, politeness level consistent.
- Pass 1 reject screen: Haiku is adequate here (cheap, catches obvious junk).
- Pass 2 on survivors: Sonnet confirms "ok" and proposes fixes. Total volume is ~100k tokens, so spend on quality, not savings.
- Verdicts saved to `local/tatoeba_review.json` (not committed).
- "fix" rows are edited text, which Tatoeba permits under CC BY with attribution. Mark them in the output.

**D. Human spot check.** You read a random 10% plus every "fix". Any systematic error found sends us back to adjust the stage A/C rules, not to patching rows.

**E. Export and ingest.**
- `data/tatoeba_selected.tsv`: `id, kor, english(optional)`.
- Dry run: `node ingest.js --file data/tatoeba_selected.tsv --source tatoeba --dry-run`, then real run.
- Tatoeba rows keep inline text (`OPEN_LICENSED_SOURCES`). Run `node test.js --full` afterwards.

## English translations
The TSV has none. You would download Tatoeba's `links.csv` and `eng_sentences.tsv.bz2` (tatoeba.org/downloads) into `local/`; a join script then adds English where a link exists. Optional; the plan works without it.

## Model assignment
- A, B, E: no model, plain Node. Cheap and reproducible.
- C pass 1: Haiku. C pass 2: Sonnet. Opus not needed.
- Haiku alone for validity is not recommended; it is fine as a first filter.
