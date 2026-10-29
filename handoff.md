# Kongbuhey - Project Handoff & Architecture Guide

## 1. Project Overview & Vision
**Kongbuhey (공부해)** is an educational, client-side web application built with pure HTML, modern CSS, and Vanilla JavaScript (zero server, zero external dependencies, no build step). Its purpose is to train learners in Korean sentence construction, vocabulary recognition, honorific concord, and grammar patterns through dynamically generated, linguistically guaranteed sentences, paired with multi-voice speech synthesis.

### Development Roadmap
- **Phase 1 [COMPLETE]**: Core Morphology, Semantic Rule Matrix (Features F1–F11), Statutory Pronunciation Engine, and English/European-Readable Phoneme Transliteration.
- **Phase 1.5 [COMPLETE]**: Curriculum study text ingestion from `studytexts.js` (All 28 passages completed through `studytext162`; 0 curriculum gaps across entire corpus).
- **Phase 2 [ACTIVE / UPCOMING]**: Interactive Study & Flashcard UI with real-time passage decomposition, toggleable LUT tokens, and multi-voice TTS audio playback.
- **Phase 3 [FUTURE]**: Adaptive Quiz UI and pedagogical spaced-repetition trainer.

---

## 2. System Architecture & Core Modules

```
kongbuhey/
├── data.js                     # Single point of truth: 12-element schema & 2,006 language units
├── schema_summary.json         # High-speed cached taxonomies (POS, tags, domains, honorifics)
├── schema_analysis.js          # Taxonomy extractor & smart draft unit scaffolder (stem deduction & deduplication)
├── select.js                   # CLI/module: SQL-like query, update, insert & schema alteration
├── homonyms.js                 # Surface token resolver: direct units, LUT trees & confusable pairs
├── text_analyzer.js            # Passage analysis, morphological decomposition & curriculum gap detector
├── ingest.js                   # Unified 1-command ingestion pipeline (decomposition, scaffold, insert, test)
├── generator.js & exhaustive.js# Combinatorial phrase generators & Cartesian validator
├── test.js                     # 7-stage unified fast-failing master test suite (Stage 0: Static Hygiene & Linter)
├── index.html                  # Local-filesystem SPA entry point (Spreadsheet & Practice Set UI)
├── index.css                   # Stylesheet with distinct Default (data.js) vs Additional (DB) column palettes
├── db.js                       # Browser IndexedDB storage layer (+ LocalStorage/memory fallback)
├── spreadsheet.js              # Virtualized spreadsheet engine (sorting, row/col reorder, resize, hide, inline edit)
├── app.js                      # SPA controller, column/view modals, and Flashcard queue evaluator
├── tts_demo.html               # Interactive browser SpeechSynthesis testbed
├── korean.js                   # Public facade re-exporting core modules
├── korean/
│   ├── analyzer/
│   │   ├── indexer.js          # Fast in-memory indexing, semantic tag caching & stem classification
│   │   ├── particles.js        # Declarative particle specs, compound cliticization & batchim rules
│   │   ├── syntax_frame.js     # SyntaxFrame evaluator, ontology matching & pedagogical ambiguity
│   │   ├── verb_morphology.js  # Verb conjugation, irregular stems (ㅂ, ㄷ, 르, ㅡ) & adnominal participles
│   │   ├── token_analyzer.js   # Single-token morphological decomposition engine
│   │   ├── sentence_analyzer.js # Multi-word auxiliary constructions & clause predicate detection
│   │   ├── passage_analyzer.js # Pure JS passage decomposition & report formatting (browser-safe)
│   │   └── index.js            # Barrel export for analyzer subsystem
│   ├── core/
│   │   ├── primitives.js       # Unicode Hangul math (compose, decompose, batchim, vowel harmony)
│   │   ├── morphology.js       # Irregular verbs, particles, honorific infixes, copula sandhi
│   │   └── numbers.js          # Sino-Korean and Native Korean counting systems
│   ├── phonetics/
│   │   ├── pronunciation.js    # Standard Korean Pronunciation engine with statutory exceptions
│   │   └── english_phonemes.js # Latin phonetic transliteration engine for TTS voices
│   └── specs/
│       ├── verb_argument_specs.js # Declarative valency and case particles
│       ├── pronunciation_rules.js # Statutory exception maps, saisori, Sino-Korean compounds
│       └── honorific_specs.js  # Seniority, titles, suppletive verbs/nouns
├── test/                       # 14 isolated test suites (concord, phonetics, clausal, analyzer)
└── history/                    # Historical documentation, previous handoffs, migration scripts
```

### Key Modules Summary
1. **`data.js`**: 12-column schema array (`[Id, Korean, English, POS, SemanticTags, Disambiguation, ConjugationRules, Source, PriorityScore, FormalityLevel, HonorificRules, SemanticVector]`).
   - 2,006 units sequentially indexed 0..2005 with zero TODOs.
   - Houses all vocabulary, counting classifiers, honorific titles, origin/goal/static locatives, humble verbs, and clausal connectives.
2. **`korean.js` & `korean/`**:
   - `korean/phonetics/pronunciation.js`: Standard Korean Pronunciation (국립국어원 표준 발음법) implementing statutory exceptions (제10항/제11항 coda dissimilation, 제15항 substantive boundary liaison, 제16항 letter name liaison, 제20항 Sino-Korean non-lateralization, 제24항 passive/causative non-tensification, 제26항 reduplicated Hanja, 제28항 saisori, 제29항 compound [ㄴ] insertion).
   - `korean/phonetics/english_phonemes.js`: Transliterates Korean text into Latin phonetic script optimized for browser speech synthesizers (English, French, Polish).
   - `korean/core/morphology.js`: Robust agglutinative morphology engine resolving batchim allomorphs, vowel harmony, irregulars (ㄷ, ㅂ, ㅅ, 르, ㅡ, ㅎ, ㄹ), and copula contractions.
3. **`select.js`**: Query, filter, update, and insert units using familiar SQL-like syntax without loading all 2,006 rows into LLM context.
4. **`text_analyzer.js` & `korean/analyzer/`**: Decomposes natural Korean passages into constituent learning units, resolving homonyms and identifying curriculum gaps. Refactored into a modular, zero-dependency engine optimized for both Node CLI and interactive web browser execution (<5ms per passage).
5. **`ingest.js`**: Unified CLI pipeline automating passage decomposition, stem deduction hints, draft filtering, unit insertion, homonym synchronization, and test verification in one command.
6. **`tts_demo.html`**: Visual and auditory testbed for evaluating browser `window.speechSynthesis` voices with customizable styles (`natural`, `hyphenated`, `spaced`) and pitch/rate controls.
7. **`index.html`, `index.css`, `db.js`, `spreadsheet.js`, `app.js`**:
   - Local-filesystem (`file://`) compatible Single-Page Application (SPA) with separate JS and CSS modules.
   - Virtualized Spreadsheet UI displaying all 2,006 language units across all 13 default `data.js` columns (`Id`..`SyntaxFrame`) plus user-extensible Browser DB columns.
   - Pre-initialized with 6 Flashcard & Practice Set columns: `InSet` (`boolean`), `RecognitionScore` (`int`), `LongTermRecognition` (`enum{unknown, recognized, definitionKnown, knownByDefinition}`), `TimeStampLastCorrect` (`unixTime`), `TimeStampLastSeen` (`unixTime`), and `notes` (`string`).
   - Full persistence of additional column schemas, cell values, default column overrides, and view settings (`columnOrder`, `columnWidths`, `columnVisibility`, `rowOrder`, `sortState`) in `IndexedDB`.

---

## 3. Learnings & Architectural Constraints

### A. Single Point of Truth
- **Never hardcode Hangul strings** into JavaScript logic for semantic categorization, counting rules, honorific titles, or clausal relations. All linguistic knowledge lives in `data.js` expressed via `SemanticTags` or `SemanticVector`.

### B. LLM Context Window Discipline
- Never dump or read the full `data.js` array into context.
- Use `node select.js SELECT ...` (which defaults to compact TSV/JSONL) or `select.js --summary [n]` to inspect subsets.
- Use `node select.js UPDATE ... FROMFILE` or `node select.js INSERT FROMFILE` for data modifications.

### C. Web Runtime Readiness (Passage Analyzer)
- All modules under `korean/analyzer/` are pure JavaScript with zero Node dependencies (`fs`, `path`).
- Fast in-memory memoization caches combined semantic tags for instant $O(1)$ lookups, allowing learners to analyze their own homework or K-pop lyrics interactively in real time.

### D. Speech Synthesis (TTS) Transliteration Rules
- **No Double Consonants**: Double consonants (ㄲ, ㅆ, ㄸ, ㅃ, ㅉ) MUST be transliterated as single consonants (`k`, `s`, `t`, `p`, `j`). Western speech synthesizers treat double initial consonants as stutter bursts.
- **No Acronym Letter-Spelling**: Vowels in closed syllables must not include trailing `h` (`an` instead of `ahn`, `man` instead of `mahn`) to prevent synthesizers from spelling out syllables letter-by-letter.
- **Natural Word Joining**: Syllables must be joined into natural whole words (e.g. `Annyeong haseyo`) by default, preserving natural rhythm and preventing isolated initialisms or misplaced long diphthongs (such as `ny-` being pronounced as `/naɪ/`).
- **Liquid Gemination**: Consecutive liquids `ㄹ + ㄹ` (coda `ㄹ` + onset `ㄹ`) are pronounced as geminate lateral [lː] and must be transliterated as `ll` (e.g. `빨리` $\rightarrow$ `Palli`, `몰라` $\rightarrow$ `Molla`, `연락 [열락]` $\rightarrow$ `Yeollak`), avoiding the awkward cluster `lr`.
- **TTS Strategy Decision**:
  - Multi-voice non-Korean TTS experimentation is currently shelved. Non-Korean voices produce inconsistent phonological artifacts that are unsuitable for learner audio models without prohibitive per-voice tuning or external AI audio pipelines.
  - The standard Korean speech synthesis voice is native and high quality, serving as the official voice for the application.
  - The English/European Latin transliteration engine (`toEnglishPhonemes`, `transliterateSyllable`) remains active in the codebase to provide English-readable pronunciation guides and romanized reading aids.

### E. Declarative MWE Parsing Engine (`/*js:matcher*/` in `SyntaxFrame`)
- **Zero Hardcoded Grammatical Units in Code**: Analyzer modules must contain zero hardcoded grammar unit IDs. `unitById.get(\d+)` is enforced by Stage 0 linter via `MAGIC_GET_ALLOWLIST` (all analyzer files are guarded by default; only legacy `token_analyzer.js`, `verb_morphology.js`, and declarative `particles.js` are currently exempt pending upcoming refactors).
- **`SyntaxFrame` Reverse Parsing Specification**: Multi-word expressions (auxiliaries, bound noun constructions, compound connectives) encapsulate their lexical match logic directly in their `SyntaxFrame` column via an embedded JavaScript closure starting with `/*js:matcher*/`.
- **Dynamic Compilation & Fast Execution**:
  - `korean/analyzer/indexer.js` scans language units at index initialization, compiles all `/*js:matcher*/` functions via `new Function('ctx', ...)`, and registers them in `index.mweRules`.
  - Units tagged with `'verbal_ending'` (e.g. 49, 50, 336, 416, 459, 619, 645, 930, 1644, 1773) declare their surface forms in `SemanticVector.surface_forms` and are compiled into `index.verbalEndingRules` sorted by descending form length for greedy maximal munch matching.
  - The match context passed to each rule: `{ w1, w2, w3, cleanW2, cleanW3, prevW1, isAdnominalN, isAdnominalL, isInformal, rawWords, i, sentenceContext, index, unit }`.
  - The matcher returns an AST specification: `{ span, pattern, lexicalType, stemSuffix, grammar, extraParticle, parseTrailingParticle, parseW2Grammar, disambiguation, auxEndingTokenIndex }` or `null`.
  - `sentence_analyzer.js` delegates to `buildMweToken()` and `resolveAuxiliaryEnding()` to dynamically construct AST tokens for both browser and Node runtime, seamlessly arbitrating between single-token morphology and `index.verbalEndingRules`.

### F. Continuous Tooling & Process Evolution (Self-Improvement Imperative)
- **Codify Repetitive Work into Automation**: On long projects involving iterative tasks (such as curriculum passage ingestion, morphology debugging, schema curation, and linter enforcement), any process improvements codified into automated tooling and linting directly amplify agentic performance and reduce the time required to complete future tasks.
- **Task Meta-Awareness**: During every task, the working agent must maintain active awareness of the processing being done:
  - *What manual steps, cognitive overhead, or repetitive patterns are currently being incurred?*
  - *What information, CLI utility, scaffolder diagnostic, or static lint rule would make this processing easier, faster, and more robust?*
- **Scaffolder Auto-Snippet Generator**: `schema_analysis.js` and `ingest.js` export `generateVerbSuffixSnippet(morph)`. When reverse-stem deduction identifies an unparsed surface inflection of an existing dictionary verb, the tool immediately outputs a ready-to-paste `VERB_SUFFIX_RULES` JavaScript snippet with canonical morpheme IDs and deduced stem type.
- **Reflective Summary Considerations**: When summarizing completed work, proactively evaluate whether any improvements can be made to the process or tooling in the current environment (e.g., expanding magic number linters, creating whitelist mechanisms, adding diagnostic hints), and share those considerations with the developer.
- **Immediate Action on Process Improvements**: Tooling and process improvements do not need to be added as additional work items to `handoff.md` unless they are large enough to warrant a multi-run workflow. They are considered valuable enough by the developer that they will be addressed immediately, even expanding them into larger features that require more than one run if it makes sense.
- **Psychological Safety & Collaboration**: Striving for process improvements is not a high-pressure metric evaluating agent quality; rather, continuous self-improvement and iterative tooling refinement are valued as an essential, intrinsic part of our work together.

---

## 4. Current Status & Verification
- **Dataset**: 2,006 units (100% valid, 0 TODOs, sequential IDs 0..2005).
- **Homonym Dictionary**: 3,539 tokens mapped, 0 broken links.
- **Ingested Passages (Phase 1.5 - COMPLETE)**: `studytext12`, `studytext21`, `studytext22`, `studytext31`, `studytext41`, `studytext42`, `studytext51`, `studytext52`, `studytext61`, `studytext62`, `studytext71`, `studytext72`, `studytext81`, `studytext82`, `studytext101`, `studytext102`, `studytext111`, `studytext112`, `studytext121`, `studytext122`, `studytext131`, `studytext132`, `studytext141`, `studytext142`, `studytext151`, `studytext152`, `studytext161`, `studytext162` (100% recognized, 0 curriculum gaps across all 28 passages).
- **Master Test Suite (`node test.js`)**:
  - Stage 0: Code Quality & Static Hygiene [ PASS ] (Limits, browser purity, FK integrity, 0 magic IDs)
  - Stage 1: Schema & Data Integrity [ PASS ] (2,006 units, sequential IDs 0..2005)
  - Stage 2: Schema Taxonomy Sync [ PASS ] (9 POS, 667 tags, 128 domains)
  - Stage 3: Homonym Dictionary Sync [ PASS ] (3,539 tokens)
  - Stage 4: Exhaustive Sentence Generation [ PASS ] (3,403 sentences, 0 errors)
  - Stage 5: Text Analyzer Passage Check [ PASS ] (28 passages: 0 gaps)
  - Stage 6: Semantic & Honorific Concord [ PASS ] (14 suites, 6,216 assertions passed)
- **Modular Analyzer Suite (`node test/analyzer_modular_test.js`)**: 14/14 tests passed, browser-clean (zero Node dependencies).
- **Spreadsheet UI & DB Suite (`node test/spreadsheet_ui_test.js`)**: 52/52 assertions passed (virtual scrolling, IndexedDB persistence, custom/default columns, sorting, reordering, flashcard queue evaluation).

---

## 5. Next Steps

### Interactive Study & Flashcard Web App (Phase 2)
1. **Interactive Study Web Interface (`index.html`, `index.css`, `app.js`)**:
   - Modern, aesthetic client-side single-page app (dark theme, glassmorphism, responsive).
   - Real-time passage decomposition viewer showing sentence trees, vocabulary cards, grammar rules, and particle breakdowns.
   - Flashcard study mode with confidence scoring, spaced repetition, and vocabulary search.
   - Built-in Korean SpeechSynthesis (`window.speechSynthesis`) integration with audio playback.
2. **Additional Curricula / Study Texts**:
   - If further study texts (e.g. `studytext171`+) are introduced to `studytexts.js`, ingest via `node ingest.js <source>`.

