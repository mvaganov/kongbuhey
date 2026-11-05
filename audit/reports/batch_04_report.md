# Linguistic Audit Report: Batch 04 (Particles & Grammar)

> **Batch ID:** 04  
> **Category:** Particles & Grammar  
> **Target Manifest:** `audit/batches/batch_04_grammar.json`  
> **Total In-Scope Units:** 191  
> **PRNG Seed:** `1793700400000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (191 / 191 Analyzed)**  
> **Audit Summary:** **Clean: 191 units (100.0%) | Flagged: 0 units (0.0%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 04 audits all 191 Grammar and Particle units in the curriculum (Case Particles, Clausal Connectives, Moods, Speech Acts, Auxiliaries, and Politeness Markers).
Following Round 1 findings and Round 2 targeted remediation, all 191 units were re-evaluated and confirmed to achieve 100% clean sentence generation.

### Key Round 2 Remediations Verified:
1. Social Title Alignment ('씨', ID 23): Restricted strictly to personal given names between social equals ('민수 씨', '수진 씨', '올리비아 씨'), completely eliminating severe honorific insults (*'외할머니씨'*, *'교수씨'*). Proper orthographic spacing ('{Name} 씨') enforced.
2. Equative Copula Category Concord: Copular identification patterns ('A는 B이에요/예요') enforce semantic category parity; human subjects are equated exclusively with human roles/professions, eliminating surreal category crossings (*'영수는 오토바이예요'*).
3. Volitional Imperative / Propositive Concord: Imperative ('-(으)세요') and propositive ('-자') forms are restricted to volitional, agentive predicates, barring passive or involuntary events (*'전화가 오세요'*, *'고장 나지 마세요'*).
4. Purpose Motion Clause Concord ('-(으)러 가다/오다'): Strictly pairs with transitive and active verbs, preventing passives (*'열리러 가요'*).
5. Clausal Temporal vs. Locative Disambiguation ('-(으)ㄴ 뒤에'): Preserves temporal clausal sequencing without dynamic locative particle confusion.

---

## 2. Detailed Linguistic Audit Findings

### Unit #23 씨 (Grammar) - "Mr./Ms."
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 23 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_23.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '씨' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #36 은 / 는 (Grammar) - "topic marker"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 36 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_36.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '은 / 는' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #37 이에요 / 예요 (Grammar) - "polite informal 'to be'"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 37 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_37.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이에요 / 예요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #49 ~아요 / ~어요 / ~해요 (Grammar) - "polite ending"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 49 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_49.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~아요 / ~어요 / ~해요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #50 ~습니다 / ~ㅂ니다 (Grammar) - "formal polite declarative ending"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 50 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_50.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~습니다 / ~ㅂ니다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #51 ~자 (Grammar) - "let's do..."
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 51 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_51.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~자' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #52 -아/어서 (Grammar) - "because / so"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 52 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_52.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-아/어서' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #53 -(으)니까 (Grammar) - "since / because"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 53 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_53.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)니까' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #54 -기 때문에 (Grammar) - "because of"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 54 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_54.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-기 때문에' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #56 입니다 (Grammar) - "is/are"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 56 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_56.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '입니다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #57 부사 표현 (Grammar) - "adverb expression"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 57 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_57.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부사 표현' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #95 이/가 아니에요 (Grammar) - "to not be"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 95 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_95.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이/가 아니에요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #96 이 / 가 (Grammar) - "subject marker"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 96 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_96.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이 / 가' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #132 에 (location) (Grammar) - "location marker"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 132 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_132.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '에 (location)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #173 을 / 를 (Grammar) - "object marker"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 173 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_173.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '을 / 를' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #199 에서 (Grammar) - "location action marker"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 199 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_199.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '에서' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #200 에 (direction) (Grammar) - "direction marker"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 200 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_200.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '에 (direction)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #274 -지 않다 (Grammar) - "to not do/be"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 274 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_274.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-지 않다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #275 에 (time) (Grammar) - "time marker"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 275 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_275.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '에 (time)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #276 (이)랑 (Grammar) - "and/with"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 276 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_276.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '(이)랑' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #277 시간 표현 (Grammar) - "time expression"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 277 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_277.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시간 표현' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #278 횟수 표현 (Grammar) - "number of times"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 278 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_278.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '횟수 표현' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #279 한자어 수량 표현 (1-10) (Grammar) - "Sino-Korean quantity (1-10)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 279 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_279.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한자어 수량 표현 (1-10)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #280 고유어 수량 표현 (1-10) (Grammar) - "pure Korean quantity (1-10)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 280 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_280.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고유어 수량 표현 (1-10)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #281 한자어 수량 표현 (1-10000) (Grammar) - "Sino-Korean quantity (1-10000)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 281 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_281.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한자어 수량 표현 (1-10000)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #282 고유어 수량 표현 (1-99) (Grammar) - "pure Korean quantity (1-99)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 282 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_282.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고유어 수량 표현 (1-99)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #283 한자어 숫자 세기 (Grammar) - "Sino-Korean number counting"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 283 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_283.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한자어 숫자 세기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #284 고유어 숫자 세기 (Grammar) - "pure Korean number counting"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 284 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_284.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고유어 숫자 세기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #335 ~았/었어요 (Grammar) - "past tense"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 335 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_335.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~았/었어요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #336 ~고 (Grammar) - "and (clausal)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 336 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_336.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~고' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #366 도 (Grammar) - "also"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 366 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_366.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '도' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #367 하고 (Grammar) - "and/with"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 367 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_367.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '하고' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #416 ~(으)세요 (Grammar) - "polite imperative"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 416 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_416.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)세요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #417 ~고 싶다 (Grammar) - "to want to"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 417 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_417.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~고 싶다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #459 ~아/어서 (Grammar) - "because/and then"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 459 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_459.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~아/어서' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #460 ~(으)ㄹ 거예요 (Grammar) - "future tense"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 460 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_460.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)ㄹ 거예요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #461 ~지만 (Grammar) - "but/although"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 461 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_461.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~지만' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #484 ~(으)ㄹ게요 (Grammar) - "I will"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 484 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_484.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)ㄹ게요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #485 ~(으)러 가다/오다 (Grammar) - "go/come to do"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 485 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_485.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)러 가다/오다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #522 ~(으)ㄹ 수 있다 (Grammar) - "can do"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 522 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_522.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)ㄹ 수 있다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #523 ~(으)ㄹ 수 없다 (Grammar) - "cannot do"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 523 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_523.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)ㄹ 수 없다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #524 못 ~ / ~지 못하다 (Grammar) - "cannot do (external)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 524 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_524.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '못 ~ / ~지 못하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #572 ~아/어도 되다 (Grammar) - "may I / it is okay to"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 572 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_572.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~아/어도 되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #573 ~(으)면 안 되다 (Grammar) - "must not"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 573 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_573.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)면 안 되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #574 ~아/어야 하다/되다 (Grammar) - "must / have to do"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 574 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_574.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~아/어야 하다/되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #618 에게/한테 (Grammar) - "to/for"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 618 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_618.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '에게/한테' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #619 ~(으)면 (Grammar) - "if/when"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 619 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_619.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)면' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #620 ~는데 (Grammar) - "but/and"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 620 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_620.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~는데' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #621 ~(으)ㄴ데 (Grammar) - "but/and"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 621 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_621.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)ㄴ데' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #644 ~(으)ㄴ (Grammar) - "relative clause (verb past / adjective present)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 644 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_644.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)ㄴ' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #645 ~는 (Grammar) - "relative clause (verb present)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 645 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_645.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~는' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #646 ~(으)ㄹ (Grammar) - "relative clause (future)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 646 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_646.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)ㄹ' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #647 께 (Grammar) - "to/for (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 647 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_647.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '께' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #648 께서 (Grammar) - "subject marker (honorific)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 648 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_648.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '께서' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #653 쯤 (Grammar) - "about/approximately"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 653 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_653.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쯤' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #678 ~(으)시~ (Grammar) - "honorific infix"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 678 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_678.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)시~' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #679 ~(으)ㄴ 적이 있다/없다 (Grammar) - "have experience of"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 679 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_679.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)ㄴ 적이 있다/없다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #680 보다 (더) (Grammar) - "more than"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 680 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_680.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '보다 (더)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #710 ~(으)ㄴ 후에 / ~기 전에 (Grammar) - "after / before doing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 710 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_710.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)ㄴ 후에 / ~기 전에' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #711 ~(으)면서 (Grammar) - "while doing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 711 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_711.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~(으)면서' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #738 ~기 / ~는 것 (Grammar) - "doing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 738 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_738.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~기 / ~는 것' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #800 -게 (Grammar) - "so that / in a manner of (adverbial)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 800 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_800.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-게' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #801 -어지다 (Grammar) - "to become / get (changed state)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 801 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_801.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-어지다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #816 -(으)려고 (Grammar) - "in order to, intending to"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 816 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_816.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)려고' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #817 -(으)ㄴ 지 (Grammar) - "since (time elapsed)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 817 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_817.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)ㄴ 지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #837 -겠다 (conjecture) (Grammar) - "must be, looks like (conjecture)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 837 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_837.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-겠다 (conjecture)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #838 -겠다 (intention) (Grammar) - "will, intend to (intention)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 838 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_838.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-겠다 (intention)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #839 -네요 (Grammar) - "indeed, oh it is (realization)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 839 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_839.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-네요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #855 -(으)ㄹ 때 (Grammar) - "when, at the time of"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 855 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_855.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)ㄹ 때' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #856 의 (possessive) (Grammar) - "possessive particle ('s, of)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 856 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_856.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '의 (possessive)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #857 의 (relation) (Grammar) - "relationship/origin particle (of)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 857 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_857.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '의 (relation)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #877 -만에 (Grammar) - "after, for the first time in (time duration)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 877 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_877.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-만에' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #878 -어 보다 (attempt) (Grammar) - "try doing (attempt)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 878 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_878.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-어 보다 (attempt)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #879 -어 보다 (experience) (Grammar) - "have tried, experienced (experience)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 879 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_879.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-어 보다 (experience)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #892 -기 때문에 (Grammar) - "because, because of"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 892 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_892.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-기 때문에' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #893 -는데 (background) (Grammar) - "and, so, while (background context)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 893 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_893.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는데 (background)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #894 -는데 (contrast) (Grammar) - "but, however (contrast)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 894 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_894.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는데 (contrast)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #911 -어야겠다 (Grammar) - "must, should, ought to (strong intention)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 911 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_911.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-어야겠다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #912 -었으면 좋겠다 (Grammar) - "I wish, I hope (hope or desire)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 912 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_912.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-었으면 좋겠다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #930 -나요? (Grammar) - "is it? does it? (interrogative)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 930 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_930.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-나요?' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #931 -는 중이다 (Grammar) - "in the middle of, currently doing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 931 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_931.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는 중이다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #932 -은가요? (Grammar) - "is it? (descriptive interrogative)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 932 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_932.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-은가요?' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #956 -는데 (background) (Grammar) - "and, so, while (background context)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 956 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_956.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는데 (background)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #957 -는데 (contrast) (Grammar) - "but, however (contrast)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 957 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_957.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는데 (contrast)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #958 -어 보다 (attempt) (Grammar) - "try doing (attempt)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 958 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_958.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-어 보다 (attempt)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #959 -어 보다 (experience) (Grammar) - "have tried, experienced (experience)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 959 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_959.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-어 보다 (experience)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #995 에다가 (location) (Grammar) - "on to, in, at (location/destination)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 995 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_995.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '에다가 (location)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #996 에다가 (addition) (Grammar) - "on top of, in addition to (addition)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 996 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_996.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '에다가 (addition)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #997 -(으)ㄴ 적이 있다 (Grammar) - "have done, have experience of doing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 997 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_997.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)ㄴ 적이 있다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1019 -(으)ㄹ 거예요 (intention) (Grammar) - "will, going to (future plan/intention)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1019 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1019.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)ㄹ 거예요 (intention)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1020 -(으)ㄹ 거예요 (conjecture) (Grammar) - "probably, I think (probable conjecture)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1020 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1020.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)ㄹ 거예요 (conjecture)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1021 -(으)ㄹ까요? (suggestion) (Grammar) - "shall we? shall I? (suggestion)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1021 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1021.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)ㄹ까요? (suggestion)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1022 -(으)ㄹ까요? (opinion) (Grammar) - "do you think? (opinion/guess)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1022 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1022.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)ㄹ까요? (opinion)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1044 -는데 (background) (Grammar) - "and, so, while (background context)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1044 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1044.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는데 (background)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1045 -는데 (contrast) (Grammar) - "but, however (contrast)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1045 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1045.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는데 (contrast)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1046 -어하다 (Grammar) - "to feel, find it to be (3rd person emotion)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1046 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1046.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-어하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1067 -어도 되다 (Grammar) - "may, it is okay to"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1067 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1067.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-어도 되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1068 -으면 안 되다 (Grammar) - "must not, should not"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1068 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1068.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-으면 안 되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1092 얼마나 -는지 모르다 (Grammar) - "you have no idea how... (high degree)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1092 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1092.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '얼마나 -는지 모르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1113 -아/어 (informal intimate) (Grammar) - "informal intimate sentence ending (panmal)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1113 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1113.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-아/어 (informal intimate)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1114 -(으)ㄹ까 하다 (Grammar) - "thinking of doing, considering"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1114 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1114.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)ㄹ까 하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1139 -아/어 가지고 (reason) (Grammar) - "because, so (cause or reason)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1139 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1139.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-아/어 가지고 (reason)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1140 -아/어 가지고 (sequence) (Grammar) - "and then, having done (sequential action)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1140 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1140.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-아/어 가지고 (sequence)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1141 -지 마 (Grammar) - "don't (informal imperative prohibitive)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1141 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1141.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-지 마' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1156 -(느)ㄴ다 (Grammar) - "plain declarative sentence ending for verbs (present tense)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1156 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1156.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(느)ㄴ다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1157 -니? (Grammar) - "informal casual interrogative sentence ending ("asking a question casually")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1157 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1157.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-니?' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1158 -(으)ㄹ게요 (Grammar) - "sentence ending expressing promise or willingness ("I will...", "I promise to...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1158 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1158.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)ㄹ게요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1170 -세 (Grammar) - "formal proposal ending ("let's")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1170 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1170.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-세' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1181 -게 되다 (Grammar) - "particle indicating change of state or result outside speaker's control ("end up doing", "come to be")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1181 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1181.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-게 되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1182 -어라 (Grammar) - "plain/casual imperative sentence ending ("do...", "command ending")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1182 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1182.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-어라' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1183 -자 (Grammar) - "plain/casual propositive sentence ending ("let's...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1183 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1183.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-자' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1198 -었다가 (Grammar) - "connective particle indicating completed action followed by a contrasting/reversal action ("did and then...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1198 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1198.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-었다가' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1199 -을래요? (Grammar) - "polite interrogative ending asking listener's intention/preference or expressing speaker's intention ("would you like to...?", "I want to...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1199 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1199.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-을래요?' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1211 -는지 알다 (Grammar) - "pattern indicating knowing whether/how something is ("to know whether/how...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1211 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1211.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는지 알다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1212 -습니다만 (Grammar) - "formal polite connective showing contrast ("...but", "...however")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1212 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1212.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-습니다만' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1239 -다가 (Grammar) - "connective particle indicating an action in progress interrupted by another action ("while doing", "and then")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1239 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1239.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-다가' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1240 -(으)로 (direction) (Grammar) - "particle indicating direction or destination ("toward", "to")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1240 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1240.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)로 (direction)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1241 -(으)로 (means) (Grammar) - "particle indicating means, tool, or method ("by", "with", "via")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1241 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1241.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)로 (means)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1242 -(으)로 (status) (Grammar) - "particle indicating material, status, or change ("into", "as")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1242 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1242.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)로 (status)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1259 -으려면 (Grammar) - "connective particle expressing intention as a condition ("if one intends to", "in order to")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1259 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1259.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-으려면' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1260 으로 해서 (Grammar) - "expression indicating passing through or via a route ("by way of", "via")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1260 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1260.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '으로 해서' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1276 -어야 (Grammar) - "connective particle expressing essential prerequisite condition ("only if", "must... in order to")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1276 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1276.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-어야' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1277 -으면 되다 (Grammar) - "pattern expressing sufficiency or permission ("all one has to do is", "it is fine if")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1277 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1277.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-으면 되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1291 -거나 (Grammar) - "connective particle offering choices between actions or states ("or")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1291 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1291.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-거나' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1292 -는데요 (background) (Grammar) - "sentence ending providing background information or soft statement ("and", "so")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1292 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1292.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는데요 (background)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1293 -는데요 (contrast) (Grammar) - "sentence ending expressing mild surprise or contrast ("but", "however")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1293 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1293.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는데요 (contrast)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1311 -는 동안 (Grammar) - "connective expression indicating time duration ("while", "during the time that")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1311 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1311.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는 동안' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1312 부터 (Grammar) - "particle indicating starting point in time or place ("from", "starting from")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1312 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1312.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부터' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1332 -을 건가요? (Grammar) - "polite interrogative ending asking future plan ("are you going to...?")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1332 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1332.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-을 건가요?' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1333 이나 (choice) (Grammar) - "particle indicating choice or option ("or")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1333 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1333.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이나 (choice)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1334 이나 (emphasis) (Grammar) - "particle emphasizing large quantity or degree ("as many as", "no less than")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1334 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1334.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이나 (emphasis)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1346 -냐고 하다 (Grammar) - "indirect quotation ending for questions ("asked if/whether...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1346 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1346.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-냐고 하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1347 -는다고 하다 (Grammar) - "indirect quotation ending for declarative statements ("said that...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1347 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1347.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는다고 하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1362 -으라고 하다 (Grammar) - "indirect quotation ending for commands ("told to...", "ordered to...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1362 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1362.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-으라고 하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1363 -자고 하다 (Grammar) - "indirect quotation ending for proposals ("suggested that we...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1363 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1363.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-자고 하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1383 -어 달라고 하다 (Grammar) - "indirect quotation requesting a favor for speaker ("asked to do for speaker")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1383 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1383.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-어 달라고 하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1384 -어 주라고 하다 (Grammar) - "indirect quotation requesting a favor for third person ("asked to do for someone else")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1384 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1384.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-어 주라고 하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1385 이라서 (Grammar) - "particle indicating cause/reason for a noun ("because it is...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1385 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1385.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이라서' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1402 만 (Grammar) - "particle indicating restriction or exclusivity ("only", "just")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1402 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1402.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '만' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1403 만 (Grammar) - "particle indicating elapsed time duration ("for", "full duration")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1403 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1403.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '만' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1404 -었던 (Grammar) - "retrospective noun-modifying suffix for completed past state/action ("that used to be", "that was")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1404 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1404.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-었던' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1432 -는 데다가 (Grammar) - "connective expression indicating addition ("in addition to", "on top of")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1432 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1432.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는 데다가' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1453 이라도 (Grammar) - "particle indicating compromise or option ("even if it is", "at least", "any")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1453 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1453.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이라도' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1454 -지 않으면 안 되다 (Grammar) - "expression indicating strong necessity/obligation ("must", "have to")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1454 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1454.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-지 않으면 안 되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1469 만큼 (Grammar) - "particle indicating degree or quantity ("as much as", "to the extent of")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1469 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1469.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '만큼' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1470 -어도 (Grammar) - "concessive connective particle ("even if", "even though")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1470 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1470.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-어도' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1490 -던 (Grammar) - "retrospective noun-modifying suffix for past habitual action ("that used to be", "that I was doing")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1490 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1490.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-던' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1491 -을 줄 알다(모르다) (Grammar) - "pattern indicating knowing (or not knowing) how to do something ("know how to / don't know how to")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1491 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1491.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-을 줄 알다(모르다)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1506 -던데요 (Grammar) - "sentence ending expressing past personal observation or mild surprise ("I noticed that...", "it was...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1506 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1506.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-던데요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1507 이든지 (Grammar) - "particle indicating choice or non-exclusivity ("whichever", "whatever", "whether... or")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1507 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1507.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이든지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1522 밖에 (Grammar) - "particle indicating restriction used with negative verb ("only", "nothing but")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1522 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1522.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '밖에' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1523 -을 줄 알았다 (Grammar) - "expression indicating mistaken past assumption ("I thought that...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1523 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1523.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-을 줄 알았다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1543 -은 뒤에 (Grammar) - "connective expression indicating sequence ("after doing")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1543 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1543.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-은 뒤에' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1544 이나 (choice) (Grammar) - "particle indicating choice or option ("or")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1544 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1544.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이나 (choice)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1545 이나 (emphasis) (Grammar) - "particle emphasizing large quantity or degree ("as many as")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1545 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1545.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이나 (emphasis)' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1557 -기로 하다 (Grammar) - "pattern indicating decision or agreement to do something ("decided to...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1557 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1557.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-기로 하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1558 -자마자 (Grammar) - "connective particle indicating immediate sequence ("as soon as", "right after")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1558 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1558.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-자마자' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1579 -는다고 하니까 (Grammar) - "connective expression giving reported advice or fact as reason ("since they say that...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1579 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1579.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는다고 하니까' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1580 -지 말고 (Grammar) - "imperative connective instructing to omit action ("don't do X and instead...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1580 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1580.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-지 말고' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1601 -을 테니까 (Grammar) - "connective particle giving intent or assumption as reason ("because it will be", "because I will...")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1601 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1601.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-을 테니까' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1624 와 / 과 (Grammar) - "and / with (comitative nominal particle)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1624 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1624.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '와 / 과' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1625 -고 싶어하다 (Grammar) - "want to do (3rd person perspective)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1625 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1625.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-고 싶어하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1644 -(으)십시오 (Grammar) - "please do (formal polite imperative)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1644 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1644.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)십시오' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1645 -는군요 / -군요 (Grammar) - "exclamatory ending expressing realization/discovery ('I see that..., oh so...')"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1645 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1645.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는군요 / -군요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1646 -(으)면 좋겠다 (Grammar) - "I hope/wish that (present desire)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1646 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1646.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)면 좋겠다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1702 -(으)시- (Grammar) - "subject honorific verbal infix"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1702 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1702.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)시-' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1703 -께서는 (Grammar) - "topic/subject marker for honored elders (께서 + 는)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1703 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1703.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-께서는' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1704 에게 (Grammar) - "dative particle to/for (animate, written/formal)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1704 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1704.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '에게' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1705 한테 (Grammar) - "dative particle to/for (animate, spoken/colloquial)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1705 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1705.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한테' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1706 에게서 (Grammar) - "source/ablative particle from (animate, written/formal)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1706 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1706.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '에게서' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1707 한테서 (Grammar) - "source/ablative particle from (animate, spoken/colloquial)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1707 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1707.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한테서' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1710 -고 있다 (Grammar) - "present progressive verbal ending ("is/are doing")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1710 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1710.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-고 있다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1711 ~았/었습니다 (Grammar) - "formal polite past tense ending"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1711 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1711.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~았/었습니다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1712 -(으)려고 하다 (Grammar) - "future plan or intentional ending ("plan to / intend to do")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1712 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1712.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)려고 하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1736 -(으)ㅂ시다 (Grammar) - "let's do... (formal propositive)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1736 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1736.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)ㅂ시다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1737 -지 마세요 (Grammar) - "please do not... (polite prohibitive imperative)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1737 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1737.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-지 마세요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1738 -지 마십시오 (Grammar) - "please do not... (formal prohibitive imperative)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1738 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1738.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-지 마십시오' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1744 -느라고 (Grammar) - "because of doing, as a result of (negative consequence/trade-off)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1744 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1744.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-느라고' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1745 -는 바람에 (Grammar) - "because, owing to, as a result of (sudden unexpected negative occurrence)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1745 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1745.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-는 바람에' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1746 -(으)므로 (Grammar) - "because, since, therefore (formal written reason)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1746 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1746.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)므로' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1773 -지요 (Grammar) - "confirmation polite sentence ending ('isn't it?, right?')"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1773 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1773.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-지요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1797 마다 (Grammar) - "each, every (nominal particle indicating universality)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1797 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1797.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '마다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1815 -기 (Grammar) - "nominalizing suffix (-ing, act of doing)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1815 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1815.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1826 까지 (Grammar) - "particle indicating destination, limit, or end point in time or space ("until", "to", "up to")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1826 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1826.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '까지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1833 이야 / 야 (Grammar) - "informal plain 'to be' (copula)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1833 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1833.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이야 / 야' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1834 아 / 야 (Grammar) - "informal vocative particle (used when calling a person's name)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1834 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1834.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아 / 야' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1855 ~습니까 / ~ㅂ니까 (Grammar) - "formal polite interrogative ending"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1855 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1855.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '~습니까 / ~ㅂ니까' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1865 (이)라고 (Grammar) - "quotation particle ("called", "saying that")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1865 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1865.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '(이)라고' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1949 -(느)ㄴ구나 / -구나 (Grammar) - "plain exclamatory ending expressing realization/discovery ('I see that..., oh so...')"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1949 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1949.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(느)ㄴ구나 / -구나' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1987 -(으)ㄹ지 (Grammar) - "connective ending expressing uncertainty or indirect question ("whether", "if")"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1987 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1987.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-(으)ㄹ지' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1994 -기 싫다 (Grammar) - "to not want to do, hate doing (verb)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1994 -eng none --ast -sentence 10 --seed 1793700400000 -o scratch/audit/unit_1994.txt`
- **Seed:** `1793700400000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '-기 싫다' functions correctly within its syntactic slot without allomorphic or case errors.

