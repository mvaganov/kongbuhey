# Linguistic Audit Report: Batch 05 (Action Verbs (Part A))

> **Batch ID:** 05  
> **Category:** Action Verbs (Part A)  
> **Target Manifest:** `audit/batches/batch_05_action_verbs_part_a.json`  
> **Total In-Scope Units:** 190  
> **PRNG Seed:** `1793700500000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (190 / 190 Analyzed)**  
> **Audit Summary:** **Clean: 190 units (100.0%) | Flagged: 0 units (0.0%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 05 audits 190 core Action Verbs covering foundational daily actions, eating/cooking, clothing, movement, communication, and basic commerce.
Following Round 1 findings and Round 2 targeted remediation, all 190 units were re-evaluated and confirmed to achieve 100% clean sentence generation.

### Key Round 2 Remediations Verified:
1. Involuntary & Passive Event Volition Guard: Verbs denoting spontaneous or passive occurrences ('끝나다', '시작되다', '고장 나다', '죽다', '생기다', '열리다', '닫히다') are strictly barred from volitional desire auxiliary '-고 싶어하다' (*'끝나고 싶어해요'*), generating natural indicative past and future forms instead ('방학이 끝났어요', '학기가 시작되었어요').
2. Retagging of '나이' (Age, ID 250): With '나이' retagged from 'person' to 'person_attribute', human agent/experiencer and social communication verbs ('만나다', '사귀다', '전화하다', '선물하다', '춤추다') strictly select genuine human nouns, completely eliminating nonsensical collocations (*'나이를 만나요'*).
3. Food Manipulation & Collocation Precision: Cooking verbs ('썰다', '다지다', '튀기다', '깎다') operate with fine-grained semantic taxon constraints, eliminating liquid soup slicing (*'설렁탕을 썰어요'*) or commercial venue mincing (*'빵집을 다져요'*).
4. Posture Locative Alignment ('앉다'): Restricts static locative complements to physical seating surfaces ('의자', '자리', '소파', '바닥'), preventing macro-geographic mismatches (*'한국에 앉다'*).
5. Irregular Verb Inflection: Complex irregular action stems (ㄷ-irregular '듣다/걷다/묻다', ㅂ-irregular '돕다/줍다', ㅅ-irregular '짓다/젓다/붓다', 르-irregular '부르다/자르다/골라다') maintain 100% morphological accuracy.

---

## 2. Detailed Linguistic Audit Findings

### Unit #40 먹다 (Action Verb) - "to eat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 40 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_40.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '먹다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #41 마시다 (Action Verb) - "to drink"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 41 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_41.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '마시다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #44 가다 (Action Verb) - "to go"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 44 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_44.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #135 배우다 (Action Verb) - "to learn"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 135 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_135.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '배우다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #136 오다 (Action Verb) - "to come"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 136 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_136.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #145 가르치다 (Action Verb) - "to teach"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 145 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_145.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가르치다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #146 기다리다 (Action Verb) - "to wait"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 146 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_146.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '기다리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #147 듣다 (Action Verb) - "to listen/hear"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 147 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_147.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '듣다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #148 만나다 (Action Verb) - "to meet"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 148 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_148.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '만나다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #149 보다 (Action Verb) - "to see/watch"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 149 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_149.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '보다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #150 사다 (Action Verb) - "to buy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 150 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_150.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #151 쓰다 (Action Verb) - "to write"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 151 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_151.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쓰다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #152 읽다 (Action Verb) - "to read"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 152 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_152.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '읽다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #153 입다 (Action Verb) - "to wear"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 153 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_153.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '입다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #158 하다 (Action Verb) - "to do"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 158 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_158.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #166 게임하다 (Action Verb) - "to play games"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 166 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_166.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '게임하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #167 공부하다 (Action Verb) - "to study"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 167 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_167.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '공부하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #168 노래하다 (Action Verb) - "to sing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 168 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_168.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '노래하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #169 식사하다 (Action Verb) - "to have a meal"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 169 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_169.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '식사하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #170 아르바이트하다 (Action Verb) - "to work part time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 170 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_170.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아르바이트하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #171 운동하다 (Action Verb) - "to exercise"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 171 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_171.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '운동하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #172 일하다 (Action Verb) - "to work"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 172 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_172.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '일하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #230 알다 (Action Verb) - "to know/understand"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 230 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_230.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '알다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #232 닫다 (Action Verb) - "to close"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 232 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_232.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '닫다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #233 운전하다 (Action Verb) - "to drive"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 233 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_233.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '운전하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #234 전화하다 (Action Verb) - "to call"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 234 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_234.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전화하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #286 만들다 (Action Verb) - "to make"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 286 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_286.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '만들다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #288 좋아하다 (Action Verb) - "to like"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 288 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_288.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '좋아하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #313 놀다 (Action Verb) - "to play/hang out"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 313 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_313.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '놀다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #316 살다 (Action Verb) - "to live"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 316 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_316.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '살다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #317 열다 (Action Verb) - "to open"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 317 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_317.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #321 시키다 (Action Verb) - "to order"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 321 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_321.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시키다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #322 주다 (Action Verb) - "to give"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 322 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_322.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #328 앉다 (Action Verb) - "to sit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 328 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_328.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '앉다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #352 샤워하다 (Action Verb) - "to take a shower"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 352 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_352.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '샤워하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #356 끝나다 (Action Verb) - "to finish"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 356 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_356.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '끝나다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #357 세수하다 (Action Verb) - "to wash one's face"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 357 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_357.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '세수하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #358 일어나다 (Action Verb) - "to wake up"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 358 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_358.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '일어나다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #359 자다 (Action Verb) - "to sleep"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 359 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_359.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '자다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #360 닦다 (Action Verb) - "to brush/wipe"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 360 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_360.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '닦다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #362 걷다 (Action Verb) - "to walk"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 362 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_362.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '걷다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #363 묻다 (Action Verb) - "to ask"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 363 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_363.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '묻다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #364 싣다 (Action Verb) - "to load"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 364 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_364.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '싣다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #365 받다 (Action Verb) - "to receive"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 365 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_365.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '받다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #393 빌리다 (Action Verb) - "to borrow/rent"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 393 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_393.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '빌리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #395 잘하다 (Action Verb) - "to do well"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 395 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_395.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잘하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #396 치다 (Action Verb) - "to play (racket/cue sports), hit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 396 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_396.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '치다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #397 타다 (Action Verb) - "to ride"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 397 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_397.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '타다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #398 등산하다 (Action Verb) - "to hike"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 398 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_398.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '등산하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #399 청소하다 (Action Verb) - "to do cleaning"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 399 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_399.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '청소하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #404 데이트하다 (Action Verb) - "to go out with someone"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 404 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_404.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '데이트하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #405 빨래하다 (Action Verb) - "to do laundry"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 405 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_405.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '빨래하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #406 쇼핑하다 (Action Verb) - "to go shopping"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 406 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_406.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쇼핑하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #407 여행하다 (Action Verb) - "to travel"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 407 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_407.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여행하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #411 돕다 (Action Verb) - "to help"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 411 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_411.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '돕다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #420 쉬다 (Action Verb) - "to rest"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 420 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_420.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쉬다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #442 예매하다 (Action Verb) - "to book"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 442 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_442.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '예매하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #454 예약하다 (Action Verb) - "to make a reservation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 454 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_454.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '예약하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #466 자전거를 타다 (Action Verb) - "to ride a bicycle"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 466 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_466.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '자전거를 타다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #469 약속을 지키다 (Action Verb) - "to keep appointment"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 469 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_469.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '약속을 지키다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #470 약속을 하다 (Action Verb) - "to make appointment"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 470 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_470.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '약속을 하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #504 계시다 (Action Verb) - "to be"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 504 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_504.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '계시다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #505 드시다 (Action Verb) - "to eat/drink"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 505 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_505.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '드시다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #506 말씀하시다 (Action Verb) - "to speak"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 506 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_506.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '말씀하시다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #507 잡수시다 (Action Verb) - "to eat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 507 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_507.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잡수시다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #508 주무시다 (Action Verb) - "to sleep"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 508 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_508.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주무시다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #513 구경하다 (Action Verb) - "to look around"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 513 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_513.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '구경하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #517 그림을 그리다 (Action Verb) - "to draw a picture"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 517 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_517.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그림을 그리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #518 독서를 하다 (Action Verb) - "to read"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 518 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_518.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '독서를 하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #519 사진을 찍다 (Action Verb) - "to take a photo"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 519 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_519.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사진을 찍다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #520 요리를 하다 (Action Verb) - "to cook"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 520 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_520.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '요리를 하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #521 춤을 추다 (Action Verb) - "to dance"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 521 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_521.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '춤을 추다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #554 찾다 (Action Verb) - "to find"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 554 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_554.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '찾다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #579 선물하다 (Action Verb) - "to give a gift"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 579 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_579.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '선물하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #591 드리다 (Action Verb) - "to give (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 591 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_591.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '드리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #592 말씀드리다 (Action Verb) - "to say (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 592 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_592.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '말씀드리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #593 말하다 (Action Verb) - "to say"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 593 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_593.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '말하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #594 보내다 (Action Verb) - "to send"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 594 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_594.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '보내다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #595 연락드리다 (Action Verb) - "to contact (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 595 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_595.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '연락드리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #596 연락하다 (Action Verb) - "to contact"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 596 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_596.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '연락하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #597 인사드리다 (Action Verb) - "to greet (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 597 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_597.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '인사드리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #598 인사하다 (Action Verb) - "to greet"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 598 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_598.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '인사하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #599 전화드리다 (Action Verb) - "to call (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 599 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_599.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전화드리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #600 전화하다 (Action Verb) - "to call"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 600 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_600.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전화하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #604 고르다 (Action Verb) - "to pick/select"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 604 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_604.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #605 준비하다 (Action Verb) - "to prepare"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 605 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_605.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '준비하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #606 축하하다 (Action Verb) - "to congratulate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 606 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_606.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '축하하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #609 생일축하 노래를 부르다 (Action Verb) - "to sing a birthday song"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 609 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_609.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '생일축하 노래를 부르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #610 선물을 고르다 (Action Verb) - "to pick a gift"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 610 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_610.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '선물을 고르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #611 카드를 쓰다 (Action Verb) - "to write a card"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 611 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_611.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '카드를 쓰다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #612 케이크를 자르다 (Action Verb) - "to cut cake"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 612 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_612.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '케이크를 자르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #613 풍선을 불다 (Action Verb) - "to blow a balloon"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 613 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_613.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '풍선을 불다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #615 모르다 (Action Verb) - "to not know"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 615 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_615.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '모르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #616 부르다 (Action Verb) - "to sing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 616 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_616.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #617 자르다 (Action Verb) - "to cut"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 617 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_617.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '자르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #630 전화를 받다 (Action Verb) - "to receive a call"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 630 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_630.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전화를 받다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #633 문자메시지를 받다 (Action Verb) - "to receive a text message"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 633 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_633.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '문자메시지를 받다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #634 문자메시지를 보내다 (Action Verb) - "to send a text message"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 634 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_634.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '문자메시지를 보내다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #635 전화가 오다 (Action Verb) - "call is coming"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 635 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_635.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전화가 오다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #636 전화를 걸다 (Action Verb) - "to make a call"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 636 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_636.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전화를 걸다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #637 전화를 끊다 (Action Verb) - "to hang up a call"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 637 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_637.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전화를 끊다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #638 전화를 바꾸다 (Action Verb) - "to put someone else on the phone"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 638 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_638.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전화를 바꾸다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #643 여쭙다 (Action Verb) - "to ask (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 643 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_643.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여쭙다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #651 걸리다 (Action Verb) - "to take (time)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 651 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_651.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '걸리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #667 내리다 (Action Verb) - "to get off (bus, train)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 667 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_667.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '내리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #673 갈아타다 (Action Verb) - "to transfer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 673 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_673.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '갈아타다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #674 끄다 (Action Verb) - "to turn off"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 674 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_674.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '끄다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #675 도착하다 (Action Verb) - "to arrive"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 675 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_675.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '도착하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #676 출발하다 (Action Verb) - "to depart"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 676 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_676.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '출발하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #694 물어보다 (Action Verb) - "to ask"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 694 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_694.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '물어보다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #699 건너다 (Action Verb) - "to cross"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 699 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_699.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '건너다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #700 보이다 (Action Verb) - "to be seen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 700 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_700.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '보이다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #706 나가다 (Action Verb) - "to exit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 706 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_706.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '나가다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #707 내려가다 (Action Verb) - "to go down"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 707 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_707.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '내려가다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #708 들어가다 (Action Verb) - "to enter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 708 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_708.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '들어가다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #709 올라가다 (Action Verb) - "to go up"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 709 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_709.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '올라가다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #714 가지고 오다 (Action Verb) - "to bring"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 714 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_714.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가지고 오다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #715 비가 오다 (Action Verb) - "it's raining"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 715 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_715.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '비가 오다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #716 우산을 쓰다 (Action Verb) - "to use an umbrella"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 716 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_716.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '우산을 쓰다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #722 눈이 오다 (Action Verb) - "it's snowing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 722 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_722.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '눈이 오다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #723 바람이 불다 (Action Verb) - "wind is blowing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 723 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_723.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '바람이 불다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #726 피다 (Action Verb) - "to blossom"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 726 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_726.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '피다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #727 소풍을 가다 (Action Verb) - "to go on a picnic"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 727 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_727.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '소풍을 가다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #731 눈싸움을 하다 (Action Verb) - "to snowfight"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 731 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_731.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '눈싸움을 하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #732 단풍 구경을 하다 (Action Verb) - "to see autumn leaves"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 732 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_732.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '단풍 구경을 하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #733 담배를 피우다 (Action Verb) - "to smoke a cigarette"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 733 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_733.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '담배를 피우다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #734 해수욕장에 가다 (Action Verb) - "to go to a beach"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 734 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_734.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '해수욕장에 가다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #741 민박하다 (Action Verb) - "to stay at bed and breakfast"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 741 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_741.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '민박하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #748 계획을 세우다 (Action Verb) - "to make a plan"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 748 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_748.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '계획을 세우다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #749 여행을 가다 (Action Verb) - "to go on a trip"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 749 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_749.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여행을 가다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #751 떠나다 (Action Verb) - "to leave"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 751 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_751.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '떠나다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #756 신다 (Action Verb) - "to wear (shoes)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 756 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_756.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '신다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #757 쓰다 (Action Verb) - "to wear on head"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 757 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_757.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쓰다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #758 돈을 바꾸다 (Action Verb) - "to exchange money"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 758 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_758.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '돈을 바꾸다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #760 돌아오다 (Action Verb) - "to come back"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 760 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_760.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '돌아오다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #761 방학하다 (Action Verb) - "to vacation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 761 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_761.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '방학하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #762 시작되다 (Action Verb) - "to be started"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 762 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_762.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시작되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #769 방학이 끝나다 (Action Verb) - "vacation is over"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 769 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_769.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '방학이 끝나다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #770 방학이 시작되다 (Action Verb) - "vacation starts"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 770 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_770.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '방학이 시작되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #771 학기가 끝나다 (Action Verb) - "semester is over"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 771 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_771.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '학기가 끝나다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #772 학기가 시작되다 (Action Verb) - "semester starts"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 772 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_772.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '학기가 시작되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #775 세배하다 (Action Verb) - "to do New Year's bow"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 775 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_775.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '세배하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #784 그만두다 (Action Verb) - "to quit/leave"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 784 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_784.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그만두다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #785 다니다 (Action Verb) - "to attend/go"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 785 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_785.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다니다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #788 사귀다 (Action Verb) - "to make friends with"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 788 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_788.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사귀다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #795 지내다 (Action Verb) - "to spend time/get along"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 795 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_795.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지내다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #797 출근하다 (Action Verb) - "to go to work"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 797 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_797.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '출근하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #813 전공하다 (Action Verb) - "to major in"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 813 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_813.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전공하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #814 졸업하다 (Action Verb) - "to graduate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 814 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_814.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '졸업하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #820 도와주다 (Action Verb) - "to help, give help"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 820 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_820.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '도와주다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #861 다녀오다 (Action Verb) - "visit, to go and come back"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 861 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_861.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다녀오다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #891 화가 나다 (Action Verb) - "to get angry, be enraged"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 891 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_891.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '화가 나다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #895 계약하다 (Action Verb) - "to sign a contract, make an agreement"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 895 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_895.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '계약하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #901 싸다 (Action Verb) - "to pack, wrap"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 901 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_901.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '싸다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #902 알아보다 (Action Verb) - "to look into, investigate, recognize"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 902 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_902.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '알아보다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #904 이사하다 (Action Verb) - "to move (residence)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 904 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_904.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이사하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #907 정리하다 (Action Verb) - "to organize, arrange, clean up"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 907 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_907.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '정리하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #915 걸다 (Action Verb) - "to hang, make (a phone call), bet"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 915 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_915.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '걸다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #916 놓다 (Action Verb) - "to put, place, set down"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 916 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_916.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '놓다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #934 깎다 (Action Verb) - "to peel, cut, pare, discount"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 934 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_934.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '깎다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #935 넣다 (Action Verb) - "to put in, insert"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 935 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_935.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '넣다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #936 덜다 (Action Verb) - "to lessen, remove part of, serve onto a plate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 936 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_936.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '덜다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #938 말다 (Action Verb) - "to roll, mix (rice in soup), refrain from"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 938 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_938.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '말다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #941 비비다 (Action Verb) - "to mix, rub"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 941 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_941.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '비비다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #942 뿌리다 (Action Verb) - "to sprinkle, scatter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 942 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_942.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '뿌리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #944 섞다 (Action Verb) - "to mix, blend"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 944 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_944.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '섞다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #951 양념하다 (Action Verb) - "to season, marinate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 951 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_951.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '양념하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #954 찍다 (Action Verb) - "to take (photo), dip, stamp, print"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 954 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_954.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '찍다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #963 굽다 (Action Verb) - "to grill, roast, bake"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 963 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_963.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '굽다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #965 꽃다 (Action Verb) - "to skewer, stick in, plug in"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 965 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_965.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '꽃다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #966 끓이다 (Action Verb) - "to boil (soup, water)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 966 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_966.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '끓이다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #968 다지다 (Action Verb) - "to mince, chop finely, strengthen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 968 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_968.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다지다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #972 두다 (Action Verb) - "to put, leave, place"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 972 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_972.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '두다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #974 버리다 (Action Verb) - "to throw away, discard"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 974 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_974.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '버리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #976 보다 (Action Verb) - "to see, look, watch, take (test)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 976 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_976.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '보다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #977 볶다 (Action Verb) - "to stir-fry, fry"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 977 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_977.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '볶다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #978 삶다 (Action Verb) - "to boil (eggs, meat)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 978 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_978.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '삶다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #981 썰다 (Action Verb) - "to slice, chop"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 981 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_981.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '썰다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #986 잃어버리다 (Action Verb) - "to lose (something)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 986 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_986.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잃어버리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #988 찌다 (Action Verb) - "to steam, gain weight"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 988 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_988.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '찌다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #992 튀기다 (Action Verb) - "to deep-fry, splatter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 992 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_992.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '튀기다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1015 팔다 (Action Verb) - "to sell"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1015 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_1015.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '팔다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1028 메다 (Action Verb) - "to carry on shoulder, wear (backpack, bag)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1028 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_1028.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '메다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1033 세일하다 (Action Verb) - "to go on sale, discount"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1033 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_1033.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '세일하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1036 쓰다 (Action Verb) - "to wear (hat, glasses)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1036 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_1036.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쓰다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1039 차다 (Action Verb) - "to wear, fasten (watch, bracelet)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1039 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_1039.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '차다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1047 갈아입다 (Action Verb) - "to change clothes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1047 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_1047.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '갈아입다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1048 떠들다 (Action Verb) - "to make noise, chatter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1048 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_1048.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '떠들다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1049 뛰다 (Action Verb) - "to run, jump"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1049 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_1049.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '뛰다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1050 만지다 (Action Verb) - "to touch, feel"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1050 -eng none --ast -sentence 10 --seed 1793700500000 -o scratch/audit/unit_1050.txt`
- **Seed:** `1793700500000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '만지다' functions correctly within its syntactic slot without allomorphic or case errors.

