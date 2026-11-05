# Linguistic Audit Report: Batch 07 (Nouns (Part A))

> **Batch ID:** 07  
> **Category:** Nouns (Part A)  
> **Target Manifest:** `audit/batches/batch_07_nouns_part_a.json`  
> **Total In-Scope Units:** 221  
> **PRNG Seed:** `1793700700000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (221 / 221 Analyzed)**  
> **Audit Summary:** **Clean: 221 units (100.0%) | Flagged: 0 units (0.0%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 07 audits 221 Nouns spanning core concrete objects, time words, food items, places, tools, and human relationship terms.
Following Round 1 findings and Round 2 targeted remediation, all 221 units were generated with seed 1793700700000 and evaluated, achieving 100% clean sentence generation.

### Key Round 2 Remediations Verified:
1. Time Determiner Framing on '지난' (ID 438): Enforced determiner modification frame ('지난 달에', '지난 주에', '지난 해에') instead of ungrammatical bare particle attachment (*'지난에'*).
2. Complex Predicate Filtering: Excluded multi-word descriptive verbs (such as '결과 다르다') and non-adjectival stems ('안녕하다', '싶다') from noun stative predicate slots, completely eliminating syntax anomalies like *'냄비가 결과 달라요'*.
3. Copula Coda Sandhi: Resolved copula past/concessive past sandhi ensuring proper vowel insertion on consonant codas ('통화중이어도', '학생이어도').
4. Honorific Concord & Food Granularity: Enforced meal honorific concord ('진지' with '잡수시다') and blocked cross-category food manipulation anomalies.

---

## 2. Detailed Linguistic Audit Findings

### Unit #0 미국 사람 (Noun) - "American person"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 0 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_0.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '미국 사람' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1 이름 (Noun) - "name"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_1.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이름' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #6 나라 (Noun) - "country"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 6 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_6.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '나라' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #7 노르웨이 (Noun) - "Norway"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 7 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_7.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '노르웨이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #8 미국 (Noun) - "the U.S."
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 8 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_8.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '미국' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #9 베트남 (Noun) - "Vietnam"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 9 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_9.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '베트남' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #10 브라질 (Noun) - "Brazil"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 10 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_10.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '브라질' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #11 사람 (Noun) - "person"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 11 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_11.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사람' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #12 일본 (Noun) - "Japan"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 12 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_12.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '일본' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #13 중국 (Noun) - "China"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 13 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_13.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '중국' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #14 케냐 (Noun) - "Kenya"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 14 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_14.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '케냐' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #15 프랑스 (Noun) - "France"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 15 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_15.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '프랑스' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #16 한국 (Noun) - "Korea"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 16 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_16.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한국' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #17 한국 사람 (Noun) - "Korean person"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 17 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_17.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한국 사람' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #18 호주 (Noun) - "Australia"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 18 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_18.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '호주' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #24 학생 (Noun) - "student"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 24 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_24.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '학생' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #25 회사원 (Noun) - "company worker"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 25 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_25.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '회사원' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #27 가수 (Noun) - "singer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 27 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_27.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가수' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #28 간호사 (Noun) - "nurse"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 28 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_28.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '간호사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #29 기자 (Noun) - "journalist"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 29 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_29.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '기자' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #31 배우 (Noun) - "actor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 31 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_31.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '배우' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #32 선생님 (Noun) - "teacher"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 32 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_32.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '선생님' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #33 요리사 (Noun) - "chef"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 33 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_33.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '요리사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #34 은행원 (Noun) - "bank teller"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 34 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_34.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '은행원' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #35 의사 (Noun) - "doctor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 35 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_35.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '의사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #38 밥 (Noun) - "rice/meal"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 38 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_38.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '밥' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #39 물 (Noun) - "water"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 39 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_39.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '물' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #45 오늘 (Noun) - "today"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 45 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_45.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오늘' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #46 내일 (Noun) - "tomorrow"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 46 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_46.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '내일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #58 교실 (Noun) - "classroom"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 58 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_58.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '교실' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #64 컴퓨터 (Noun) - "computer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 64 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_64.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '컴퓨터' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #65 거울 (Noun) - "mirror"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 65 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_65.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '거울' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #67 달력 (Noun) - "calendar"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 67 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_67.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '달력' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #68 지도 (Noun) - "map"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 68 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_68.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지도' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #69 문 (Noun) - "door"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 69 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_69.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '문' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #70 시계 (Noun) - "clock"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 70 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_70.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시계' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #71 옷걸이 (Noun) - "coat hanger"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 71 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_71.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '옷걸이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #72 의자 (Noun) - "chair"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 72 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_72.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '의자' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #74 창문 (Noun) - "window"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 74 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_74.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '창문' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #75 책상 (Noun) - "desk"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 75 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_75.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '책상' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #76 친구 (Noun) - "friend"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 76 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_76.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '친구' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #77 칠판 (Noun) - "blackboard"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 77 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_77.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '칠판' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #78 텔레비전 (Noun) - "television"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 78 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_78.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '텔레비전' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #79 공책 (Noun) - "notebook"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 79 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_79.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '공책' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #80 책 (Noun) - "book"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 80 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_80.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '책' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #83 가방 (Noun) - "bag"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 83 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_83.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가방' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #84 돈 (Noun) - "money"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 84 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_84.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '돈' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #85 볼펜 (Noun) - "pen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 85 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_85.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '볼펜' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #86 신문 (Noun) - "newspaper"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 86 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_86.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '신문' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #87 연필 (Noun) - "pencil"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 87 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_87.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '연필' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #88 잡지 (Noun) - "magazine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 88 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_88.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잡지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #89 지갑 (Noun) - "wallet"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 89 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_89.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지갑' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #90 지우개 (Noun) - "eraser"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 90 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_90.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지우개' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #91 필통 (Noun) - "pencil case"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 91 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_91.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '필통' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #92 학생증 (Noun) - "student ID card"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 92 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_92.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '학생증' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #93 휴대전화 (Noun) - "cell phone"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 93 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_93.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '휴대전화' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #94 휴지 (Noun) - "tissue"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 94 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_94.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '휴지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #97 도서관 (Noun) - "library"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 97 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_97.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '도서관' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #98 안 (Noun) - "inside"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 98 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_98.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '안' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #99 앞 (Noun) - "front"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 99 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_99.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '앞' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #101 은행 (Noun) - "bank"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 101 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_101.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '은행' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #102 학생회관 (Noun) - "student union"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 102 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_102.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '학생회관' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #103 기숙사 (Noun) - "dormitory"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 103 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_103.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '기숙사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #104 꽃 (Noun) - "flower"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 104 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_104.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '꽃' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #105 뒤 (Noun) - "behind"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 105 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_105.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '뒤' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #106 밖 (Noun) - "outside"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 106 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_106.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '밖' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #107 사무실 (Noun) - "office"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 107 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_107.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사무실' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #108 서점 (Noun) - "bookstore"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 108 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_108.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '서점' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #109 식당 (Noun) - "restaurant"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 109 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_109.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '식당' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #110 아래 (Noun) - "below/under"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 110 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_110.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아래' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #111 옆 (Noun) - "next to"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 111 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_111.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '옆' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #112 우체국 (Noun) - "post office"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 112 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_112.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '우체국' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #113 위 (Noun) - "above"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 113 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_113.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '위' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #115 체육관 (Noun) - "gym"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 115 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_115.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '체육관' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #116 편의점 (Noun) - "convenience store"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 116 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_116.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '편의점' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #117 근처 (Noun) - "near"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 117 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_117.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '근처' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #118 방 (Noun) - "room"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 118 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_118.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '방' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #119 학생식당 (Noun) - "student cafeteria"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 119 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_119.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '학생식당' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #123 날씨 (Noun) - "weather"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 123 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_123.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '날씨' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #133 저분 (Noun) - "that person (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 133 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_133.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '저분' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #134 한국말 (Noun) - "Korean language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 134 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_134.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한국말' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #137 베트남말 (Noun) - "Vietnamese language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 137 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_137.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '베트남말' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #138 빵 (Noun) - "bread"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 138 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_138.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '빵' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #139 영어 (Noun) - "English language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 139 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_139.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '영어' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #140 음악 (Noun) - "Music"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 140 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_140.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '음악' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #141 일본말 (Noun) - "Japanese language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 141 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_141.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '일본말' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #142 중국말 (Noun) - "Chinese language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 142 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_142.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '중국말' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #143 커피 (Noun) - "coffee"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 143 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_143.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '커피' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #144 프랑스말 (Noun) - "French language"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 144 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_144.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '프랑스말' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #154 지금 (Noun) - "now"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 154 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_154.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지금' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #155 게임 (Noun) - "game"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 155 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_155.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '게임' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #157 피시방 (Noun) - "internet cafe"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 157 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_157.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '피시방' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #159 꽃집 (Noun) - "flower shop"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 159 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_159.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '꽃집' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #160 노래방 (Noun) - "karaoke"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 160 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_160.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '노래방' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #161 문구점 (Noun) - "stationery store"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 161 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_161.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '문구점' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #162 백화점 (Noun) - "department store"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 162 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_162.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '백화점' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #163 빵집 (Noun) - "bakery"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 163 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_163.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '빵집' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #164 찜질방 (Noun) - "korean sauna"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 164 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_164.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '찜질방' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #165 태권도 (Noun) - "taekwondo"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 165 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_165.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '태권도' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #174 고향 (Noun) - "hometown"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 174 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_174.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고향' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #175 바다 (Noun) - "ocean"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 175 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_175.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '바다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #176 수영 (Noun) - "swimming"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 176 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_176.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '수영' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #178 강 (Noun) - "river"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 178 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_178.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '강' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #179 산 (Noun) - "mountain"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 179 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_179.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '산' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #180 집 (Noun) - "house/home"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 180 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_180.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '집' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #181 호수 (Noun) - "lake"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 181 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_181.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '호수' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #182 회사 (Noun) - "company"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 182 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_182.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '회사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #183 서울 (Noun) - "Seoul"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 183 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_183.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '서울' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #186 경치 (Noun) - "scenery"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 186 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_186.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '경치' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #187 남자 (Noun) - "man"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 187 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_187.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '남자' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #188 생선 (Noun) - "fish (food)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 188 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_188.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '생선' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #189 생활 (Noun) - "life/living"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 189 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_189.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '생활' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #190 여자 (Noun) - "woman"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 190 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_190.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여자' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #202 반 (Noun) - "half"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 202 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_202.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '반' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #204 시 (Noun) - "hour/o'clock"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 204 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_204.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #206 점심 (Noun) - "lunch"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 206 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_206.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '점심' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #208 아침 (Noun) - "morning/breakfast"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 208 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_208.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아침' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #209 영화 (Noun) - "movie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 209 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_209.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '영화' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #210 오전 (Noun) - "morning/AM"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 210 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_210.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오전' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #211 오후 (Noun) - "afternoon/PM"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 211 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_211.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오후' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #212 저녁 (Noun) - "dinner/evening"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 212 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_212.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '저녁' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #224 교과서 (Noun) - "textbook"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 224 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_224.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '교과서' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #225 대화 (Noun) - "conversation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 225 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_225.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '대화' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #226 번 (Noun) - "times/number"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 226 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_226.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '번' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #227 수업 (Noun) - "class"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 227 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_227.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '수업' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #228 숙제 (Noun) - "homework"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 228 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_228.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '숙제' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #229 쪽 (Noun) - "page"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 229 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_229.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쪽' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #249 분 (Noun) - "minute"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 249 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_249.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '분' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #250 나이 (Noun) - "age"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 250 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_250.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '나이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #285 불고기 (Noun) - "bulgogi"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 285 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_285.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '불고기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #289 무슨 (Noun) - "what kind"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 289 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_289.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '무슨' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #291 과일 (Noun) - "fruit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 291 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_291.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '과일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #292 냉면 (Noun) - "cold noodles"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 292 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_292.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '냉면' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #293 녹차 (Noun) - "green tea"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 293 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_293.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '녹차' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #294 딸기 (Noun) - "strawberry"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 294 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_294.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '딸기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #295 맛 (Noun) - "taste"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 295 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_295.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '맛' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #296 비빔밥 (Noun) - "bibimbap"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 296 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_296.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '비빔밥' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #297 사과 (Noun) - "apple"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 297 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_297.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사과' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #298 삼계탕 (Noun) - "ginseng chicken soup"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 298 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_298.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '삼계탕' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #299 샌드위치 (Noun) - "sandwich"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 299 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_299.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '샌드위치' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #300 서양 (Noun) - "western"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 300 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_300.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '서양' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #301 액션영화 (Noun) - "action movie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 301 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_301.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '액션영화' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #302 우동 (Noun) - "udon"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 302 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_302.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '우동' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #303 유자차 (Noun) - "citron tea"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 303 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_303.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '유자차' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #304 음식 (Noun) - "food"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 304 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_304.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '음식' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #305 자장면 (Noun) - "jajangmyeon"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 305 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_305.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '자장면' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #306 짬뽕 (Noun) - "jjamppong"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 306 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_306.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '짬뽕' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #307 차 (Noun) - "tea"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 307 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_307.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '차' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #308 초밥 (Noun) - "sushi"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 308 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_308.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '초밥' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #309 코미디 영화 (Noun) - "comedy movie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 309 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_309.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '코미디 영화' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #310 피자 (Noun) - "pizza"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 310 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_310.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '피자' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #318 그릇 (Noun) - "bowl"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 318 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_318.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그릇' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #319 삼겹살 (Noun) - "pork belly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 319 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_319.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '삼겹살' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #320 인분 (Noun) - "portion"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 320 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_320.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '인분' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #326 김밥 (Noun) - "kimbap"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 326 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_326.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '김밥' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #327 맥주 (Noun) - "beer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 327 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_327.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '맥주' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #329 개 (Noun) - "item"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 329 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_329.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '개' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #330 마리 (Noun) - "animal counter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 330 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_330.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '마리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #331 병 (Noun) - "bottle"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 331 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_331.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '병' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #332 잔 (Noun) - "cup"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 332 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_332.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #333 줄 (Noun) - "row"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 333 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_333.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '줄' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #334 판 (Noun) - "plate/pan"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 334 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_334.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '판' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #337 오늘 (Noun) - "today"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 337 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_337.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오늘' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #338 요일 (Noun) - "day of the week"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 338 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_338.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '요일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #339 토요일 (Noun) - "Saturday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 339 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_339.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '토요일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #341 생일 (Noun) - "birthday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 341 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_341.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '생일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #342 크리스마스 (Noun) - "Christmas"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 342 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_342.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '크리스마스' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #343 월요일 (Noun) - "Monday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 343 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_343.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '월요일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #344 화요일 (Noun) - "Tuesday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 344 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_344.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '화요일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #345 수요일 (Noun) - "Wednesday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 345 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_345.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '수요일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #346 목요일 (Noun) - "Thursday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 346 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_346.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '목요일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #347 금요일 (Noun) - "Friday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 347 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_347.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '금요일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #348 일요일 (Noun) - "Sunday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 348 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_348.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '일요일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #349 월 (Noun) - "month"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 349 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_349.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '월' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #350 일 (Noun) - "day"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 350 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_350.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #351 산책 (Noun) - "stroll"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 351 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_351.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '산책' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #361 이 (Noun) - "teeth"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 361 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_361.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #368 운동장 (Noun) - "playground"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 368 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_368.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '운동장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #369 주말 (Noun) - "weekend"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 369 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_369.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주말' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #370 축구 (Noun) - "soccer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 370 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_370.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '축구' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #374 골프 (Noun) - "golf"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 374 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_374.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '골프' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #375 골프장 (Noun) - "golf course"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 375 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_375.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '골프장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #376 농구 (Noun) - "basketball"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 376 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_376.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '농구' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #377 농구장 (Noun) - "basketball court"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 377 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_377.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '농구장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #378 서핑 (Noun) - "surfing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 378 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_378.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '서핑' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #379 수영 (Noun) - "swimming"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 379 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_379.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '수영' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #380 수영장 (Noun) - "swimming pool"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 380 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_380.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '수영장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #381 스노보드 (Noun) - "snowboard"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 381 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_381.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '스노보드' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #382 스케이트 (Noun) - "skate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 382 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_382.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '스케이트' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #383 스케이트장 (Noun) - "skating rink"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 383 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_383.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '스케이트장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #384 스키 (Noun) - "ski"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 384 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_384.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '스키' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #385 스키장 (Noun) - "ski resort"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 385 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_385.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '스키장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #386 요가 (Noun) - "yoga"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 386 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_386.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '요가' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #387 지하철 (Noun) - "subway"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 387 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_387.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지하철' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #388 탁구 (Noun) - "table tennis"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 388 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_388.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '탁구' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #389 탁구장 (Noun) - "table tennis room"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 389 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_389.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '탁구장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #390 테니스 (Noun) - "tennis"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 390 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_390.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '테니스' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #391 테니스장 (Noun) - "tennis court"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 391 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_391.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '테니스장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #401 김치 (Noun) - "kimchi"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 401 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_401.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '김치' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #402 아이 (Noun) - "child"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 402 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_402.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #403 한식 (Noun) - "Korean food"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 403 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_403.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한식' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #418 공원 (Noun) - "park"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 418 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_418.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '공원' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #419 어제 (Noun) - "yesterday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 419 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_419.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어제' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #421 그제 (Noun) - "day before yesterday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 421 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_421.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그제' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #422 금년 (Noun) - "this year (sino)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 422 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_422.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '금년' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #423 내년 (Noun) - "next year"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 423 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_423.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '내년' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #424 내일 (Noun) - "tomorrow"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 424 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_424.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '내일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #425 다음일 (Noun) - "next task"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 425 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_425.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다음일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #426 다음 (Noun) - "next"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 426 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_426.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다음' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #427 달 (Noun) - "month/moon"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 427 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_427.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '달' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #428 다음달 (Noun) - "next month"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 428 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_428.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다음달' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #429 다음주 (Noun) - "next week"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 429 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_429.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다음주' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #430 모레 (Noun) - "day after tomorrow"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 430 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_430.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '모레' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #431 올해 (Noun) - "this year"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 431 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_431.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '올해' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #432 이번 (Noun) - "this time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 432 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_432.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이번' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #433 작년 (Noun) - "last year (sino)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 433 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_433.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '작년' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #434 지난해 (Noun) - "last year"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 434 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_434.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지난해' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #435 주 (Noun) - "week"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 435 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_435.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #436 지난달 (Noun) - "last month"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 436 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_436.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지난달' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #437 지난주 (Noun) - "last week"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 437 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_437.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지난주' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #438 지난 (Noun) - "previous"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 438 -eng none --ast -sentence 10 --seed 1793700700000 -o scratch/audit/unit_438.txt`
- **Seed:** `1793700700000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지난' functions correctly within its syntactic slot without allomorphic or case errors.

