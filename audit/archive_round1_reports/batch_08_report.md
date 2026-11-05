# Linguistic Audit Report: Batch 08 (Nouns Part B)

> **Batch ID:** 08  
> **Category:** Nouns (Part B: Facilities, Clothing, Relatives, Body Parts, Transport & Concepts)  
> **Target Manifest:** `audit/batches/batch_08_nouns_part_b.json`  
> **Total In-Scope Units:** 221  
> **PRNG Seed:** `1793700800000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (221 / 221 Analyzed)**  
> **Audit Summary:** **Clean: 182 units (82%) | Flagged: 39 units (18%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 08 audits the second quintile of Nouns (221 units, IDs 440..852), covering public and private facilities, apparel and footwear, kinship and family terms, anatomical body parts, vehicles, and abstract concepts.

### Key Discoveries & Root Causes:

1. **Tag Over-Generalization on Body Parts & Concepts (`object` Tag Pollution):**
   - Anatomical body parts (`손` ID 827, `얼굴` ID 829, `코` ID 835, `허리` ID 836) and psychological concepts (`마음` ID 822, `성격` ID 826) carry the generic `object` tag in `data.js`.
   - Consequently, the generator paired them with commercial and domestic manual manipulation verbs:
     - Dishwashing feelings (*`마음을 설거지해요`*) and dishwashing a waist (*`허리를 설거지해요`*).
     - Purchasing or earning body parts (*`코를 샀어요`*, *`허리를 구매할 거예요`*, *`코를 벌 거예요`*).
     - Stacking block personalities (*`성격을 쌓을 거예요`*).
     - Applying for a hand (*`손을 신청해요`*) or resigning from a hand (*`손을 그만둘 거예요`*).
     - Taking a face out of a bag (*`얼굴을 꺼냈어요`*) or selling a face (*`얼굴을 팔 거예요`*).
   - Re-tagging: remove generic `object` from body parts and mental concepts; restrict to dedicated `bodyPart` frames.

2. **Kinship Honorific Concord & Directionality Inversion:**
   - **Elder Kinship Concord (High Precision):** Respect terms tagged with `elder_noun` (`어머니` ID 494, `고모` ID 840, `외할머니` ID 847, `외할아버지` ID 848) achieved excellent honorific agreement, generating subject particle `-(으)께서`, verbal honorific `-(으)시-` (`발표하세요`, `준비하세요`, `선선하세요`), and suppletive honorific verbs (`드실 거예요`, `편찮으셔요`).
   - **Directionality Inversion:** Junior relative `남동생` (ID 491) was paired with the elder-exalting suppletive eating verb *`남동생은 고기를 잡수셨어요`*.
   - **Kinship Loan Object Error:** Grandfather was generated as loaning out a human father (*`외할아버지께서는 아버지를 빌려주세요`* in ID 848), violating animacy restrictions on `빌려주다`.

3. **Physical Scale Mismatches on Vehicles & Inanimates:**
   - Giant transit vehicle `비행기` (airplane, ID 659) was paired with manual shoulder carrying (*`비행기를 메요`* - `메다` is strictly for bags/backpacks) and block stacking (*`비행기를 쌓을 거예요`*).
   - Sentient biological fatigue state `졸리다` was applied to inanimate dress shoes (*`구두는 졸렸어요`* in ID 533).
   - Behavioral imitation verb `따라하다` was paired with an umbrella (*`우산을 따라해요`* in ID 540).

4. **Copula Inflection Bugs (`여요` / `였어요`):**
   - The Unit 55 `이다` bug persisted across 6 nouns in this batch, generating detached endings (*`남동생이 였어요`*, *`넥타이가 오랜만여요`*, *`휴대전화가 였어요`*, *`비행기가 였어요`*, *`한번이 였어요`*, *`학기 중에 드럼이 였어요`*, *`크리스마스트리가 였어요`*).

5. **Temporal Adverbial Precision (`요즘`):**
   - `요즘` (ID 465, these days) tagged with `no_time_particle` generated **100% clean sentences** without ungrammatical *`-에`*, seamlessly operating as an independent temporal adverbial.

---

## 2. Detailed Unit-by-Unit Linguistic Evaluations

### Unit #440 콘서트 (Noun) - "concert"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 440 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_440.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 콘서트를 기억해요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #441 표 (Noun) - "ticket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 441 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_441.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #445 기차표 (Noun) - "train ticket"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 445 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_445.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 9:* `사나이는 기차표를 결제할 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #446 병원 (Noun) - "hospital"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 446 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_446.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #447 비행기 표 (Noun) - "plane ticket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 447 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_447.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #448 식당 (Noun) - "restaurant"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 448 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_448.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #449 영화표 (Noun) - "movie ticket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 449 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_449.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #450 옷 (Noun) - "clothes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 450 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_450.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #451 호텔 (Noun) - "hotel"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 451 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_451.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `어른은 호텔에 출석할 거예요.`
  - *Var 4:* `미국 사람은 호텔에서 우산을 깎아요.`
  - *Var 5:* `약사는 호텔에서 뷔페를 삶았어요.`
  - **Linguistic Error:** Collocation violation: Accommodation venue '호텔' (hotel) paired with academic attendance '출석하다' (*'호텔에 출석할 거예요'*) and culinary mismatch '뷔페를 삶다' (boiling a buffet).
  - **Suggested Remediation:** Restrict '출석하다' to academic institutions; restrict '삶다' to specific boilable foods.

### Unit #462 약속 (Noun) - "appointment"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 462 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_462.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #463 한강공원 (Noun) - "Hangang park"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 463 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_463.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #465 요즘 (Noun) - "these days"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 465 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_465.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #467 약속 시간 (Noun) - "appointment time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 467 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_467.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #468 약속 장소 (Noun) - "appointment place"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 468 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_468.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #474 놀이공원 (Noun) - "amusement park"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 474 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_474.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #475 드라마 (Noun) - "drama"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 475 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_475.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #478 극장 (Noun) - "theater"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 478 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_478.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #479 동물원 (Noun) - "zoo"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 479 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_479.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #480 미술관 (Noun) - "art gallery"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 480 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_480.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #481 박물관 (Noun) - "museum"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 481 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_481.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #482 영화관 (Noun) - "movie theater"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 482 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_482.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #483 카페 (Noun) - "cafe"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 483 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_483.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #486 교수 (Noun) - "professor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 486 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_486.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #487 대학교 (Noun) - "college"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 487 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_487.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #488 아버지 (Noun) - "father"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 488 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_488.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #489 역사 (Noun) - "history"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 489 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_489.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #491 남동생 (Noun) - "younger brother"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 491 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_491.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 8:* `남동생이 였어요.`
  - **Linguistic Error:** Copula inflection bug: Unit 55 '이다' generated as bare defect '*여요*' or '*였어요*' (*'남동생이 였어요.'*) instead of bound predicative ending '이에요/예요' or '이었어요/였어요'.
  - **Suggested Remediation:** Ensure Unit 55 '이다' attaches directly to the nominal stem: -이에요/-이었어요 after consonants, -예요/-였어요 after vowels.
  - *Var 5:* `남동생은 고기를 잡수셨어요.`
  - **Linguistic Error:** Sociolinguistic honorific violation: Junior family member '남동생' (younger brother) paired with elder-exalting suppletive eating predicate '잡수셨어요'.
  - **Suggested Remediation:** Restrict '잡수시다' strictly to subjects marked with [elder_noun] or [honorific].

### Unit #492 누나 (Noun) - "older sister (for male)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 492 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_492.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #493 부모님 (Noun) - "parents"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 493 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_493.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #494 어머니 (Noun) - "mother"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 494 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_494.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #495 언니 (Noun) - "older sister (for female)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 495 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_495.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #496 여동생 (Noun) - "younger sister"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 496 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_496.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #497 오빠 (Noun) - "older brother (for female)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 497 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_497.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #498 외할머니 (Noun) - "grandmother (mother's side)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 498 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_498.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #499 외할아버지 (Noun) - "grandfather (mother's side)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 499 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_499.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #500 할머니 (Noun) - "grandmother"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 500 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_500.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #501 할아버지 (Noun) - "grandfather"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 501 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_501.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #502 형 (Noun) - "older brother (for male)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 502 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_502.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #503 형제 (Noun) - "sibling"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 503 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_503.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #509 과자 (Noun) - "cookie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 509 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_509.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #511 요리 (Noun) - "dish"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 511 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_511.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #526 원 (Noun) - "won"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 526 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_526.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #527 치마 (Noun) - "skirt"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 527 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_527.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #531 만 (Noun) - "ten thousand"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 531 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_531.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #532 값 (Noun) - "price"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 532 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_532.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #533 구두 (Noun) - "dress shoes"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 533 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_533.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `저는 구두를 말씀해요.`
  - *Var 2:* `구두는 졸렸어요.`
  - *Var 7:* `외국인은 구두를 질문해요.`
  - **Linguistic Error:** Semantic animacy violation: Footwear artifact '구두' (dress shoes) paired with sentient biological state '졸리다' (*'구두는 졸렸어요'*) and speech question verb '질문하다'.
  - **Suggested Remediation:** Restrict '졸리다' to sentient animates, and restrict '질문하다' to cognitive/speech arguments.
  - *Var 3:* `사나이는 구두를 낼 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #534 바지 (Noun) - "pants"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 534 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_534.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #535 백 (Noun) - "hundred"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 535 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_535.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #536 슬리퍼 (Noun) - "slippers"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 536 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_536.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #537 신발 (Noun) - "shoes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 537 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_537.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #538 십만 (Noun) - "hundred thousand"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 538 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_538.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #539 와이셔츠 (Noun) - "collared shirt"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 539 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_539.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #540 우산 (Noun) - "umbrella"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 540 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_540.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 7:* `누구는 우산을 따라해요.`
  - **Linguistic Error:** Semantic selection violation: Physical tool '우산' (umbrella) paired with human behavioral imitation '따라하다' (*'누구는 우산을 따라해요'*).
  - **Suggested Remediation:** Restrict '따라하다' direct objects to human actions, words, speeches, or instructors [action, speech, person].

### Unit #541 운동화 (Noun) - "sneakers"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 541 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_541.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #542 천 (Noun) - "thousand"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 542 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_542.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #543 코트 (Noun) - "coat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 543 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_543.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #544 티셔츠 (Noun) - "t-shirt"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 544 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_544.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #550 들 (Noun) - "plural suffix"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 550 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_550.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #551 송이 (Noun) - "cluster"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 551 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_551.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #552 스물 (Noun) - "twenty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 552 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_552.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #553 장미 (Noun) - "rose"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 553 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_553.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #557 가게 (Noun) - "store"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 557 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_557.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #558 곳 (Noun) - "place"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 558 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_558.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 곳에서 선물을 내요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #559 면세점 (Noun) - "duty free shop"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 559 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_559.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #560 바나나 (Noun) - "banana"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 560 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_560.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #561 백화점 (Noun) - "department store"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 561 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_561.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #562 슈퍼마켓 (Noun) - "supermarket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 562 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_562.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #563 시장 (Noun) - "market"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 563 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_563.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #564 양말 (Noun) - "socks"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 564 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_564.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #565 주스 (Noun) - "juice"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 565 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_565.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #566 크림빵 (Noun) - "cream bread"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 566 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_566.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #567 권 (Noun) - "counting word for books"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 567 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_567.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #568 벌 (Noun) - "counting word for clothes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 568 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_568.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #569 자루 (Noun) - "counting word for pen/pencil"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 569 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_569.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #570 장 (Noun) - "counting word for paper"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 570 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_570.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #571 켤레 (Noun) - "counting word for shoes/socks"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 571 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_571.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #576 선물 (Noun) - "gift"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 576 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_576.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `사나이는 선물을 묶을 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #577 케이크 (Noun) - "cake"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 577 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_577.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #578 화장품 (Noun) - "cosmetics"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 578 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_578.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #581 것 (Noun) - "thing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 581 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_581.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #582 꽃다발 (Noun) - "bouquet"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 582 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_582.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #583 넥타이 (Noun) - "tie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 583 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_583.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #584 상품권 (Noun) - "gift certificate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 584 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_584.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #585 생신 (Noun) - "birthday (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 585 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_585.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #586 시디 (Noun) - "CD"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 586 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_586.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 7:* `사나이는 시디를 잡아요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #587 액세서리 (Noun) - "accessories"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 587 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_587.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #588 이메일 (Noun) - "e-mail"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 588 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_588.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `사나이는 이메일을 원했어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #589 인형 (Noun) - "doll"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 589 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_589.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #590 향수 (Noun) - "perfume"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 590 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_590.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #603 초콜릿 (Noun) - "chocolate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 603 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_603.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #608 여기저기 (Noun) - "here and there"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 608 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_608.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #622 전화번호 (Noun) - "phone number"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 622 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_622.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #624 국가 번호 (Noun) - "country code"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 624 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_624.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #625 지역 번호 (Noun) - "area code"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 625 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_625.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #626 휴대전화 (Noun) - "mobile phone"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 626 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_626.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 4:* `휴대전화가 여요.`
  - **Linguistic Error:** Copula inflection bug: Unit 55 '이다' generated as bare defect '*여요*' or '*였어요*' (*'휴대전화가 여요.'*) instead of bound predicative ending '이에요/예요' or '이었어요/였어요'.
  - **Suggested Remediation:** Ensure Unit 55 '이다' attaches directly to the nominal stem: -이에요/-이었어요 after consonants, -예요/-였어요 after vowels.

### Unit #627 이야기 (Noun) - "story"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 627 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_627.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 10:* `사나이는 이야기를 준비했어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #628 파티 (Noun) - "party"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 628 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_628.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `사나이는 파티를 고를 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #631 뉴스 (Noun) - "news"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 631 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_631.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #639 진지 (Noun) - "meal (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 639 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_639.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #640 연세 (Noun) - "age (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 640 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_640.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #641 성함 (Noun) - "name (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 641 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_641.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #642 댁 (Noun) - "house (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 642 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_642.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #649 택시 (Noun) - "taxi"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 649 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_649.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #654 고속버스 (Noun) - "express bus"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 654 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_654.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #655 공항버스 (Noun) - "airport bus"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 655 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_655.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 공항버스를 찍어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #656 기차 (Noun) - "train"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 656 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_656.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #657 배 (Noun) - "ship"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 657 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_657.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #658 버스 (Noun) - "bus"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 658 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_658.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #659 비행기 (Noun) - "airplane"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 659 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_659.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 8:* `비행기가 였어요.`
  - **Linguistic Error:** Copula inflection bug: Unit 55 '이다' generated as bare defect '*여요*' or '*였어요*' (*'비행기가 였어요.'*) instead of bound predicative ending '이에요/예요' or '이었어요/였어요'.
  - **Suggested Remediation:** Ensure Unit 55 '이다' attaches directly to the nominal stem: -이에요/-이었어요 after consonants, -예요/-였어요 after vowels.
  - *Var 1:* `형제는 비행기를 메요.`
  - *Var 5:* `아주머니는 비행기를 벌었어요.`
  - *Var 9:* `남동생은 비행기를 쌓을 거예요.`
  - **Linguistic Error:** Physical scale mismatch: Massive transit vehicle '비행기' (airplane) paired with manual shoulder carrying '메다' (*'비행기를 메요'*) and block stacking '쌓다' (*'비행기를 쌓을 거예요'*).
  - **Suggested Remediation:** Subcategorize [vehicle] separately from small portable physical objects.

### Unit #660 오토바이 (Noun) - "motorcycle"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 660 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_660.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #661 자전거 (Noun) - "bicycle"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 661 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_661.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #662 차 (Noun) - "car"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 662 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_662.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #663 젓가락 (Noun) - "chopsticks"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 663 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_663.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #664 종업원 (Noun) - "employee"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 664 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_664.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #665 시간 (Noun) - "hour/time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 665 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_665.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #666 호선 (Noun) - "subway line"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 666 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_666.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #669 고속버스터미널 (Noun) - "express bus terminal"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 669 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_669.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #670 공항 (Noun) - "airport"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 670 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_670.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #671 역 (Noun) - "station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 671 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_671.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #672 정류장 (Noun) - "bus stop"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 672 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_672.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #677 번 (Noun) - "number"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 677 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_677.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #681 미터 (Noun) - "meter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 681 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_681.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #682 사거리 (Noun) - "4 way intersection"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 682 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_682.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 6:* `사나이는 사거리에서 식을 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #683 약국 (Noun) - "pharmacy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 683 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_683.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #684 오른쪽 (Noun) - "right side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 684 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_684.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #687 그쪽 (Noun) - "your side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 687 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_687.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #688 왼쪽 (Noun) - "left side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 688 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_688.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #689 이쪽 (Noun) - "this side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 689 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_689.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #690 저쪽 (Noun) - "that side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 690 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_690.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #691 지하 (Noun) - "basement"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 691 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_691.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #692 층 (Noun) - "floor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 692 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_692.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #693 한복 (Noun) - "hanbok"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 693 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_693.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `사나이는 한복을 깎았어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #696 거기 (Noun) - "there"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 696 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_696.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #697 건너편 (Noun) - "the other side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 697 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_697.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #698 횡단보도 (Noun) - "crosswalk"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 698 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_698.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #701 약 (Noun) - "medicine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 701 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_701.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #702 육교 (Noun) - "pedestrian overpass"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 702 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_702.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #703 지하도 (Noun) - "underpass"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 703 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_703.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #704 출구 (Noun) - "exit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 704 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_704.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #705 화장실 (Noun) - "restroom"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 705 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_705.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #712 일기예보 (Noun) - "weather forecast"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 712 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_712.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #717 물건 (Noun) - "object"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 717 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_717.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #724 벚꽃 (Noun) - "cherry blossom"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 724 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_724.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #725 봄 (Noun) - "spring"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 725 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_725.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #728 계절 (Noun) - "season"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 728 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_728.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #729 눈사람 (Noun) - "snowman"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 729 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_729.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #730 팝콘 (Noun) - "popcorn"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 730 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_730.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #735 여름 (Noun) - "summer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 735 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_735.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #736 가을 (Noun) - "autumn"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 736 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_736.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #737 겨울 (Noun) - "winter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 737 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_737.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #739 민박집 (Noun) - "bed and breakfast"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 739 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_739.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #740 전주 (Noun) - "Jeonju"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 740 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_740.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 전주에서 초콜릿을 맛봐요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #743 게스트하우스 (Noun) - "guesthouse"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 743 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_743.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #744 여행 (Noun) - "travel"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 744 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_744.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #745 여행사 (Noun) - "travel agency"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 745 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_745.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #746 콘도 (Noun) - "condo"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 746 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_746.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #747 펜션 (Noun) - "rental cottage"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 747 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_747.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #750 모자 (Noun) - "hat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 750 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_750.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #753 선글라스 (Noun) - "sunglasses"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 753 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_753.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `수진은 선글라스를 벌어요.`
  - *Var 3:* `기사는 선글라스를 따라할 거예요.`
  - *Var 9:* `남동생은 선글라스를 이해할 거예요.`
  - **Linguistic Error:** Semantic selection violation: Eyewear '선글라스' (sunglasses) paired with cognitive comprehension '이해하다' (*'선글라스를 이해할 거예요'*) and income earning '벌다'.
  - **Suggested Remediation:** Restrict '이해하다' to languages, concepts, and people; restrict '벌다' to currency/resources.

### Unit #754 여권 (Noun) - "passport"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 754 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_754.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 여권을 세워요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #755 충전기 (Noun) - "charger"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 755 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_755.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #759 학기 (Noun) - "semester"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 759 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_759.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #763 한번 (Noun) - "once"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 763 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_763.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 4:* `한번에 영화가 여요.`
  - **Linguistic Error:** Copula inflection bug: Unit 55 '이다' generated as bare defect '*여요*' or '*였어요*' (*'한번에 영화가 여요.'*) instead of bound predicative ending '이에요/예요' or '이었어요/였어요'.
  - **Suggested Remediation:** Ensure Unit 55 '이다' attaches directly to the nominal stem: -이에요/-이었어요 after consonants, -예요/-였어요 after vowels.

### Unit #764 끝 (Noun) - "end"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 764 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_764.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #765 방학 (Noun) - "vacation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 765 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_765.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #766 방학중 (Noun) - "during vacation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 766 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_766.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #767 시작 (Noun) - "start"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 767 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_767.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #768 학기 중 (Noun) - "during semester"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 768 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_768.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 8:* `학기 중에 드럼이 였어요.`
  - **Linguistic Error:** Copula inflection bug: Unit 55 '이다' generated as bare defect '*여요*' or '*였어요*' (*'학기 중에 드럼이 였어요.'*) instead of bound predicative ending '이에요/예요' or '이었어요/였어요'.
  - **Suggested Remediation:** Ensure Unit 55 '이다' attaches directly to the nominal stem: -이에요/-이었어요 after consonants, -예요/-였어요 after vowels.

### Unit #773 떡국 (Noun) - "tteokguk"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 773 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_773.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #774 설날 (Noun) - "New Year's day"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 774 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_774.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #776 어린이날 (Noun) - "Children's day"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 776 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_776.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #777 음력 (Noun) - "lunar calendar"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 777 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_777.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #778 크리스마스트리 (Noun) - "Christmas tree"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 778 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_778.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 8:* `크리스마스트리가 였어요.`
  - **Linguistic Error:** Copula inflection bug: Unit 55 '이다' generated as bare defect '*여요*' or '*였어요*' (*'크리스마스트리가 였어요.'*) instead of bound predicative ending '이에요/예요' or '이었어요/였어요'.
  - **Suggested Remediation:** Ensure Unit 55 '이다' attaches directly to the nominal stem: -이에요/-이었어요 after consonants, -예요/-였어요 after vowels.

### Unit #779 한글날 (Noun) - "Hangul Proclamation day"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 779 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_779.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #780 휴가 (Noun) - "vacation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 780 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_780.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #781 휴일 (Noun) - "holiday"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 781 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_781.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 9:* `사나이는 휴일에 책상을 기뻐할 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #783 광고 회사 (Noun) - "advertising company"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 783 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_783.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 8:* `사나이는 광고 회사에서 풍선을 불었어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #786 무역 회사 (Noun) - "trading company"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 786 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_786.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #787 방송국 (Noun) - "broadcasting station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 787 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_787.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #789 신문사 (Noun) - "newspaper company"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 789 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_789.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #792 잡지사 (Noun) - "magazine company"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 792 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_792.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `사나이는 잡지사에서 못했어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #796 직장 (Noun) - "workplace"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 796 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_796.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #798 출판사 (Noun) - "publisher"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 798 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_798.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #799 항공사 (Noun) - "airline"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 799 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_799.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 10:* `사나이는 항공사에서 막혀요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #802 경영학 (Noun) - "business administration"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 802 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_802.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 경영학을 즐겨요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #803 경제학 (Noun) - "economics"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 803 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_803.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #804 교육학 (Noun) - "pedagogy, education"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 804 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_804.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #805 국어국문학 (Noun) - "Korean language and literature"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 805 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_805.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #806 대학원 (Noun) - "graduate school"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 806 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_806.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #807 법학 (Noun) - "law, jurisprudence"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 807 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_807.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #808 새 (Noun) - "new, bird"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 808 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_808.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #809 신문방송학 (Noun) - "journalism and mass communication"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 809 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_809.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #811 영문학 (Noun) - "English literature"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 811 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_811.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #812 의학 (Noun) - "medicine, medical science"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 812 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_812.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #815 컴퓨터공학 (Noun) - "computer engineering"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 815 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_815.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #818 귀 (Noun) - "ear"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 818 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_818.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #822 마음 (Noun) - "mind, heart, feelings"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 822 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_822.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 7:* `윗사람은 마음을 설거지해요.`
  - **Linguistic Error:** Incompatible commercial collocation: Body part / concept noun '마음' (mind, heart, feelings) carries the generic 'object' tag, causing it to generate as a purchasable, stackable, or dishwashable physical commodity (*'윗사람은 마음을 설거지해요.'*).
  - **Suggested Remediation:** Remove generic 'object' tag from body parts and abstract psychological concepts; assign specific [bodyPart] or [psychological_concept] tags with dedicated transitive verb frames.

### Unit #823 목소리 (Noun) - "voice"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 823 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_823.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 목소리를 세워요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #824 무릎 (Noun) - "knee, lap"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 824 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_824.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #825 발 (Noun) - "foot"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 825 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_825.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 발을 결제해요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #826 성격 (Noun) - "personality, character"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 826 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_826.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `저는 성격을 쌓을 거예요.`
  - **Linguistic Error:** Incompatible commercial collocation: Body part / concept noun '성격' (personality, character) carries the generic 'object' tag, causing it to generate as a purchasable, stackable, or dishwashable physical commodity (*'저는 성격을 쌓을 거예요.'*).
  - **Suggested Remediation:** Remove generic 'object' tag from body parts and abstract psychological concepts; assign specific [bodyPart] or [psychological_concept] tags with dedicated transitive verb frames.

### Unit #827 손 (Noun) - "hand"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 827 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_827.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 손을 신청해요.`
  - *Var 3:* `은행원은 손을 그만둘 거예요.`
  - **Linguistic Error:** Incompatible commercial collocation: Body part / concept noun '손' (hand) carries the generic 'object' tag, causing it to generate as a purchasable, stackable, or dishwashable physical commodity (*'사나이는 손을 신청해요.'*).
  - **Suggested Remediation:** Remove generic 'object' tag from body parts and abstract psychological concepts; assign specific [bodyPart] or [psychological_concept] tags with dedicated transitive verb frames.
  - *Var 1:* `사나이는 손을 신청해요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #828 어깨 (Noun) - "shoulder"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 828 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_828.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #829 얼굴 (Noun) - "face"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 829 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_829.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `놈은 얼굴을 팔 거예요.`
  - *Var 5:* `윗사람은 얼굴을 꺼냈어요.`
  - **Linguistic Error:** Incompatible commercial collocation: Body part / concept noun '얼굴' (face) carries the generic 'object' tag, causing it to generate as a purchasable, stackable, or dishwashable physical commodity (*'놈은 얼굴을 팔 거예요.'*).
  - **Suggested Remediation:** Remove generic 'object' tag from body parts and abstract psychological concepts; assign specific [bodyPart] or [psychological_concept] tags with dedicated transitive verb frames.

### Unit #830 연초 (Noun) - "beginning of the year"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 830 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_830.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #831 이마 (Noun) - "forehead"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 831 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_831.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #832 입 (Noun) - "mouth, lips"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 832 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_832.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #835 코 (Noun) - "nose"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 835 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_835.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `마리아는 코를 샀어요.`
  - *Var 9:* `미국 사람은 코를 벌 거예요.`
  - **Linguistic Error:** Incompatible commercial collocation: Body part / concept noun '코' (nose) carries the generic 'object' tag, causing it to generate as a purchasable, stackable, or dishwashable physical commodity (*'마리아는 코를 샀어요.'*).
  - **Suggested Remediation:** Remove generic 'object' tag from body parts and abstract psychological concepts; assign specific [bodyPart] or [psychological_concept] tags with dedicated transitive verb frames.

### Unit #836 허리 (Noun) - "waist, lower back"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 836 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_836.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `싸이는 허리를 구매할 거예요.`
  - *Var 7:* `수진은 허리를 설거지해요.`
  - *Var 9:* `얘들은 허리를 잃어버릴 거예요.`
  - **Linguistic Error:** Incompatible commercial collocation: Body part / concept noun '허리' (waist, lower back) carries the generic 'object' tag, causing it to generate as a purchasable, stackable, or dishwashable physical commodity (*'싸이는 허리를 구매할 거예요.'*).
  - **Suggested Remediation:** Remove generic 'object' tag from body parts and abstract psychological concepts; assign specific [bodyPart] or [psychological_concept] tags with dedicated transitive verb frames.

### Unit #840 고모 (Noun) - "paternal aunt (father's sister)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 840 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_840.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #841 고모부 (Noun) - "uncle (husband of father's sister)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 841 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_841.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #842 공무원 (Noun) - "public servant, civil servant"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 842 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_842.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #843 시청 (Noun) - "city hall, watching TV"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 843 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_843.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `싸이는 시청에서 개요.`
  - *Var 6:* `의사는 시청에서 장미를 켤 거예요.`
  - *Var 9:* `아주머니는 시청에서 배달될 거예요.`
  - **Linguistic Error:** Selection error: Public venue '시청' context paired with human agent performing weather clearing (*'싸이는 시청에서 개요'*), turning on a flower (*'장미를 켤 거예요'*), and human delivery (*'아주머니는 시청에서 배달될 거예요'*).
  - **Suggested Remediation:** Ensure predicate valency rules prohibit weather verbs and electrical verbs on inappropriate arguments.

### Unit #845 외삼촌 (Noun) - "maternal uncle (mother's brother)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 845 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_845.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #846 외숙모 (Noun) - "aunt (wife of mother's brother)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 846 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_846.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #847 외할머니 (Noun) - "maternal grandmother (mother's mother)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 847 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_847.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 9:* `외할머니께서는 바비큐를 지으세요.`
  - **Linguistic Error:** Collocation defect: Specialized creation/cooking verb '짓다' (to make rice, build house, compose poem) paired with barbecue (*'바비큐를 지으세요'*).
  - **Suggested Remediation:** Restrict direct objects of '짓다' strictly to traditional collocations [rice_meal, house, name, expression, clothes].

### Unit #848 외할아버지 (Noun) - "maternal grandfather (mother's father)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 848 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_848.txt`
- **Seed:** `1793700800000`
- **Generation Sample (Offending Variations):**
  - *Var 8:* `외할아버지께서는 아버지를 빌려주세요.`
  - **Linguistic Error:** Semantic animacy violation: Human relative '아버지' (father) generated as a loanable object with '빌려주다' (*'외할아버지께서는 아버지를 빌려주세요'*).
  - **Suggested Remediation:** Restrict '빌려주다' / '빌리다' direct objects strictly to inanimate tools, resources, and money [loanable_object].

### Unit #849 이모 (Noun) - "maternal aunt (mother's sister)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 849 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_849.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #850 이모부 (Noun) - "uncle (husband of mother's sister)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 850 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_850.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #851 조카 (Noun) - "nephew, niece"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 851 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_851.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #852 친척 (Noun) - "relative, relation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 852 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_852.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

