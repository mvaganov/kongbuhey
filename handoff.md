# Kongbuhey (공부해): Handoff

Updated 2026-11-22. Rules, commands and the flag-review loop are in `CLAUDE.md`; how the system is built and why is in `docs/architecture.md`; this file is state and priorities.

## State
**Flashcards (`flashcards/`, the study app, untested on a phone):** localStorage state `kb.fc.v1.*` (deck, notes, opts, flags, stats).
- Cards mode: tap to reveal; 5 self-scores (-2..+2) reposition the card; Back undoes; Remove keeps the score. Example-sentence units
  link to their cards. Markdown notes, reverse mode, flag export (same JSON as the webapp), backup/restore, sort by last seen/last correct
  ("seen" = shown as a card or used in a spoken sentence; "correct" = positive score).
- Units mode (`units.js`): mobile port of the webapp's Unit Selector.
- Deck rules: `deck.js` (`test/flashcard_deck_test.js`). UI flows: `test/browser_load_test.js`. The deck canvas animation is untested (jsdom).
- Deploy: repo Settings > Pages > branch `main`, `/ (root)`; open `https://mvaganov.github.io/kongbuhey/flashcards/`. Scores are per browser.

**fc2 (`fc2/`, the study game, slices 1-3 built 2026-11-16/17; slice 3 untested on a phone):** keeps `flashcards/` as the comparison.
- Module layout, storage layers and debug scenes: `docs/architecture.md` section 4. All tuning numbers are the `T` table at the top of `game.js`.
- Loop: Shop pull unlocks units in course order (class packs first, PriorityScore low to high: easiest first) -> learn in-session until
  RecognitionScore 3 -> the unit "grows" and earns idle coins -> ripe after an interval set by LongTermRecognition
  (4h / 20h / 3d / 7d) -> harvest (the spaced review) banks progress to the next tier -> wilts after 3 intervals (miss = lose a tier,
  capped at 20 at-risk units, the rest are dormant). Coins never depend on the self-score picked.
- Trials: the harvest that would promote a unit is an objective question, not a self-scored card. By tier: Korean -> meaning (4 choices),
  listening -> meaning (6, falls back to reading without speech synthesis), meaning -> Korean (6). Pass promotes and pays a bonus; fail sends
  the unit back to learning and the trial returns when it is next ripe. Distractors: unlocked units of the same part of speech first.
- Daily quests (3 per local day plus a chest) and Ascend (bank 10+ new stars as seals: +2% coins each, resets coins and upgrades).
- First launch imports the old flashcards state (`kb.fc.v1.*`).
- Sentence test: examples are built from unlocked units only by default (Menu option). Each example has a 🎯 test: forward = Korean enlarged + 4
  English choices, reverse = English + 4 Korean sentences; distractors are other sentences from the same units. Right = 2 "Correct" answers for every unlocked
  unit in the sentence and 3 for the card's unit (units waiting on a promotion trial are skipped; a second answer on a ripe unit pays as practice), with a
  sentence-clear show (coin and XP particles, learning pill counting up, a sliding chip per unit; `bonusShow` in `app.js`); wrong = "Missed it" for the card.
- Number sound board: Lv 0 shop unlock (10 냥), hear 0-12 native or Sino-Korean, tap it; a tapped number is spoken in the question's system (native 0 = 공).
- Listening trial: unlocked by play, not by a setting. A unit must reach ★ (meaning trial passed), be harvested once at ★ (20 h interval), then be ripe again:
  the next review is the listening trial (about 2 days after earning ★). Needs the "Listening trials" option and speech synthesis.
- Sentence-test wrong answers share the sentence's nouns where possible; when the card's unit is a noun it never appears in a wrong answer
  and each wrong answer swaps in a different noun. Opening a test marks lastSeen for every unit shown. Quizzes are pre-built while the card
  is read, and taps are ignored for 450 ms after a quiz opens. Wrong answers do not follow the sentence queue (variety).
- Sentence queue: "☰ Queue" beside "New examples" shows the verified sentences that fit the card, ready first, reorderable.
- Recovery and testing tools: Menu > Data has Recover progress, Force save (write + read back), backup/restore (flags export separately).
  Map > tap a unit > 🛠 Edit values sets score, star, harvests to next star and the timestamps. Map cheat mode: tap = +1 score, "Mature all"
  moves every timestamp back N minutes. The Map offers "Found saved progress" when another copy has far more units.
- Not built: a free-play sound board, undo, Units picker.
- Deploy: same Pages site, `https://mvaganov.github.io/kongbuhey/fc2/`.

**Webapp (`webapp/`):** Unit Selector & Details, spreadsheet over all units, practice sets, text importer, Verified Sentences (544
templates), Decks view. Its Practice tab is legacy (Gemini-built), superseded by `flashcards/`.

**Known gaps:**
- Browser vs Node differ on unit 400 (너무) in ~2 of 39 sampled batches: the browser emits "너무 + action verb", Node does not. Cause
  unknown. Check InSet/tier state, then diff generator inputs.
- String-level validators (`validateAdverbConcord` etc.) accept "너무 주문할 수 있습니다"; only unit-level checks catch it.
- Fresh clones lack gitignored `studytexts.js`, so Stage 5 and the leak scan skip.
- `korean/concord/index.js:32` logs a TypeError in Chrome on every page: in the browser `concordExports` is built by spreading `window`
  into itself, and `Object.assign` stops at the read-only `window` key. Harmless (the values are already globals) but it is console noise
  that jsdom does not report.

## Private text overlay (copyright)
Mechanism: `docs/architecture.md` section 2. Remaining exposure: slot `Surface` strings still encode textbook sentences eojeol by eojeol
(a hygiene test caps known leaks). History was rewritten with `git filter-repo`; old commits may survive in GitHub caches and forks.

## Non-obvious files
```
select.js, test.js      first-class tools: unit query/edit CLI, test runner
data/                   constants, units, templates, homonym resolver (each also a CLI), generated schema_summary.json
                        (homonyms.js also holds the big dictionary; split it out later)
korean/index.js         Node facade over korean/ (the browser loads korean/ modules directly)
tools/exhaustive.js     seeded generation sweep (smoke test, not an oracle)    tools/text_analyzer.js  passage analysis CLI
ingest.js, schema_analysis.js, verify_sentences_cli.js   still at root, not yet sorted
tools/vs_tune.js        Verified Sentence CLI: show/list/gen/check templates, edit slot filters and template Rules (writes the data file),
                        tuning batches (data/vs_review.json), slot fixtures, gap classes, stats (docs/vs_tuning_baseline.txt)
tools/merge_units.js    merge duplicate units: alias=canonical pairs -> alias rows, remapped templates/homonyms (see Decisions)
```
- **Add a verified sentence:** put one sentence per line in a text file (optional `| <grammar ids>` the line must cover), then
  `node tools/vs_tune.js ingest <file> --dry-run`, then without `--dry-run`. Project-authored sentences use source `minimal` (kept inline,
  open-licensed); textbook text goes through `tools/text_analyzer.js --add-verified` so it lands in `local/`. Rejections are analyzer gaps.

## Priorities (in order)
Top priority now (owner 2026-11-24): English frames for every verified template (section below), so verified sentences
can be used in the sentence quiz. Sonnet does the drafting. Then:
- Since 2026-11-24 the tag loosening and the English frames are one sentence-focused batch (`vs_tune batch --critical-path`):
  each template is loosened first, then given its English, so neither has to be redone.
- **Reminder for the owner:** the Opus implementer pass (fixing the recorded gaps) is paused to save budget; gaps keep
  accumulating as rules (`gaps --summary`). Once most verified templates have an English frame (`node tools/vs_tune.js en-status`),
  start running it again after batches.
- After that tuning settles the grammar handling: upgrade the AST English realizer (`korean/translation/natural_realizer.js`):
  relative clauses, quotes, 3+ clauses. Measured 2026-11-24: only 230 of 547 templates avoid those gaps. Decide then whether
  it replaces the frames. Not before: two English generators are too much for an agent to keep in view.
0. Refactor the conjugator (agreed 2026-11-20, not started): it builds malformed forms that the validator accepts (받가지고,
   사으라고/고르으라고, 찾실/넣실: -가지고, -(으)라고, -(으)시- with some stems; batch 4 log). Old code with much feature creep;
   pin current correct output with tests first, then refactor. Gap class `morphology` collects new cases.
1. Play `fc2/` on the phone (and `flashcards/` to compare) and send balance and pacing notes. Semester starts ~2026-12-01; early units (class2011 to class2112) first.
2. New study modes on top of `shared/`: reverse sound board (hear Korean, pick from a button matrix) and multiple-choice comprehension.
3. Study, flag, triage, fix (CLAUDE.md loop). Freeze generator scope once the loop works.
4. Android packaging.
5. Goal: paste K-pop lyrics or a movie script into the web app and get a curriculum from the units it recognizes. Needs the ingest/homonym
   resolution logic (`data/homonyms.js`, `tools/text_analyzer.js`) usable in the browser.
6. TODO (owner request 2026-11-20): API round-trip tests for the other data tools, like `test/select_test.js` (temp copy of the data file
   beside the original, edit through the tool's API, assert it still loads, only the target changed, `--dry-run` writes nothing, real
   files untouched). Cover `data/verified_sentences.js` CLI and writers (`tools/vs_tune.js` write commands: it has no data-file option
   yet, so tags/rule-add/fixture/done write the real files; its data invariants are checked in golden_sentences_test), `tools/text_analyzer.js`
   `--add-verified`), `tools/merge_units.js` (needs a data-file option first; it writes the real files today), `data/homonyms.js update`,
   `ingest.js`, `tools/triage_flags.js`. Same pattern: write the test, then make it fail on a known bug before trusting it.
7. Stretch, paused 2026-11-15: Tatoeba sentences (structures differ too much from the class). Status in `docs/tatoeba_selection_plan.md`.

## Decisions
- Keep the free AST generator (`korean/generation/unit_sentence_generator.js`); its large functions may be replaced, refactored or deleted
  later, decided once verified-sentence generation is strong. Do not refactor it before then.
- `data/verified_sentences.js` drives generation today; its data will improve as sentences are tested and semantic tag constraints relax.
- Duplicate units (2026-11-20) became alias rows (`tools/merge_units.js`; design in `docs/architecture.md` section 2). The canonical keeps
  its own tags, gains missing SemanticData keys and takes the earliest pack Source. Sense splits the analyzer cannot tell apart were merged
  into the unit it emits (는데 893/894/956/957/1044/1045 -> 620; 거예요 1019/1020 -> 460). Kept separate as true homonyms: 내다 1216/1281,
  찾다 554/1306, 보다 149/976, 겠다 837/838, 는데요 1292/1293.

## Verified-sentence tuning workflow (agreed 2026-11-20)
Goal: varied, short, not-wrong sentences in fc2. The game varies ONE slot at a time with the rest of the template fixed, so each slot is
judged against its original sentence. Baseline: `docs/vs_tuning_baseline.txt` (1,788 of 2,693 variable slots admit one word; 6,436
one-slot sentences realize). Generator guarantees (tested): a slot's own word is always in its pool (only `deny` removes it), and a
validator error that the original sentence also raises is waived, so only what a variation changes can reject it.
State lives in code, not here: `vs_tune.js batch` (open batch, `data/vs_review.json`), `gaps --summary`, `fixtures --unsure`, `batch status`.
`test/golden_sentences_test.js` enforces it: slot fixtures, gap classes, ledger ids.

One agent at a time (vs_tune writes files in place; no locks). Per batch: sentence agent (Sonnet) -> implementer (Opus; paused, see
Priorities) -> owner (review, native-speaker list, commit). Since 2026-11-24 a `--critical-path` batch is sentence-focused: each template
gets its tags reviewed (when something varies) and an English frame, in that order; the list shows `needs tags+english` etc., and `done`
refuses a template without a valid frame. 25 per batch. The orchestrating session starts each agent with the prompt below, does not do
the batch itself, and may run 2 or 3 batches back to back (fresh agent each) before one review and commit.

**Sentence batch brief (Sonnet). Paste as the agent prompt:**
> Kongbuhey repo (read CLAUDE.md first: test from a local copy, never commit). Run `node tools/vs_tune.js batch --critical-path`
> (opens or resumes the batch; new batches follow the Examples Critical Path from the owner's save, so each batch makes soon-usable
> templates better) and `node tools/vs_tune.js gap-classes`. An open batch keeps `]vs_batch.txt` in the repo root (progress and
> milestones; it blocks commits); `done` on the last template removes it. Never edit or delete it. For each listed template: `show <id>`; for each variable slot (the `pools` column,
> slot:pool size), decide which words fit the sentence with every other slot fixed. `show` prints how many pool words realize;
> `slot <id> <i> --open --by-tag` lists what the validator alone allows, grouped by tag (`unit <id>` shows one word's tags). Then:
> 1. Loosen: `tags <id> <i> -tag --dry-run`; read every `OK` line (`REJ` = an existing validator already rejects it). Write it (same
>    command without `--dry-run`) only if every OK sentence is natural. Prefer a tag that matches the good set; for a few extra words
>    use `{"kind":"allow","ids":[...]}`. Never leave a slot with no tags: a big pool where few realize (`show`: "pool 1022, 5 realize")
>    makes the game fail on that slot. Pool already big (>30) and natural: leave it. Strict defaults also admit nonsense:
>    tightening (`rule-add` noTags/anyTags/deny) is part of the job.
> 2. At most 3 attempts per slot. No tag/rule split works: `rule-add <id> '{"kind":"gap","class":...,"slot":i,"text":...}'`.
>    A word that lacks a tag is class `data-tag` with `units`: do not edit data.js tags (other templates share them).
> 3. Fixtures (`fixture <id> <i> <unitId> bad|ok "<reason>"`): one `bad` per distinct kind of wrong sentence you saw (excluded ones
>    become fixed, gap ones open with `--gap-class`), one `ok` for the newly admitted word you are surest of. `--confidence unsure`
>    whenever you would not bet on it; `evidence <ko> ...` shows Tatoeba support. Unsure fixtures go to a native speaker.
> 4. Locked slots never vary: skip them. A template with nothing variable needs only step 6.
> 5. A validator rejecting a natural sentence with the new word is gap class `validator-reject` (name the error code); do not work
>    around a failing test with a deny rule: report it.
> 6. English (every template; after its tags are done). If `show` prints a frame, rerun it: `en-set <id> "<frame>" --dry-run`; otherwise
>    write one. `en-set <id> "<frame>"` validates and prints the frame filled for the original and 4 variants. Natural English that keeps
>    the Korean structure visible ("because I was tired, I slept"; connectives translated faithfully; relative clauses as "the X that...");
>    dropped subjects chosen from context (questions: "you"); no words for politeness levels or -(으)시-. Fixed slots are written out;
>    every slot that varies is a placeholder: `{3}` plain gloss, `{3:form}` (`base past part s ing adj` | `pl a the`; write "a/the"
>    only through `{3:a}`/`{3:the}`), `{3|wording}` used while slot 3 holds its original word. Read every variant; restructure until
>    they are grammatical. Gloss or pool problems a frame can't fix (degree adverbs, prepositions of time/motion verbs): list them.
>    Never deny a word whose Korean is natural only because its English reads badly (the Korean is the product): list it instead.
>    Read 10 frames from earlier batches first (`show` on a few `done` templates) to match their style.
> 7. `done <id> "<tags: what changed | kept>; en: <new|kept|reworked>"` (refused until the frame is valid).
>    After the last `done`, never run `batch` again (with no batch open it opens the next one, whose flag then blocks the commit);
>    `batch status` is safe.
> Finish: `node test.js` (local copy) passes, then report `batch status`, `gaps --summary`, the count from `fixtures --unsure`, `en-status`,
> a table of the frames (id | Korean | frame), and the gloss/pool problems from step 6. Stop.

**Implementer (Opus), after the loosener:** `gaps --summary`, take the top class (or two), implement it in the generator/concord/data
(CLAUDE.md rules: no Hangul literals or unit ids in logic), remove the gap rules it now handles (`rule-rm`), `fixtures --sync`,
`node test.js`, spot-check `gen <id> 5 --slot i` on ~10 changed slots. Report what was implemented and what is left.
Run `fixtures --sync` and the suite right after EACH engine edit, not only at the end: an interrupted run (the laptop slept mid-pass
on 2026-11-24) must leave a passing tree.

Before each batch, look for a mechanical cause first: batch 1's loosener spent ~195k tokens for +348 sentences, while one
generator fix it pointed at (originals failing their own validator: 257 of 547 templates) gave +832. If several gaps share an error
code, measure it across all templates before reviewing more.

Batch log: 1 (2026-11-20, Sonnet): 25 templates, 67 slot fixtures (19 unsure), gaps mostly validator-reject; the Opus pass added the
original-word guarantee, the baseline waiver, `allow` rules, `slot --open`, `unit`, `fixture-rm`, `stats --deep`. 6,436 -> 7,617 sentences.
Batch 2 (2026-11-20, Sonnet, ~135k tokens): 25 templates (입니다, 이/가, 에, 을/를). Opus pass: `allow` rules now land (the target check
re-implemented eligibility), intransitive verbs with a `collocation_filter` take the objects it names, verb data: 가다 + `motion_activity`
nouns (new tag: 여행, 유학, 해외여행, ...), 넣다 + ingredient, 보다 + reading, 잘하다 + language/sports/instrument. -> 7,788 sentences.
Left: 5 validator-reject gaps (살다+person adnominal, 춥다 with a person subject, 단순한 + clothing, 여러분/너희 + 말하다, 만나다-type
verbs without an object), 53 low-yield slots (wide verb pools filtered by collocation).
Batch 3 (2026-11-20, Sonnet, ~147k tokens): 25 templates. Opus pass: data tag `object_elidable` (만나다, 사귀다, 뵙다) exempts verbs whose
person object is routinely dropped from MISSING_TRANSITIVE_PERSON_OBJECT; vs_tune rejects rules on locked slots. -> ~7,850 sentences.
Per-batch gains are shrinking (+171, +60): the later templates are long and mostly locked; consider batching by low-yield/pool-1
slots across all templates instead of by template order.
Batch 4 (2026-11-20, Sonnet, ~142k tokens): the 52 low-yield slots (48 templates, `batch --low-yield`), each narrowed to an `only`
list of the natural words among those that realize. slots.lowYield 52 -> 0; sentences.oneSlot 7,858 -> 7,198 (the removed ones
realized but were unnatural; the game now varies those slots reliably). Found: the conjugator builds malformed forms that pass
the validator (받가지고, 사으라고/고르으라고, 찾실/넣실: -가지고, -(으)라고, -(으)시- with some stems); none is reachable now (only
lists exclude them), but loosening could re-admit them. Fix the conjugator next (gap class `morphology`).

Batch 5 (2026-11-24, first `--critical-path` batch from the owner's save; Sonnet ~113k tokens, Opus ~138k): 13 of 25 templates
changed (food/person/place slots to their class + denies; emotion and 괜찮다 slots narrowed to only-lists), ~35 fixtures. Opus pass
measured rejections over a 30k one-slot sweep (VERB_OBJECT 6,471 mostly right, DESCRIPTIVE_VERB_SUBJECT 1,038, ADNOMINAL_ACTION 786,
ADNOMINAL_DESCRIPTIVE 637) and fixed ADNOMINAL_ACTION for animate heads of intransitive motion/locative clauses (일본에서 온 민수,
같이 살 친구; 786 -> 682); g205 and g072 fixed. Fixed after (2026-11-24): a 들 slot never admits names, proper nouns or
plural nouns; conjugation class `b_drop` (뵙다: 뵈러, 뵈어요, 뵙고). Then: 찾다 takes 학생 (overrideAllow over notTags academic); the focus-object fallback (도/는/만) only
considers nouns/pronouns (그래도 씻고 주무세요, g129 fixed); vs_73 and vs_223 verb slots narrowed (연락드려 주세요, 바람이 개는).
validator-reject gaps 14 -> 10. Left: a 도/는 noun before an intransitive verb is its subject, not an object (vs_329, vs_185);
seen in bench samples, for later batches: vs_415 slot "아이가 죽는 동안", the AST builds 개다 (weather) with person subjects.

Batch 6 (2026-11-24, critical-path; Sonnet ~157k tokens, Opus ~193k): 24 of 25 templates changed (facility places for 가다,
fee nouns for 싸다, person/event/school slots; humble and weather verbs narrowed), ~70 fixtures (11 unsure). Opus pass measured a
40k one-slot sweep: VERB_OBJECT rejects 9,306 (~9% natural), DESCRIPTIVE_VERB_SUBJECT 1,371 (0 of 22 natural): mostly right, so it
fixed data, not checks: 하다 + activities/events, 졸업하다 + schools, 떠나다/다녀오다 + travel nouns, 전공하다 + fields, 싸다/비싸다 +
fees, 먹다 + meals; validator: 뭘/무엇을 skip the object-list check (still checked for intransitive and person-only verbs), and in
유키 씨는 the subject is the name, not 씨. After the bench review: 팔다 no longer takes events (*콘서트를 팔았어요). validator-reject
gaps 22 -> 15. Left: 크다/작다/맛있다 + 식당 (vs_490, vs_70), 다니다 + travel nouns (vs_413), a 도/는 noun read as object (vs_185,
vs_329); some verbs lack an intransitive tag (open pools offer 뭘 넘어질); 다음일을 샀어요; the conjugator builds 들어주가지고.

**Owner:** `node tools/vs_tune.js fixtures --unsure` is the native-speaker list; record answers with `human <gid> right|wrong`; commit.

Existing checks to know before calling something a gap: the validator already has temporal concord (section E of
`generateSentenceFromTemplate`, `TEMPORAL_CONCORD_MISMATCH`) and verb-object collocation (`VERB_OBJECT_COLLOCATION_MISMATCH`:
이름을 읽었어요 is rejected). Known hole: 모레 숙제를 다 하고 잤어요? passes (`tags vs_367 0 -temporal_past -past --dry-run`), so the
temporal check misses some time words; extend it rather than adding a second one.
Ingestion of minimal sentences (one short sentence per grammar unit) is a separate track, blocked on the analyzer: it rejects -자,
-(으)ㄹ게요, -니, 줘요, 고파서 (12 of 15 pilot sentences in `local/minimal_pilot.txt`). One Opus task, then `vs_tune.js ingest`.

## English frames for verified sentences (agreed 2026-11-24)
Verified templates had no English. `enNatural` was the slot glosses joined with ` · `, so quiz answers gave themselves away.
`VERIFIED_TEMPLATE_SCHEMA.English` (index 7, null Rules before it) holds a frame. `renderEnglishFrame` fills it per generation:
`{3}` plain gloss, `{3:past}` a form (`base past part s ing adj pl a the`), `{3|wording}` used while slot 3 holds its original word.
A sentence without a frame has `glossOk: false` (shared/sentence_adapter.js). fc2 then hides its 🎯, and it is never offered as a wrong answer.
- Normal path: the sentence-focused tuning batch (tuning workflow section). English-only pass (no tag work): `node tools/vs_tune.js en-batch --n 50` (critical-path order), `en-set <id> "<frame>"` (validates, shows variants),
  `en-check` (run by test/collocation_test.js), `en-status`. Sonnet brief: natural English that keeps the Korean structure visible
  (connectives translated faithfully, dropped subjects chosen from context, no words for politeness levels), every VARIES slot a placeholder,
  read the variants and restructure until they're grammatical.
- Batch 1 (25, 2026-11-24): about 2 min and 90k Sonnet tokens. The owner reviews the English.
  Problems frames can't fix: these come from pool quality (later tuning work):
  - degree-adverb pools (너무 "too much", 제일 "most", 더) next to an adjective slot: vs_503, vs_85, vs_400;
  - 현재 glossed "present": vs_396, vs_397;
  - location nouns that don't fit "on the X" (건너편 "the other side", 밑, 가운데): vs_228;
  - school subjects in vs_506 slot 1.
  No `{n:is}` agreement form yet. The workaround is "as for X, it's" (vs_54).
- Batch 2 (50, 2026-11-24): about 4 min, 108k Sonnet tokens; 75 of 547 done. 50 per batch worked; keep it. More problems frames
  can't fix:
  - time nouns that need their own preposition ("at 8 o'clock, Thursday" in vs_426/vs_520; "today afternoon" in vs_435);
  - 이번 glossed "this time" ("this time week" in vs_537, vs_522);
  - verbs that need their own preposition ("arrived to the bank" in vs_491; `getVerbEnForms` has a `prep` field no form uses yet);
  - 아침 = "morning", not the meal ("I ate morning" in vs_490);
  - mixed verb/noun pools (vs_523).
  Fixed: `{n:the}` on period nouns (the weekend), and "American persons".
- Batch 3 (50, English only via `en-batch --loosened`, 2026-11-24): 125 of 547 done, about 4 min and 122k tokens. en-batch output
  (>15 KB) truncates in the agent's tool result: have it redirect to a file and read it in slices. More problems frames can't fix:
  countries as modifiers ("China songs"), "one hours", verbs whose object/preposition differs from the original's.
  While few templates have frames, fc2_ui_test's "repeated replacement" noun-quiz check flakes more often (fewer framed sentences
  to draw wrong answers from); it failed once in 5 runs here.
- Batch 4 (48, English only, 2026-11-24): 173 of 547; every loosened template now has a frame. about 5 min, 129k tokens.
  Remaining English work goes through the sentence-focused tuning batches. Ideas from the agents, not done: `en-set --variants N`
  (4 variants miss rare combinations), the pool count on VARIES lines.
- Batch 7 (first sentence-focused batch, 25, 2026-11-24): about 8 min, 114k tokens; 196 of 547 framed. Tightened only (deny/only rules
  in vs_95, vs_98, vs_367, vs_344, vs_424, vs_50, vs_116), 15 fixtures (5 unsure; 38 in total). Seen in the bench review, not yet
  fixed: duration slots admit 일/주 for short trips (vs_216 "걸어서 15주쯤", vs_227 "5일 정도 걸립니다"); 확인하다 glossed "to confirm"
  (should be "to check"); plural glosses of mass nouns ("garlics"). Agents: run `show` for the whole batch into one file and read
  it in slices (each `show` takes seconds on the mounted folder).
- Batch 8 (25, 2026-11-24): about 11 min, 162k tokens; 221 of 547 framed. Loosened vs_428 (food, 3 -> 74), vs_433 (nature), several
  allow lists; tightened vs_471, vs_62, vs_339. Bench review: vs_501 slot 5 took seasonings ("그 식당의 설탕이 맛있는 줄"):
  orchestrator added noTags condiment/ingredient/place + fixture g304. Agent notes: `listVerifiedFitsForUnit` can list a unit the
  validator rejects (공책 in vs_469 broke fc2_ui_test until denied); 동창회 glossed "alumni association" (means reunion).
- Batch 9 (25, 2026-11-24): about 8 min, 129k tokens; 246 of 547 framed. Tightened only (vs_100, vs_97, vs_262, vs_483, vs_303,
  vs_375, vs_393, vs_83); 4 new gap rules (validator-reject: 하다 + language names, 넣다 + meats; cross-slot duplicates). Bench review:
  vs_212 took 외우다 and 기념품 ("교통 기념품을 ... 외우지 마시고요"): orchestrator narrowed slot 4 to 잊다/잊어버리다, denied 기념품/생필품
  (g319, g320). Agent note: en-set requires a placeholder for pool > 1 even when only 1 word realizes.
- Batch 10 (25, 2026-11-24): about 6 min, 117k tokens; 271 of 547 framed. Tightened only (deny/only on vs_33, vs_254, vs_275, vs_218,
  vs_148, vs_439, vs_437, vs_507, vs_312), 6 unsure fixtures. Orchestrator fixes:
  - `withEnglishArticle` tested pronouns by prefix, so "meeting"/"message" (me), "item" (it), "wedding" (we) never got an article,
    in frames and in free-sentence English; it now matches whole words, and checks a phrase's last word for mass nouns (men's clothing).
  - vs_415 slot 2 denies 죽다/생기다/끝나다 and similar ("while the child was dying"), g333.
  - fc2/debug.js testableCard moves a testable example to the front (the sentence-card scene flaked when a pack's first examples
    had no English frame).
  Agent notes, not done: 선물하다/축하하다/찾다 glosses read badly in frames; slots of one template can draw the same word
  (불고기나 불고기: no distinct-word check); 보다 976 and 149 render identically.
- Batch 11 (25, 2026-11-24): about 7 min, 130k tokens; 296 of 547 framed. Tightened only (12 templates), 5 unsure fixtures. The agent
  denied two natural Korean words for English reasons (얼마나 in vs_119 slot 2, 재미없다 in vs_235 slot 1); the brief now forbids it
  (step 6). Those two denies are still in place: remove them once frames can handle them. Missing frame feature: counter plurals
  ("{n} minute(s)" in vs_496/497/498). fc2/debug.js sentence scenes unlock more units when 12 give no testable example (flaked).
- Batch 12 (25, 2026-11-24): about 8 min, 142k tokens; 321 of 547 framed. Loosened vs_363 (-male), allow lists on vs_265/266;
  tightened vs_357, vs_minimal_3, vs_284, vs_445, vs_241, vs_32. Test fixes (they assumed every example is testable or row 0 untuned):
  fc2_ui_test's sentence tests keep the card they checked, testable example first; verified_originals_test's round-trip picks an
  untuned row. Bench review: seasonings in dish slots again (vs_77 "설탕도 많았고요", vs_80 "후추를 제일 좋아했어요"): noTags
  condiment/ingredient + g365/g366. Candidate one-off sweep: every food slot whose original is a dish, noTags condiment/ingredient.
- Batch 13 (25, 2026-11-24): about 7 min, 133k tokens; 346 of 547 framed. Tightened 8 templates (vs_311 slot 4: non-elder kin only,
  gap class honorific for the elders); 4 unsure fixtures. Agent note: the `pools` header counts words that don't realize, and en-set
  wants a placeholder for each; showing the realized count would save a rejected en-set per template.
- Batch 14 (25, 2026-11-24): about 7 min, 161k tokens; 371 of 547 framed. Loosened vs_419 (allow list), vs_412 (-female), vs_42
  (cities); tightened 9; 4 gap rules (validator-reject: 도와드리다 + elders, 부치다 + clothing; 연말을 보내다 rejected but not logged).
  Bench review: vs_341 took 기간/종일/동안 as a day count and 쌀쌀하다 for 따뜻하다 (g396, g397). Agent idea: `slot --open --tags a,b`.
- Batch 15 (25, 2026-11-24): about 8 min, 158k tokens; 396 of 547 framed. Loosened allow lists (vs_7, vs_143, vs_245, vs_157); tightened
  10 incl. vs_216 (walking time: minutes/seconds only); 5 gap rules (validator-reject: 언어 + 연습하다, 비싸다 polarity in vs_283).
  Bench review: vs_227 trip time also minutes/seconds only (g420). Agent ideas: the batch list's `pools` should show only pool > 1;
  `rule-add --dry-run` should show other slots' pools too (an allow on one slot can widen another through collocation).
- Batch 16 (25, 2026-11-24): about 8 min, 159k tokens; 421 of 547 framed. Loosened vs_389, vs_476; tightened 11 (transit templates:
  places that are stations, vehicles that run lines). Bench review: vs_377 numbered routes are buses only (g443), vs_227 no tollgate
  (g444). Recurring frame limits: counters ("{n} hour(s)"), country adjectives ("songs from {0|Korea}"), 보다 976/149 identical.
- Batch 17 (25, 2026-11-24): about 7 min, 143k tokens; 446 of 547 framed. Loosened allow lists (vs_307, vs_19, vs_238); tightened 13.
  Bench review: vs_227/vs_216 trip time no seconds either (g-fixture "5초 정도").
- Batch 18 (25, 2026-11-24): about 6 min, 141k tokens; 471 of 547 framed. Loosened allow lists (vs_175, vs_139); tightened 3; gap
  validator-reject: 올리다 + toppings (vs_103). The agent didn't probe pool-1 slots for loosening (e.g. vs_136 slot 2).
  Agent idea: a tag filter on `slot --open --by-tag` (output is ~25 groups of mostly irrelevant words).
  The batch 18 agent ran `batch` after its last `done`, which opened batch 19 and blocked the commit; batches 18 and 19 were committed
  together. The brief (step 7) now warns about it.
- Batch 19 (25, 2026-11-24): about 7 min, 145k tokens; 496 of 547 framed. Tightened 9 (cooking verbs, kin collisions, 걸리다 + illness).
  fc2_ui_test's sentence tests now pick an example whose quiz builds twice (the background build is random too).

## fc2 storage, sentence queue, generation performance (2026-11-19 to 2026-11-22)
Design and invariants now live in `docs/architecture.md` (sections 3, 4 and 6). History in brief:
- 2026-11-19: localStorage progress mirror, session restore, snapshots, error panel, Recovery panel, unit editor, cheat mode, Force save.
- 2026-11-20: two causes of lost progress, both fixed with tests: `?debug` scenes saved their staged state over the real one (debug pages
  now never save), and `webapp/db.js` bulk save kept only the last cell per unit (one read-modify-write per unit now; damaged records heal).
- 2026-11-22: "time to use it" queue and Queue view; relaxed availability (any fitting unlocked word opens a slot) with an incremental,
  time-sliced cache; generation caches (warm card 21.7 -> 3.3 ms, quiz build ~1 s -> ~50 ms); `tools/bench_generation.js` in `--full`.
  Measured but deliberately not done: architecture doc section 6.
- Open: one unexplained stage-6 failure in 1 of 4 full runs on 2026-11-22 (not reproduced in 13 UI-suite runs); suspect the old
  random-pack flake in the UI test's "sentence test" step.

## Simulator sentence QA workflow (agreed 2026-11-23)
Goal: find and fix wrong example sentences without the owner play-testing. `tools/fc2_sim.js` plays the real game (same controller and
generators as the phone) and lists every example it showed. Each one is marked: V = from a verified textbook template (📖 in the app),
G = built by the fallback generator (⚙). Most wrong sentences are G; V ones go through the verified-sentence tuning workflow above.

**Brief for an agent (paste as the prompt):**
> Kongbuhey repo (read CLAUDE.md: test from a local copy, ask before committing). Sentence quality pass with the simulator.
> 1. Collect: `node tools/fc2_sim.js run --load "$(ls local/GameSave_*.json | tail -1)" --cards 300 --days 3 --seed <N> --sentences /tmp/sent.tsv`
>    (no save in local/: drop `--load`; also try `--pull-from examples`, which unlocks different units). Use 2-3 seeds.
> 2. Read `/tmp/sent.tsv` (count, V/G, template, card units, Korean, English; G first, most repeated first). Read at least the top 150 G
>    rows and 50 V rows. Note each distinct KIND of error with 2 examples: wrong particle or role, verb that does not fit its subject or
>    object, adverb that does not fit the verb, tense clash, incomplete sentence, a fixed phrase broken by a slot.
>    Skip what is grammatical but bland (`가방이 좋아요`) and anything you are not sure is wrong (list those for the owner instead).
> 3. Reproduce each kind with the smallest unlocked set: `generateSentenceForUnit(id, { onlyFromSet: true, allowedUnitIds, seedOffset })`
>    from `korean/generation/unit_sentence_generator.js`; `unitsUsed[].role` shows which builder branch made it.
> 4. Fix the rule, preferring data: tags, SemanticData (`collocation_filter`, `adverb_concord.denyVerbs`, `needsAdv`, `req`), or
>    `tools/vs_tune.js` rules for a verified slot. Code only when a builder ignores the data (then make it obey the data everywhere).
>    No Hangul literals or unit ids in engine code.
> 5. Guard each fix: a test case in the matching existing suite (adverb_test, collocation_test, spatial_concord_test,
>    temporal_concord_test, ...) built on the small set from step 3, or a slot fixture (`vs_tune.js fixture`) for a verified slot.
>    Check the test FAILS without the fix.
> 6. Re-run step 1 with the same seeds: the kind is gone and `checks: all passed`. Then `node test.js`, and `node tools/flags.js resolve`
>    if a `]` flag file exists. Report: kinds fixed (one example each), kinds left for the owner, the unsure list.
Fixed in the first pass (2026-11-23): 지내다 without 잘 (needsAdv), 많다 with a single demonstrative (collocation filter now holds in the
fallback), 열심히 with one-time events (denyVerbs, also for grammar-formula adverbs), a person at a place with a descriptive verb
(*우리는 학생회관에 조용했어요: the place is the subject), eat-verb slots open to every verb (vs_minimal_2, vs_83).
Seen and left (owner: fine or unsure): `맞은편에 서점이 있습니다` without a reference noun (fine), `프랑스에서 졸업했어요`, `제가 죄송해요`.
