# Linguistic Audit Report: Batch 10 (Nouns Part D)

> **Batch ID:** 10  
> **Category:** Nouns (Part D: Abstract Concepts, Administration, Public Facilities & Honorific Titles)  
> **Target Manifest:** `audit/batches/batch_10_nouns_part_d.json`  
> **Total In-Scope Units:** 221  
> **PRNG Seed:** `1793701000000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (221 / 221 Analyzed)**  
> **Audit Summary:** **Clean: 205 units (93%) | Flagged: 16 units (7%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 10 audits the fourth quintile of Nouns (221 units, IDs 1290..1690), encompassing banking and administrative procedures, postal and parcel delivery, dimensional measurements, high-honorific personal titles, public institutions, and emotional/psychological concepts.

### Key Discoveries & Root Causes:

1. **Abstract Measurement & Emotional Terms Treated as Commercial Goods:**
   - Abstract dimensions (`길이` ID 1314), meteorological states (`기온` ID 1564), bodily processes (`소화` ID 1423), and psychological states (`기분` ID 1655) were selected by commercial purchasing frames:
     - Buying or pricing length: *`친구는 길이를 살 거예요`*, *`길이가 비쌌어요`*, *`길이가 싸요`*.
     - Buying air temperature: *`사나이는 기온을 샀어요`*.
     - Buying or utilizing a mood: *`싸이는 기분을 샀어요`*, *`동창은 기분을 이용해요`*.
     - Pricing or exchanging digestion: *`소화가 비쌀 거예요`*, *`사나이는 소화를 바꿀 거예요`*.
   - *Mitigation:* Restrict commercial transaction predicates (`사다`, `팔다`, `비싸다`, `싸다`) strictly to tangible merchandise, tickets, and paid services [commercial_item].

2. **Inappropriate Descriptive Adjectives on Human Referents:**
   - Physical terrain/surface texture adjective `울퉁불퉁하다` (bumpy, rugged, uneven) was applied to a human aunt (*`작은어머니께서 울퉁불퉁하셨어요`* in ID 1654).
   - Commercial pricing stative `비싸다` (expensive) was applied directly to a human executive (*`사장님께서 비싸세요`* in ID 1664).
   - *Mitigation:* Restrict surface texture adjectives (`울퉁불퉁하다`, `매끄럽다`) strictly to physical terrain and surfaces; restrict pricing adjectives (`비싸다`, `싸다`) to goods/fees.

3. **Animacy Violation: Gifting Human Kin:**
   - In variation 9 of `어르신` (ID 1665), human kin (`부부`, married couple) was generated as a gift object: *`어르신께서는 부부를 선물하세요`*.
   - *Mitigation:* Restrict direct objects of `선선하다` / `선물하다` strictly to giftable inanimate tokens and merchandise.

4. **Flawless High-Honorific Verbal Concord (`교수님`, `사장님`, `어르신`):**
   - Professional titles and respect nouns (`교수님` ID 1663, `사장님` ID 1664, `어르신` ID 1665, `작은어머니` ID 1654, `작은아버지` ID 1666) demonstrated **100% honorific concord**:
     - Subject case marking: strictly honorific `께서` / `께서는`.
     - Predicate agreement: strictly honorific `-(으)시-` (`가지세요`, `구매하세요`, `들으셨어요`, `알아보세요`).

5. **Exceptional Baseline Cleanliness (93% Clean):**
   - 205 out of 221 units operated with complete morphosyntactic and semantic integrity. Banking tools (`통장`, `도장`, `체크카드`), postal terms (`국제 특급`, `등기`), and public facilities (`경찰서`, `대사관`, `구청`, `소방서`) generated natural, idiomatic Korean sentences.

---

## 2. Detailed Unit-by-Unit Linguistic Evaluations

### Unit #1290 휴학 (Noun) - "leave of absence (from school)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1290 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1290.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1294 계좌 번호 (Noun) - "account number"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1294 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1294.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `사나이는 계좌 번호를 살 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1295 공과금 (Noun) - "utility bill, public charges"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1295 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1295.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1296 도장 (Noun) - "personal seal, stamp"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1296 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1296.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1297 번호표 (Noun) - "waiting number ticket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1297 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1297.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1298 부부 (Noun) - "married couple, husband and wife"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1298 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1298.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1299 비밀번호 (Noun) - "password, PIN"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1299 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1299.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `사나이는 비밀번호를 바꿨어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1301 순서 (Noun) - "order, sequence, turn"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1301 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1301.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1305 저금 (Noun) - "savings, deposit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1305 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1305.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1307 체크카드 (Noun) - "debit card"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1307 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1307.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1308 통장 (Noun) - "bankbook, passbook"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1308 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1308.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1309 현금 자동 인출기 (Noun) - "ATM (automated teller machine)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1309 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1309.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1310 환전 (Noun) - "currency exchange"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1310 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1310.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1313 국제 특급 (Noun) - "express mail service (EMS), international express mail"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1313 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1313.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1314 길이 (Noun) - "length"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1314 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1314.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 2:* `길이는 비쌌어요.`
  - *Var 3:* `친구는 길이를 살 거예요.`
  - *Var 9:* `종업원은 길이를 살 거예요.`
  - **Linguistic Error:** Abstract dimension / state noun '길이' (length) carries generic tags that allowed selection by commercial purchase and pricing frames (*'길이는 비쌌어요.'*).
  - **Suggested Remediation:** Disallow commercial transaction verbs (사다, 팔다, 바꾸다) and pricing statives (비싸다, 싸다) from selecting non-commodity abstract nouns [dimension, measurement, emotion, bodily_process].

### Unit #1317 높이 (Noun) - "height"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1317 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1317.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1318 무게 (Noun) - "weight"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1318 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1318.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1319 배편 (Noun) - "surface mail, sea mail (shipping by ship)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1319 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1319.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1320 봉투 (Noun) - "envelope"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1320 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1320.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1322 상자 (Noun) - "box"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1322 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1322.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1323 소포 (Noun) - "parcel, package"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1323 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1323.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1325 우편번호 (Noun) - "postal code, ZIP code"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1325 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1325.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1326 우표 (Noun) - "postage stamp"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1326 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1326.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1327 저울 (Noun) - "scale (for weighing)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1327 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1327.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1328 크기 (Noun) - "size, dimensions"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1328 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1328.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1329 택배 (Noun) - "parcel delivery, courier service"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1329 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1329.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1331 항공편 (Noun) - "airmail, flight"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1331 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1331.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1340 동영상 (Noun) - "video, video clip"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1340 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1340.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1341 서비스 센터 (Noun) - "service center, repair center"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1341 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1341.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1342 속도 (Noun) - "speed"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1342 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1342.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1343 위치 (Noun) - "location, position"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1343 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1343.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1344 이전 (Noun) - "previous time, relocation, transfer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1344 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1344.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1350 농구공 (Noun) - "basketball (ball)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1350 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1350.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1351 답장 (Noun) - "reply, answer (message, letter)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1351 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1351.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1353 땀 (Noun) - "sweat, perspiration"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1353 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1353.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1355 바비큐 (Noun) - "barbecue"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1355 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1355.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1359 캠핑장 (Noun) - "campsite, camping ground"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1359 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1359.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1364 공휴일 (Noun) - "public holiday, official holiday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1364 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1364.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1366 날짜 (Noun) - "date (calendar)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1366 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1366.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1369 말 (Noun) - "end (of period, month, year)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1369 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1369.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1370 메뉴 (Noun) - "menu"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1370 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1370.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1372 서비스 (Noun) - "service, complimentary item (on the house)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1372 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1372.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1373 선택 (Noun) - "choice, selection"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1373 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1373.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1374 연락처 (Noun) - "contact information, phone number"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1374 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1374.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1375 연말 (Noun) - "end of the year"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1375 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1375.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1376 연예인 (Noun) - "celebrity, entertainer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1376 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1376.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1377 연휴 (Noun) - "consecutive holidays, long weekend"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1377 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1377.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1378 예약석 (Noun) - "reserved seat, reserved table"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1378 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1378.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1380 초 (Noun) - "second (time), candle, beginning (of period)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1380 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1380.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1381 팀장 (Noun) - "team leader, manager"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1381 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1381.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1382 평일 (Noun) - "weekday, workday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1382 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1382.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1387 과거 (Noun) - "past"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1387 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1387.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 과거에 우유를 양념했어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1390 미래 (Noun) - "future"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1390 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1390.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1393 신용카드 (Noun) - "credit card"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1393 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1393.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1396 외출 (Noun) - "going out, outing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1396 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1396.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1397 이상 (Noun) - "more than, above, abnormal"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1397 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1397.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1399 지난번 (Noun) - "last time, previous time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1399 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1399.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1400 현금 (Noun) - "cash"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1400 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1400.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1401 현재 (Noun) - "present, current time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1401 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1401.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1405 감기 (Noun) - "cold (illness)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1405 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1405.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1407 기침 (Noun) - "cough"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1407 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1407.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1411 냄새 (Noun) - "smell, odor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1411 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1411.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1412 두통 (Noun) - "headache"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1412 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1412.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1413 디자인 (Noun) - "design"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1413 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1413.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1417 배탈 (Noun) - "stomachache, upset stomach"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1417 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1417.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1418 변비 (Noun) - "constipation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1418 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1418.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1421 사고 (Noun) - "accident, incident"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1421 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1421.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1422 상처 (Noun) - "wound, injury, scar"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1422 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1422.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1423 소화 (Noun) - "digestion"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1423 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1423.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 6:* `소화가 비쌀 거예요.`
  - *Var 9:* `사나이는 소화를 바꿀 거예요.`
  - **Linguistic Error:** Abstract dimension / state noun '소화' (digestion) carries generic tags that allowed selection by commercial purchase and pricing frames (*'소화가 비쌀 거예요.'*).
  - **Suggested Remediation:** Disallow commercial transaction verbs (사다, 팔다, 바꾸다) and pricing statives (비싸다, 싸다) from selecting non-commodity abstract nouns [dimension, measurement, emotion, bodily_process].
  - *Var 9:* `사나이는 소화를 바꿀 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1425 열 (Noun) - "fever, heat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1425 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1425.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1429 콧물 (Noun) - "runny nose, nasal discharge"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1429 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1429.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1431 피 (Noun) - "blood"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1431 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1431.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1433 ㅅ동사 (Noun) - "s-irregular verbs (grammatical category)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1433 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1433.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1434 감기약 (Noun) - "cold medicine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1434 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1434.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1435 건강 보험 (Noun) - "health insurance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1435 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1435.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1436 기침약 (Noun) - "cough medicine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1436 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1436.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1438 두통약 (Noun) - "headache medicine, painkiller"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1438 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1438.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1439 몸무게 (Noun) - "body weight"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1439 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1439.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1441 변비약 (Noun) - "constipation medicine, laxative"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1441 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1441.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1442 선풍기 (Noun) - "electric fan"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1442 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1442.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1443 소독약 (Noun) - "disinfectant, antiseptic"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1443 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1443.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1444 소화제 (Noun) - "digestive medicine, antacid"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1444 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1444.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `사나이는 소화제를 먹었어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1445 약사 (Noun) - "pharmacist"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1445 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1445.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1446 이상 (Noun) - "abnormality, problem (health)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1446 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1446.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1447 점수 (Noun) - "score, mark, grade"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1447 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1447.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1449 치료 (Noun) - "medical treatment, cure"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1449 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1449.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1450 치료비 (Noun) - "medical expenses, treatment cost"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1450 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1450.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1451 토픽 (Noun) - "TOPIK (Test of Proficiency in Korean)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1451 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1451.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1452 한약 (Noun) - "traditional Korean herbal medicine"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1452 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1452.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 한약을 먹어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1455 가족 영화 (Noun) - "family movie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1455 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1455.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1456 공상 과학 영화 (Noun) - "sci-fi movie (science fiction movie)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1456 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1456.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1457 공포 영화 (Noun) - "horror movie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1457 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1457.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1458 관심 (Noun) - "interest, attention"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1458 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1458.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1460 동물 (Noun) - "animal"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1460 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1460.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1461 록 (Noun) - "rock music"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1461 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1461.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1462 만화 영화 (Noun) - "animated movie, cartoon"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1462 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1462.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1463 멜로 영화 (Noun) - "romance movie, melodrama"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1463 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1463.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1464 무료 (Noun) - "free of charge"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1464 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1464.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1465 세계 (Noun) - "world"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1465 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1465.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1467 전쟁 영화 (Noun) - "war movie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1467 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1467.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1471 기타 (Noun) - "guitar, others, etc."
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1471 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1471.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1473 당구 (Noun) - "billiards, pool"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1473 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1473.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1474 동전 (Noun) - "coin"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1474 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1474.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1475 드럼 (Noun) - "drum"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1475 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1475.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1476 만화책 (Noun) - "comic book, manga"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1476 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1476.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1478 물고기 (Noun) - "fish (living)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1478 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1478.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1479 볼링 (Noun) - "bowling"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1479 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1479.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1480 새 (Noun) - "bird"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1480 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1480.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1481 연극 (Noun) - "play, theatrical performance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1481 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1481.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1482 엽서 (Noun) - "postcard"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1482 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1482.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1483 오토바이 (Noun) - "motorcycle, motorbike"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1483 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1483.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1488 팩스 (Noun) - "fax"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1488 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1488.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1489 피아노 (Noun) - "piano"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1489 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1489.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1492 겉 (Noun) - "outside, surface, exterior"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1492 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1492.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1493 경험 (Noun) - "experience"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1493 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1493.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1494 낮 (Noun) - "daytime, day"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1494 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1494.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1496 바깥 (Noun) - "outside, exterior"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1496 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1496.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1497 밤 (Noun) - "night, chestnut"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1497 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1497.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1499 속 (Noun) - "inside, interior, stomach"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1499 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1499.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1501 아랫사람 (Noun) - "subordinate, younger/junior person"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1501 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1501.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1502 어른 (Noun) - "adult, elder"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1502 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1502.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1504 윗사람 (Noun) - "superior, elder/senior person"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1504 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1504.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1505 학원 (Noun) - "private academy, cram school"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1505 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1505.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 6:* `사나이는 학원에 내려갈 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1509 계획표 (Noun) - "schedule, timetable, plan chart"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1509 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1509.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1510 고등학교 (Noun) - "high school"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1510 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1510.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1514 유치원 (Noun) - "kindergarten"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1514 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1514.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1515 유학 (Noun) - "studying abroad"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1515 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1515.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1517 정도 (Noun) - "degree, limit, approximate amount ("about")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1517 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1517.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1518 중학교 (Noun) - "middle school, junior high school"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1518 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1518.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 6:* `사나이는 중학교에서 싸이를 만날 거예요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1519 초등학교 (Noun) - "elementary school, primary school"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1519 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1519.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1524 객실 (Noun) - "guest room, hotel room"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1524 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1524.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `사나이는 객실을 원했어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1525 교통편 (Noun) - "means of transportation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1525 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1525.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1527 기념품 (Noun) - "souvenir"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1527 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1527.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1528 렌터카 (Noun) - "rental car"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1528 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1528.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1529 리포터 (Noun) - "reporter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1529 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1529.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1530 -박 -일 (Noun) - "duration of stay (nights and days, ... nights ... days)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1530 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1530.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1532 시설 (Noun) - "facilities, amenities"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1532 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1532.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1533 여행자 보험 (Noun) - "traveler's insurance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1533 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1533.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1534 여행지 (Noun) - "travel destination"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1534 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1534.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1535 예절 (Noun) - "etiquette, manners"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1535 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1535.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1536 왕복 (Noun) - "round trip"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1536 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1536.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1537 일정 (Noun) - "schedule, itinerary"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1537 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1537.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1538 전망 (Noun) - "view, prospect, outlook"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1538 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1538.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1539 팬 (Noun) - "fan (supporter)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1539 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1539.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1540 편도 (Noun) - "one-way (trip)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1540 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1540.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1541 풍경 (Noun) - "scenery, landscape, wind chime"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1541 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1541.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1542 항공권 (Noun) - "plane ticket, airline ticket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1542 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1542.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1546 가족 여행 (Noun) - "family trip"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1546 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1546.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1547 국내 여행 (Noun) - "domestic travel"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1547 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1547.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1548 단체 관광 (Noun) - "group tour"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1548 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1548.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1549 배낭여행 (Noun) - "backpacking trip"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1549 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1549.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1550 볼거리 (Noun) - "things to see, attractions"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1550 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1550.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1551 수학여행 (Noun) - "school field trip, educational excursion"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1551 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1551.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1553 옛날 (Noun) - "old days, ancient times, past"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1553 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1553.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1554 유물 (Noun) - "relic, artifact"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1554 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1554.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1555 자유 여행 (Noun) - "independent travel, self-guided tour"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1555 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1555.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1556 해외여행 (Noun) - "overseas travel, international trip"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1556 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1556.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1564 기온 (Noun) - "temperature (air)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1564 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1564.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `사나이는 기온을 샀어요.`
  - *Var 7:* `조카는 기온을 이용해요.`
  - **Linguistic Error:** Abstract dimension / state noun '기온' (temperature (air)) carries generic tags that allowed selection by commercial purchase and pricing frames (*'사나이는 기온을 샀어요.'*).
  - **Suggested Remediation:** Disallow commercial transaction verbs (사다, 팔다, 바꾸다) and pricing statives (비싸다, 싸다) from selecting non-commodity abstract nouns [dimension, measurement, emotion, bodily_process].
  - *Var 5:* `사나이는 기온을 샀어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1566 남이섬 (Noun) - "Nami Island (Namiseom)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1566 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1566.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1568 미세 먼지 (Noun) - "fine dust, particulate matter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1568 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1568.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1569 습관 (Noun) - "habit, custom"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1569 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1569.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1571 안개 (Noun) - "fog, mist"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1571 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1571.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1572 열쇠고리 (Noun) - "keychain, key ring"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1572 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1572.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1573 영상 (Noun) - "above zero (temperature), video image"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1573 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1573.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1574 영하 (Noun) - "below zero (sub-zero temperature)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1574 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1574.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1575 최고 (Noun) - "best, maximum, highest"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1575 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1575.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1576 최저 (Noun) - "lowest, minimum"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1576 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1576.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1577 춘천 (Noun) - "Chuncheon (city in Gangwon Province)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1577 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1577.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1578 태풍 (Noun) - "typhoon"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1578 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1578.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1586 마스크 (Noun) - "face mask"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1586 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1586.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1587 비옷 (Noun) - "raincoat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1587 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1587.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1588 선크림 (Noun) - "sunscreen, sunblock"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1588 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1588.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1590 실내 (Noun) - "indoors, interior of a building"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1590 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1590.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1594 장화 (Noun) - "rain boots, rubber boots"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1594 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1594.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1596 종일 (Noun) - "all day long, the whole day"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1596 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1596.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1597 집안일 (Noun) - "housework, household chores"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1597 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1597.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1599 햇빛 (Noun) - "sunlight, sunshine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1599 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1599.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1600 환기 (Noun) - "ventilation, airing out"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1600 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1600.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1602 접속사 (Noun) - "grammatical term for conjunctions (connecting words like 그래도, 그러나, 그러면, 하지만, 왜냐하면)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1602 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1602.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1603 독일 (Noun) - "Germany"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1603 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1603.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1604 영어학 (Noun) - "English linguistics, English studies"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1604 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1604.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1605 때 (Noun) - "time, when, moment"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1605 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1605.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1606 아시아 (Noun) - "Asia"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1606 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1606.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1607 문화 (Noun) - "culture"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1607 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1607.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1608 아시아학 (Noun) - "Asian studies"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1608 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1608.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1612 방송 (Noun) - "broadcasting, broadcast, show"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1612 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1612.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1614 한국어 (Noun) - "Korean language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1614 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1614.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1617 한국학 (Noun) - "Korean studies"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1617 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1617.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1620 학교 (Noun) - "school"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1620 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1620.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1623 년 (Noun) - "year (counter)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1623 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1623.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1627 러시아 (Noun) - "Russia"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1627 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1627.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1628 일본어 (Noun) - "Japanese language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1628 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1628.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1629 제목 (Noun) - "title, subject, heading"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1629 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1629.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1630 개월 (Noun) - "month (duration counter)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1630 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1630.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1631 전 (Noun) - "before, ago, previous"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1631 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1631.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1632 한국어학당 (Noun) - "Korean language institute"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1632 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1632.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 2:* `사나이는 한국어학당에서 전화를 찍었어요.`
  - **Linguistic Error:** Collateral tag pollution: Abstract noun '나이' (age, Unit 250) leaked into generation context as a human subject/object due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Resolved globally by re-tagging Unit 250 to 'person_attribute'.

### Unit #1633 공부 (Noun) - "study, studying"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1633 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1633.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1634 날 (Noun) - "day, date"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1634 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1634.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1636 노래 (Noun) - "song"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1636 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1636.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1637 취미 (Noun) - "hobby, pastime"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1637 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1637.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1639 분 (Noun) - "person (honorific), counter for people"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1639 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1639.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1640 전화 (Noun) - "telephone, phone call"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1640 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1640.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1641 일 (Noun) - "work, task, matter, thing, business"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1641 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1641.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1642 마리아 (Noun) - "Maria (name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1642 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1642.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1643 마리 (Noun) - "Marie (name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1643 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1643.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1651 결혼식 (Noun) - "wedding ceremony"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1651 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1651.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1652 대전 (Noun) - "Daejeon (city in Korea)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1652 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1652.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1654 작은어머니 (Noun) - "aunt (wife of father's younger brother)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1654 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1654.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 4:* `작은어머니께서 파라세요.`
  - *Var 8:* `작은어머니께서 울퉁불퉁하셨어요.`
  - **Linguistic Error:** Semantic category violation: Physical surface texture adjective '울퉁불퉁하다' (bumpy, rugged) and primary color '파랗다' (blue) applied as descriptive predicates to human relative '작은어머니' (*'작은어머니께서 울퉁불퉁하셨어요'*).
  - **Suggested Remediation:** Restrict surface texture adjectives (울퉁불퉁하다, 매끄럽다) to terrain and physical surfaces [surface_texture], and exclude from human subjects.

### Unit #1655 기분 (Noun) - "feeling, mood"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1655 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1655.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `싸이는 기분을 샀어요.`
  - *Var 7:* `동창은 기분을 이용해요.`
  - **Linguistic Error:** Abstract dimension / state noun '기분' (feeling, mood) carries generic tags that allowed selection by commercial purchase and pricing frames (*'싸이는 기분을 샀어요.'*).
  - **Suggested Remediation:** Disallow commercial transaction verbs (사다, 팔다, 바꾸다) and pricing statives (비싸다, 싸다) from selecting non-commodity abstract nouns [dimension, measurement, emotion, bodily_process].

### Unit #1656 처음 (Noun) - "first time, for the first time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1656 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1656.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1661 팔찌 (Noun) - "bracelet"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1661 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1661.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1662 스카프 (Noun) - "scarf"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1662 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1662.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1663 교수님 (Noun) - "professor (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1663 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1663.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1664 사장님 (Noun) - "company president, CEO (honorific)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1664 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1664.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 6:* `사장님께서 비싸세요.`
  - **Linguistic Error:** Semantic category violation: Commercial pricing adjective '비싸다' (expensive) applied directly to human corporate executive '사장님' (*'사장님께서 비싸세요'*).
  - **Suggested Remediation:** Restrict pricing adjectives (비싸다, 싸다) strictly to merchandise, fees, and goods [commercial_item], excluding human subjects.

### Unit #1665 어르신 (Noun) - "elder, senior citizen, venerable person"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1665 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1665.txt`
- **Seed:** `1793701000000`
- **Generation Sample (Offending Variations):**
  - *Var 9:* `어르신께서는 부부를 선물하세요.`
  - **Linguistic Error:** Semantic animacy violation: Human kin '부부' (married couple) selected as a gift item with '선물하다' (*'어르신께서는 부부를 선물하세요'*).
  - **Suggested Remediation:** Restrict '선물하다' direct objects strictly to giftable inanimate artifacts and tokens [gift_item].

### Unit #1666 작은아버지 (Noun) - "paternal uncle (father's younger brother)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1666 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1666.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1668 경찰서 (Noun) - "police station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1668 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1668.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1669 대사관 (Noun) - "embassy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1669 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1669.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1670 구청 (Noun) - "district office, ward office"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1670 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1670.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1671 소방서 (Noun) - "fire station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1671 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1671.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

### Unit #1690 민수 (Noun) - "Minsu (given name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1690 -eng none --ast -sentence 10 --seed 1793701000000 -o scratch/audit/unit_1690.txt`
- **Seed:** `1793701000000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate natural argument selection, accurate particle attachment, correct animacy agreement, and proper semantic collocations.

