# Kongbuhey - Project Handoff Summary

## Project Overview
**Goal:** Build an educational web app (pure HTML/CSS/Vanilla JS, no server) to help users recognize Korean words and grammar. It generates random sentences from a structured vocabulary/grammar collection to test recognition.

**Development Phases:**
1. **[CURRENT] Core Engine & Data:** Develop the semantic schema, grammar formula system, and morphology engine.
2. **Flash-card UI:** Build a UI that generates random sentences and allows users to self-score.
3. **Quiz UI:** Build a more advanced quizzing interface.

---

## Current Architecture & Files

### 1. `data.js` (The Data Schema)
Contains the 12-element schema array for Language Units (Vocabulary and Grammar):
`[Id, Korean, English, Part of Speech, [Semantic Tags], Disambiguation, Conjugation Rules/Formula, Source Variable, PriorityScore, Formality Level, Honorific Rules, Semantic Vector]`

* **Id (Position 0):** Dedicated integer index (0..N).
* **PriorityScore (Position 8, after Source):** Quantized 1–5 learner priority scale informed by TOPIK I/II and NIKL frequency:
  - **Tier 1 (Top Essential)**: Top ~200 items (pronouns `저/제`, copulas, survival verbs `가다/오다/먹다`, greetings).
  - **Tier 2 (Core Beginner / TOPIK I Level 1)**: Top ~1,000 words (daily objects, question words, basic verbs/adjectives).
  - **Tier 3 (Elementary / TOPIK I Level 2)**: ~1,000–2,500 words (situational vocabulary, transport, weather, clothing).
  - **Tier 4 (Intermediate / TOPIK II Level 3–4)**: ~2,500–5,000 words (secondary vocabulary, specialized services).
  - **Tier 5 (Advanced / Niche)**: 5,000+ words (rare, cultural, or highly situational items).
* **Semantic Tags:** Array converted in-place to `Set<string>` via `addLearningUnit` for $O(1)$ grammar pairing checks.
* **Semantic Vectors:** JSON string defining domain, prerequisites, products, and polarity (e.g. `{"domain":"consume", "req":"food", "prod":"satiety", "polarity": 1}`).
* **File Layout & LLM Tooling**: Functional logic (`DATA_SCHEMA`, in-memory cache engine, `addLearningUnit`, `getWords`, `hasTag`) is positioned at the top of `data.js` (lines 1–150) above `KR_EN_languageUnits`. Agents must use `select.js` to query, count, or modify data rows rather than reading the data array directly.

* **Current Dataset Status:** 
  - **1,023 units (100% complete schema)**: Covers `SUOBI00` through `SUOBI20` from `words0.js`, plus `class2011` through `class2061` from `words1.js`.
  - All units have complete `Id`, `PriorityScore`, `SemanticTags`, and `SemanticVector` fields.
  - Number support: Full Sino-Korean (0..10,000) and Pure Korean (0..99 cardinal/attributive) generation with counter measure formulas validated via `number_test.js` (30,630 assertions, 100% pass).
  - Sentence validation: 100% pass rate with 0 errors across Cartesian test suites (`node exhaustive.js`).

### 2. `korean.js` (Morphology & Semantic Generation Engine)
A robust, centralized module that handles complex rules of Korean text manipulation and semantic generation:
*   Exports `applyMorphology(text)` (handles batchim, vowel harmony, honorific infixes, irregular verbs, contractions).
*   **Standard Korean Pronunciation Engine (`getPronunciation(text)`)**: Converts Hangul text into standard phonetic Hangul (국립국어원 표준 발음법), implementing liaison, double batchim simplification, 7-coda neutralization, nasalization, lateralization, tensification, aspiration / ㅎ-elimination, and palatalization. (See [pronunciation_exceptions.md](file:///d:/Users/mvaga/Developer/agentic/antigravity/kongbuhey/pronunciation_exceptions.md) for statutory exception references).
*   **Semantic Generation**: Houses `generateSemanticSentence(template, context)` and `SemanticConfig` migrated from `exhaustive.js`.
*   **Tunable Strictness:** Contains a `SemanticConfig` object that allows weighting the constraints (`0.0` = total random novelty, `1.0` = strict semantic adherence). This ensures the "mad-libs" absurdity is preserved, while specific grammars (like contrast) can have their strictness set to 1.0 to prevent complete nonsense.
*   **Language Unit Tree (LUT)**: `generateSemanticSentence` produces `{ ko, context, tree }` tracking the hierarchical tree of language unit IDs / templates used to produce the sentence.
*   **Tree Ingestion / Reconstruction**: `reconstructFromLanguageUnitTree(tree)` ingests the LUT and reproduces the identical pre-morphology sentence string.
*   **Flattening & Compact Base64 Encoding**: `flattenLanguageUnitTree(tree)` extracts unique unit IDs into a 1D array; `encodeLanguageUnitIds(idsOrTree)` and `decodeLanguageUnitIds(token)` serialize these IDs into a URL-safe, compact Base64 token for copy/pasting and UI toggling.

### 3. `generator.js` & `exhaustive.js`
`generator.js` takes templates and randomly injects vocabulary. `exhaustive.js` runs Cartesian tests.
*   `exhaustive.js` supports `--tokens` (`--token`, `--lut`) CLI argument to print URL-safe Base64 LUT tokens inline next to generated sentences (e.g. `미국은 [CAAkAA]`).
*   `exhaustive.js` supports `--pronunciation` (`--pronounce`, `--pr`, `--pron`) CLI argument to optionally append standard Hangul pronunciation after every generated phrase (e.g. `미국은 "미구근"`, `먹습니다 "먹씀니다"`). Both flags can be used together (e.g. `미국은 "미구근" [CAAkAA]`).

### 4. `select.js` (SQL-like Data Subsetting & Batch Modification Tool)
Pure JavaScript CLI and programmatic module for querying, exporting, and updating subsets of `KR_EN_languageUnits` in `data.js` without loading all 750+ units into LLM context:
*   **Querying (`SELECT`)**: Filter by columns (`Korean`, `English`, `Id`, `SemanticVector`, `SemanticTags`, `Source`, etc.), condition (`WHERE Source = 'SUOBI01' AND SemanticTags CONTAINS 'food'`), order, and limit (`LIMIT 10`). Output formats include `json` (default), `jsonl`, `tsv`, `table` (ASCII), and `raw` (JS array literal).
*   **File Update Workflow (`UPDATE ... FROMFILE`)**:
    *   Export subset: `node select.js SELECT Korean, English, Id, SemanticVector WHERE Source = 'SUOBI01' > output.txt`
    *   Agent/user performs targeted inspection or edits in `output.txt`.
    *   Update back to `data.js`: `node select.js UPDATE Korean, English, Id, SemanticVector FROMFILE output.txt`
    *   Also supports `--dry-run` to preview changes safely without writing.
*   **Inserting New Units & Parameterizable Source (`--source`, `-s`)**:
    *   Insert from file: `node select.js INSERT FROMFILE new_units.json --source class2012`
    *   Inline insert: `node select.js "INSERT INTO KR_EN_languageUnits (Korean, English, PartofSpeech) VALUES ('사과', 'apple', 'Noun')" --source class2012`
    *   **Source Parameterization & Default Timestamp (`::YYYYMMDD`)**:
        - Use `--source <name>` (or `-s <name>`) to explicitly assign a curriculum source tag to newly inserted units.
        - If `--source` is not provided on the CLI, any unit-level `Source` key specified in the input file will be preserved.
        - If no `Source` is specified anywhere (neither via CLI flag nor in the record), `select.js` automatically assigns a generated date-based source string prefixed by colons in the format `::YYYYMMDD` (e.g. `::20261016`).
*   **Schema Alteration (`ADD`)**:
    *   Dynamically add new columns to `DATA_SCHEMA` and all unit rows in `data.js`:
        - `node select.js "ADD PriorityScore 99 AFTER Source"`
        - `node select.js "ADD id 0 FIRST"`
    *   Supports positions `FIRST`, `LAST`, `AFTER <col>`, and `BEFORE <col>`, with support for string, numeric, boolean, or array default values and `--dry-run`.
*   **Context Window Efficiency & Dynamic Format Selection**:
    *   To optimize LLM context window token density, `select.js` defaults to tab-delimited (`tsv`) for low-complexity column sets and `json` for high-complexity queries when no explicit format is specified.
    *   **Complexity Scoring**:
        - Standard scalar columns (`Id`, `Korean`, `English`, `PartofSpeech`, `Disambiguation`, `Source`, `PriorityScore`, `FormalityLevel`, `HonorificRules`): 1 point each.
        - `SemanticTags` and `Conjugation` (arrays): 2 points each.
        - `SemanticVector` (nested JSON dictionary): 4 points.
        - `*` (all columns): sums to 17 points.
    *   Queries with score $\le 8$ default to `tsv` (e.g. `SELECT Id Korean English PriorityScore`), achieving ~60-75% token reduction over verbose JSON. Queries with score $> 8$ (or `*`) default to `json` for nested data clarity.
    *   Explicit `--format <fmt>` CLI flag or inline `FORMAT <fmt>` query keyword always overrides automatic detection.
*   **Safety & Comment Preservation**: In-place line-mapping modifies target rows directly without disturbing comments (such as `// Vocabulary from SUOBI01`), validates syntax via temporary files before committing, and automatically supports Windows UTF-16LE, UTF-8 BOM, and standard UTF-8 encodings. Section comment records (`{ "comment": "// ..." }`) in input files are also preserved during insertion without duplication.

### 5. `homonyms.js` (Korean Homonym, Stem & Phonetic Confusables Engine)
Maps surface Hangul tokens to:
1. **Direct Unit References (`number`)**: Direct vocabulary matches or base verb stems (e.g. `2` for `저`, `44` for `가`, `11` for `사람`).
2. **Language Unit Trees (`Array`)**: Canonical LUTs `[grammarId, [childId]]` representing morphological combinations yielding that surface token or portmanteau (e.g. `간`: `[[644, [44]], ...]` from `가다` + `-(으)ㄴ`; `저는`: `[[36, [2]]]` from `저` + `은/는`; `누가`: `[[96, [30]], 66]` from `누구` + `이/가`).
3. **Phonetic Minimal Pairs (`string` prefixed with `_`)**: Phonologically adjacent syllables generated via Jamo voice-onset-time, aspiration, tenseness, vowel proximity, and coda neutralization (e.g. `_물` for `문`, `_적다` for `작다`, `_아요` for `어요`).
   - **Mutual & Vocabulary-Grounded**: Confusable `_neighbor` entries are strictly pruned unless the neighbor actually exists as an active entry in the dictionary.
   - **Dynamic Insertion Linking**: During `addHomonymEntry`, any new token checks for phonetic confusion against existing entries, automatically linking them bidirectionally. Eliminates phantom false positives and minimizes token footprint.

**Key Capabilities & CLI**:
*   **Incremental Batch Updates**: `node homonyms.js update [--source S1,S2] [--ids start..end] [--clean] [--dry-run]`
*   **Reverse Ingestion & Paragraph Parsing**: `node homonyms.js parse "<paragraph>"` breaks down real Korean text into matching lexical units, LUT trees, and prefixes/suffixes.
*   **Token Confusability Scoring**: Weighted score based on $(N_{\text{direct}} \times 1.0) + (N_{\text{LUT}} \times 1.2) + (N_{\text{phonetic}} \times 0.8)$.
*   **Rankings & Analytics**:
    *   `node homonyms.js top [10]`: Displays the most confusable tokens.
    *   `node homonyms.js least [10]`: Displays the least confusable tokens.
    *   `node homonyms.js stats`: Summary metrics of total tokens, direct units, LUTs, and phonetic links.
*   **Dataset Status**: 100% of `data.js` vocabulary ingested (1,886 tokens, 2,181 mapped entries: 1,261 direct units, 714 LUT combinations, and 206 mutual phonetic links). 0 orphan links. Exhaustive tests pass with 0 errors.

---

## Next Steps for the Next Agent

1. **Continue Bulk Migration (`words1.js`)**: Units from `words0.js` and `class2011` through `class2061` from `words1.js` are 100% complete with full schema and semantic vectors. Proceed to migrating `class2062` onward. Migrate one or two sections at a time using `select.js INSERT FROMFILE` and IMMEDIATELY run `node exhaustive.js [SourceTag]` to validate the morphology.
2. **Pronunciation Rule Exceptions [DEFERRED]**: Consult [pronunciation_exceptions.md](file:///d:/Users/mvaga/Developer/agentic/antigravity/kongbuhey/pronunciation_exceptions.md) for explicit exceptions (substantive morpheme boundaries like `옷 안 [오단]`, verb stem dissimilations like `맑게 [말께]`, non-lateralizing Sino-Korean words like `생산량 [생산냥]`). Implement these in `korean.js` later when green-lit.
3. **Phase 2 (UI Development) [ON HOLD]**: Wait for the user to explicitly green-light moving to Phase 2. Once they do, build `index.html` and `index.css` with a premium, highly polished aesthetic (modern fonts, smooth micro-animations, rich colors, glassmorphism) tailored for the Web UI. Harness the LUT tokens to easily toggle/filter units in the study UI.
