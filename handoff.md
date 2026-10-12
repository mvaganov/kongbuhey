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
    * **250+ units (SUOBI00 through SUOBI10, plus devtest items)** have been tagged with Semantic Tags and Semantic Vectors.
    * Recent completed batches: SUOBI08 (31 units), SUOBI09 (50 units), and SUOBI10 (44 units) — totaling 125 units verified with 100% unit coverage and clean passes across all exhaustive and validation tests.
    * Morphology updates: irregular pronoun contraction support (`누가를` -> `누구를`, `누가에게` -> `누구에게`, `누가는` -> `누구는`, `누가도` -> `누구도`), verb phrase sports/transportation/place expansions (`transitive_sports`, `transitive_transportation`, `transitive_place`).

### 2. `semantic_test.js` (Contextual Generation Proof-of-Concept)
A new script that proves the Semantic Vector architecture works. It contains a `generateSemanticSentence()` algorithm that:
*   Builds sentences sequentially, passing a `currentContext` object between clauses.
*   Enforces logical rules (e.g., `으/니까` forces a positive cause to yield a positive effect; `는데` forces contrast).
*   **Tunable Strictness:** Contains a `SemanticConfig` object that allows weighting the constraints (`0.0` = total random novelty, `1.0` = strict semantic adherence). This ensures the "mad-libs" absurdity is preserved, while specific grammars (like contrast) can have their strictness set to 1.0 to prevent complete nonsense.

### 3. `korean.js` (Morphology & Semantic Generation Engine)
A robust, centralized module that handles complex rules of Korean text manipulation and semantic generation:
*   Exports `applyMorphology(text)` (handles batchim, vowel harmony, honorific infixes, irregular verbs, contractions).
*   **Semantic Generation**: Houses `generateSemanticSentence(template, context)` and `SemanticConfig` migrated from `exhaustive.js`.
*   **Language Unit Tree (LUT)**: `generateSemanticSentence` produces `{ ko, context, tree }` tracking the hierarchical tree of language unit IDs / templates used to produce the sentence.
*   **Tree Ingestion / Reconstruction**: `reconstructFromLanguageUnitTree(tree)` ingests the LUT and reproduces the identical pre-morphology sentence string.
*   **Flattening & Compact Base64 Encoding**: `flattenLanguageUnitTree(tree)` extracts unique unit IDs into a 1D array; `encodeLanguageUnitIds(idsOrTree)` and `decodeLanguageUnitIds(token)` serialize these IDs into a URL-safe, compact Base64 token for copy/pasting and UI toggling.

### 4. `generator.js` & `exhaustive.js`
`generator.js` takes templates and randomly injects vocabulary. `exhaustive.js` runs Cartesian tests.
*   `exhaustive.js` supports `--tokens` (`--token`, `--lut`) CLI argument to print URL-safe Base64 LUT tokens inline next to generated sentences (e.g. `미국은 [CAAkAA]`).

---

## Next Steps for the Next Agent

1. **Batch Process Remaining Semantic Vectors**: There are roughly 500 language units left in `data.js` that need Semantic Vectors. Write a script to batch-process them or continue the manual processing in chunks. The emerging schema involves 4 types: Nouns (Entities), Action Verbs (Events), Descriptive Verbs (States), and Grammar (Logic Gates).
2. **Continue Bulk Migration (`words1.js`)**: Once semantic vectors are stable, continue migrating the units from `words1.js`. The user enforces a very strict workflow: Migrate one or two sections at a time and IMMEDIATELY run `node exhaustive.js [SourceTag]` to validate the morphology.
3. **Phase 2 (UI Development) [ON HOLD]**: Wait for the user to explicitly green-light moving to Phase 2. Once they do, build `index.html` and `index.css` with a premium, highly polished aesthetic (modern fonts, smooth micro-animations, rich colors, glassmorphism) tailored for the Web UI. Harness the LUT tokens to easily toggle/filter units in the study UI.
