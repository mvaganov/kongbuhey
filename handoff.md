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
Contains the 10-element schema array for Language Units (Vocabulary and Grammar):
`[Korean, English, Part of Speech, [Semantic Tags], Disambiguation, Conjugation Rules/Formula, Source Variable, Formality Level, Honorific Rules, Semantic Vector, id]`

* **Semantic Tags:** Used to ensure sentences are structurally logical (e.g., `transitive_food` verbs only pair with `food` or `drink` nouns).
* **Semantic Vectors (NEW):** We have added a 10th element: a human-readable JSON string defining the semantic domain, polarity, and logical constraints of the word. E.g., `{"domain":"consume", "req":"food", "prod":"satiety", "polarity": 1}`. 
* **Current State:** 
    * All vocabulary and grammar from `words0.js` (SUOBI00 through SUOBI20) have been successfully imported and tested.
    * **100% of all language units in `data.js` (754 units, SUOBI00 through SUOBI20)** now have complete Semantic Tags and Semantic Vectors.
    * Recent completed batches: 
      - SUOBI17 (31 units): 100% coverage (31/31), 2,189 generated sentences validated with 0 errors.
      - SUOBI18 (27 units): 100% coverage (27/27), 1,142 generated sentences validated with 0 errors.
      - SUOBI19 (20 units): 100% coverage (20/20), 1,533 generated sentences validated with 0 errors.
      - SUOBI20 (23 units): 100% coverage (23/23), 762 generated sentences validated with 0 errors.
      - Fixed stray double-comma syntax elision in `data.js` and completed semantic vectors for 6 early grammar entries in SUOBI00/SUOBI02.
    * Morphology updates: 
      - Irregular pronoun contraction support (`누가를` -> `누구를`, `누가에게` -> `누구에게`, `누가는` -> `누구는`, `누가도` -> `누구도`).
      - Verb phrase expansions (`transitive_sports`, `transitive_transportation`, `transitive_place`).
      - Vowel contractions for `도` and `야` suffixes (`마셔야 돼요`, `해도 돼요`, `가도 돼요`, `봐야 돼요`).
      - Vowel contractions for `ㅐ`, `ㅓ`, `ㅔ` stems with `어`/`었` (`보내다` + `어요`/`었어요` -> `보내요`/`보냈어요`; `서다` + `어요`/`었어요` -> `서요`/`섰어요`).

### 2. `semantic_test.js` (Contextual Generation Proof-of-Concept)
A new script that proves the Semantic Vector architecture works. It contains a `generateSemanticSentence()` algorithm that:
*   Builds sentences sequentially, passing a `currentContext` object between clauses.
*   Enforces logical rules (e.g., `으/니까` forces a positive cause to yield a positive effect; `는데` forces contrast).
*   **Tunable Strictness:** Contains a `SemanticConfig` object that allows weighting the constraints (`0.0` = total random novelty, `1.0` = strict semantic adherence). This ensures the "mad-libs" absurdity is preserved, while specific grammars (like contrast) can have their strictness set to 1.0 to prevent complete nonsense.

### 3. `korean.js` (Morphology & Semantic Generation Engine)
A robust, centralized module that handles complex rules of Korean text manipulation and semantic generation:
*   Exports `applyMorphology(text)` (handles batchim, vowel harmony, honorific infixes, irregular verbs, contractions).
*   **Standard Korean Pronunciation Engine (`getPronunciation(text)`)**:
    - Converts Hangul strings into their official phonetic pronunciation (in Hangul), implementing the National Institute of Korean Language standard rules (국립국어원 표준 발음법):
    - **Liaison (연음 법칙)**: `한국어` -> `[한구거]`, `밥을` -> `[바블]`, `꽃이` -> `[꼬치]`.
    - **Double Batchim Simplification (자음군 단순화)**: `닭` -> `[닥]`, `값` -> `[갑]`, `앉다` -> `[안따]`; with vowel liaison: `닭이` -> `[달기]`, `값이` -> `[갑씨]`, `앉아요` -> `[안자요]`.
    - **Coda Neutralization (음절 끝소리 규칙)**: 7 representative codas [ㄱ, ㄴ, ㄷ, ㄹ, ㅁ, ㅂ, ㅇ] (`꽃` -> `[꼳]`, `옷` -> `[옫]`).
    - **Nasalization (비음화)**: `한국말` -> `[한궁말]`, `국물` -> `[궁물]`, `밥물` -> `[밤물]`, `먹습니다` -> `[먹씀니다]`, `갑니다` -> `[감니다]`, `독립` -> `[동닙]`, `심리` -> `[심니]`.
    - **Lateralization (유음화)**: `신라` -> `[실라]`, `설날` -> `[설랄]`, `칼날` -> `[칼랄]`.
    - **Tensification (경음화)**: `학교` -> `[학꾜]`, `식당` -> `[식땅]`, `약국` -> `[약꾹]`, `갈 거예요` -> `[갈 꺼예요]`.
    - **Aspiration & ㅎ Rules (격음화 및 ㅎ 탈락)**: `좋아요` -> `[조아]`, `많아요` -> `[마나]`, `도착해요` -> `[도차캐요]`, `깨끗해요` -> `[깨끄태요]`, `복잡해요` -> `[복짜패요]`.
    - **Palatalization (구개음화)**: `같이` -> `[가치]`, `굳이` -> `[구지]`, `끝이` -> `[끄치]`.
    - **Explicit Exceptions Reference**: For full documentation of statutory exceptions to the standard pronunciation rules (e.g., `밟다 [밥따]`, `맑게 [말께]`, substantive morpheme boundary liaison `밭 아래 [바다래]`, lateralization exceptions `생산량 [생산냥]`, saisori tensification, and 'ㄴ' insertion), see [pronunciation_exceptions.md](file:///d:/Users/mvaga/Developer/agentic/antigravity/kongbuhey/pronunciation_exceptions.md).
*   **Semantic Generation**: Houses `generateSemanticSentence(template, context)` and `SemanticConfig` migrated from `exhaustive.js`.
*   **Language Unit Tree (LUT)**: `generateSemanticSentence` produces `{ ko, context, tree }` tracking the hierarchical tree of language unit IDs / templates used to produce the sentence.
*   **Tree Ingestion / Reconstruction**: `reconstructFromLanguageUnitTree(tree)` ingests the LUT and reproduces the identical pre-morphology sentence string.
*   **Flattening & Compact Base64 Encoding**: `flattenLanguageUnitTree(tree)` extracts unique unit IDs into a 1D array; `encodeLanguageUnitIds(idsOrTree)` and `decodeLanguageUnitIds(token)` serialize these IDs into a URL-safe, compact Base64 token for copy/pasting and UI toggling.

### 4. `generator.js` & `exhaustive.js`
`generator.js` takes templates and randomly injects vocabulary. `exhaustive.js` runs Cartesian tests.
*   `exhaustive.js` supports `--tokens` (`--token`, `--lut`) CLI argument to print URL-safe Base64 LUT tokens inline next to generated sentences (e.g. `미국은 [CAAkAA]`).
*   `exhaustive.js` supports `--pronunciation` (`--pronounce`, `--pr`, `--pron`) CLI argument to optionally append standard Hangul pronunciation after every generated phrase (e.g. `미국은 [미구근]`, `먹습니다 [먹씀니다]`). Both flags can be used together (e.g. `미국은 [미구근] [CAAkAA]`).

---

## Next Steps for the Next Agent

1. **Continue Bulk Migration (`words1.js`)**: All units from `words0.js` (SUOBI00 through SUOBI20) are 100% complete and tagged with semantic vectors. Proceed to migrating language units from `words1.js`. The user enforces a very strict workflow: Migrate one or two sections at a time and IMMEDIATELY run `node exhaustive.js [SourceTag]` to validate the morphology.
2. **Pronunciation Rule Exceptions [DEFERRED]**: Consult [pronunciation_exceptions.md](file:///d:/Users/mvaga/Developer/agentic/antigravity/kongbuhey/pronunciation_exceptions.md) for explicit exceptions (substantive morpheme boundaries like `옷 안 [오단]`, verb stem dissimilations like `맑게 [말께]`, non-lateralizing Sino-Korean words like `생산량 [생산냥]`). Implement these in `korean.js` later when green-lit.
3. **Phase 2 (UI Development) [ON HOLD]**: Wait for the user to explicitly green-light moving to Phase 2. Once they do, build `index.html` and `index.css` with a premium, highly polished aesthetic (modern fonts, smooth micro-animations, rich colors, glassmorphism) tailored for the Web UI. Harness the LUT tokens to easily toggle/filter units in the study UI.
