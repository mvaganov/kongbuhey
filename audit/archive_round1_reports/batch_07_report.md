# Linguistic Audit Report: Batch 07 (Nouns Part A)

> **Batch ID:** 07  
> **Category:** Nouns (Part A: Basic Concrete Nouns, People, Places, Foods, Counters & Time)  
> **Target Manifest:** `audit/batches/batch_07_nouns_part_a.json`  
> **Total In-Scope Units:** 221  
> **PRNG Seed:** `1793700700000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (221 / 221 Analyzed)**  
> **Audit Summary:** **Clean: 187 units (85%) | Flagged: 34 units (15%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 07 audits the first quintile of Nouns (221 units, IDs 0..438), covering nationalities and countries, basic people and professions, classroom and household concrete artifacts, physical spatial relations, Korean foods and beverages, numerical counter classifiers, sports activities and facilities, and calendar/temporal nouns.

### Key Discoveries & Root Causes:

1. **Self-Generation Breakdown of Unit #250 `나이` (Age):**
   - The systemic `person` tag pollution on Unit 250 (`나이`, age) produced absurd sentences when `나이` itself was tested:
     - `나이` generated as an agent folding furniture (*`나이는 가구를 접어요`*), throwing away wedding bouquets (*`나이는 부케를 버렸어요`*), and tying up medicine (*`나이는 의학을 묶을 거예요`*).
     - It was modified by food taste statives (*`나이가 맛있었어요`*, *`나이가 달았어요`*).
   - Re-tagging Unit 250 to `person_attribute` remains the highest-priority schema fix.

2. **Parts-of-Speech Misclassification of `지난` (ID 438):**
   - `지난` (past, last) is labeled as `Noun` in `data.js` rather than `Determiner` (Prenoun / 관형사).
   - Consequently, the generator treated it as an independent temporal noun and attached bare locative `-에`, producing the ungrammatical form *`지난에`* across **all 10 variations** (*`지난에 시디를 쓸어요`*, *`지난에 세탁기가 유행였어요`*).
   - `지난` strictly requires a temporal head noun (`지난주`, `지난달`, `지난해`, `지난번`).

3. **Classifier Concord & Containment Violations (Counters):**
   - **Liquid Counters (`병`, `잔`, Units 331 & 332):** Conflated drink nouns with commercial beverage venues, outputting *`카페 네 병이 있어요`* (four bottles of cafe) and *`커피숍 세 잔이 있어요`* (three cups of coffee shop).
   - **Roll Counter (`줄`, Unit 333):** Selected cafeterias (*`학생식당 네 줄`*), soybean paste (*`된장 두 줄`*), and produced the surreal honorific collocation: *`진지 한 줄께서 계셔요`* ("One roll of esteemed meal is honorably residing").
   - **Sheet/Pan Counter (`판`, Unit 334):** Counted individual small fruits (*`사과 두 판`*, *`감 네 판`*) and bowls of rice (*`밥 세 판`*) rather than flat baked goods or sheet eggs (피자, 파전, 계란 판).

4. **Sociolinguistic Honorific Inversion & Self-Exaltation:**
   - **Self-Exaltation:** Humble 1st-person speaker `저` was combined with the esteemed elder predicate `주무시다` (*`저는 스키장에서 주무셨어요`* in Unit 385).
   - **Directionality Inversion:** Junior subject `아이` (child) was paired with the elder honorific eating predicate `잡수시다` (*`아이는 사과를 잡수셨어요`* in Unit 297).

5. **Culinary Collocation Failures on Food Nouns:**
   - Continuing the domain granularity gap observed in Batches 05–06, food nouns were paired with incompatible culinary actions:
     - Mincing soup: *`나는 삼계탕을 다졌어요`* (Unit 298).
     - Deep-frying noodle soup: *`기사는 자장면을 튀길 거예요`* (Unit 305).
     - Grilling soup on an open grill: *`의사는 짬뽕을 구워요`* (Unit 306).
     - Mincing or sprinkling whole kimbap rolls: *`마리는 김밥을 다져요`*, *`회원은 김밥을 뿌릴 거예요`* (Unit 326).

6. **Flawless Tense Concord on Temporal Nouns (`no_time_particle`):**
   - Units with `no_time_particle` (`어제` ID 419, `내일` ID 424, `모레` ID 430) achieved **100% precision**:
     - None generated ungrammatical *`-에`* (*`어제에`*, *`내일에`*).
     - `어제` generated 10/10 strictly past-tense verbs (`선택했어요`, `들었어요`, `쌌어요`).
     - `내일` and `모레` generated 10/10 strictly future-tense constructions (`-(으)ㄹ 거예요`).

---

## 2. Detailed Unit-by-Unit Linguistic Evaluations

### Unit #0 미국 사람 (Noun) - "American person"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 0 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_0.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1 이름 (Noun) - "name"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_1.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #6 나라 (Noun) - "country"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 6 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_6.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `공무원은 나라에 입학했어요.`
  - *Var 6:* `종업원은 나라에 걸어갈 거예요.`
  - **Linguistic Error:** Macro-locative scale violation: Sovereign territory '나라' (country) paired with school matriculation (*'나라에 입학했어요'*) and walking on foot (*'나라에 걸어갈 거예요'*).
  - **Suggested Remediation:** Distinguish macro-geographic territories [place_macro] from educational institutions and walkable building locations.
  - *Var 3:* `사나이는 나라에서 액세서리를 열 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #7 노르웨이 (Noun) - "Norway"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 7 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_7.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #8 미국 (Noun) - "the U.S."
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 8 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_8.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 8:* `사나이는 미국에서 신분증을 바꿨어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #9 베트남 (Noun) - "Vietnam"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 9 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_9.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #10 브라질 (Noun) - "Brazil"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 10 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_10.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #11 사람 (Noun) - "person"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 11 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_11.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #12 일본 (Noun) - "Japan"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 12 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_12.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #13 중국 (Noun) - "China"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 13 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_13.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 중국에서 채소를 덜어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #14 케냐 (Noun) - "Kenya"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 14 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_14.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #15 프랑스 (Noun) - "France"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 15 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_15.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #16 한국 (Noun) - "Korea"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 16 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_16.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #17 한국 사람 (Noun) - "Korean person"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 17 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_17.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #18 호주 (Noun) - "Australia"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 18 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_18.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #24 학생 (Noun) - "student"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 24 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_24.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #25 회사원 (Noun) - "company worker"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 25 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_25.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #27 가수 (Noun) - "singer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 27 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_27.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #28 간호사 (Noun) - "nurse"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 28 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_28.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #29 기자 (Noun) - "journalist"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 29 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_29.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #31 배우 (Noun) - "actor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 31 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_31.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #32 선생님 (Noun) - "teacher"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 32 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_32.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #33 요리사 (Noun) - "chef"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 33 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_33.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #34 은행원 (Noun) - "bank teller"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 34 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_34.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #35 의사 (Noun) - "doctor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 35 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_35.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #38 밥 (Noun) - "rice/meal"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 38 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_38.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #39 물 (Noun) - "water"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 39 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_39.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #45 오늘 (Noun) - "today"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 45 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_45.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #46 내일 (Noun) - "tomorrow"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 46 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_46.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #58 교실 (Noun) - "classroom"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 58 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_58.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #64 컴퓨터 (Noun) - "computer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 64 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_64.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #65 거울 (Noun) - "mirror"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 65 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_65.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `미진은 거울을 다림질할 거예요.`
  - *Var 9:* `약사는 거울을 질문할 거예요.`
  - **Linguistic Error:** Semantic selection violation: Inanimate glass object '거울' (mirror) paired with garment ironing (*'거울을 다림질할 거예요'*) and speech questions (*'거울을 질문할 거예요'*).
  - **Suggested Remediation:** Restrict '다림질하다' to [clothing] and '질문하다' to [interpersonal, academic].
  - *Var 7:* `사나이는 거울을 이어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #67 달력 (Noun) - "calendar"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 67 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_67.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #68 지도 (Noun) - "map"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 68 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_68.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #69 문 (Noun) - "door"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 69 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_69.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #70 시계 (Noun) - "clock"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 70 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_70.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #71 옷걸이 (Noun) - "coat hanger"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 71 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_71.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #72 의자 (Noun) - "chair"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 72 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_72.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #74 창문 (Noun) - "window"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 74 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_74.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #75 책상 (Noun) - "desk"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 75 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_75.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #76 친구 (Noun) - "friend"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 76 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_76.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #77 칠판 (Noun) - "blackboard"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 77 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_77.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #78 텔레비전 (Noun) - "television"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 78 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_78.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #79 공책 (Noun) - "notebook"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 79 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_79.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 9:* `사나이는 공책을 찾을 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #80 책 (Noun) - "book"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 80 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_80.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #83 가방 (Noun) - "bag"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 83 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_83.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 10:* `가방이 졸려요.`
  - **Linguistic Error:** Semantic animacy violation: Inanimate object '가방' (bag) paired with psychological/biological state '졸리다' (*'가방이 졸려요'*).
  - **Suggested Remediation:** Restrict '졸리다' strictly to sentient [animate, person, animal] subjects.

### Unit #84 돈 (Noun) - "money"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 84 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_84.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #85 볼펜 (Noun) - "pen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 85 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_85.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #86 신문 (Noun) - "newspaper"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 86 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_86.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #87 연필 (Noun) - "pencil"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 87 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_87.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `형은 연필을 예매했어요.`
  - **Linguistic Error:** Semantic selection violation: Writing tool '연필' (pencil) paired with advance ticket reservation verb '예매하다' (*'연필을 예매했어요'*).
  - **Suggested Remediation:** Restrict '예매하다' direct objects strictly to tickets, performances, and transit bookings [ticket, reservation].

### Unit #88 잡지 (Noun) - "magazine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 88 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_88.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #89 지갑 (Noun) - "wallet"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 89 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_89.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #90 지우개 (Noun) - "eraser"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 90 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_90.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 4:* `지우개가 여요.`
  - **Linguistic Error:** Copula inflection bug: Unit 55 '이다' misconjugated into bare clitic defect '*여요*' or '*였어요*' (*'지우개가 여요.'*) instead of bound nominal predicative ending '이에요/예요' or '이었어요/였어요'.
  - **Suggested Remediation:** Patch Unit 55 '이다' copula engine to conjugate as bound clitic attaching directly to nouns without space: consonant-final noun -> -이에요/-이었어요; vowel-final noun -> -예요/-였어요.

### Unit #91 필통 (Noun) - "pencil case"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 91 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_91.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #92 학생증 (Noun) - "student ID card"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 92 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_92.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `누구는 학생증을 벌 거예요.`
  - *Var 7:* `우리는 학생증을 실례해요.`
  - **Linguistic Error:** Semantic selection violation: Identification artifact '학생증' (student ID card) paired with income earning '벌다' (*'학생증을 벌 거예요'*) and social etiquette '실례하다' (*'학생증을 실례해요'*).
  - **Suggested Remediation:** Restrict '벌다' to currency/resources [money] and enforce intransitive status on '실례하다'.

### Unit #93 휴대전화 (Noun) - "cell phone"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 93 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_93.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #94 휴지 (Noun) - "tissue"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 94 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_94.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #97 도서관 (Noun) - "library"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 97 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_97.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #98 안 (Noun) - "inside"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 98 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_98.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #99 앞 (Noun) - "front"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 99 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_99.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `비행기 앞에 나이가 있어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #101 은행 (Noun) - "bank"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 101 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_101.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #102 학생회관 (Noun) - "student union"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 102 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_102.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #103 기숙사 (Noun) - "dormitory"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 103 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_103.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #104 꽃 (Noun) - "flower"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 104 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_104.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #105 뒤 (Noun) - "behind"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 105 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_105.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #106 밖 (Noun) - "outside"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 106 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_106.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #107 사무실 (Noun) - "office"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 107 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_107.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #108 서점 (Noun) - "bookstore"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 108 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_108.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #109 식당 (Noun) - "restaurant"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 109 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_109.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 식당에서 되어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #110 아래 (Noun) - "below/under"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 110 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_110.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #111 옆 (Noun) - "next to"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 111 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_111.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #112 우체국 (Noun) - "post office"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 112 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_112.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #113 위 (Noun) - "above"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 113 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_113.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #115 체육관 (Noun) - "gym"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 115 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_115.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #116 편의점 (Noun) - "convenience store"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 116 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_116.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #117 근처 (Noun) - "near"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 117 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_117.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #118 방 (Noun) - "room"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 118 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_118.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #119 학생식당 (Noun) - "student cafeteria"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 119 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_119.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #123 날씨 (Noun) - "weather"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 123 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_123.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #133 저분 (Noun) - "that person (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 133 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_133.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #134 한국말 (Noun) - "Korean language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 134 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_134.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #137 베트남말 (Noun) - "Vietnamese language"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 137 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_137.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 8:* `베트남말이 였어요.`
  - **Linguistic Error:** Copula inflection bug: Unit 55 '이다' misconjugated into bare clitic defect '*여요*' or '*였어요*' (*'베트남말이 였어요.'*) instead of bound nominal predicative ending '이에요/예요' or '이었어요/였어요'.
  - **Suggested Remediation:** Patch Unit 55 '이다' copula engine to conjugate as bound clitic attaching directly to nouns without space: consonant-final noun -> -이에요/-이었어요; vowel-final noun -> -예요/-였어요.

### Unit #138 빵 (Noun) - "bread"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 138 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_138.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #139 영어 (Noun) - "English language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 139 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_139.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #140 음악 (Noun) - "Music"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 140 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_140.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #141 일본말 (Noun) - "Japanese language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 141 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_141.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #142 중국말 (Noun) - "Chinese language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 142 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_142.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #143 커피 (Noun) - "coffee"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 143 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_143.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #144 프랑스말 (Noun) - "French language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 144 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_144.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #154 지금 (Noun) - "now"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 154 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_154.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #155 게임 (Noun) - "game"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 155 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_155.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #157 피시방 (Noun) - "internet cafe"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 157 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_157.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #159 꽃집 (Noun) - "flower shop"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 159 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_159.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #160 노래방 (Noun) - "karaoke"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 160 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_160.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #161 문구점 (Noun) - "stationery store"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 161 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_161.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #162 백화점 (Noun) - "department store"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 162 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_162.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #163 빵집 (Noun) - "bakery"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 163 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_163.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #164 찜질방 (Noun) - "korean sauna"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 164 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_164.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #165 태권도 (Noun) - "taekwondo"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 165 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_165.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #174 고향 (Noun) - "hometown"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 174 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_174.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #175 바다 (Noun) - "ocean"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 175 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_175.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #176 수영 (Noun) - "swimming"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 176 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_176.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #178 강 (Noun) - "river"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 178 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_178.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #179 산 (Noun) - "mountain"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 179 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_179.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #180 집 (Noun) - "house/home"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 180 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_180.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #181 호수 (Noun) - "lake"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 181 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_181.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #182 회사 (Noun) - "company"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 182 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_182.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 9:* `사나이는 회사에서 답장을 쓸 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #183 서울 (Noun) - "Seoul"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 183 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_183.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #186 경치 (Noun) - "scenery"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 186 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_186.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #187 남자 (Noun) - "man"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 187 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_187.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #188 생선 (Noun) - "fish (food)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 188 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_188.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #189 생활 (Noun) - "life/living"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 189 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_189.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #190 여자 (Noun) - "woman"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 190 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_190.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #202 반 (Noun) - "half"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 202 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_202.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #204 시 (Noun) - "hour/o'clock"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 204 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_204.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #206 점심 (Noun) - "lunch"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 206 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_206.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #208 아침 (Noun) - "morning/breakfast"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 208 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_208.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `사나이는 아침에 잡지를 세울 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #209 영화 (Noun) - "movie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 209 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_209.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #210 오전 (Noun) - "morning/AM"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 210 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_210.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #211 오후 (Noun) - "afternoon/PM"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 211 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_211.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #212 저녁 (Noun) - "dinner/evening"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 212 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_212.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #224 교과서 (Noun) - "textbook"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 224 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_224.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #225 대화 (Noun) - "conversation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 225 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_225.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #226 번 (Noun) - "times/number"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 226 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_226.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #227 수업 (Noun) - "class"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 227 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_227.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #228 숙제 (Noun) - "homework"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 228 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_228.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 7:* `사나이는 숙제를 끝내요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #229 쪽 (Noun) - "page"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 229 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_229.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #249 분 (Noun) - "minute"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 249 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_249.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #250 나이 (Noun) - "age"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 250 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_250.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `나이는 가구를 접어요.`
  - *Var 2:* `나이가 맛있었어요.`
  - *Var 3:* `나이는 의학을 묶을 거예요.`
  - **Linguistic Error:** Critical person tag pollution: Abstract noun '나이' (age) carries the 'person' tag in data.js, causing it to generate as an agentive human subject performing volitional actions (*'나이는 가구를 접어요'*, *'나이는 부케를 버렸어요'*), as well as being modified by food adjectives (*'나이가 맛있었어요'*).
  - **Suggested Remediation:** Reclassify Unit 250 '나이' from 'person' to 'person_attribute' in data.js.

### Unit #285 불고기 (Noun) - "bulgogi"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 285 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_285.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #289 무슨 (Noun) - "what kind"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 289 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_289.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #291 과일 (Noun) - "fruit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 291 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_291.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #292 냉면 (Noun) - "cold noodles"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 292 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_292.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #293 녹차 (Noun) - "green tea"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 293 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_293.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #294 딸기 (Noun) - "strawberry"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 294 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_294.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #295 맛 (Noun) - "taste"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 295 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_295.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #296 비빔밥 (Noun) - "bibimbap"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 296 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_296.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #297 사과 (Noun) - "apple"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 297 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_297.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 10:* `아이는 사과를 잡수셨어요.`
  - **Linguistic Error:** Sociolinguistic honorific violation: Junior subject '아이' (child) paired with esteemed elder honorific predicate '잡수시다' (*'아이는 잡수셨어요'*).
  - **Suggested Remediation:** Restrict honorific predicates (잡수시다, 주무시다) strictly to subjects marked with [elder_noun] or [honorific].

### Unit #298 삼계탕 (Noun) - "ginseng chicken soup"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 298 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_298.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `나는 삼계탕을 다졌어요.`
  - **Linguistic Error:** Culinary collocation violation: Food noun '삼계탕' (ginseng chicken soup) paired with incompatible cooking verb (*'나는 삼계탕을 다졌어요.'*).
  - **Suggested Remediation:** Refine [food] sub-tags to distinguish liquid soups, noodles, and rolled foods from minceable/deep-fryable solids.
  - *Var 7:* `사나이는 삼계탕을 잡수셔요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #299 샌드위치 (Noun) - "sandwich"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 299 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_299.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #300 서양 (Noun) - "western"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 300 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_300.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `사나이는 서양에서 치마를 입을 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #301 액션영화 (Noun) - "action movie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 301 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_301.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #302 우동 (Noun) - "udon"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 302 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_302.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #303 유자차 (Noun) - "citron tea"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 303 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_303.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 7:* `사나이는 유자차를 마셔요.`
  - *Var 9:* `사나이는 유자차를 마실 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #304 음식 (Noun) - "food"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 304 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_304.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #305 자장면 (Noun) - "jajangmyeon"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 305 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_305.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `기사는 자장면을 튀길 거예요.`
  - **Linguistic Error:** Culinary collocation violation: Food noun '자장면' (jajangmyeon) paired with incompatible cooking verb (*'기사는 자장면을 튀길 거예요.'*).
  - **Suggested Remediation:** Refine [food] sub-tags to distinguish liquid soups, noodles, and rolled foods from minceable/deep-fryable solids.

### Unit #306 짬뽕 (Noun) - "jjamppong"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 306 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_306.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 7:* `의사는 짬뽕을 구워요.`
  - **Linguistic Error:** Culinary collocation violation: Food noun '짬뽕' (jjamppong) paired with incompatible cooking verb (*'의사는 짬뽕을 구워요.'*).
  - **Suggested Remediation:** Refine [food] sub-tags to distinguish liquid soups, noodles, and rolled foods from minceable/deep-fryable solids.

### Unit #307 차 (Noun) - "tea"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 307 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_307.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #308 초밥 (Noun) - "sushi"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 308 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_308.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #309 코미디 영화 (Noun) - "comedy movie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 309 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_309.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #310 피자 (Noun) - "pizza"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 310 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_310.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #318 그릇 (Noun) - "bowl"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 318 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_318.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #319 삼겹살 (Noun) - "pork belly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 319 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_319.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #320 인분 (Noun) - "portion"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 320 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_320.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #326 김밥 (Noun) - "kimbap"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 326 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_326.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `마리는 김밥을 다져요.`
  - *Var 3:* `언니는 김밥을 튀길 거예요.`
  - *Var 9:* `회원은 김밥을 뿌릴 거예요.`
  - **Linguistic Error:** Culinary collocation violation: Food noun '김밥' (kimbap) paired with incompatible cooking verb (*'마리는 김밥을 다져요.'*).
  - **Suggested Remediation:** Refine [food] sub-tags to distinguish liquid soups, noodles, and rolled foods from minceable/deep-fryable solids.

### Unit #327 맥주 (Noun) - "beer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 327 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_327.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #329 개 (Noun) - "item"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 329 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_329.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #330 마리 (Noun) - "animal counter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 330 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_330.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #331 병 (Noun) - "bottle"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 331 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_331.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 4:* `카페 네 병이 있어요.`
  - *Var 5:* `커피숍 한 병이 있어요.`
  - **Linguistic Error:** Counter semantic violation: Liquid drink classifier '병' (bottle) paired with commercial venue nouns (*'카페 네 병이 있어요.'*) instead of drink items (물, 주스, 맥주, 콜라).
  - **Suggested Remediation:** Disambiguate [drink] tag from [venue] so commercial buildings (카페, 커피숍) cannot be counted with liquid container classifiers (병, 잔).

### Unit #332 잔 (Noun) - "cup"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 332 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_332.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `커피숍 세 잔이 있어요.`
  - **Linguistic Error:** Counter semantic violation: Liquid drink classifier '잔' (cup) paired with commercial venue nouns (*'커피숍 세 잔이 있어요.'*) instead of drink items (물, 주스, 맥주, 콜라).
  - **Suggested Remediation:** Disambiguate [drink] tag from [venue] so commercial buildings (카페, 커피숍) cannot be counted with liquid container classifiers (병, 잔).

### Unit #333 줄 (Noun) - "row"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 333 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_333.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 2:* `된장 두 줄이 있어요.`
  - *Var 4:* `학생식당 네 줄이 있어요.`
  - *Var 6:* `서비스 두 줄이 있어요.`
  - **Linguistic Error:** Counter semantic violation: Roll/row classifier '줄' paired with cafeterias (*'학생식당 네 줄이 있어요'*), paste (*'된장 두 줄이 있어요'*), and honorific meals (*'진지 한 줄께서 계셔요'*).
  - **Suggested Remediation:** Restrict classifier '줄' in food contexts to roll items [food_roll] (김밥) or linear queues.

### Unit #334 판 (Noun) - "plate/pan"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 334 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_334.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 4:* `감 네 판이 있어요.`
  - *Var 6:* `소스 두 판이 있어요.`
  - *Var 7:* `밥 세 판이 있어요.`
  - **Linguistic Error:** Counter semantic violation: Flat whole-sheet / pan classifier '판' paired with individual fruits (*'사과 두 판'*, *'감 네 판'*), sauces, and bowls of rice.
  - **Suggested Remediation:** Restrict classifier '판' to flat baked / whole sheet items [food_sheet] (피자, 파전, 계란 한 판).

### Unit #337 오늘 (Noun) - "today"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 337 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_337.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #338 요일 (Noun) - "day of the week"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 338 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_338.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #339 토요일 (Noun) - "Saturday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 339 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_339.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #341 생일 (Noun) - "birthday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 341 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_341.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #342 크리스마스 (Noun) - "Christmas"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 342 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_342.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #343 월요일 (Noun) - "Monday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 343 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_343.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #344 화요일 (Noun) - "Tuesday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 344 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_344.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #345 수요일 (Noun) - "Wednesday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 345 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_345.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #346 목요일 (Noun) - "Thursday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 346 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_346.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #347 금요일 (Noun) - "Friday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 347 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_347.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #348 일요일 (Noun) - "Sunday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 348 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_348.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #349 월 (Noun) - "month"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 349 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_349.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #350 일 (Noun) - "day"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 350 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_350.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #351 산책 (Noun) - "stroll"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 351 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_351.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #361 이 (Noun) - "teeth"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 361 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_361.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 9:* `사나이는 이를 닦을 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #368 운동장 (Noun) - "playground"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 368 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_368.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #369 주말 (Noun) - "weekend"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 369 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_369.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #370 축구 (Noun) - "soccer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 370 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_370.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #374 골프 (Noun) - "golf"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 374 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_374.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #375 골프장 (Noun) - "golf course"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 375 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_375.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #376 농구 (Noun) - "basketball"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 376 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_376.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #377 농구장 (Noun) - "basketball court"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 377 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_377.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `우리는 농구장에 지각해요.`
  - **Linguistic Error:** Academic verb leakage: Sports facility '농구장' paired with academic attendance/tardiness verb (*'우리는 농구장에 지각해요.'*).
  - **Suggested Remediation:** Restrict '출석하다' and '지각하다' to [academic_institution, class, meeting].
  - *Var 6:* `사나이는 농구장에서 열쇠고리를 결제할 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #378 서핑 (Noun) - "surfing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 378 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_378.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #379 수영 (Noun) - "swimming"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 379 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_379.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #380 수영장 (Noun) - "swimming pool"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 380 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_380.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 7:* `놈은 수영장에 출석해요.`
  - **Linguistic Error:** Academic verb leakage: Sports facility '수영장' paired with academic attendance/tardiness verb (*'놈은 수영장에 출석해요.'*).
  - **Suggested Remediation:** Restrict '출석하다' and '지각하다' to [academic_institution, class, meeting].
  - *Var 10:* `사나이는 수영장에서 서둘러요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #381 스노보드 (Noun) - "snowboard"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 381 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_381.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #382 스케이트 (Noun) - "skate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 382 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_382.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #383 스케이트장 (Noun) - "skating rink"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 383 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_383.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #384 스키 (Noun) - "ski"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 384 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_384.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #385 스키장 (Noun) - "ski resort"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 385 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_385.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `저는 스키장에서 주무셨어요.`
  - **Linguistic Error:** Sociolinguistic honorific violation: Humble 1st-person speaker ('저') combined with subject-honorific predicate '주무시다' (*'저는 주무셨어요'*), violating the rule prohibiting self-exaltation.
  - **Suggested Remediation:** Enforce honorific concord preventing 1st-person subjects ('저', '나', '우리', '저희') from selecting subject-exalting predicates (주무시다, 잡수시다, 계시다, 편찮으시다).

### Unit #386 요가 (Noun) - "yoga"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 386 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_386.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #387 지하철 (Noun) - "subway"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 387 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_387.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #388 탁구 (Noun) - "table tennis"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 388 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_388.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #389 탁구장 (Noun) - "table tennis room"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 389 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_389.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #390 테니스 (Noun) - "tennis"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 390 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_390.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #391 테니스장 (Noun) - "tennis court"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 391 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_391.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #401 김치 (Noun) - "kimchi"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 401 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_401.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #402 아이 (Noun) - "child"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 402 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_402.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #403 한식 (Noun) - "Korean food"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 403 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_403.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #418 공원 (Noun) - "park"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 418 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_418.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #419 어제 (Noun) - "yesterday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 419 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_419.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #421 그제 (Noun) - "day before yesterday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 421 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_421.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #422 금년 (Noun) - "this year (sino)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 422 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_422.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #423 내년 (Noun) - "next year"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 423 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_423.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #424 내일 (Noun) - "tomorrow"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 424 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_424.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #425 다음일 (Noun) - "next task"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 425 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_425.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #426 다음 (Noun) - "next"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 426 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_426.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #427 달 (Noun) - "month/moon"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 427 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_427.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #428 다음달 (Noun) - "next month"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 428 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_428.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #429 다음주 (Noun) - "next week"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 429 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_429.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #430 모레 (Noun) - "day after tomorrow"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 430 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_430.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #431 올해 (Noun) - "this year"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 431 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_431.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #432 이번 (Noun) - "this time"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 432 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_432.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 8:* `이번에 지갑이 였어요.`
  - **Linguistic Error:** Copula inflection bug: Unit 55 '이다' misconjugated into bare clitic defect '*여요*' or '*였어요*' (*'이번에 지갑이 였어요.'*) instead of bound nominal predicative ending '이에요/예요' or '이었어요/였어요'.
  - **Suggested Remediation:** Patch Unit 55 '이다' copula engine to conjugate as bound clitic attaching directly to nouns without space: consonant-final noun -> -이에요/-이었어요; vowel-final noun -> -예요/-였어요.
  - *Var 5:* `사나이는 이번에 노래를 다운로드했어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #433 작년 (Noun) - "last year (sino)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 433 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_433.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #434 지난해 (Noun) - "last year"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 434 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_434.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #435 주 (Noun) - "week"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 435 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_435.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #436 지난달 (Noun) - "last month"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 436 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_436.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #437 지난주 (Noun) - "last week"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 437 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_437.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 지난주에 꽃다발을 즐겼어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (Unit 250) leaked into generation context due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #438 지난 (Noun) - "previous"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 438 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_438.txt`
- **Seed:** `1793700700000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `유키는 지난에 시디를 쓸어요.`
  - *Var 2:* `지난에 세탁기가 유행였어요.`
  - *Var 3:* `윗사람은 지난에 목걸이를 갈아입을 거예요.`
  - **Linguistic Error:** POS misclassification: Adnominal determiner '지난' (last, past) is classified as 'Noun' in data.js, causing it to take bare locative '-에' (*'지난에'*) across all 10 variations instead of modifying a temporal head noun ('지난주에', '지난달에', '지난해에').
  - **Suggested Remediation:** Reclassify Unit 438 '지난' from 'Noun' to 'Determiner' (Prenoun / 관형사) with syntactic requirement for a temporal head noun.

