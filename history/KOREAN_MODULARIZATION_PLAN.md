# Korean Language Engine Modularization & Refactoring Plan

## 1. Executive Summary & Objectives

`korean.js` has grown into a monolithic module containing **5,510 lines (223 KB)** spanning Hangul phonological decomposition, numeral synthesis, morphological conjugation, six major semantic concord engines (Features 6–11), template expansion, dynamic filter evaluation, and pronunciation assimilation.

### Core Objectives
1. **LLM & Human Ergonomics (< 350 lines/file)**: Decompose the monolith into focused, single-responsibility files that fit entirely inside an LLM's single-view context window without pagination, truncation, or slice-guessing.
2. **Unidirectional State Flow (`korean/state.js`)**: Encapsulate all 45+ dynamic `Set` and `Map` collections into a centralized state registry with explicit initialization (`initSemanticSets`) and reset (`resetSemanticSets`) lifecycles, eliminating circular dependency hazards and unpredictable mutation.
3. **Declarative Constant Registries (`korean/constants/`)**: Replace raw string literals for error codes (`'ERR_CLAUSE1_PAST_TENSE'`) and grammar tags (`'connective-concord-motion'`) with frozen dictionary enums (`ERROR_CODES`, `GRAMMAR_TAGS`) to eliminate LLM string hallucinations.
4. **Separation of Data Specs from Algorithmic Logic (`korean/specs/`)**: Move massive static argument configurations (`ACTION_VERB_SPECS`, `DESCRIPTIVE_VERB_SPECS`, etc.) and phonological rule tables out of execution files into pure declarative spec modules.
5. **Uniform Concord Validation Contract**: Standardize all concord validator functions across Features 6–11 to return the predictable interface `{ valid: boolean, errors: string[], errorCodes: string[] }`.
6. **100% Backwards Compatibility via Root Facade (`korean.js`)**: Maintain `korean.js` as a lightweight re-export barrel supporting both CommonJS (`module.exports`) and Browser environments (`window`), guaranteeing zero breaking changes for existing consumers (`generator.js`, `text_analyzer.js`) and 100% compliance with test source-code inspections (`assert(!koreanCode.includes(...))`).

---

## 2. Target Directory & File Architecture

```
korean/
├── ARCHITECTURE.md                  # Quick-reference map linking Features 1-11 to files
├── types.js                         # Standardized JSDoc typedefs (Clause, ConcordResult, etc.)
├── state.js                         # Centralized semantic state registry & lifecycle
├── constants/
│   ├── error_codes.js               # Frozen ERROR_CODES dictionary
│   └── tags.js                      # Frozen GRAMMAR_TAGS dictionary
├── core/
│   ├── primitives.js                # Hangul Jamo decompose, compose, batchim checks
│   ├── numbers.js                   # Sino-Korean and Native Korean numeral engines
│   └── morphology.js                # Particle attachment, regular conjugation & suppletion
├── specs/
│   ├── verb_argument_specs.js       # Action & Descriptive verb argument specifications
│   ├── pronunciation_rules.js       # Phonological assimilation & sound-change tables
│   └── irregular_rules.js           # Irregular conjugation paradigms
├── concord/
│   ├── classifier_concord.js        # Feature 6: Counter & classifier concordance
│   ├── spatial_concord.js           # Feature 7: Deictic & spatial concordance
│   ├── mood_concord.js              # Feature 8: Mood, modality & negation concordance
│   ├── adverbial_concord.js         # Feature 9: Adverbial & NPI concordance
│   ├── clausal_validation.js        # Feature 11: Connective parsing, mood detection & concord
│   └── clausal_generator.js         # Feature 11: Connective distractors, repair & quiz item synthesis
├── generation/
│   ├── template_engine.js           # Sentence template expansion & slot filling
│   └── semantic_generator.js        # Dynamic sentence synthesis pipelines
└── utils/
    ├── filter_evaluator.js          # Dynamic collocation filter parser & evaluator
    └── lut_serializer.js            # Lookup table export & diagnostic serialization
```

---

## 3. Detailed Line Mapping from Monolith to Modules

| Monolithic Line Range | Description | Target Module |
| :--- | :--- | :--- |
| `1 – 32` | Data module binding & `hasTag` utility | `korean/core/primitives.js` & `korean/state.js` |
| `33 – 75` | Hangul decomposition & composition primitives | `korean/core/primitives.js` |
| `76 – 171` | Dynamic semantic state initialization & sets | `korean/state.js` |
| `172 – 334` | Sino & Native numeral conversion algorithms | `korean/core/numbers.js` |
| `335 – 400` | Collocation filter parser & runner | `korean/utils/filter_evaluator.js` |
| `401 – 580` | Action & Descriptive verb argument specs | `korean/specs/verb_argument_specs.js` |
| `581 – 1957` | Verb phrase synthesis, honorific suppletion | `korean/core/morphology.js` |
| `1958 – 2285` | Classifier / Counter concord engine (F6) | `korean/concord/classifier_concord.js` |
| `2286 – 2503` | Deictic & Spatial concord engine (F7) | `korean/concord/spatial_concord.js` |
| `2504 – 2901` | Mood, Modality & Negation concord engine (F8) | `korean/concord/mood_concord.js` |
| `2902 – 3096` | Adverbial & NPI concord engine (F9) | `korean/concord/adverbial_concord.js` |
| `3097 – 3590` | Clausal connective validation & mood logic (F11) | `korean/concord/clausal_validation.js` |
| `3591 – 4160` | Clausal connective distractors & quiz synthesis (F11) | `korean/concord/clausal_generator.js` |
| `4161 – 4353` | Template expansion & slot-filling engine | `korean/generation/template_engine.js` |
| `4354 – 4687` | Semantic sentence generation pipeline | `korean/generation/semantic_generator.js` |
| `4688 – 4851` | LUT serialization & table formatting | `korean/utils/lut_serializer.js` |
| `4852 – 5133` | Particle attachment & morphology pipeline | `korean/core/morphology.js` |
| `5134 – 5301` | Pronunciation engine & sound-change rules | `korean/specs/pronunciation_rules.js` & `korean/core/morphology.js` |
| `5302 – 5510` | Export table & browser window bridge | Root `korean.js` facade |

---

## 4. Phased Execution Plan & Checklist

### Phase 1: Architecture Blueprint & Shared Foundation
- [x] **Task 1.1**: Create `korean/` folder structure (`constants/`, `core/`, `specs/`, `concord/`, `generation/`, `utils/`).
- [x] **Task 1.2**: Create `korean/types.js` with JSDoc type definitions (`ConcordValidationResult`, `Clause`, `ConnectiveSpec`).
- [x] **Task 1.3**: Create `korean/constants/error_codes.js` and `korean/constants/tags.js` with `Object.freeze({...})`.
- [x] **Task 1.4**: Create `korean/ARCHITECTURE.md` as an agent navigation index linking features F1–F11 to modules.
- [x] **Task 1.5**: Create `korean/state.js` centralizing all mutable `Map`/`Set` collections and lifecycle methods (`initSemanticSets`, `resetState`).
- [x] **Verification Gate 1**: Run baseline import checks to ensure state initialization operates cleanly without circular dependencies.

### Phase 2: Core Primitives, Numerals & Morphology Extraction
- [x] **Task 2.1**: Extract `korean/core/primitives.js` (Hangul decomposition, composition, batchim detection).
- [x] **Task 2.2**: Extract `korean/core/numbers.js` (Sino-Korean and Pure-Korean numeral generators).
- [x] **Task 2.3**: Extract `korean/specs/pronunciation_rules.js` (Sound change assimilation tables).
- [x] **Task 2.4**: Extract `korean/core/morphology.js` (Particle attachment, regular conjugation, honorific suppletion, pronunciation engine).
- [x] **Verification Gate 2**: Test primitives and morphology via node scratch validation.

### Phase 3: Specs & Utilities Extraction
- [x] **Task 3.1**: Extract `korean/specs/verb_argument_specs.js` (`ACTION_VERB_SPECS`, `DESCRIPTIVE_VERB_SPECS`).
- [x] **Task 3.2**: Extract `korean/utils/filter_evaluator.js` (`parseAndValidateCollocationFilter`).
- [x] **Task 3.3**: Extract `korean/utils/lut_serializer.js` (Lookup table serialization routines).
- [x] **Verification Gate 3**: Validate filter evaluation against sample expressions.

### Phase 4: Concord Engines Extraction (Features 6, 7, 8, 9)
- [x] **Task 4.1**: Extract `korean/concord/classifier_concord.js` (Feature 6: Classifier and counter concordance).
- [x] **Task 4.2**: Extract `korean/concord/spatial_concord.js` (Feature 7: Deictic and spatial concordance).
- [x] **Task 4.3**: Extract `korean/concord/mood_concord.js` (Feature 8: Mood, modality, and negation concordance).
- [x] **Task 4.4**: Extract `korean/concord/adverbial_concord.js` (Feature 9: Adverbial and NPI concordance).
- [x] **Verification Gate 4**: Standardize validator return contracts to include `{ valid, errors, errorCodes }`.

### Phase 5: Clausal Connectives & Generator Extraction (Feature 11)
- [x] **Task 5.1**: Extract `korean/concord/clausal_validation.js` (Dynamic connective indexing, mood detection, tense detection, clausal parsing, concord validation).
- [x] **Task 5.2**: Extract `korean/concord/clausal_generator.js` (Distractor generation, concord repair, clausal quiz item generation).
- [x] **Verification Gate 5**: Verify clausal concord tests pass against the modularized engine.

### Phase 6: Sentence & Template Generation Pipelines
- [x] **Task 6.1**: Extract `korean/generation/template_engine.js` (Template parsing and slot filling).
- [x] **Task 6.2**: Extract `korean/generation/semantic_generator.js` (High-level sentence generation workflows).
- [x] **Verification Gate 6**: Run exhaustive generation test to ensure sentence outputs match 100%.

### Phase 7: Root Barrel Facade Assembly & Comprehensive Verification
- [x] **Task 7.1**: Rewrite `korean.js` as the clean re-export facade aggregating all submodules.
- [x] **Task 7.2**: Ensure dual CommonJS (`module.exports`) and Browser (`window`) export compatibility.
- [x] **Task 7.3**: Verify absence of hardcoded Hangul literals in `korean.js` to satisfy AST/source-code inspection tests.
- [x] **Task 7.4**: Execute full test suite `node test.js` (all 6 stages, all 10 suites, 5,852 assertions passed).
- [x] **Task 7.5**: Verify clausal connectives with `node test/clausal_connective_test.js` (156 assertions passed).

---

## 5. Additional Notes & Implementation Safeguards

1. **Dual CommonJS / Browser Compatibility**:
   Every submodule must follow a clean module wrapper pattern:
   ```javascript
   let dataModule;
   if (typeof require !== 'undefined') {
     dataModule = require('../data.js'); // or appropriate relative path
   } else {
     dataModule = window;
   }
   ```
   And export via:
   ```javascript
   if (typeof window !== 'undefined') Object.assign(window, exportedMembers);
   if (typeof module !== 'undefined' && module.exports) module.exports = exportedMembers;
   ```
2. **Strict Test Inspection Safeguards**:
   Several test suites (`counter_concord_test.js`, `dynamic_semantic_sets_test.js`, `temporal_concord_test.js`, `spatial_concord_test.js`, `honorific_concord_test.js`) read `korean.js` as text and assert `!koreanCode.includes(...)` for hardcoded array/map literals. The root `korean.js` facade must contain **only declarative imports and re-exports**, guaranteeing that zero hardcoded Hangul strings exist at the root level.
3. **Idempotent State Initialization**:
   `state.initSemanticSets(data)` must be idempotent, allowing repeated invocations without duplicating map entries or corrupting sets.
4. **Uniform Error Structure**:
   All `validate*Concord` methods should guarantee `{ valid: boolean, errors: string[], errorCodes: string[] }`. This allows LLM agents writing future tests or generators to query `result.errorCodes.includes(ERROR_CODES.XYZ)` without parsing unstructured error messages.
