# Linguistic Audit Report: Batch 03 (Statives & Adjectives)

> **Batch ID:** 03  
> **Category:** Statives & Adjectives  
> **Target Manifest:** `audit/batches/batch_03_descriptive_verbs.json`  
> **Total In-Scope Units:** 142  
> **PRNG Seed:** `1793700300000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (142 / 142 Analyzed)**  
> **Audit Summary:** **Clean: 142 units (100.0%) | Flagged: 0 units (0.0%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 03 audits all 142 Descriptive Verb units (adjectives and stative predicates) in the curriculum.
Following Round 1 findings and Round 2 targeted remediation, all 142 units were re-evaluated and confirmed to achieve 100% clean sentence generation.

### Key Round 2 Remediations Verified:
1. Copula Predicate ('이다', ID 55): Fully integrated with complement noun and subject topic phrase, conjugating accurately according to final batchim (-이에요/-예요, -이었습니다/-였습니다) without bare stem collapse (*여요).
2. Formulaic Greeting ('안녕하다', ID 5): Modeled strictly as an interrogative politeness formula ('안녕하세요?', '큰아버지께서는 안녕하세요?'), completely prohibiting ungrammatical gradable declaratives (*'회원이 아주 안녕해요').
3. Existential Predicates ('있다' / '없다', IDs 81 & 82): Degree adverbs ('아주', '무척', '완전') are completely barred from modifying binary existential predicates; sentences instead feature authentic locative ('출구에 꽃바구니는 있었어요') and existential frames.
4. Sentient Experiencer Enforcement for Emotion Statives: Inanimate non-experiencers ('스트레스', '여유', '나이') are strictly barred from acting as subjects of emotion adjectives ('섭섭하다', '슬프다', '외롭다', '기쁘다'). Subjects are exclusively sentient humans or genuine internal emotional locus nouns ('마음', '기분').
5. Honorific Suppletion Hierarchy: Senior honorific predicates (e.g. '편찮으시다') are strictly restricted to elder/senior subjects ('할머니께서 편찮으세요'), preventing child or body-part hierarchy collisions.

---

## 2. Detailed Linguistic Audit Findings

### Unit #5 안녕하다 (Descriptive Verb) - "doing well"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 5 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_5.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '안녕하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #20 감사하다 (Descriptive Verb) - "to be thankful"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 20 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_20.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '감사하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #21 괜찮다 (Descriptive Verb) - "to be okay"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 21 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_21.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '괜찮다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #22 죄송하다 (Descriptive Verb) - "to be sorry"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 22 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_22.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '죄송하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #42 크다 (Descriptive Verb) - "to be big"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 42 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_42.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '크다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #43 맛있다 (Descriptive Verb) - "to be delicious"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 43 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_43.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '맛있다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #55 이다 (Descriptive Verb) - "to be"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 55 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_55.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #81 없다 (Descriptive Verb) - "to not have"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 81 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_81.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '없다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #82 있다 (Descriptive Verb) - "to have"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 82 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_82.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '있다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #120 어떻다 (Descriptive Verb) - "to be how"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 120 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_120.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어떻다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #121 좋다 (Descriptive Verb) - "to be good"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 121 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_121.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '좋다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #124 나쁘다 (Descriptive Verb) - "to be bad"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 124 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_124.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '나쁘다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #125 덥다 (Descriptive Verb) - "to be hot"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 125 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_125.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '덥다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #126 많다 (Descriptive Verb) - "to be many/much"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 126 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_126.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '많다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #127 시끄럽다 (Descriptive Verb) - "to be noisy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 127 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_127.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시끄럽다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #128 작다 (Descriptive Verb) - "to be small"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 128 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_128.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '작다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #129 적다 (Descriptive Verb) - "to be little/few"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 129 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_129.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '적다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #130 조용하다 (Descriptive Verb) - "to be quiet"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 130 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_130.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '조용하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #131 춥다 (Descriptive Verb) - "to be cold"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 131 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_131.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '춥다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #184 복잡하다 (Descriptive Verb) - "to be crowded/complicated"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 184 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_184.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '복잡하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #185 아름답다 (Descriptive Verb) - "to be beautiful"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 185 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_185.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아름답다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #191 깨끗하다 (Descriptive Verb) - "to be clean"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 191 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_191.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '깨끗하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #192 더럽다 (Descriptive Verb) - "to be dirty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 192 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_192.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '더럽다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #193 바쁘다 (Descriptive Verb) - "to be busy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 193 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_193.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '바쁘다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #194 예쁘다 (Descriptive Verb) - "to be pretty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 194 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_194.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '예쁘다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #195 재미없다 (Descriptive Verb) - "to be not fun"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 195 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_195.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '재미없다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #196 재미있다 (Descriptive Verb) - "to be fun"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 196 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_196.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '재미있다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #197 친절하다 (Descriptive Verb) - "to be kind"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 197 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_197.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '친절하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #198 한가하다 (Descriptive Verb) - "to be not busy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 198 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_198.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한가하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #231 고맙다 (Descriptive Verb) - "to be thankful"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 231 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_231.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고맙다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #235 피곤하다 (Descriptive Verb) - "to be tired"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 235 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_235.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '피곤하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #287 맵다 (Descriptive Verb) - "to be spicy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 287 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_287.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '맵다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #311 맛없다 (Descriptive Verb) - "to be not delicious"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 311 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_311.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '맛없다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #312 길다 (Descriptive Verb) - "to be long"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 312 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_312.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '길다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #314 달다 (Descriptive Verb) - "to be sweet"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 314 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_314.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '달다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #315 멀다 (Descriptive Verb) - "to be far"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 315 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_315.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '멀다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #324 배가 고프다 (Descriptive Verb) - "to be hungry"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 324 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_324.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '배가 고프다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #371 힘들다 (Descriptive Verb) - "to be hard"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 371 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_371.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '힘들다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #392 비싸다 (Descriptive Verb) - "to be expensive"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 392 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_392.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '비싸다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #394 빠르다 (Descriptive Verb) - "to be fast"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 394 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_394.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '빠르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #412 반갑다 (Descriptive Verb) - "to be glad"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 412 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_412.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '반갑다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #413 쉽다 (Descriptive Verb) - "to be easy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 413 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_413.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쉽다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #414 어렵다 (Descriptive Verb) - "to be difficult"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 414 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_414.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어렵다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #415 좁다 (Descriptive Verb) - "to be narrow"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 415 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_415.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '좁다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #444 시간이 없다 (Descriptive Verb) - "to have no time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 444 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_444.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시간이 없다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #452 늦다 (Descriptive Verb) - "to be late"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 452 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_452.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '늦다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #453 아프다 (Descriptive Verb) - "to be sick"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 453 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_453.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아프다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #471 약속이 없다 (Descriptive Verb) - "to not have appointment"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 471 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_471.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '약속이 없다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #472 약속이 있다 (Descriptive Verb) - "to have appointment"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 472 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_472.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '약속이 있다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #476 심심하다 (Descriptive Verb) - "to be bored"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 476 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_476.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '심심하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #529 짧다 (Descriptive Verb) - "to be short"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 529 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_529.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '짧다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #545 가볍다 (Descriptive Verb) - "to be light"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 545 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_545.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가볍다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #546 두껍다 (Descriptive Verb) - "to be thick"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 546 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_546.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '두껍다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #547 무겁다 (Descriptive Verb) - "to be heavy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 547 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_547.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '무겁다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #548 싸다 (Descriptive Verb) - "to be cheap"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 548 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_548.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '싸다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #549 얇다 (Descriptive Verb) - "to be thin"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 549 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_549.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '얇다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #614 다르다 (Descriptive Verb) - "to be different"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 614 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_614.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #632 통화중이다 (Descriptive Verb) - "in the middle of a phone call"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 632 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_632.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '통화중이다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #650 가깝다 (Descriptive Verb) - "to be close"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 650 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_650.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가깝다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #713 따뜻하다 (Descriptive Verb) - "to be warm"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 713 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_713.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '따뜻하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #718 맑다 (Descriptive Verb) - "to be clear"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 718 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_718.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '맑다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #719 선선하다 (Descriptive Verb) - "to be cool"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 719 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_719.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '선선하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #720 쌀쌀하다 (Descriptive Verb) - "to be chilly"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 720 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_720.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쌀쌀하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #721 흐리다 (Descriptive Verb) - "to be cloudy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 721 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_721.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '흐리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #782 건강하다 (Descriptive Verb) - "healthy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 782 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_782.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '건강하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #790 오랜만이다 (Descriptive Verb) - "to have been a long time"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 790 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_790.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오랜만이다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #791 익숙하다 (Descriptive Verb) - "to be familiar"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 791 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_791.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '익숙하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #794 즐겁다 (Descriptive Verb) - "to be pleasant/joyful"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 794 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_794.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '즐겁다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #819 날씬하다 (Descriptive Verb) - "slender, slim"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 819 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_819.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '날씬하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #821 똑똑하다 (Descriptive Verb) - "smart, clever"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 821 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_821.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '똑똑하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #833 잘생기다 (Descriptive Verb) - "handsome"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 833 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_833.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잘생기다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #834 착하다 (Descriptive Verb) - "good-natured, kind"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 834 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_834.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '착하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #844 어리다 (Descriptive Verb) - "young"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 844 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_844.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #870 신선하다 (Descriptive Verb) - "fresh"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 870 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_870.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '신선하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #872 편리하다 (Descriptive Verb) - "convenient"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 872 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_872.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '편리하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #873 푸르다 (Descriptive Verb) - "blue, green (nature)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 873 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_873.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '푸르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #881 그립다 (Descriptive Verb) - "to miss, long for"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 881 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_881.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그립다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #882 기쁘다 (Descriptive Verb) - "glad, happy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 882 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_882.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '기쁘다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #884 부끄럽다 (Descriptive Verb) - "shy, embarrassed"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 884 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_884.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부끄럽다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #885 부럽다 (Descriptive Verb) - "envious, jealous"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 885 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_885.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부럽다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #886 불안하다 (Descriptive Verb) - "anxious, uneasy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 886 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_886.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '불안하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #887 오래되다 (Descriptive Verb) - "old (for objects or time)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 887 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_887.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오래되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #888 외롭다 (Descriptive Verb) - "lonely"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 888 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_888.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '외롭다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #889 유명하다 (Descriptive Verb) - "famous, well-known"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 889 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_889.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '유명하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #890 행복하다 (Descriptive Verb) - "happy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 890 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_890.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '행복하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #900 불편하다 (Descriptive Verb) - "uncomfortable, inconvenient"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 900 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_900.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '불편하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1051 목이 마르다 (Descriptive Verb) - "to be thirsty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1051 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1051.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '목이 마르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1059 유행이다 (Descriptive Verb) - "to be in fashion, be popular, be trendy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1059 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1059.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '유행이다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1069 그렇다 (Descriptive Verb) - "to be so, be like that"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1069 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1069.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그렇다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1070 까맣다 (Descriptive Verb) - "black, dark"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1070 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1070.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '까맣다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1071 노랗다 (Descriptive Verb) - "yellow"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1071 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1071.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '노랗다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1072 단순하다 (Descriptive Verb) - "simple, plain"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1072 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1072.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '단순하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1074 마음에 들다 (Descriptive Verb) - "to like, be to one's liking"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1074 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1074.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '마음에 들다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1075 맞다 (Descriptive Verb) - "correct, fit, match, be hit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1075 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1075.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '맞다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1076 멋있다 (Descriptive Verb) - "cool, stylish, handsome"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1076 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1076.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '멋있다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1078 밝다 (Descriptive Verb) - "bright, light"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1078 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1078.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '밝다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1079 비슷하다 (Descriptive Verb) - "similar, alike"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1079 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1079.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '비슷하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1080 빨갛다 (Descriptive Verb) - "red"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1080 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1080.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '빨갛다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1082 어둡다 (Descriptive Verb) - "dark, dim"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1082 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1082.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어둡다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1083 어떻다 (Descriptive Verb) - "how, what kind of"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1083 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1083.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어떻다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1085 이렇다 (Descriptive Verb) - "like this, such"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1085 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1085.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이렇다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1086 저렇다 (Descriptive Verb) - "like that (over there)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1086 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1086.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '저렇다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1089 파랗다 (Descriptive Verb) - "blue"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1089 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1089.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '파랗다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1090 하얗다 (Descriptive Verb) - "white"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1090 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1090.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '하얗다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1091 화려하다 (Descriptive Verb) - "fancy, colorful, glamorous"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1091 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1091.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '화려하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1110 필요하다 (Descriptive Verb) - "to need, be necessary"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1110 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1110.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '필요하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1130 어울리다 (Descriptive Verb) - "to match, suit, go well with"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1130 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1130.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어울리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1160 급하다 (Descriptive Verb) - "urgent, hasty, in a hurry"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1160 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1160.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '급하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1168 섭섭하다 (Descriptive Verb) - "disappointed, sad, regretful"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1168 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1168.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '섭섭하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1278 결과 다르다 (Descriptive Verb) - "to have a different result"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1278 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1278.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '결과 다르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1315 낮다 (Descriptive Verb) - "low"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1315 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1315.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '낮다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1316 높다 (Descriptive Verb) - "high, tall"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1316 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1316.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '높다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1371 비다 (Descriptive Verb) - "to be empty, vacant"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1371 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1371.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '비다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1379 중요하다 (Descriptive Verb) - "important"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1379 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1379.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '중요하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1410 낫다 (Descriptive Verb) - "to be better, superior, preferable"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1410 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1410.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '낫다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1414 뜨겁다 (Descriptive Verb) - "hot (to touch)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1414 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1414.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '뜨겁다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1424 심하다 (Descriptive Verb) - "severe, extreme"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1424 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1424.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '심하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1552 신기하다 (Descriptive Verb) - "fascinating, marvelous, novel"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1552 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1552.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '신기하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1559 강하다 (Descriptive Verb) - "strong, powerful"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1559 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1559.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '강하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1570 습하다 (Descriptive Verb) - "humid, damp"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1570 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1570.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '습하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1595 졸리다 (Descriptive Verb) - "to be sleepy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1595 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1595.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '졸리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1635 지루하다 (Descriptive Verb) - "to be boring, tedious, dull"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1635 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1635.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지루하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1638 같다 (Descriptive Verb) - "to be same, identical, similar, like"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1638 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1638.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '같다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1693 편찮으시다 (Descriptive Verb) - "to be sick, unwell (honorific form of 아프다)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1693 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1693.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '편찮으시다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1759 편하다 (Descriptive Verb) - "comfortable, convenient"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1759 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1759.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '편하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1785 시원하다 (Descriptive Verb) - "to be cool, refreshing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1785 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1785.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시원하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1827 튼튼하다 (Descriptive Verb) - "to be sturdy, strong, solid"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1827 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1827.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '튼튼하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1858 미안하다 (Descriptive Verb) - "to be sorry, apologetic"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1858 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1858.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '미안하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1859 친하다 (Descriptive Verb) - "to be close, intimate, friendly (with)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1859 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1859.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '친하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1907 특별하다 (Descriptive Verb) - "to be special, particular, extraordinary"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1907 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1907.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '특별하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1956 간단하다 (Descriptive Verb) - "to be simple, brief, uncomplicated"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1956 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1956.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '간단하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1985 무섭다 (Descriptive Verb) - "to be scary, to be afraid, fearful"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1985 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1985.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '무섭다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1993 싫다 (Descriptive Verb) - "to dislike, be unpleasant, unwelcome"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1993 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_1993.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '싫다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2005 걱정되다 (Descriptive Verb) - "to be worried, to be concerned"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2005 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_2005.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '걱정되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2011 따사롭다 (Descriptive Verb) - "to be warm, genial, pleasantly sunny"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2011 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_2011.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '따사롭다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2024 사랑스럽다 (Descriptive Verb) - "to be lovely, charming, adorable"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2024 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_2024.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사랑스럽다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2027 정숙하다 (Descriptive Verb) - "to be virtuous, demure, modest, quiet"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2027 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_2027.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '정숙하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2029 싶다 (Descriptive Verb) - "to want to, feel like, think"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2029 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_2029.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '싶다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2034 웬만하다 (Descriptive Verb) - "to be passable, tolerable, decent, fairly good"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2034 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_2034.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '웬만하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2036 야하다 (Descriptive Verb) - "to be sexy, suggestive, scandalous, flashy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2036 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_2036.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '야하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2038 점잖다 (Descriptive Verb) - "to be gentle, dignified, respectable, well-mannered"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2038 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_2038.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '점잖다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2043 울퉁불퉁하다 (Descriptive Verb) - "to be bumpy, uneven, rugged, rough"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2043 -eng none --ast -sentence 10 --seed 1793700300000 -o scratch/audit/unit_2043.txt`
- **Seed:** `1793700300000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '울퉁불퉁하다' functions correctly within its syntactic slot without allomorphic or case errors.

