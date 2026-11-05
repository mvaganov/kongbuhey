# Linguistic Audit Report: Batch 11 (Nouns Part E)

> **Batch ID:** 11  
> **Category:** Nouns (Part E: Classifiers/Counters, Bound Roots & Modifiers, Proper Names, Urban Toponyms & Colloquial Terms)  
> **Target Manifest:** `audit/batches/batch_11_nouns_part_e.json`  
> **Total In-Scope Units:** 221  
> **PRNG Seed:** `1793701100000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (221 / 221 Analyzed)**  
> **Audit Summary:** **Clean: 203 units (92%) | Flagged: 18 units (8%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 11 completes the linguistic audit of the final quintile of Nouns (221 units, IDs 1691..2044) and concludes the curriculum-wide audit of all 2,045 units. This batch encompasses numerical counters/classifiers (`명`, `살`, `대`, `채`, `호`, `학년`, `편`, `%`), bound roots and dependent nouns (`인간적`, `감각적`, `데`), proper personal names (`지훈`, `수진`, `영수`, `싸이`), Seoul urban toponyms and administrative districts (`신촌`, `창천동`, `상수동`, `마포구`, `서대문구`, `강남`), and colloquial/social nouns.

### Key Discoveries & Root Causes:

1. **Root Nominal Affix Bug on Sino-Korean Modifiers (`-적` Words: Units #2012 `인간적`, #2037 `감각적`):**
   - The generator classifies words ending in the Sino-Korean adjectival suffix `-적` (`인간적` humane/warm, `감각적` sensuous/stylish) as standard nominals in `data.js`. Consequently, they were generated with bare nominal case particles:
     - Subject case: *`인간적이 작아요`*, *`인간적이 쉬워요`*, *`감각적이 쉬워요`*, *`감각적이 많을 거예요`*.
     - Object case: *`아주머니는 인간적을 배워요`*, *`동창은 인간적을 고를 거예요`*, *`노인은 감각적을 기다려요`*, *`우리는 감각적을 바꿨어요`*.
   - *Linguistic Reality:* In Korean grammar, `-적` stems cannot act as bare nominal arguments taking `이/가` or `을/를`. They are bound modifier roots requiring:
     - Adnominal marker `-적인` (`인간적인 마음`, `감각적인 디자인`).
     - Adverbial marker `-적으로` (`인간적으로`, `감각적으로`).
     - Predicative copula `-적이다` (`인간적이다`, `감각적이다`).
   - *Mitigation:* Reclassify `-적` modifier stems with a dedicated syntactic type or constrain them to bound clitic frames (`-적인`, `-적으로`, `-적이다`), strictly disallowing bare subject/object particle attachment.

2. **Bound Noun Syntactic Dependency Violation (Unit #2025 `데`):**
   - Unit 2025 `데` (place, spot, circumstance) is a bound noun (의존명사) that strictly requires a preceding adnominal clause (`-(으)ㄴ/는/-(으)ㄹ 데`).
   - The generator treated `데` as an independent spatial head noun, generating completely bare spatial particles:
     - *`회원은 데에서 파스타를 시켜요`*, *`에릭은 데에서 잤어요`*, *`남자는 데에 건널 거예요`*, *`미진은 데에서 휴지를 메요`*.
   - *Mitigation:* Enforce bound noun dependency rules for `데`, requiring a preceding adnominal verbal modifier (e.g., `가는 데`, `사는 데`, `조용한 데`).

3. **Classifier & Numerical Counter Collocation Deficiencies:**
   - Numerical classifiers were frequently combined with incompatible semantic nouns:
     - `살` (ID 1713, age classifier): applied to adults and seniors (*`어른 한 살`*, *`노인 네 살`*) and paired with subject honorific concord (*`연세 네 살께서 계셔요`*).
     - `대` (ID 1714, vehicle/machinery counter): applied to tickets (*`비행기 표 세 대`*, *`교통카드 한 대`*), trips (*`왕복 두 대`*), strap handles (*`손잡이 네 대`*), station platforms (*`승강장 세 대`*), and verbal action nouns (*`승차 두 대`*).
     - `채` (ID 1715, building counter): applied to utility bills (*`공과금 세 채`*) and residence nouns with honorific subject concord (*`댁 한 채께서 계셔요`*).
     - `호` (ID 1716, room number counter): applied to internal domestic rooms (*`베란다 이 호`*, *`거실 일 호`*).
     - `학년` (ID 1717, school grade counter): applied to homework (*`숙제 일 학년`*), academic disciplines (*`한국학 사 학년`*), and campus buildings (*`대강당 사 학년`*).
     - `편` (ID 1913, media/literary work counter): applied to stationery, furniture, and appliances (*`피아노 한 편`*, *`필통 두 편`*, *`우산 세 편`*, *`세탁기 네 편`*).
     - `%` (ID 1938, percent counter): applied as a discrete item classifier for physical objects (*`꽃 세 %`*, *`슬리퍼 한 %`*, *`가전제품 한 %`*).
   - *Mitigation:* Bind each numerical classifier strictly to its valid semantic taxons (e.g., `대` $ightarrow$ `[vehicle, machine, appliance]`, `편` $ightarrow$ `[media_work, film, literature]`, `%` $ightarrow$ `[rate_proportion]`).

4. **Honorific Concord Violations (`말씀` ID 1697, `톨게이트` ID 1899, `라면` ID 1724):**
   - Non-human honorific noun `말씀` (speech/word) received the human subject honorific particle `께서`: *`말씀께서는 유명하셨어요`*, *`말씀께서 좋으세요`*, *`말씀께서 중요하셨어요`*. In Korean, `께서` is restricted strictly to exalted persons; inanimate speech takes `이/가` (`말씀이 옳으세요`).
   - First-person self-exaltation with dynamic locative mismatch: *`우리는 톨게이트에서 계셔요`* in Unit 1899 (combining 1st-person plural subject `우리` with elder-exalting suppletive `계시다`, plus `에서` instead of static `에`).
   - Plain/colloquial masculine noun paired with elder-exalting verb: *`사나이는 라면을 드셔요`* in Unit 1724.

5. **Abstract Nouns Treated as Retail Commodities:**
   - Sleep (`잠` ID 1999) was purchased and priced: *`부부는 잠을 사요`*, *`잠이 싸요`*.
   - Portability (`휴대` ID 1936) was sized and priced: *`휴대는 컸어요`*, *`휴대가 싸요`*, *`휴대가 비쌌어요`*.
   - Cultural style/song (`강남스타일` ID 2007) was priced: *`강남스타일이 비쌀 거예요`*.

6. **Animacy Mismatch on Human Nouns (`놈` ID 2044, `사나이` ID 2019):**
   - Colloquial human noun `놈` was paired with meteorological/terrain statives: *`놈이 맑았어요`*, *`놈이 울퉁불퉁해요`*.
   - Masculine human noun `사나이` was paired with spatial width statives: *`사나이가 좁았어요`*.

7. **Collateral Verb Contraction Defect on `모으다` (ID 1103):**
   - Generated as contracted defect *`뫄요`* in Unit 2025 var 4: *`친구는 데에서 두루마리를 뫄요`*.

---

## 2. Detailed Unit-by-Unit Linguistic Evaluations

### Unit #1691 지훈 (Noun) - "Jihoon (given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1691 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1691.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1692 수진 (Noun) - "Sujin (given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1692 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1692.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1696 식사 (Noun) - "meal, dining"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1696 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1696.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1697 말씀 (Noun) - "words, speech (honorific or humble form of 말)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1697 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1697.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 2:* `말씀께서는 유명하셨어요.`
  - *Var 4:* `말씀께서 좋으세요.`
  - *Var 6:* `말씀께서 쉬우세요.`
  - **Linguistic Error:** Honorific particle '께서' erroneously attached to non-person speech noun '말씀' (*'말씀께서는 유명하셨어요.'*). '께서' only marks exalted human agents.
  - **Suggested Remediation:** Constrain '께서' attachment to human animate subjects carrying [+hon_subject]. Inanimate speech concepts take '이/가' (e.g., '선생님의 말씀이 맞아요').
  - *Var 1:* `종업원은 말씀을 찾아요.`
  - *Var 3:* `남자는 말씀을 이용할 거예요.`
  - *Var 5:* `조카는 말씀을 골랐어요.`
  - **Linguistic Error:** Honorific speech noun '말씀' paired with concrete object manipulation verbs (*'종업원은 말씀을 찾아요.'*).
  - **Suggested Remediation:** Constrain '말씀' to speech predicate frames (말씀하시다, 말씀드리다, 말씀을 듣다/나누다/전하다).

### Unit #1698 명 (Noun) - "counter for people (plain)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1698 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1698.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1708 매일 (Noun) - "every day, daily"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1708 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1708.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1713 살 (Noun) - "years old (native Korean age counter)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1713 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1713.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `어른 한 살이 있어요.`
  - *Var 3:* `어른 세 살이 있어요.`
  - *Var 4:* `노인 네 살이 있어요.`
  - **Linguistic Error:** Age counter '살' generated with honorific/adult nouns (*'어른 한 살이 있어요.'*), including honorific '연세' with person honorific verb '께서 계셔요'.
  - **Suggested Remediation:** Constrain '살' to numerical age expressions modifying human nouns or predicative age constructions ('N살이다'). Disallow '연세 N 살께서 계셔요'.

### Unit #1714 대 (Noun) - "counter for vehicles, machines, appliances"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1714 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1714.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `교통카드 한 대가 있어요.`
  - *Var 2:* `왕복 두 대가 있어요.`
  - *Var 4:* `손잡이 네 대가 있어요.`
  - **Linguistic Error:** Vehicle/machinery classifier '대' applied to tickets, trips, station platforms, and vehicle straps (*'교통카드 한 대가 있어요.'*).
  - **Suggested Remediation:** Restrict classifier '대' strictly to vehicles (차, 비행기, 배, 자전거) and electronic/mechanical appliances (컴퓨터, 에어컨, 텔레비전).

### Unit #1715 채 (Noun) - "counter for houses, buildings"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1715 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1715.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `공과금 세 채가 있어요.`
  - *Var 9:* `댁 한 채께서 계셔요.`
  - **Linguistic Error:** Building classifier '채' applied to utility bills ('공과금 세 채') or honorific residence with person honorific verb (*'댁 한 채께서 계셔요'*).
  - **Suggested Remediation:** Restrict classifier '채' to physical residential/commercial buildings (집, 건물, 하숙집, 빌딩). Disallow honorific concord '께서 계시다' on residence classifier.

### Unit #1716 호 (Noun) - "room / unit number (counter)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1716 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1716.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `욕실 일 호가 있어요.`
  - *Var 2:* `베란다 이 호가 있어요.`
  - *Var 5:* `거실 일 호가 있어요.`
  - **Linguistic Error:** Room/suite numbering counter '호' applied to intra-household room types (*'욕실 일 호가 있어요.'*).
  - **Suggested Remediation:** Restrict counter '호' to numbered rooms, suites, or apartment unit numbers (e.g., '101호', '302호').

### Unit #1717 학년 (Noun) - "school year, grade"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1717 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1717.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `숙제 일 학년이 있어요.`
  - *Var 2:* `일본어 이 학년이 있어요.`
  - *Var 3:* `공부 삼 학년이 있어요.`
  - **Linguistic Error:** School grade counter '학년' applied to homework, academic subjects, institutes, and assembly halls (*'숙제 일 학년이 있어요.'*).
  - **Suggested Remediation:** Restrict '학년' to school grade levels paired with school institutions (초등학교, 중학교, 고등학교, 대학교) or student persons.

### Unit #1718 고양이 (Noun) - "cat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1718 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1718.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1719 사진 (Noun) - "photo, picture, photograph"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1719 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1719.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1720 편지 (Noun) - "letter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1720 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1720.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1721 종이 (Noun) - "paper, sheet of paper"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1721 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1721.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1722 사전 (Noun) - "dictionary"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1722 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1722.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1723 정장 (Noun) - "suit, formal dress"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1723 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1723.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1724 라면 (Noun) - "ramen, instant noodles"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1724 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1724.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 라면을 드셔요.`
  - **Linguistic Error:** Plain or junior subject paired with elder-exalting honorific suppletive verb (*'사나이는 라면을 드셔요.'*).
  - **Suggested Remediation:** Constrain subject-exalting verbs (드시다, 주무시다, 계시다) to subjects marked [+elder, +respected].

### Unit #1725 자동차 (Noun) - "automobile, car"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1725 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1725.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1726 밑 (Noun) - "bottom, below, base, under"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1726 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1726.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1727 사이 (Noun) - "between, space between, interval, relationship"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1727 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1727.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1728 가운데 (Noun) - "middle, center, midst, among"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1728 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1728.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1729 중간 (Noun) - "middle, midpoint, intermediate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1729 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1729.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1730 맞은편 (Noun) - "opposite side, across, facing side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1730 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1730.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1747 영수 (Noun) - "Young-soo (personal given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1747 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1747.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1748 오랜만 (Noun) - "after a long time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1748 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1748.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1749 속초 (Noun) - "Sokcho (coastal city in Gangwon-do)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1749 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1749.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1750 안내 (Noun) - "guidance, information, tour guide"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1750 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1750.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1751 동쪽 (Noun) - "east, eastern side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1751 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1751.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1752 설악산 (Noun) - "Mount Seorak (mountain in Gangwon-do)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1752 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1752.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1753 등산 (Noun) - "hiking, mountain climbing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1753 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1753.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1754 케이블카 (Noun) - "cable car"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1754 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1754.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1755 해수욕장 (Noun) - "beach, bathing beach, seaside resort"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1755 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1755.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1757 커피숍 (Noun) - "coffee shop, café"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1757 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1757.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1760 이사 (Noun) - "moving, relocation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1760 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1760.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1761 하숙집 (Noun) - "boarding house, homestay"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1761 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1761.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1762 아주머니 (Noun) - "middle-aged woman, landlady, auntie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1762 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1762.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1763 생각 (Noun) - "thought, idea, opinion"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1763 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1763.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1764 부동산 (Noun) - "real estate, real estate agency"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1764 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1764.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1765 아저씨 (Noun) - "middle-aged man, mister"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1765 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1765.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1766 원룸 (Noun) - "studio apartment, one-room"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1766 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1766.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1767 관리비 (Noun) - "maintenance fee, utility fee"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1767 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1767.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1768 유키 (Noun) - "Yuki (personal name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1768 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1768.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1769 세탁소 (Noun) - "laundromat, dry cleaner's"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1769 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1769.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1771 에어컨 (Noun) - "air conditioner"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1771 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1771.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1772 청소 (Noun) - "cleaning"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1772 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1772.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1774 올리비아 (Noun) - "Olivia (personal name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1774 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1774.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1776 치맥 (Noun) - "chimaek (chicken and beer)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1776 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1776.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1778 대구 (Noun) - "Daegu (metropolitan city in Korea)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1778 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1778.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1779 페스티벌 (Noun) - "festival"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1779 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1779.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1780 치킨 (Noun) - "fried chicken, chicken"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1780 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1780.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1781 프라이드치킨 (Noun) - "fried chicken"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1781 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1781.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1782 마늘 (Noun) - "garlic"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1782 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1782.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1783 중 (Noun) - "middle, among, during"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1783 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1783.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1786 인기 (Noun) - "popularity"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1786 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1786.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1787 적 (Noun) - "experience, occasion (bound noun in -(으)ㄴ 적이 있다/없다)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1787 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1787.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1788 잔치 (Noun) - "feast, banquet, party"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1788 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1788.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1789 당면 (Noun) - "glass noodles, cellophane noodles (sweet potato starch noodles)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1789 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1789.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1790 시금치 (Noun) - "spinach"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1790 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1790.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1791 달걀 (Noun) - "egg, hen's egg"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1791 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1791.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1792 간장 (Noun) - "soy sauce"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1792 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1792.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1794 동안 (Noun) - "during, for, duration of time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1794 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1794.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1796 외국인 (Noun) - "foreigner"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1796 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1796.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1802 가지 (Noun) - "kind, sort, variety (bound noun / classifier for types)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1802 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1802.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1803 도시락 (Noun) - "lunchbox, packed meal, bento"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1803 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1803.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1804 우유 (Noun) - "milk"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1804 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1804.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1807 생필품 (Noun) - "daily necessities, essential goods"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1807 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1807.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1808 가구 (Noun) - "furniture"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1808 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1808.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1809 클릭 (Noun) - "click (mouse click)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1809 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1809.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1811 가족 (Noun) - "family"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1811 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1811.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1812 필요 (Noun) - "need, necessity"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1812 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1812.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1813 쇼핑몰 (Noun) - "shopping mall, online mall"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1813 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1813.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1816 카테고리 (Noun) - "category"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1816 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1816.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1817 식품 (Noun) - "food, foodstuffs, groceries"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1817 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1817.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1818 전품목 (Noun) - "all items, all products"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1818 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1818.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1819 쿠폰 (Noun) - "coupon"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1819 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1819.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1820 특별 (Noun) - "special, specialty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1820 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1820.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1822 회원 (Noun) - "member, membership"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1822 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1822.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1823 바람 (Noun) - "wind"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1823 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1823.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1824 비 (Noun) - "rain"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1824 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1824.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1825 빈칸 (Noun) - "blank, empty space, blank line"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1825 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1825.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1828 갈색 (Noun) - "brown color, brown"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1828 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1828.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1829 까만색 (Noun) - "black color, black"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1829 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1829.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1830 파란색 (Noun) - "blue color, blue"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1830 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1830.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1831 무늬 (Noun) - "pattern, design"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1831 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1831.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1832 체크무늬 (Noun) - "check pattern, plaid, checkered"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1832 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1832.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1836 얘들 (Noun) - "these kids, these children, these guys"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1836 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1836.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1837 때문 (Noun) - "reason, cause, because of"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1837 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1837.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1838 이유 (Noun) - "reason, cause, motive"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1838 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1838.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1839 장소 (Noun) - "place, venue, location"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1839 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1839.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1840 외국 (Noun) - "foreign country, abroad, overseas"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1840 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1840.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1842 신촌 (Noun) - "Sinchon (university district in Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1842 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1842.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1843 미진 (Noun) - "Mijin (personal given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1843 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1843.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1844 북경반점 (Noun) - "Beijing Restaurant (Chinese restaurant name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1844 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1844.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1845 리타오 (Noun) - "Li Tao (personal given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1845 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1845.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1846 흐엉 (Noun) - "Huong (personal given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1846 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1846.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1847 에릭 (Noun) - "Eric (personal given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1847 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1847.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1848 민준 (Noun) - "Minjun (personal given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1848 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1848.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1852 의미 (Noun) - "meaning, sense, significance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1852 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1852.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1853 디퓨저 (Noun) - "diffuser (aroma / fragrance diffuser)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1853 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1853.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1854 두루마리 (Noun) - "roll, scroll (as in 두루마리 휴지: roll of toilet paper)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1854 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1854.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1856 자리 (Noun) - "seat, spot, position, space"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1856 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1856.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1861 걱정 (Noun) - "worry, concern, anxiety"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1861 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1861.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1862 설명 (Noun) - "explanation, description, account"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1862 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1862.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1864 상황 (Noun) - "situation, circumstance, condition"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1864 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1864.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1869 국립 (Noun) - "national, state-run, established by the nation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1869 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1869.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1870 중앙 (Noun) - "center, middle, central"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1870 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1870.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1871 이촌역 (Noun) - "Ichon Station (Seoul Subway Line 4 / Gyeongui-Jungang Line)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1871 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1871.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1874 외국어 (Noun) - "foreign language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1874 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1874.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1875 음성 (Noun) - "voice, audio, speech sound"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1875 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1875.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1876 안내기 (Noun) - "guide device, audio guide machine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1876 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1876.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1877 신분증 (Noun) - "identification card, ID, identification document"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1877 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1877.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1882 정리 (Noun) - "arrangement, organization, summary, clean-up"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1882 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1882.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1883 출발 (Noun) - "departure"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1883 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1883.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1884 교통 (Noun) - "traffic, transportation, transit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1884 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1884.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1885 카드 (Noun) - "card (credit/transit/greeting card)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1885 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1885.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1886 매표소 (Noun) - "ticket office, ticket booth, box office"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1886 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1886.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1887 충정로역 (Noun) - "Chungjeongno Station (Seoul Subway Line 2 and Line 5)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1887 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1887.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1888 음악회 (Noun) - "concert, music recital, musical performance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1888 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1888.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1890 기억 (Noun) - "memory, recollection"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1890 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1890.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1891 입구 (Noun) - "entrance, entry, doorway"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1891 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1891.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1893 인주 (Noun) - "Inju (fictional city name in TOPIK/SNU curricula)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1893 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1893.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1894 터미널 (Noun) - "terminal, bus terminal"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1894 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1894.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1895 하차 (Noun) - "getting off, alighting, disembarkation (vehicle)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1895 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1895.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1896 승차 (Noun) - "boarding, embarking, getting on (vehicle)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1896 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1896.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1897 운전 (Noun) - "driving, vehicle operation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1897 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1897.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1898 고속도로 (Noun) - "expressway, highway, motorway"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1898 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1898.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1899 톨게이트 (Noun) - "tollgate, tollbooth"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1899 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1899.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 10:* `우리는 톨게이트에서 계셔요.`
  - **Linguistic Error:** First-person subject combined with subject-exalting suppletive honorific verb (*'우리는 톨게이트에서 계셔요.'*).
  - **Suggested Remediation:** Disallow 1st-person pronouns (저, 나, 우리, 저희) from selecting subject-exalting verbs (주무시다, 잡수시다, 계시다).
  - *Var 10:* `우리는 톨게이트에서 계셔요.`
  - **Linguistic Error:** Existential honorific verb '계시다' preceded by dynamic locative particle '에서' (*'우리는 톨게이트에서 계셔요.'*) instead of static locative '에'.
  - **Suggested Remediation:** Enforce static locative particle '에' for existential statives (있다, 없다, 계시다); reserve '에서' for dynamic action locations.

### Unit #1900 북인주길 (Noun) - "Buk-inju-gil (North Inju Road)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1900 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1900.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1901 길 (Noun) - "road, way, street, path, directions"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1901 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1901.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1902 글쓰기 (Noun) - "writing, composition, essay writing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1902 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1902.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1903 전공 (Noun) - "major, field of study, academic specialization"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1903 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1903.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1904 시험 (Noun) - "exam, test, examination"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1904 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1904.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1905 일주일 (Noun) - "one week, a week"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1905 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1905.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1906 프로그램 (Noun) - "program, schedule of activities"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1906 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1906.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1908 언어 (Noun) - "language, tongue, speech"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1908 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1908.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1909 연습 (Noun) - "practice, drill, rehearsal, exercise"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1909 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1909.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1910 오리엔테이션 (Noun) - "orientation, welcoming and introductory session"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1910 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1910.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1911 몸 (Noun) - "body, physique, physical health"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1911 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1911.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1913 편 (Noun) - "counter for movies, videos, films, poems, literary pieces"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1913 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1913.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `피아노 한 편이 있어요.`
  - *Var 2:* `필통 두 편이 있어요.`
  - *Var 3:* `우산 세 편이 있어요.`
  - **Linguistic Error:** Literary/cinematic classifier '편' applied to miscellaneous physical objects and appliances (*'피아노 한 편이 있어요.'*).
  - **Suggested Remediation:** Restrict counter '편' strictly to films, dramas, poems, novels, and media productions [media_work, literature, film].

### Unit #1914 대강당 (Noun) - "main auditorium, grand hall, assembly hall"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1914 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1914.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1915 인터넷 (Noun) - "internet"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1915 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1915.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1916 전문 (Noun) - "specialty, specialization, expertise"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1916 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1916.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1917 앱 (Noun) - "app, mobile application"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1917 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1917.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1918 다운로드 (Noun) - "download"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1918 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1918.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1920 계좌 (Noun) - "bank account, account"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1920 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1920.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1922 체크 (Noun) - "check, debit, verification"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1922 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1922.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1923 대부분 (Noun) - "most, majority, mostly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1923 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1923.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1924 메시지 (Noun) - "message, text message"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1924 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1924.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1927 핸드폰 (Noun) - "cell phone, mobile phone"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1927 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1927.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1928 축하 (Noun) - "celebration, congratulation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1928 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1928.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1929 인사 (Noun) - "greeting, regards, salutation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1929 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1929.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1930 배달 (Noun) - "delivery"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1930 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1930.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1933 신선식품 (Noun) - "fresh food, perishable food products"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1933 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1933.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1934 곡류 (Noun) - "grains, cereals"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1934 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1934.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1935 등 (Noun) - "etc., and the like, and so on"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1935 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1935.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1936 휴대 (Noun) - "carrying, carrying on one's person, portability"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1936 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1936.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 2:* `휴대는 컸어요.`
  - *Var 4:* `휴대가 싸요.`
  - *Var 8:* `휴대가 비쌌어요.`
  - **Linguistic Error:** Verbal action noun '휴대' (carrying on one's person) treated as a priced physical object (*'휴대는 컸어요.'*).
  - **Suggested Remediation:** Classify '휴대' as an action/property noun (휴대하다, 휴대용); disallow bare pricing/sizing statives.

### Unit #1937 가격 (Noun) - "price, cost"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1937 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1937.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1938 % (Noun) - "percent, percentage"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1938 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1938.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `가전제품 한 %가 있어요.`
  - *Var 2:* `벚꽃 두 %가 있어요.`
  - *Var 3:* `꽃 세 %가 있어요.`
  - **Linguistic Error:** Percentage unit '%' applied as a discrete item counter for physical objects (*'가전제품 한 %가 있어요.'*).
  - **Suggested Remediation:** Disallow '%' as an item counting classifier; restrict '%' to numerical rate/proportion frames (e.g. '50% 할인', '성공률이 90%이다').

### Unit #1939 노인 (Noun) - "elderly person, senior citizen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1939 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1939.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1940 통화 (Noun) - "phone call, phone conversation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1940 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1940.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1941 녹음 (Noun) - "audio recording"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1941 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1941.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1942 계산 (Noun) - "calculation, paying the bill"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1942 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1942.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1943 점 (Noun) - "point, aspect, feature"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1943 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1943.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1944 쇼핑 (Noun) - "shopping"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1944 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1944.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1945 뱅킹 (Noun) - "banking (e.g. internet banking)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1945 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1945.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1946 블로그 (Noun) - "blog"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1946 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1946.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1947 검색 (Noun) - "search, online search"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1947 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1947.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1948 글씨 (Noun) - "letter, handwriting, script, font"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1948 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1948.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1950 하늘 (Noun) - "sky, heaven"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1950 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1950.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1951 엄마 (Noun) - "mom, mommy, mother"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1951 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1951.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1952 만두 (Noun) - "dumpling, mandu"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1952 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1952.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1957 방문 (Noun) - "visit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1957 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1957.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1960 맛집 (Noun) - "famous restaurant, renowned eatery"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1960 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1960.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1962 그중 (Noun) - "among them, of them"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1962 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1962.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1963 예약 (Noun) - "reservation, booking"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1963 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1963.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1964 양식 (Noun) - "Western food, Western cuisine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1964 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1964.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1965 뷔페 (Noun) - "buffet, buffet restaurant"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1965 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1965.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1966 헤이 (Noun) - "Hey (brand name in 'Hey Pizza')"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1966 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1966.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1967 주소 (Noun) - "address, street address"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1967 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1967.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1968 서울시 (Noun) - "Seoul City, Seoul Metropolitan Government"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1968 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1968.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1969 서대문구 (Noun) - "Seodaemun-gu (district in northwestern Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1969 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1969.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1970 창천동 (Noun) - "Changcheon-dong (neighborhood in Seodaemun-gu, Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1970 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1970.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1971 배달비 (Noun) - "delivery fee, delivery charge"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1971 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1971.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1972 콜라 (Noun) - "cola, Coke"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1972 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1972.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1973 사이다 (Noun) - "cider, lemon-lime soda (e.g. Chilsung Cider)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1973 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1973.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1974 장바구니 (Noun) - "shopping cart, shopping bag, basket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1974 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1974.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1975 주문 (Noun) - "order, placement of order"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1975 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1975.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1976 결제 (Noun) - "payment, settlement, checkout"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1976 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1976.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1977 이딸리 (Noun) - "Itali (brand name in 'Pizza Itali')"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1977 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1977.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1978 마포구 (Noun) - "Mapo-gu (district in western Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1978 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1978.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1979 상수동 (Noun) - "Sangsu-dong (neighborhood in Mapo-gu, Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1979 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1979.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1980 손님 (Noun) - "customer, guest, visitor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1980 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1980.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1981 파스타 (Noun) - "pasta"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1981 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1981.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1984 목 (Noun) - "neck, throat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1984 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1984.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1986 환자 (Noun) - "patient (medical)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1986 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1986.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1989 차례 (Noun) - "turn, order, sequence"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1989 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1989.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1990 대답 (Noun) - "answer, reply, response"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1990 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1990.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1999 잠 (Noun) - "sleep (noun)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1999 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_1999.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `부부는 잠을 사요.`
  - *Var 3:* `수진은 잠을 사용할 거예요.`
  - *Var 7:* `사나이는 잠을 사요.`
  - **Linguistic Error:** Abstract bodily state noun '잠' (sleep) treated as a purchasable retail commodity (*'부부는 잠을 사요.'*).
  - **Suggested Remediation:** Disallow commercial purchase/sale verbs (사다, 팔다) and pricing statives (싸다, 비싸다) on '잠'; pair strictly with physiological verbs (자다, 깨다, 오다).

### Unit #2001 연고 (Noun) - "ointment, salve"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2001 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2001.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2002 바닥 (Noun) - "bottom, floor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2002 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2002.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2006 싸이 (Noun) - "Psy (South Korean singer/rapper)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2006 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2006.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2007 강남스타일 (Noun) - "Gangnam Style (cultural style / song)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 2007 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2007.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 6:* `강남스타일이 비쌀 거예요.`
  - **Linguistic Error:** Cultural style / pop song '강남스타일' treated as a retail priced commodity (*'강남스타일이 비쌀 거예요.'*).
  - **Suggested Remediation:** Disallow commercial pricing statives (비싸다, 싸다) on cultural music/style concepts.

### Unit #2008 가사 (Noun) - "lyrics, words of a song"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2008 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2008.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2009 강남 (Noun) - "Gangnam (district in Seoul)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2009 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2009.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2010 스타일 (Noun) - "style, fashion, manner"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2010 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2010.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2012 인간적 (Noun) - "humane, humanistic, warm-hearted"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 2012 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2012.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `아주머니는 인간적을 배워요.`
  - *Var 2:* `인간적은 어려웠어요.`
  - *Var 3:* `동창은 인간적을 고를 거예요.`
  - **Linguistic Error:** Sino-Korean suffix root noun '인간적' (humane, humanistic, warm-hearted) generated as independent noun with bare nominal case particles (*'아주머니는 인간적을 배워요.'*). In Korean, '-적' roots cannot take bare subject/object particles.
  - **Suggested Remediation:** Reclassify '인간적' as bound modifier root requiring adnominal '-적인' (e.g. 인간적인 사람), adverbial '-적으로' (인간적으로), or predicative copula '-적이다' (인간적이다). Disallow bare case markers.

### Unit #2013 한잔 (Noun) - "a cup, a drink, a glass of drink"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2013 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2013.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2014 여유 (Noun) - "leisure, composure, relaxedness"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2014 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2014.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2015 품격 (Noun) - "dignity, elegance, class, grace"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2015 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2015.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2016 심장 (Noun) - "heart (organ or figurative seat of emotion)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2016 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2016.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2019 사나이 (Noun) - "man, guy, fellow (manly)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 2019 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2019.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 2:* `사나이가 좁았어요.`
  - *Var 5:* `사나이는 자동차를 나빠했어요.`
  - *Var 6:* `사나이가 오랜만일 거예요.`
  - **Linguistic Error:** Human noun '사나이' paired with spatial stative '좁다' (*'사나이가 좁았어요'*), temporal stative '오랜만이다', or ungrammatical psych-verb '나빠하다'.
  - **Suggested Remediation:** Constrain human noun '사나이' to human-compatible attributes (용감하다, 건강하다, 멋있다) and suppress spatial width/distance statives.

### Unit #2021 원샷 (Noun) - "bottoms up, one-shot (drinking in one gulp)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2021 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2021.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2025 데 (Noun) - "place, spot, case (bound noun)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 2025 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2025.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `회원은 데에서 파스타를 시켜요.`
  - *Var 2:* `에릭은 데에서 잤어요.`
  - *Var 3:* `남자는 데에 건널 거예요.`
  - **Linguistic Error:** Unit 2025 '데' is a bound noun (의존명사) requiring an adnominal clausal modifier ('-(으)ㄴ/는/-(으)ㄹ 데'), but generated bare with spatial particles (*'회원은 데에서 파스타를 시켜요.'*).
  - **Suggested Remediation:** Enforce bound noun syntax for '데': require preceding adnominal modifier verb/adjective phrase (e.g., '가는 데', '조용한 데').
  - *Var 4:* `친구는 데에서 두루마리를 뫄요.`
  - **Linguistic Error:** Irregular stem contraction defect: Verb '모으다' (ID 1103) conjugated as defect '*뫄요*' or '*뫘어요*' (*'친구는 데에서 두루마리를 뫄요.'*) instead of standard '모아요' / '모았어요'.
  - **Suggested Remediation:** Correct '모으다' conjugation table to produce standard uncontracted '모아요' / '모았어요'.

### Unit #2028 이때 (Noun) - "this moment, this time, now"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2028 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2028.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2031 머리 (Noun) - "head, hair (body part)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2031 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2031.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2035 노출 (Noun) - "exposure, revealing (clothing, body, facts)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2035 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2035.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2037 감각적 (Noun) - "sensuous, stylish, sensible, tasteful"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 2037 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2037.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `노인은 감각적을 기다려요.`
  - *Var 2:* `감각적은 쉬웠어요.`
  - *Var 3:* `민수는 감각적을 이용할 거예요.`
  - **Linguistic Error:** Sino-Korean suffix root noun '감각적' (sensuous, stylish, sensible, tasteful) generated as independent noun with bare nominal case particles (*'노인은 감각적을 기다려요.'*). In Korean, '-적' roots cannot take bare subject/object particles.
  - **Suggested Remediation:** Reclassify '감각적' as bound modifier root requiring adnominal '-적인' (e.g. 감각적인 사람), adverbial '-적으로' (감각적으로), or predicative copula '-적이다' (감각적이다). Disallow bare case markers.

### Unit #2041 근육 (Noun) - "muscle (body part)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2041 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2041.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2042 사상 (Noun) - "thought, ideology, philosophy, ideas"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2042 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2042.txt`
- **Seed:** `1793701100000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #2044 놈 (Noun) - "guy, fellow, rascal (vulgar or colloquial)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 2044 -eng none --ast -sentence 10 --seed 1793701100000 -o scratch/audit/unit_2044.txt`
- **Seed:** `1793701100000`
- **Generation Sample (Offending Variations):**
  - *Var 2:* `놈이 맑았어요.`
  - *Var 4:* `놈이 울퉁불퉁해요.`
  - *Var 7:* `놈은 거울을 이어요.`
  - **Linguistic Error:** Colloquial human noun '놈' (fellow/rascal) paired with terrain/meteorological statives ('맑다', '울퉁불퉁하다') and bizarre transitive verbs (*'놈이 맑았어요.'*).
  - **Suggested Remediation:** Constrain human animate noun '놈' to human psychological/behavioral statives and human-compatible agent actions.

