# Kongbuhey - Project Handoff Summary

## Project Overview
**Goal:** Build an educational web app (pure HTML/CSS/Vanilla JS, no server) to help users recognize Korean words and grammar. It generates random sentences (often delightfully absurd but grammatically flawless) from a structured vocabulary/grammar collection to test recognition.

**Development Phases:**
1. **[CURRENT] Core Engine & Data:** Develop the semantic schema, grammar formula system, and morphology engine.
2. **Flash-card UI:** Build a UI that generates random sentences and allows users to self-score.
3. **Quiz UI:** Build a more advanced quizzing interface.

---

## Current Architecture & Files

### 1. `data.js` (The Data Schema)
Contains the finalized 9-element schema array for Language Units (Vocabulary and Grammar):
`[Korean, English, Part of Speech, [Semantic Tags], Disambiguation, Conjugation Rules/Formula, Source Variable, Formality Level, Honorific Rules]`

* **Semantic Tags:** Used heavily to ensure sentences are structurally logical (e.g., `transitive_food` verbs only pair with `food` or `drink` nouns; `person` nouns pair with `descriptive_person` verbs).
* **Smart Grammar Formulas:** Grammar structures are defined as string templates with "smart tokens" that the engine parses. Example: `["{VP_AVst}아/어서 {Clause}"]` or `["{VP_AVst}으/니까 {Clause}"]`.

### 2. `korean.js` (The Morphology Engine)
A centralized module that handles all the complex rules of Korean text manipulation. It exports `applyMorphology(text)`, which:
* Resolves batchim-dependent particles (`은/는`, `이/가`, `을/를`).
* Resolves consonant morphing (`습니다/ㅂ니다`).
* **Vowel Harmony:** Parses `아/어` in strings, analyzes the medial vowel of the preceding character, and correctly injects `아` or `어`.
* **'으' Insertion:** Parses `으/` (e.g. `으/니까`) and conditionally injects `으` if the preceding character has a batchim.
* **Vowel Contractions:** Applies final spelling contractions (`가아요 -> 가요`, `하여요 -> 해요`, `마시어요 -> 마셔요`).

### 3. `generator.js` (The Random Sentence Generator)
Takes templates (e.g., `{N:person}이/가 밥을 {AVst:transitive_food}어요`) and randomly injects vocabulary from `data.js` based on semantic tags, then pipes the raw output through `korean.js` to finalize the conjugations.

### 4. `exhaustive.js` (The Test Suite)
A test script that pulls non-nested formulas directly from `data.js` and exhaustively computes the Cartesian product of all possible Noun/Verb combinations. We use this to expose and fix bugs in `korean.js`.

---

## Next Steps for the Next Agent

The semantic engine and morphological conjugator are validated. We are ready to proceed with:

1. **Bulk Data Migration:** The user has raw data in `words0.js` and `words1.js`. The next step is to write a script (or manually convert) the rest of these raw entries into the `data.js` 9-element schema, paying careful attention to semantic tags.
2. **Phase 2 (UI Development):** Begin drafting `index.html` and `index.css` to build the actual flashcard application that imports and utilizes `generator.js`. Remember the user wants a **premium, highly polished aesthetic** (modern fonts, smooth micro-animations, rich colors) for the UI.
