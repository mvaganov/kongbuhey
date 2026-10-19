# Kongbuhey - Project Handoff Summary

## Project Overview
**Goal:** Build an educational web app (pure HTML/CSS/Vanilla JS, no server) to help users recognize Korean words and grammar. It generates random sentences from a structured vocabulary/grammar collection to test recognition.

**Development Phases:**
1. **[CURRENT] Core Engine & Semantic Rules:** Develop the semantic schema, grammar formula system, morphology engine, and fine-grained semantic rule matrix to guarantee valid phrase generation.
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
  - **1,603 units (100% complete curriculum from words0.js and words1.js)**: Covers `SUOBI00` through `SUOBI20` from `words0.js`, and all 40 classes (`class2011` through `class2202`) from `words1.js`.
  - All units have complete `Id`, `PriorityScore`, `SemanticTags`, and `SemanticVector` fields.
  - Number support: Full Sino-Korean (0..10,000) and Pure Korean (0..99 cardinal/attributive) generation with counter measure formulas validated via `number_test.js` (30,630 assertions, 100% pass).
  - Sentence validation: 100% pass rate with 0 errors across Cartesian test suites (`node exhaustive.js`, 3,234 generated sentences).

### 2. `korean.js` (Morphology, Pronunciation & Semantic Generation Engine)
A robust, centralized module that handles complex rules of Korean text manipulation, standard pronunciation, and semantic generation (refactored for high token and syntactic density: 1,280 lines / 59.6 KB, down from 1,935 lines / 83.6 KB, a ~34% reduction in line count and ~29% in file size with 100% backward compatibility):
*   **Core Primitives & Unicode Math Hoisting**: Shared primitives (`decomposeHangul`, `composeHangul`, `hasBatchim`, `getStem`, `getVowelHarmony`, and `setFinal(char, finalOffset)`) centralized at top of file, replacing repetitive Unicode arithmetic and magic offsets across morphology and phonetics.
*   **Declarative Verb Argument Architecture**: Unified `ACTION_VERB_SPECS`, `DESCRIPTIVE_VERB_SPECS`, `findNounForVerbTag`, and `attachParticle` eliminate repetitive `if...else` boilerplate across phrase builders, semantic expansions, and token option generators.
*   **Standard Korean Pronunciation Engine (`getPronunciation(text)`)**: Converts Hangul text into standard phonetic Hangul (국립국어원 표준 발음법) using declarative lookup tables (`DOUBLE_CODA_LIAISON`, `DOUBLE_CODA_SIMPLIFY`, `H_ONSET_MAP`, `NASAL_CODA`, `K/T/P_SOUNDS`) for liaison, double batchim simplification, 7-coda neutralization, nasalization, lateralization, tensification, aspiration / ㅎ-elimination, and palatalization. (See [pronunciation_exceptions.md](file:///d:/Users/mvaga/Developer/agentic/antigravity/kongbuhey/pronunciation_exceptions.md) for statutory exception references).
*   **Morphology Engine (`applyMorphology(text)`)**: Handles batchim, vowel harmony, honorific infixes, irregular verbs (ㄷ, ㅂ, ㅅ, 르, ㅡ, ㅎ, ㄹ), and contractions with concise regular expressions and `PARTICLE_PAIRS`.
*   **Semantic Generation**: Houses `generateSemanticSentence(template, context)` and `SemanticConfig` migrated from `exhaustive.js`.
*   **Tunable Strictness:** Contains a `SemanticConfig` object that allows weighting constraints (`0.0` = total random novelty, `1.0` = strict semantic adherence).
*   **Language Unit Tree (LUT)**: `generateSemanticSentence` produces `{ ko, context, tree }` tracking the hierarchical tree of language unit IDs / templates used to produce the sentence.
*   **Tree Ingestion / Reconstruction**: `reconstructFromLanguageUnitTree(tree)` ingests the LUT and reproduces the identical pre-morphology sentence string.
*   **Flattening & Compact Base64 Encoding**: `flattenLanguageUnitTree(tree)` extracts unique unit IDs into a 1D array; `encodeLanguageUnitIds(idsOrTree)` and `decodeLanguageUnitIds(token)` serialize these IDs into a URL-safe, compact Base64 token for copy/pasting and UI toggling.

### 3. `generator.js` & `exhaustive.js`
`generator.js` takes templates and randomly injects vocabulary. `exhaustive.js` runs Cartesian tests.
*   `exhaustive.js` supports `--tokens` (`--token`, `--lut`) CLI argument to print URL-safe Base64 LUT tokens inline next to generated sentences (e.g. `미국은 [CAAkAA]`).
*   `exhaustive.js` supports `--pronunciation` (`--pronounce`, `--pr`, `--pron`) CLI argument to optionally append standard Hangul pronunciation after every generated phrase (e.g. `미국은 "미구근"`, `먹습니다 "먹씀니다"`). Both flags can be used together (e.g. `미국은 "미구근" [CAAkAA]`).
*   `exhaustive.js` supports `--id <id|id1,id2>` and `--range <start>-<end>` (or `<start>..<end>`) to isolate grammar templates and vocabulary testing to specific language units or ID ranges (e.g. `node exhaustive.js --range 0-200`).

### 4. `select.js` (SQL-like Data Subsetting & Batch Modification Tool)
Pure JavaScript CLI and programmatic module for querying, exporting, and updating subsets of `KR_EN_languageUnits` in `data.js` without loading all 750+ units into LLM context:
*   **Querying (`SELECT`)**: Filter by columns (`Korean`, `English`, `Id`, `SemanticVector`, `SemanticTags`, `Source`, etc.), condition (`WHERE Source = 'SUOBI01' AND SemanticTags CONTAINS 'food'`), order, and limit (`LIMIT 10`). Output formats include `jsonl` (default for complex queries), `json` (only if explicitly specified), `tsv`, `table` (ASCII), and `raw` (JS array literal).
*   **Nested JSON Path Queries (`sv.<field>`)**: Directly query and project JSON properties within `SemanticVector` using dot notation (e.g. `WHERE sv.domain = 'age'`, `WHERE sv.traits CONTAINS 'inanimate'`, `WHERE sv.TODO != ''`). Projected scalar properties are weighted lightly, automatically defaulting to clean TSV format.
*   **`--summary [n]` Output Truncation**: Truncates large query result sets to the top $n$ rows (default: 5) and prints an informative suffix `... [{n} more rows truncated]`.
*   **Quiet by Default with `-v` / `--verbose`**: Mutating operations (`INSERT`, `UPDATE`, `DELETE`, `ADD`) execute quietly by default, outputting only on error unless `-v` or `--verbose` is provided.
*   **Automatic Schema Sync**: Mutating operations automatically trigger `schema_analysis.updateSchemaSummary()` to keep schema taxonomies synchronized.
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
    *   Queries with complexity score $\le 8$ default to `tsv` (e.g. `SELECT Id Korean English PriorityScore`), achieving ~60-75% token reduction over verbose JSON.
    *   Queries with score $> 8$ (or `*`) default to `jsonl` (one line per row) to preserve structured data while eliminating whitespace overhead. Multi-line `json` is used only if explicitly requested (`--format json` or `FORMAT json`).

### 5. `schema_analysis.js` (Taxonomy Extractor & Unit Draft Scaffolder)
Analyzes `data.js` and provides canonical taxonomies and draft unit scaffolding:
*   **Canonical Taxonomies**:
    - **Parts of Speech**: 9 canonical values (`Action Verb`, `Adverb`, `Descriptive Verb`, `Determiner`, `Exclamation`, `Grammar`, `Noun`, `Number`, `Pronoun`).
    - **SemanticTags**: All 266+ unique tags with frequency distributions.
    - **Honorific Rules**: All 39 unique rules in the dataset.
    - **SemanticVector Domains & Keys**: 107 domains, 41 vector properties, and allowed values.
*   **Taxonomy Cache**: Persists summary to `schema_summary.json` for rapid, zero-overhead lookup without re-parsing `data.js`.
*   **Automatic Cache Updates**: Hooked into both `select.js` and `homonyms.js` mutations to auto-update whenever the dataset changes.
*   **Draft Unit Scaffolder (`scaffoldUnit(korean, raw, source)`)**: Generates pre-populated JSON unit drafts with recommended POS, `PriorityScore`, `SyntaxFrame`, default `SemanticTags`, and valid `SemanticVector` templates.

### 6. `homonyms.js` (Korean Homonym, Stem & Phonetic Confusables Engine)
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
*   **Auto-Update Hook**: Triggers `schema_analysis.updateSchemaSummary()` automatically upon writing dictionary updates.
*   **Rankings & Analytics**:
    *   `node homonyms.js top [10]`: Displays the most confusable tokens.
    *   `node homonyms.js least [10]`: Displays the least confusable tokens.
    *   `node homonyms.js stats`: Summary metrics of total tokens, direct units, LUTs, and phonetic links.
*   **Dataset Status**: 100% of `data.js` vocabulary ingested (2,949 tokens, 3,520+ mapped entries). 0 orphan links. Exhaustive tests pass with 0 errors across 3,403 generated sentences.

### 7. `text_analyzer.js` (Passage Ingestion, Morphological Decomposition & Disambiguation Engine)
Automated analysis pipeline that decomposes real Korean passages from `studytexts.js` into constituent language units, resolves homonyms and polysemous morphemes, generates student study checklists, and identifies curriculum gaps:
*   **Declarative Verb Suffix Architecture**: Replaced hardcoded `if (word.endsWith(...))` branching with a centralized, declarative table (`VERB_SUFFIX_RULES`, 47 rules) sorted by syllable length descending. Handles connective suffixes (`-고`, `-며`, `-지만`), honorific infixes (`-(으)시-`), past tense markers (`-았/었-`), formal/informal endings, nominalizers (`-(으)ㅁ`, `-기`), and causative/passive forms cleanly.
*   **Zero Hard-Coded Word Statements**: All homonym disambiguation (e.g. `저` pronoun vs. determiner; `이` determiner vs. numeral vs. noun; `하고` particle vs. verb connective; `-(으)ㄴ 후에` / `-(으)ㄴ 지` bound grammar vs. free nouns; `일` noun vs. number; `분` honorific person vs. minute) is driven declaratively by `SyntaxFrame` metadata (Column 12 in `data.js`) and surrounding semantic tags.
*   **Automated Draft Unit Generation**: When missing vocabulary or grammar patterns are detected in a passage, `text_analyzer.js` automatically creates `scratch/new_units_<source>.json` using `schema_analysis.scaffoldUnit()` pre-populated with schema fields, ready for quick human/agent review and insertion.
*   **Intentional Pedagogical Ambiguity**: When surrounding linguistic context admits multiple valid interpretations (e.g. `한국의` possessive vs. origin), the engine flags `intentional_ambiguity: true` and generates an instructive explanation for the learner rather than arbitrarily picking one.
*   **Small-Batch Workflow**: Prioritizes per-passage inspection over bulk curriculum scanning to catch bugs and edge cases immediately.

### 8. `test.js` (Unified Fast-Failing Test Suite)
Single command that executes all repository test suites with fail-fast behavior:
`node test.js [source] [-v]`
*   **Stage 1: Schema & Data Integrity**: Verifies strictly sequential IDs (0..N-1), schema array length (12 elements), non-empty values, valid POS types, valid priority scores (1–5), and valid JSON semantic vectors (`domain` or `logic`).
*   **Stage 2: Schema Taxonomy Sync**: Validates freshness and structure of `schema_summary.json`.
*   **Stage 3: Homonym Dictionary Sync**: Validates token count, ensures 0 broken `_neighbor` links.
*   **Stage 4: Exhaustive Sentence Generation**: Runs `exhaustive.js` in an isolated subprocess; asserts 100% unit coverage and 0 morphology/LUT errors across all generated sentences.
*   **Stage 5: Text Analyzer Passage Check**: Validates ingested study texts (`studytext12`, `studytext21`, `studytext22`, or custom source) ensuring 0 gaps.
*   **Performance**: Completes entire 5-stage validation in ~3.7 seconds.

---

## Current Study Texts Ingested (Phase 1.5)
*   **`studytext12`**: 24 units ingested (IDs 1603–1626). 100% recognized, 0 gaps.
*   **`studytext21`**: 21 units ingested (IDs 1627–1647). 100% recognized, 21 homonyms resolved, 0 gaps.
*   **`studytext22`**: 9 units ingested (IDs 1648–1656). 100% recognized, 16 homonyms resolved, 0 gaps.

---

## Next Steps for the Next Agent

1. **Semantic Rules & Phrase Generation Engine Implementation [CURRENT HIGHEST PRIORITY]**:
   - **Foundational Project Value**:
     The ultimate value of Kongbuhey relies on correct random phrase generation to provide authentic context for learning Korean grammar and vocabulary. Following the 100% completion of the curriculum audit (all 1,657 units standardized, 1,429 units cataloged with `sv.TODO`), developing these semantic rules is the highest priority for the project.
   - **Specification & Technical Roadmap**:
     The complete architectural plan, linguistic specifications, and testing strategies are codified in [`SEMANTIC_RULES_ROADMAP.md`](file:///d:/Users/mvaga/Developer/agentic/antigravity/kongbuhey/SEMANTIC_RULES_ROADMAP.md).
   - **Phased Implementation Summary**:
     - **Phase A (Collocations & Descriptive Selection — F1, F2, F10)**:
       - Refactor `ACTION_VERB_SPECS` and `DESCRIPTIVE_VERB_SPECS` in `korean.js` into fine-grained selectional tables (apparel wear verbs, intake, transit, sports/instruments, daily activity).
       - Add pronoun case sandhi (`누가`, `이게/그게/저게`, `이건/그건/저건`, `뭘/뭐가`) to `applyMorphology`.
       - Build `test/collocation_test.js` to assert 100% semantic compatibility between predicates and arguments.
     - **Phase B (Case & Spatio-Temporal Concord — F3, F5, F7, F9)**:
       - Enhance `attachParticle` for locative duality (`-에` vs `-에서`) and dative animacy (`-에게` vs `-에` vs `-께`).
       - Implement temporal tense harmony between adverbs and grammar formulas in `generateSemanticSentence`.
       - Implement spatial relational phrase generator (`[Noun + 의] + [Position] + 에/에서`).
       - Split `{Adv}` into `{Adv_Degree}`, `{Adv_Manner}`, and `{Adv_Discourse}`.
       - Build `test/particle_concord_test.js` and `test/temporal_concord_test.js`.
     - **Phase C (Honorifics & Classifier Matrices — F4, F6, F8)**:
       - Implement subject/dative honorific concord and lexical suppletions (`자다` $\rightarrow$ `주무시다`, `밥` $\rightarrow$ `진지`, `주다` $\rightarrow$ `드리다`).
       - Enforce noun-to-counter measure word matrix (`개`, `명`, `마리`, `권`, `병`, `잔`, `대`, `켤레`, `벌`, `송이`).
       - Restrict imperative/propositive moods strictly to Action Verbs.
       - Build `test/honorific_concord_test.js` and `test/counter_concord_test.js`.
     - **Phase D (Continuous Test Integration)**:
       - Add Stage 6 (Semantic & Collocation Validity) into `test.js` to permanently guard against semantic regressions in CI.

2. **Prioritize Ingestion of Remaining Study Texts (Phase 1.5)**:
   - Ingest next passage: **`studytext31`**, followed by `studytext41`, `studytext42`, `studytext51`, `studytext52`, `studytext61`, `studytext62`, `studytext63`, `studytext71`, `studytext72`, `studytext81`, `studytext82`, `studytext101`, `studytext102`, `studytext111`, `studytext112`, `studytext121`, `studytext122`.
   - **Accelerated Ingestion Workflow**:
     1. Run `node text_analyzer.js studytext31` -> review analysis and auto-generated `scratch/new_units_studytext31.json`.
     2. Refine definitions, `SyntaxFrame` (if homonym collision), and tags in the generated scaffold.
     3. Insert units via `node select.js INSERT FROMFILE scratch/new_units_studytext31.json --source studytext31`.
     4. Update homonyms via `node homonyms.js update --source studytext31`.
     5. Run single verification command: `node test.js studytext31` (fails fast in < 4s if any issue arises).
   - **Constraint**: Work strictly in small batches per passage; DO NOT run curriculum-wide pre-scanners.

3. **Pronunciation Engine Completion & English-Phoneme TTS Engine**:
   - **Pronunciation Exception Rules**: Complete the substantive morpheme boundary liaison rules (`옷 안 [오단]`), verb stem coda dissimilations (`맑게 [말께]`), and non-lateralizing Sino-Korean compounds (`생산량 [생산냥]`) documented in [pronunciation_exceptions.md](file:///d:/Users/mvaga/Developer/agentic/antigravity/kongbuhey/pronunciation_exceptions.md).
   - **English-Text Style Phoneme Pronunciation**: Extend the pronunciation engine in `korean.js` to generate English-text style phonetic phoneme respellings / pseudo-phoneme approximations specifically tailored for standard English text-to-speech engines.
   - **TTS Voice Diversity Target**: Enable the numerous high-quality English voices available in the browser's `window.speechSynthesis` API to speak Korean phrases naturally and cleanly. This will provide rich voice variety, different accents, and diverse auditory stimuli to dramatically improve learner listening comprehension and phonological discrimination.

4. **Phase 2 (UI Development & Study Mode Integration)**:
   - Build the interactive web application (`index.html`, `index.css`) with premium aesthetics (modern typography, dark mode, glassmorphism, responsive layout, smooth micro-animations).
   - Integrate `text_analyzer.js` directly into the UI to provide live passage decomposition, interactive study checklists, toggleable LUT tokens, homonym disambiguation tooltips, and multi-voice English-phoneme TTS audio playback.
