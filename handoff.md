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
Contains the finalized 10-element schema array for Language Units (Vocabulary and Grammar):
`[Korean, English, Part of Speech, [Semantic Tags], Disambiguation, Conjugation Rules/Formula, Source Variable, Formality Level, Honorific Rules, Semantic Vector]`

* **Semantic Tags:** Used to ensure sentences are structurally logical (e.g., `transitive_food` verbs only pair with `food` or `drink` nouns).
* **Semantic Vectors (NEW):** We have added a 10th element: a human-readable JSON string defining the semantic domain, polarity, and logical constraints of the word. E.g., `{"domain":"consume", "req":"food", "prod":"satiety", "polarity": 1}`. 
* **Current State:** 
    * All vocabulary and grammar from `words0.js` (SUOBI00 through SUOBI20) have been successfully imported and tested.
    * **128 words (all `devtest` items + 81 new words)** have been patched with explicit Semantic Vectors to test the contextual generation constraints.

### 2. `semantic_test.js` (Contextual Generation Proof-of-Concept)
A new script that proves the Semantic Vector architecture works. It contains a `generateSemanticSentence()` algorithm that:
*   Builds sentences sequentially, passing a `currentContext` object between clauses.
*   Enforces logical rules (e.g., `으/니까` forces a positive cause to yield a positive effect; `는데` forces contrast).
*   **Tunable Strictness:** Contains a `SemanticConfig` object that allows weighting the constraints (`0.0` = total random novelty, `1.0` = strict semantic adherence). This ensures the "mad-libs" absurdity is preserved, while specific grammars (like contrast) can have their strictness set to 1.0 to prevent complete nonsense.

### 3. `korean.js` (The Morphology Engine)
A robust, centralized module that handles complex rules of Korean text manipulation. It exports `applyMorphology(text)`. (Handles batchim, vowel harmony, honorific infixes, irregular verbs, and contractions).

### 4. `generator.js` & `exhaustive.js`
`generator.js` takes templates and randomly injects vocabulary. `exhaustive.js` runs Cartesian tests.

---

## Next Steps for the Next Agent

1. **Batch Process Remaining Semantic Vectors**: There are roughly 500 language units left in `data.js` that need Semantic Vectors. Write a script to batch-process them or continue the manual processing in chunks. The emerging schema involves 4 types: Nouns (Entities), Action Verbs (Events), Descriptive Verbs (States), and Grammar (Logic Gates).
2. **Integrate Semantic Logic into `korean.js`**: Migrate the logic from `semantic_test.js` (including the `SemanticConfig` tunability and Noun identification constraints for the Copula `{N}이/예요`) directly into the main `generator.js` or `korean.js` so it affects all native sentence generation.
3. **Continue Bulk Migration (`words1.js`)**: Once semantic vectors are stable, continue migrating the units from `words1.js`. The user enforces a very strict workflow: Migrate one or two sections at a time and IMMEDIATELY run `node exhaustive.js [SourceTag]` to validate the morphology.
4. **Phase 2 (UI Development) [ON HOLD]**: Wait for the user to explicitly green-light moving to Phase 2. Once they do, build `index.html` and `index.css` with a premium, highly polished aesthetic (modern fonts, smooth micro-animations, rich colors, glassmorphism) tailored for the Web UI.
