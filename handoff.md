# Kongbuhey - Project Handoff & Architecture Guide

## 1. Project Overview & Vision
**Kongbuhey (공부해)** is an educational, client-side web application built with pure HTML, modern CSS, and Vanilla JavaScript (zero server, zero external dependencies, no build step). Its purpose is to train learners in Korean sentence construction, vocabulary recognition, honorific concord, and grammar patterns through dynamically generated, linguistically guaranteed sentences, paired with multi-voice speech synthesis.

### Development Roadmap
- **Phase 1 [COMPLETE]**: Core Morphology, Semantic Rule Matrix (Features F1–F11), Statutory Pronunciation Engine, and English/European-Readable Phoneme Transliteration.
- **Phase 1.5 [ACTIVE]**: Curriculum study text ingestion from `studytexts.js` (`studytext12`, `studytext21`, `studytext22` completed; `studytext31` next).
- **Phase 2 [UPCOMING]**: Interactive Study & Flashcard UI with real-time passage decomposition, toggleable LUT tokens, and multi-voice TTS audio playback.
- **Phase 3 [FUTURE]**: Adaptive Quiz UI and pedagogical spaced-repetition trainer.

---

## 2. System Architecture & Core Modules

```
kongbuhey/
├── data.js                     # Single point of truth: 12-element schema & 1,747 language units
├── schema_summary.json         # High-speed cached taxonomies (POS, tags, domains, honorifics)
├── schema_analysis.js          # Taxonomy extractor & draft unit scaffolder
├── select.js                   # CLI/module: SQL-like query, update, insert & schema alteration
├── homonyms.js                 # Surface token resolver: direct units, LUT trees & confusable pairs
├── text_analyzer.js            # Passage analysis, morphological decomposition & curriculum gap detector
├── generator.js & exhaustive.js# Combinatorial phrase generators & Cartesian validator
├── test.js                     # 6-stage unified fast-failing master test suite
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
├── test/                       # 13 isolated test suites (concord, phonetics, clausal, analyzer)
└── history/                    # Historical documentation, previous handoffs, migration scripts
```

### Key Modules Summary
1. **`data.js`**: 12-column schema array (`[Id, Korean, English, POS, SemanticTags, Disambiguation, ConjugationRules, Source, PriorityScore, FormalityLevel, HonorificRules, SemanticVector]`).
   - 1,747 units sequentially indexed 0..1746 with zero TODOs.
   - Houses all vocabulary, counting classifiers, honorific titles, origin/goal/static locatives, humble verbs, and clausal connectives.
2. **`korean.js` & `korean/`**:
   - `korean/phonetics/pronunciation.js`: Standard Korean Pronunciation (국립국어원 표준 발음법) implementing statutory exceptions (제10항/제11항 coda dissimilation, 제15항 substantive boundary liaison, 제16항 letter name liaison, 제20항 Sino-Korean non-lateralization, 제24항 passive/causative non-tensification, 제26항 reduplicated Hanja, 제28항 saisori, 제29항 compound [ㄴ] insertion).
   - `korean/phonetics/english_phonemes.js`: Transliterates Korean text into Latin phonetic script optimized for browser speech synthesizers (English, French, Polish).
   - `korean/core/morphology.js`: Robust agglutinative morphology engine resolving batchim allomorphs, vowel harmony, irregulars (ㄷ, ㅂ, ㅅ, 르, ㅡ, ㅎ, ㄹ), and copula contractions.
3. **`select.js`**: Query, filter, update, and insert units using familiar SQL-like syntax without loading all 1,747 rows into LLM context.
4. **`text_analyzer.js` & `korean/analyzer/`**: Decomposes natural Korean passages into constituent learning units, resolving homonyms and identifying curriculum gaps. Refactored into a modular, zero-dependency engine optimized for both Node CLI and interactive web browser execution (<5ms per passage).
5. **`tts_demo.html`**: Visual and auditory testbed for evaluating browser `window.speechSynthesis` voices with customizable styles (`natural`, `hyphenated`, `spaced`) and pitch/rate controls.

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
- **Zero Hardcoded Grammatical Units in Code**: `korean/analyzer/sentence_analyzer.js` and `token_analyzer.js` do not contain hardcoded grammar unit IDs or special-case procedural branch trees.
- **`SyntaxFrame` Reverse Parsing Specification**: Multi-word expressions (auxiliaries, bound noun constructions, compound connectives) encapsulate their lexical match logic directly in their `SyntaxFrame` column via an embedded JavaScript closure starting with `/*js:matcher*/`.
- **Dynamic Compilation & Fast Execution**:
  - `korean/analyzer/indexer.js` scans language units at index initialization, compiles all `/*js:matcher*/` functions via `new Function('ctx', ...)`, and registers them in `index.mweRules`.
  - The match context passed to each rule: `{ w1, w2, w3, cleanW2, cleanW3, prevW1, isAdnominalN, isAdnominalL, isInformal, rawWords, i, sentenceContext, index, unit }`.
  - The matcher returns an AST specification: `{ span, pattern, lexicalType, stemSuffix, grammar, extraParticle, parseTrailingParticle, parseW2Grammar, disambiguation }` or `null`.
  - `sentence_analyzer.js` delegates to `buildMweToken()` and `resolveAuxiliaryEnding()` to dynamically construct AST tokens for both browser and Node runtime.

---

## 4. Current Status & Verification
- **Dataset**: 1,796 units (100% valid, 0 TODOs, sequential IDs 0..1795).
- **Homonym Dictionary**: 3,158 tokens mapped, 0 broken links.
- **Ingested Passages (Phase 1.5)**: `studytext12`, `studytext21`, `studytext22`, `studytext31`, `studytext41`, `studytext42`, `studytext51`, `studytext52` (100% recognized, 0 curriculum gaps).
- **Master Test Suite (`node test.js`)**:
  - Stage 1: Schema & Data Integrity [ PASS ] (1,796 units, sequential IDs 0..1795)
  - Stage 2: Schema Taxonomy Sync [ PASS ] (9 POS, 605 tags, 113 domains)
  - Stage 3: Homonym Dictionary Sync [ PASS ] (3,158 tokens)
  - Stage 4: Exhaustive Sentence Generation [ PASS ] (6,322 sentences, 0 errors)
  - Stage 5: Text Analyzer Passage Check [ PASS ] (studytext12, 21, 22, 31, 41, 42, 51, 52: 0 gaps)
  - Stage 6: Semantic & Honorific Concord [ PASS ] (13 suites, 5,926 assertions passed)
- **Modular Analyzer Suite (`node test/analyzer_modular_test.js`)**: 9/9 tests passed, browser-clean (zero Node dependencies).

---

## 5. Immediate Next Steps

### 1. Ingest Next Study Text: `studytext61` (Phase 1.5)
Follow the standardized small-batch ingestion workflow:
1. Run passage decomposition:
   ```bash
   node text_analyzer.js studytext61
   ```
2. Review `scratch/new_units_studytext61.json` generated by `schema_analysis.scaffoldUnit()`. Refine definitions, POS, tags, and `SyntaxFrame`.
3. Insert new units:
   ```bash
   node select.js INSERT FROMFILE scratch/new_units_studytext61.json --source studytext61
   ```
4. Update homonym index:
   ```bash
   node homonyms.js update --source studytext61
   ```
5. Run fast-failing verification:
   ```bash
   node test.js studytext61
   ```

### 2. Interactive Study & Flashcard Web App (Phase 2)
- Build the core study UI (`index.html`, `index.css`) utilizing rich modern aesthetics (glassmorphism, clean typography, dark theme, fluid animations).
- Provide live sentence generation, self-scoring flashcards, toggleable LUT tokens, and native Korean TTS audio playback.

