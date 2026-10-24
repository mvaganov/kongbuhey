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
├── test/                       # 12 isolated test suites (concord, phonetics, clausal, collocations)
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
4. **`text_analyzer.js`**: Decomposes natural Korean passages into constituent learning units, resolving homonyms and generating draft units for missing curriculum items.
5. **`tts_demo.html`**: Visual and auditory testbed for evaluating browser `window.speechSynthesis` voices with customizable styles (`natural`, `hyphenated`, `spaced`) and pitch/rate controls.

---

## 3. Learnings & Architectural Constraints

### A. Single Point of Truth
- **Never hardcode Hangul strings** into JavaScript logic for semantic categorization, counting rules, honorific titles, or clausal relations. All linguistic knowledge lives in `data.js` expressed via `SemanticTags` or `SemanticVector`.

### B. LLM Context Window Discipline
- Never dump or read the full `data.js` array into context.
- Use `node select.js SELECT ...` (which defaults to compact TSV/JSONL) or `select.js --summary [n]` to inspect subsets.
- Use `node select.js UPDATE ... FROMFILE` or `node select.js INSERT FROMFILE` for data modifications.

### C. Speech Synthesis (TTS) Transliteration Rules
- **No Double Consonants**: Double consonants (ㄲ, ㅆ, ㄸ, ㅃ, ㅉ) MUST be transliterated as single consonants (`k`, `s`, `t`, `p`, `j`). Western speech synthesizers treat double initial consonants as stutter bursts.
- **No Acronym Letter-Spelling**: Vowels in closed syllables must not include trailing `h` (`an` instead of `ahn`, `man` instead of `mahn`) to prevent synthesizers from spelling out syllables letter-by-letter.
- **Natural Word Joining**: Syllables must be joined into natural whole words (e.g. `Annyeong haseyo`) by default, preserving natural rhythm and preventing isolated initialisms or misplaced long diphthongs (such as `ny-` being pronounced as `/naɪ/`).
- **Liquid Gemination**: Consecutive liquids `ㄹ + ㄹ` (coda `ㄹ` + onset `ㄹ`) are pronounced as geminate lateral [lː] and must be transliterated as `ll` (e.g. `빨리` $\rightarrow$ `Palli`, `몰라` $\rightarrow$ `Molla`, `연락 [열락]` $\rightarrow$ `Yeollak`), avoiding the awkward cluster `lr`.
- **TTS Strategy Decision**:
  - Multi-voice non-Korean TTS experimentation is currently shelved. Non-Korean voices produce inconsistent phonological artifacts that are unsuitable for learner audio models without prohibitive per-voice tuning or external AI audio pipelines.
  - The standard Korean speech synthesis voice is native and high quality, serving as the official voice for the application.
  - The English/European Latin transliteration engine (`toEnglishPhonemes`, `transliterateSyllable`) remains active in the codebase to provide English-readable pronunciation guides and romanized reading aids.

---

## 4. Current Status & Verification
- **Dataset**: 1,759 units (100% valid, 0 TODOs, sequential IDs 0..1758).
- **Homonym Dictionary**: 3,098 tokens mapped, 0 broken links.
- **Ingested Passages (Phase 1.5)**: `studytext12`, `studytext21`, `studytext22`, `studytext31` (100% recognized, 0 curriculum gaps).
- **Master Test Suite (`node test.js`)**:
  - Stage 1: Schema & Data Integrity [ PASS ] (1,759 units)
  - Stage 2: Schema Taxonomy Sync [ PASS ] (9 POS, 601 tags, 111 domains)
  - Stage 3: Homonym Dictionary Sync [ PASS ] (3,098 tokens)
  - Stage 4: Exhaustive Sentence Generation [ PASS ] (6,280 sentences, 0 errors)
  - Stage 5: Text Analyzer Passage Check [ PASS ] (studytext12, 21, 22, 31: 0 gaps)
  - Stage 6: Semantic & Honorific Concord [ PASS ] (12 suites, 5,886 assertions passed)

---

## 5. Immediate Next Steps

### 1. Ingest Next Study Text: `studytext41` (Phase 1.5)
Follow the standardized small-batch ingestion workflow:
1. Run passage decomposition:
   ```bash
   node text_analyzer.js studytext41
   ```
2. Review `scratch/new_units_studytext41.json` generated by `schema_analysis.scaffoldUnit()`. Refine definitions, POS, tags, and `SyntaxFrame`.
3. Insert new units:
   ```bash
   node select.js INSERT FROMFILE scratch/new_units_studytext41.json --source studytext41
   ```
4. Update homonym index:
   ```bash
   node homonyms.js update --source studytext41
   ```
5. Run fast-failing verification:
   ```bash
   node test.js studytext41
   ```

### 2. Interactive Study & Flashcard Web App (Phase 2)
- Build the core study UI (`index.html`, `index.css`) utilizing rich modern aesthetics (glassmorphism, clean typography, dark theme, fluid animations).
- Provide live sentence generation, self-scoring flashcards, toggleable LUT tokens, and native Korean TTS audio playback.
