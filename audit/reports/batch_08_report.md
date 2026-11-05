# Linguistic Audit Report: Batch 08 (Nouns (Part B))

> **Batch ID:** 08  
> **Category:** Nouns (Part B)  
> **Target Manifest:** `audit/batches/batch_08_nouns_part_b.json`  
> **Total In-Scope Units:** 221  
> **PRNG Seed:** `1793700800000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (221 / 221 Analyzed)**  
> **Audit Summary:** **Clean: 221 units (100.0%) | Flagged: 0 units (0.0%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 08 audits 221 Nouns spanning transportation items, clothing articles, institutions, locations, family relationships, animals, and common physical objects.
Following Round 1 findings and Round 2 targeted remediation, all 221 units were generated with seed 1793700800000 and evaluated, achieving 100% clean sentence generation.

### Key Round 2 Remediations Verified:
1. Verbal Stem Contraction vs. Copula Sandhi ('줄이다', '끓이다', '움직이다', '붙이다'): Resolved a critical defect in 'stem_engine.js' where closed-syllable verb stems ending in '-이-' were falsely routed into nominal copula coda sandhi ('-이어-'), producing ungrammatical forms like *'줄이에요'* and *'줄이었어요'*. Verbal stems now contract properly to '-여요' / '-였어요' ('줄여요', '줄였어요', '끓여요', '끓였어요').
2. Multi-Word Predicate Filtering: Excluded multi-word descriptive verbs ('결과 다르다') and non-predicative stems ('안녕하다', '싶다') globally from 'selectDescriptiveVerbForNoun', completely eliminating spurious collocations like *'옷이 결과 달라요'* across all clothing articles and object nouns.
3. Sociolinguistic Honorific Concord: Junior family members ('남동생') strictly barred from elder suppletive predicates ('잡수시다'), and elder relatives ('외할머니', '외할아버지') appropriately paired with honorific markers.
4. Animacy & Collocation Filters: Human relatives barred from loanable object slots with '빌려주다', and specialized cooking predicates ('짓다') restricted to culturally normative arguments.

---

## 2. Detailed Linguistic Audit Findings

### Unit #440 콘서트 (Noun) - "concert"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 440 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_440.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '콘서트' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #441 표 (Noun) - "ticket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 441 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_441.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '표' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #445 기차표 (Noun) - "train ticket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 445 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_445.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '기차표' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #446 병원 (Noun) - "hospital"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 446 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_446.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '병원' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #447 비행기 표 (Noun) - "plane ticket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 447 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_447.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '비행기 표' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #448 식당 (Noun) - "restaurant"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 448 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_448.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '식당' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #449 영화표 (Noun) - "movie ticket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 449 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_449.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '영화표' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #450 옷 (Noun) - "clothes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 450 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_450.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '옷' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #451 호텔 (Noun) - "hotel"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 451 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_451.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '호텔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #462 약속 (Noun) - "appointment"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 462 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_462.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '약속' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #463 한강공원 (Noun) - "Hangang park"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 463 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_463.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한강공원' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #465 요즘 (Noun) - "these days"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 465 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_465.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '요즘' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #467 약속 시간 (Noun) - "appointment time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 467 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_467.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '약속 시간' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #468 약속 장소 (Noun) - "appointment place"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 468 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_468.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '약속 장소' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #474 놀이공원 (Noun) - "amusement park"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 474 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_474.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '놀이공원' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #475 드라마 (Noun) - "drama"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 475 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_475.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '드라마' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #478 극장 (Noun) - "theater"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 478 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_478.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '극장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #479 동물원 (Noun) - "zoo"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 479 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_479.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '동물원' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #480 미술관 (Noun) - "art gallery"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 480 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_480.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '미술관' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #481 박물관 (Noun) - "museum"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 481 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_481.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '박물관' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #482 영화관 (Noun) - "movie theater"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 482 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_482.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '영화관' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #483 카페 (Noun) - "cafe"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 483 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_483.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '카페' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #486 교수 (Noun) - "professor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 486 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_486.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '교수' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #487 대학교 (Noun) - "college"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 487 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_487.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '대학교' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #488 아버지 (Noun) - "father"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 488 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_488.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아버지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #489 역사 (Noun) - "history"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 489 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_489.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '역사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #491 남동생 (Noun) - "younger brother"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 491 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_491.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '남동생' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #492 누나 (Noun) - "older sister (for male)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 492 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_492.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '누나' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #493 부모님 (Noun) - "parents"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 493 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_493.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부모님' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #494 어머니 (Noun) - "mother"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 494 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_494.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어머니' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #495 언니 (Noun) - "older sister (for female)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 495 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_495.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '언니' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #496 여동생 (Noun) - "younger sister"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 496 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_496.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여동생' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #497 오빠 (Noun) - "older brother (for female)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 497 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_497.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오빠' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #498 외할머니 (Noun) - "grandmother (mother's side)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 498 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_498.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '외할머니' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #499 외할아버지 (Noun) - "grandfather (mother's side)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 499 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_499.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '외할아버지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #500 할머니 (Noun) - "grandmother"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 500 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_500.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '할머니' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #501 할아버지 (Noun) - "grandfather"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 501 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_501.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '할아버지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #502 형 (Noun) - "older brother (for male)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 502 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_502.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '형' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #503 형제 (Noun) - "sibling"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 503 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_503.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '형제' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #509 과자 (Noun) - "cookie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 509 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_509.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '과자' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #511 요리 (Noun) - "dish"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 511 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_511.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '요리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #526 원 (Noun) - "won"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 526 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_526.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '원' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #527 치마 (Noun) - "skirt"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 527 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_527.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '치마' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #531 만 (Noun) - "ten thousand"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 531 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_531.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '만' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #532 값 (Noun) - "price"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 532 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_532.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '값' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #533 구두 (Noun) - "dress shoes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 533 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_533.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '구두' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #534 바지 (Noun) - "pants"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 534 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_534.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '바지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #535 백 (Noun) - "hundred"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 535 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_535.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '백' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #536 슬리퍼 (Noun) - "slippers"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 536 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_536.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '슬리퍼' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #537 신발 (Noun) - "shoes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 537 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_537.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '신발' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #538 십만 (Noun) - "hundred thousand"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 538 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_538.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '십만' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #539 와이셔츠 (Noun) - "collared shirt"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 539 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_539.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '와이셔츠' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #540 우산 (Noun) - "umbrella"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 540 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_540.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '우산' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #541 운동화 (Noun) - "sneakers"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 541 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_541.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '운동화' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #542 천 (Noun) - "thousand"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 542 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_542.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '천' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #543 코트 (Noun) - "coat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 543 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_543.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '코트' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #544 티셔츠 (Noun) - "t-shirt"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 544 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_544.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '티셔츠' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #550 들 (Noun) - "plural suffix"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 550 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_550.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '들' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #551 송이 (Noun) - "cluster"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 551 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_551.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '송이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #552 스물 (Noun) - "twenty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 552 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_552.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '스물' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #553 장미 (Noun) - "rose"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 553 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_553.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '장미' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #557 가게 (Noun) - "store"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 557 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_557.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가게' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #558 곳 (Noun) - "place"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 558 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_558.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '곳' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #559 면세점 (Noun) - "duty free shop"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 559 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_559.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '면세점' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #560 바나나 (Noun) - "banana"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 560 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_560.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '바나나' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #561 백화점 (Noun) - "department store"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 561 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_561.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '백화점' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #562 슈퍼마켓 (Noun) - "supermarket"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 562 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_562.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '슈퍼마켓' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #563 시장 (Noun) - "market"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 563 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_563.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #564 양말 (Noun) - "socks"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 564 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_564.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '양말' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #565 주스 (Noun) - "juice"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 565 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_565.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주스' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #566 크림빵 (Noun) - "cream bread"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 566 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_566.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '크림빵' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #567 권 (Noun) - "counting word for books"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 567 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_567.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '권' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #568 벌 (Noun) - "counting word for clothes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 568 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_568.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '벌' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #569 자루 (Noun) - "counting word for pen/pencil"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 569 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_569.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '자루' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #570 장 (Noun) - "counting word for paper"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 570 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_570.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #571 켤레 (Noun) - "counting word for shoes/socks"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 571 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_571.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '켤레' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #576 선물 (Noun) - "gift"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 576 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_576.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '선물' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #577 케이크 (Noun) - "cake"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 577 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_577.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '케이크' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #578 화장품 (Noun) - "cosmetics"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 578 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_578.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '화장품' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #581 것 (Noun) - "thing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 581 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_581.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '것' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #582 꽃다발 (Noun) - "bouquet"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 582 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_582.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '꽃다발' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #583 넥타이 (Noun) - "tie"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 583 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_583.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '넥타이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #584 상품권 (Noun) - "gift certificate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 584 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_584.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '상품권' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #585 생신 (Noun) - "birthday (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 585 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_585.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '생신' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #586 시디 (Noun) - "CD"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 586 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_586.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시디' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #587 액세서리 (Noun) - "accessories"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 587 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_587.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '액세서리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #588 이메일 (Noun) - "e-mail"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 588 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_588.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이메일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #589 인형 (Noun) - "doll"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 589 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_589.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '인형' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #590 향수 (Noun) - "perfume"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 590 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_590.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '향수' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #603 초콜릿 (Noun) - "chocolate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 603 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_603.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '초콜릿' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #608 여기저기 (Noun) - "here and there"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 608 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_608.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여기저기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #622 전화번호 (Noun) - "phone number"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 622 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_622.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전화번호' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #624 국가 번호 (Noun) - "country code"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 624 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_624.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '국가 번호' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #625 지역 번호 (Noun) - "area code"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 625 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_625.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지역 번호' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #626 휴대전화 (Noun) - "mobile phone"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 626 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_626.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '휴대전화' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #627 이야기 (Noun) - "story"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 627 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_627.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이야기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #628 파티 (Noun) - "party"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 628 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_628.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '파티' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #631 뉴스 (Noun) - "news"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 631 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_631.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '뉴스' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #639 진지 (Noun) - "meal (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 639 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_639.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '진지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #640 연세 (Noun) - "age (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 640 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_640.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '연세' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #641 성함 (Noun) - "name (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 641 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_641.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '성함' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #642 댁 (Noun) - "house (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 642 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_642.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '댁' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #649 택시 (Noun) - "taxi"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 649 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_649.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '택시' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #654 고속버스 (Noun) - "express bus"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 654 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_654.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고속버스' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #655 공항버스 (Noun) - "airport bus"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 655 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_655.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '공항버스' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #656 기차 (Noun) - "train"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 656 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_656.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '기차' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #657 배 (Noun) - "ship"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 657 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_657.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '배' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #658 버스 (Noun) - "bus"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 658 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_658.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '버스' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #659 비행기 (Noun) - "airplane"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 659 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_659.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '비행기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #660 오토바이 (Noun) - "motorcycle"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 660 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_660.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오토바이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #661 자전거 (Noun) - "bicycle"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 661 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_661.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '자전거' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #662 차 (Noun) - "car"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 662 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_662.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '차' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #663 젓가락 (Noun) - "chopsticks"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 663 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_663.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '젓가락' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #664 종업원 (Noun) - "employee"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 664 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_664.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '종업원' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #665 시간 (Noun) - "hour/time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 665 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_665.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시간' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #666 호선 (Noun) - "subway line"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 666 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_666.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '호선' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #669 고속버스터미널 (Noun) - "express bus terminal"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 669 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_669.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고속버스터미널' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #670 공항 (Noun) - "airport"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 670 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_670.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '공항' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #671 역 (Noun) - "station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 671 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_671.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '역' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #672 정류장 (Noun) - "bus stop"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 672 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_672.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '정류장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #677 번 (Noun) - "number"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 677 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_677.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '번' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #681 미터 (Noun) - "meter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 681 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_681.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '미터' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #682 사거리 (Noun) - "4 way intersection"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 682 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_682.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사거리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #683 약국 (Noun) - "pharmacy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 683 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_683.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '약국' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #684 오른쪽 (Noun) - "right side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 684 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_684.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오른쪽' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #687 그쪽 (Noun) - "your side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 687 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_687.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그쪽' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #688 왼쪽 (Noun) - "left side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 688 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_688.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '왼쪽' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #689 이쪽 (Noun) - "this side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 689 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_689.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이쪽' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #690 저쪽 (Noun) - "that side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 690 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_690.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '저쪽' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #691 지하 (Noun) - "basement"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 691 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_691.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지하' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #692 층 (Noun) - "floor"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 692 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_692.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '층' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #693 한복 (Noun) - "hanbok"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 693 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_693.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한복' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #696 거기 (Noun) - "there"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 696 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_696.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '거기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #697 건너편 (Noun) - "the other side"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 697 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_697.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '건너편' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #698 횡단보도 (Noun) - "crosswalk"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 698 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_698.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '횡단보도' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #701 약 (Noun) - "medicine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 701 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_701.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '약' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #702 육교 (Noun) - "pedestrian overpass"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 702 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_702.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '육교' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #703 지하도 (Noun) - "underpass"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 703 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_703.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지하도' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #704 출구 (Noun) - "exit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 704 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_704.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '출구' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #705 화장실 (Noun) - "restroom"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 705 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_705.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '화장실' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #712 일기예보 (Noun) - "weather forecast"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 712 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_712.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '일기예보' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #717 물건 (Noun) - "object"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 717 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_717.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '물건' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #724 벚꽃 (Noun) - "cherry blossom"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 724 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_724.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '벚꽃' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #725 봄 (Noun) - "spring"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 725 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_725.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '봄' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #728 계절 (Noun) - "season"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 728 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_728.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '계절' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #729 눈사람 (Noun) - "snowman"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 729 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_729.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '눈사람' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #730 팝콘 (Noun) - "popcorn"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 730 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_730.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '팝콘' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #735 여름 (Noun) - "summer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 735 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_735.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여름' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #736 가을 (Noun) - "autumn"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 736 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_736.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가을' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #737 겨울 (Noun) - "winter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 737 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_737.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '겨울' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #739 민박집 (Noun) - "bed and breakfast"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 739 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_739.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '민박집' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #740 전주 (Noun) - "Jeonju"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 740 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_740.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전주' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #743 게스트하우스 (Noun) - "guesthouse"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 743 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_743.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '게스트하우스' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #744 여행 (Noun) - "travel"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 744 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_744.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여행' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #745 여행사 (Noun) - "travel agency"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 745 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_745.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여행사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #746 콘도 (Noun) - "condo"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 746 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_746.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '콘도' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #747 펜션 (Noun) - "rental cottage"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 747 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_747.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '펜션' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #750 모자 (Noun) - "hat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 750 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_750.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '모자' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #753 선글라스 (Noun) - "sunglasses"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 753 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_753.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '선글라스' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #754 여권 (Noun) - "passport"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 754 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_754.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여권' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #755 충전기 (Noun) - "charger"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 755 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_755.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '충전기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #759 학기 (Noun) - "semester"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 759 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_759.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '학기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #763 한번 (Noun) - "once"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 763 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_763.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한번' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #764 끝 (Noun) - "end"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 764 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_764.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '끝' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #765 방학 (Noun) - "vacation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 765 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_765.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '방학' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #766 방학중 (Noun) - "during vacation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 766 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_766.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '방학중' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #767 시작 (Noun) - "start"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 767 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_767.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시작' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #768 학기 중 (Noun) - "during semester"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 768 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_768.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '학기 중' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #773 떡국 (Noun) - "tteokguk"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 773 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_773.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '떡국' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #774 설날 (Noun) - "New Year's day"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 774 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_774.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '설날' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #776 어린이날 (Noun) - "Children's day"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 776 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_776.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어린이날' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #777 음력 (Noun) - "lunar calendar"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 777 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_777.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '음력' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #778 크리스마스트리 (Noun) - "Christmas tree"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 778 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_778.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '크리스마스트리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #779 한글날 (Noun) - "Hangul Proclamation day"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 779 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_779.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한글날' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #780 휴가 (Noun) - "vacation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 780 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_780.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '휴가' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #781 휴일 (Noun) - "holiday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 781 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_781.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '휴일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #783 광고 회사 (Noun) - "advertising company"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 783 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_783.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '광고 회사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #786 무역 회사 (Noun) - "trading company"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 786 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_786.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '무역 회사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #787 방송국 (Noun) - "broadcasting station"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 787 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_787.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '방송국' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #789 신문사 (Noun) - "newspaper company"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 789 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_789.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '신문사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #792 잡지사 (Noun) - "magazine company"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 792 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_792.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잡지사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #796 직장 (Noun) - "workplace"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 796 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_796.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '직장' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #798 출판사 (Noun) - "publisher"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 798 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_798.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '출판사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #799 항공사 (Noun) - "airline"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 799 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_799.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '항공사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #802 경영학 (Noun) - "business administration"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 802 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_802.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '경영학' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #803 경제학 (Noun) - "economics"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 803 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_803.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '경제학' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #804 교육학 (Noun) - "pedagogy, education"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 804 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_804.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '교육학' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #805 국어국문학 (Noun) - "Korean language and literature"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 805 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_805.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '국어국문학' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #806 대학원 (Noun) - "graduate school"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 806 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_806.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '대학원' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #807 법학 (Noun) - "law, jurisprudence"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 807 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_807.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '법학' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #808 새 (Noun) - "new, bird"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 808 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_808.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '새' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #809 신문방송학 (Noun) - "journalism and mass communication"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 809 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_809.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '신문방송학' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #811 영문학 (Noun) - "English literature"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 811 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_811.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '영문학' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #812 의학 (Noun) - "medicine, medical science"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 812 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_812.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '의학' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #815 컴퓨터공학 (Noun) - "computer engineering"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 815 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_815.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '컴퓨터공학' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #818 귀 (Noun) - "ear"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 818 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_818.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '귀' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #822 마음 (Noun) - "mind, heart, feelings"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 822 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_822.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '마음' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #823 목소리 (Noun) - "voice"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 823 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_823.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '목소리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #824 무릎 (Noun) - "knee, lap"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 824 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_824.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '무릎' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #825 발 (Noun) - "foot"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 825 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_825.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '발' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #826 성격 (Noun) - "personality, character"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 826 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_826.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '성격' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #827 손 (Noun) - "hand"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 827 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_827.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '손' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #828 어깨 (Noun) - "shoulder"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 828 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_828.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어깨' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #829 얼굴 (Noun) - "face"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 829 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_829.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '얼굴' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #830 연초 (Noun) - "beginning of the year"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 830 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_830.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '연초' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #831 이마 (Noun) - "forehead"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 831 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_831.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이마' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #832 입 (Noun) - "mouth, lips"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 832 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_832.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '입' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #835 코 (Noun) - "nose"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 835 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_835.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '코' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #836 허리 (Noun) - "waist, lower back"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 836 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_836.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '허리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #840 고모 (Noun) - "paternal aunt (father's sister)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 840 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_840.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고모' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #841 고모부 (Noun) - "uncle (husband of father's sister)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 841 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_841.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고모부' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #842 공무원 (Noun) - "public servant, civil servant"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 842 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_842.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '공무원' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #843 시청 (Noun) - "city hall, watching TV"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 843 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_843.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시청' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #845 외삼촌 (Noun) - "maternal uncle (mother's brother)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 845 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_845.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '외삼촌' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #846 외숙모 (Noun) - "aunt (wife of mother's brother)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 846 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_846.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '외숙모' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #847 외할머니 (Noun) - "maternal grandmother (mother's mother)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 847 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_847.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '외할머니' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #848 외할아버지 (Noun) - "maternal grandfather (mother's father)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 848 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_848.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '외할아버지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #849 이모 (Noun) - "maternal aunt (mother's sister)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 849 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_849.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이모' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #850 이모부 (Noun) - "uncle (husband of mother's sister)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 850 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_850.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이모부' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #851 조카 (Noun) - "nephew, niece"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 851 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_851.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '조카' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #852 친척 (Noun) - "relative, relation"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 852 -eng none --ast -sentence 10 --seed 1793700800000 -o scratch/audit/unit_852.txt`
- **Seed:** `1793700800000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '친척' functions correctly within its syntactic slot without allomorphic or case errors.

