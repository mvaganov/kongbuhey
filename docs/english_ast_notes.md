# English AST: notes for future work

These are notes for a later project: better English gloss for the Korean the app generates, ideally produced from the sentence AST
instead of hand-written frames. They are observations and ideas collected while building the English frames (2026-11-24). They are
not a plan or a design. Whoever picks up the work should turn them into one.

## Where things stand
- Free (AST) sentences: `korean/translation/natural_realizer.js` builds natural English from the `SentenceAST`, with subject-verb
  agreement, irregular verbs from `SemanticData.en`, articles, and clause order for 2-clause sentences.
- Verified sentences: until 2026-11-24 their `enNatural` was the slot glosses joined with ` · `. Now each template can carry a
  hand-written English frame (`VERIFIED_TEMPLATE_SCHEMA.English`, filled by `renderEnglishFrame`). Templates without one still fall
  back to the ` · ` word list, and fc2 keeps those out of the sentence quiz (`glossOk`).
- The owner wants one English generator in the end. He deferred the AST upgrade until the verified-sentence tag-loosening work has
  settled the grammar handling, because two English generators are a lot for an agent to keep in view.

## Measured gaps of the AST realizer against the verified set (547 templates, 2026-11-24)
- No relative clauses (adnominal `-(으)ㄴ/는/ㄹ` + noun): 192 templates.
- At most 2 clauses (`realizeNaturalEnglish` only looks at `clauses[0]` and `clauses[1]`): 173 templates have 3 or more predicates.
- No quoted speech (`-다고/-라고/-자고/-냐고/-달라고`): 40 templates.
- Bound nouns (것, 수, 때 ...): 14 templates.
- 230 templates (42%) have none of these. Even those hit gaps in the connective list: it has no `-다가`, `-거나`, `-고 나서`, and
  it maps `-는데` to ", and".
- Connective and modality detection works by substring matching on the grammar unit's Korean (`gKo.includes("야 하다")`),
  not by a unit property in `data.js`. That is fragile, and CLAUDE.md wants linguistic knowledge in data tags/SemanticData.

## Observations from writing frames (batch 1)
- Degree adverbs need an English form for use before adjectives. 너무 is "too" before an adjective but "too much" after a verb.
  제일 + adjective is a superlative ("the oldest", "most expensive"), and 더 is a comparative ("older", "more expensive").
  `SemanticData.en` already carries verb forms (`base`, `past` ...); adverbs could carry forms the same way. In batch 1 this was the
  biggest source of bad variants ("too much hot", "most old").
- Dictionary glosses are often the wrong form for running English: 좀 was "little" (it should be "a little"), and 현재 was "present"
  (it should be "currently"). Fixed 2026-11-24 for 좀, 조금, 너무 and 현재. The realizer reads `SemanticData.en.nat`/`lit` before the
  English column, so a gloss fix has to change both. A pass over all the gloss data would likely find more.
- Copula agreement: "the gloves is" happens because English number isn't known. Korean nouns don't mark number, so the English side
  needs its own count data (`SemanticData.en.count` exists for some nouns: "u" = uncountable). Plural-only nouns (pants, glasses,
  clothes) need a mark too. Frame writers worked around it with "as for X, it's".
- Articles: `withEnglishArticle` leaves mass nouns bare even when "the" is wanted ("how is weather"). The frames patch this with a
  heuristic (a noun `pluralizeEnglishNoun` leaves unchanged is mass or plural-only). Real count data would replace the heuristic.
- `getVerbEnForms` on a descriptive verb builds past forms by rule ("tireded"). Adjectives need "was/were + adj", not an inflected form.
- Pool mismatch shows up in the English first: an adjective slot that also admits action verbs (어울리다 "match") gives "It's very match".
  The Korean may be fine while the English shows the mismatch, so the English side can expose pool problems.
- Location nouns differ in how English attaches them: "on the right", "on the other side" (건너편 already has "the"), "under" (밑),
  "in the middle" (가운데). They need a stored preposition/article pattern, not a gloss.
- Korean drops subjects. Frame writers choose I/you/we/it from context. An AST realizer needs a default-subject rule, plus the
  speech act (a question is addressed to "you").
- Endings with no English word: politeness levels and -(으)시- add nothing. -네요 reads as "Oh, ..."/"wow", -지요 as "..., right?",
  -는데요 as softening/background ("Actually, ...", "..., though"). These are discourse choices, not translations.

## Ideas worth keeping
- Frames as fixtures: once frames cover most templates, they make a test set for the AST realizer. For each template's original
  sentence, compare the AST English with the frame (owner-reviewed English). The owner can judge English but not Korean, so English
  fixtures are something he can write and check himself.
- The verified generator already returns an `ast` field (built for validation). It may be close to what the realizer needs, or it could
  be completed so verified sentences go through the same realizer.
- A migration could be gradual: per template, use the AST English when it matches the frame for the original sentence, and keep the
  frame otherwise.
- Frames and tag loosening are linked: a slot that starts to vary needs a placeholder (`vs_tune en-check` enforces this in the
  suite). An AST English generator would remove that coupling.
