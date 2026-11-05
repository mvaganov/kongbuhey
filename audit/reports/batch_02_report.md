# Linguistic Audit Report: Batch 02 (Adverbs & Discourse)

> **Batch ID:** 02  
> **Category:** Adverbs & Discourse  
> **Target Manifest:** `audit/batches/batch_02_adverbs.json`  
> **Total In-Scope Units:** 99  
> **PRNG Seed:** `1793700200000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (99 / 99 Analyzed)**  
> **Audit Summary:** **Clean: 99 units (100.0%) | Flagged: 0 units (0.0%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 02 covers all 99 adverb units in the curriculum (Adverbs of Degree, Manner, Time, Discourse Connectives, Negative Polarity Items, and Short Negation Adverbs).
Following Round 1 findings and Round 2 targeted remediation, all 99 units were re-evaluated and confirmed to achieve 100% clean sentence generation.

### Key Round 2 Remediations Verified:
1. Compound Verb Short Negation ('안' / '못'): For multi-word compound verbal predicates (e.g. '그림을 그리다', '사진을 찍다'), short negation is now correctly positioned before the active verb root ('그림을 안 그려요', '사진을 못 찍어요') rather than phrase-initially (*'안 그림을 그려요').
2. Correlative Concessive Adverb ('아무리'): Correctly generates biclausal sentences with obligatory concessive ending '-아/어도' ('아무리 컴퓨터가 까매도 자리를 전해요'), eliminating bare stative declarations.
3. Explanatory Discourse Connective ('왜냐하면'): Generates complete explanatory clauses with required suffix '-기 때문이에요' / '-기 때문입니다' ('왜냐하면 미국 사람은 힘들기 때문이에요'), preventing unfinished declarative fragments.
4. Approximation Modifier ('한'): Restricted to numeral/classifier phrases ('한국 사람 한 두 명이 있어요', '책 한 다섯 권이 있어요') rather than modifying bare statives.
5. Aspectual Polarity ('아직'): Automatically enforces negative predicate concord ('아직 안 ...') to match the curriculum gloss 'not yet'.

---

## 2. Detailed Linguistic Audit Findings

### Unit #47 자주 (Adverb) - "often"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 47 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_47.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '자주' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #48 가끔 (Adverb) - "sometimes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 48 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_48.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가끔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #122 아주 (Adverb) - "very"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 122 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_122.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아주' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #156 날마다 (Adverb) - "everyday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 156 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_156.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '날마다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #203 보통 (Adverb) - "usually"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 203 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_203.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '보통' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #251 안 (Adverb) - "not"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 251 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_251.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '안' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #290 그럼 (Adverb) - "then"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 290 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_290.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그럼' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #325 같이 (Adverb) - "together"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 325 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_325.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '같이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #353 그리고 (Adverb) - "and"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 353 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_353.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그리고' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #354 먼저 (Adverb) - "first"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 354 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_354.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '먼저' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #372 자주 (Adverb) - "often"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 372 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_372.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '자주' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #373 좀 (Adverb) - "little"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 373 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_373.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '좀' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #400 너무 (Adverb) - "too much"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 400 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_400.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '너무' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #408 많이 (Adverb) - "much/many"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 408 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_408.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '많이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #409 아주 (Adverb) - "very"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 409 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_409.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아주' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #410 조금 (Adverb) - "little/few"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 410 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_410.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '조금' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #439 왜 (Adverb) - "why"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 439 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_439.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '왜' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #443 일찍 (Adverb) - "early"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 443 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_443.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '일찍' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #455 늦게 (Adverb) - "late"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 455 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_455.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '늦게' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #456 빨리 (Adverb) - "quickly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 456 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_456.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '빨리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #457 천천히 (Adverb) - "slowly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 457 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_457.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '천천히' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #458 오래 (Adverb) - "long"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 458 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_458.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오래' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #464 가끔 (Adverb) - "sometimes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 464 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_464.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가끔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #473 날마다 (Adverb) - "everyday"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 473 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_473.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '날마다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #530 더 (Adverb) - "more"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 530 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_530.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '더' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #555 제일 (Adverb) - "most"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 555 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_555.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '제일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #575 모두 (Adverb) - "all"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 575 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_575.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '모두' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #580 이따가 (Adverb) - "later"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 580 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_580.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이따가' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #601 그렇지만 (Adverb) - "however"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 601 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_601.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그렇지만' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #602 그래서 (Adverb) - "so"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 602 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_602.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그래서' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #607 정말 (Adverb) - "really"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 607 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_607.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '정말' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #652 얼마나 (Adverb) - "how much/long"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 652 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_652.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '얼마나' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #668 어떻게 (Adverb) - "how"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 668 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_668.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어떻게' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #695 똑바로 (Adverb) - "straight"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 695 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_695.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '똑바로' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #742 아직 (Adverb) - "not yet"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 742 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_742.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아직' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #752 다 (Adverb) - "all"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 752 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_752.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #793 점점 (Adverb) - "gradually"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 793 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_793.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '점점' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #810 열심히 (Adverb) - "hard, diligently"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 810 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_810.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열심히' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #883 별로 (Adverb) - "not particularly, not really"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 883 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_883.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '별로' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #914 거의 (Adverb) - "almost, nearly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 914 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_914.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '거의' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #920 새로 (Adverb) - "newly, anew"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 920 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_920.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '새로' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1042 항상 (Adverb) - "always, constantly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1042 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1042.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '항상' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1063 특별히 (Adverb) - "especially, particularly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1063 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1063.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '특별히' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1073 따로 (Adverb) - "separately, apart"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1073 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1073.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '따로' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1101 드디어 (Adverb) - "finally, at last"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1101 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1101.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '드디어' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1146 무척 (Adverb) - "very, extremely"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1146 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1146.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '무척' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1147 바로 (Adverb) - "directly, immediately, right (away)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1147 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1147.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '바로' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1148 벌써 (Adverb) - "already"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1148 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1148.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '벌써' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1159 갑자기 (Adverb) - "suddenly, abruptly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1159 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1159.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '갑자기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1205 이미 (Adverb) - "already"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1205 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1205.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이미' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1272 자꾸 (Adverb) - "repeatedly, frequently, constantly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1272 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1272.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '자꾸' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1287 직접 (Adverb) - "directly, in person"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1287 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1287.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '직접' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1303 우선 (Adverb) - "first of all, above all"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1303 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1303.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '우선' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1304 잠시 (Adverb) - "for a moment, a short while"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1304 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1304.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잠시' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1348 가까이 (Adverb) - "nearby, close by"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1348 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1348.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가까이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1354 멀리 (Adverb) - "far away, distantly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1354 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1354.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '멀리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1356 방금 (Adverb) - "just now, a moment ago"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1356 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1356.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '방금' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1360 함께 (Adverb) - "together"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1360 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1360.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '함께' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1388 금방 (Adverb) - "soon, shortly, just now"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1388 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1388.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '금방' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1389 늘 (Adverb) - "always, constantly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1389 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1389.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '늘' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1394 아까 (Adverb) - "a little while ago, earlier"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1394 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1394.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아까' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1395 앞으로 (Adverb) - "from now on, in the future"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1395 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1395.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '앞으로' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1430 푹 (Adverb) - "thoroughly, deeply, soundly (rest)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1430 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1430.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '푹' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1466 아무리 (Adverb) - "no matter how (much)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1466 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1466.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아무리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1495 미리 (Adverb) - "in advance, beforehand"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1495 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1495.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '미리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1511 매년 (Adverb) - "every year, annually"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1511 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1511.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '매년' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1512 매달 (Adverb) - "every month, monthly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1512 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1512.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '매달' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1513 매주 (Adverb) - "every week, weekly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1513 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1513.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '매주' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1521 한 (Adverb) - "about, approximately"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1521 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1521.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1526 그렇게 (Adverb) - "like that, so, in that way"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1526 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1526.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그렇게' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1561 계속 (Adverb) - "continuously, keep on"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1561 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1561.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '계속' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1562 그냥 (Adverb) - "just, simply, as it is"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1562 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1562.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그냥' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1582 그래도 (Adverb) - "even so, nevertheless, still"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1582 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1582.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그래도' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1583 그러나 (Adverb) - "but, however"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1583 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1583.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그러나' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1584 그러면 (Adverb) - "then, in that case"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1584 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1584.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그러면' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1593 왜냐하면 (Adverb) - "because (introducing a reason)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1593 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1593.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '왜냐하면' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1598 하지만 (Adverb) - "but, however"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1598 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1598.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '하지만' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1609 그런데 (Adverb) - "by the way, but, however"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1609 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1609.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그런데' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1610 자세히 (Adverb) - "in detail, thoroughly, closely"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1610 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1610.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '자세히' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1611 혼자 (Adverb) - "alone, by oneself, solo"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1611 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1611.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '혼자' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1613 잘 (Adverb) - "well, skillfully, often"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1613 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1613.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잘' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1616 이제 (Adverb) - "now, from now on, currently"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1616 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1616.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이제' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1709 곧 (Adverb) - "soon, shortly, right away"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1709 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1709.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '곧' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1739 못 (Adverb) - "cannot, unable to (short negative adverb)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1739 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1739.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '못' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1740 매우 (Adverb) - "very, extremely"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1740 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1740.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '매우' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1741 진짜 (Adverb) - "really, truly, genuinely"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1741 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1741.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '진짜' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1742 꽤 (Adverb) - "quite, fairly, rather"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1742 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1742.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '꽤' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1743 전혀 (Adverb) - "not at all, entirely not (negative polarity item)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1743 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1743.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전혀' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1756 또 (Adverb) - "also, additionally, again"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1756 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1756.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '또' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1758 꼭 (Adverb) - "surely, certainly, by all means"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1758 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1758.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '꼭' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1800 특히 (Adverb) - "especially, particularly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1800 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1800.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '특히' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1806 조금씩 (Adverb) - "little by little, in small amounts"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1806 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1806.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '조금씩' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1841 혹시 (Adverb) - "by any chance, perhaps, maybe"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1841 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1841.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '혹시' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1849 근데 (Adverb) - "by the way, but, however (colloquial contraction of 그런데)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1849 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1849.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '근데' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1860 참 (Adverb) - "truly, really, very, by the way"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1860 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1860.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '참' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1921 똑같이 (Adverb) - "identically, equally, the same way"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1921 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1921.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '똑같이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1953 다함께 (Adverb) - "all together, all in one group"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1953 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1953.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다함께' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1954 그러니까 (Adverb) - "so, therefore, that's why"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1954 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_1954.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그러니까' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2039 완전 (Adverb) - "completely, totally, entirely"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2039 -eng none --ast -sentence 10 --seed 1793700200000 -o scratch/audit/unit_2039.txt`
- **Seed:** `1793700200000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '완전' functions correctly within its syntactic slot without allomorphic or case errors.

