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
* **Smart Grammar Formulas:** Grammar structures are defined as string templates with "smart tokens" that the engine parses. Example: `["{VP_AVst}아/어서 {Clause}"]` or `["{VP_AVst}으/니까 {Clause}"]` or `["{AVst}으/ㄹ 거예요"]`.
* **Current State:** **All vocabulary and grammar from `words0.js` (SUOBI00 through SUOBI20) have been successfully imported and exhaustively tested!**

### 2. `korean.js` (The Morphology Engine)
A robust, centralized module that handles complex rules of Korean text manipulation. It exports `applyMorphology(text)`, which handles:
* Resolves batchim-dependent particles (`은/는`, `이/가`, `을/를`).
* Resolves consonant morphing (`습니다/ㅂ니다`).
* **Vowel Harmony (`아/어`, `았/었`)**: Parses `아/어` in strings, analyzes the medial vowel of the preceding character, and injects `아` or `어` correctly.
* **'으' Insertion (`으/니까`, `으/세요`)**: Parses `으/` and conditionally injects `으` if the preceding character has a batchim.
* **Consonant-Merging (`으/ㄹ`, `으/ㄴ`)**: Perfectly handles future tense and relative clause markers by dropping `으` and merging the `ㄹ` or `ㄴ` into the preceding batchim when necessary (e.g., `먹다` -> `먹을`, `가다` -> `갈`).
* **Honorifics (`으/십니다`, `으/셔요`)**: Accurately infixes honorific markers based on batchim.
* **Advanced Irregular Verbs**: Seamlessly handles `l_irregular` (ㄹ), `b_irregular` (ㅂ), `d_irregular` (ㄷ), `eu_irregular` (으), and `reu_irregular` (르) across all grammar paradigms.
* **Vowel Contractions:** Applies final spelling contractions (`가아요 -> 가요`, `하여요 -> 해요`, `마시어요 -> 마셔요`).

### 3. `generator.js` (The Random Sentence Generator)
Takes templates and randomly injects vocabulary from `data.js` based on semantic tags, then pipes the raw output through `korean.js` to finalize the conjugations.

### 4. `exhaustive.js` (The Test Suite)
A test script that pulls non-nested formulas directly from `data.js` and exhaustively computes the Cartesian product of all possible Noun/Verb combinations. It accepts an argument to test specific sources (e.g., `node exhaustive.js SUOBI15`).

---

## Next Steps for the Next Agent

The user explicitly stated: *"I have more changes I want to make to the system before we start the user interface for the flashcard app, including some more exhaustive tests."*

1. **Continue Bulk Migration (`words1.js`)**: All units from `words0.js` are migrated. The next major step is to continue migrating the units from `words1.js`. The user enforces a very strict workflow: **Migrate one or two sections at a time and IMMEDIATELY run `node exhaustive.js [SourceTag]` to validate the morphology.**
2. **Expand the Exhaustive Tests**: The user mentioned wanting to perform more exhaustive tests. Acknowledge this and ask how they'd like to structure those tests.
3. **Phase 2 (UI Development) [ON HOLD]**: Wait for the user to explicitly green-light moving to Phase 2. Once they do, build `index.html` and `index.css` with a premium, highly polished aesthetic (modern fonts, smooth micro-animations, rich colors, glassmorphism) tailored for the Web UI.
