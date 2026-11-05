# Linguistic Audit Report: Batch 01 (Closed Modifiers & Deictics)

> **Batch ID:** 01  
> **Category:** Closed Modifiers & Deictics  
> **Target Manifest:** `audit/batches/batch_01_closed_classes.json`  
> **Total In-Scope Units:** 129  
> **PRNG Seed:** `1793700100000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (129 / 129 Analyzed)**  
> **Audit Summary:** **Clean: 129 units (100.0%) | Flagged: 0 units (0.0%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 01 covers closed-class functional units across the curriculum.
Following Round 1 remediation and targeted Round 2 re-evaluation, all units were verified against the 5 linguistic evaluation dimensions (Morphology, Syntax, Lexical Semantics, Pragmatics, Orthography).

### Key Round 2 Remediations Verified:
1. Possessive Pronoun Attributive Alignment: 제 and 내 are routed to adnominal modifier slots (제 가방, 내 친구), preventing defective topic markings (*제는/*내는) and redundant English articles (*a my bag).
2. Interrogative Particle Enforcement: Wh-interrogatives (누구, 무엇, 뭐) strictly take nominative and accusative particles, prohibiting ungrammatical topic marking (*누구는, *무엇은).
3. Deictic Pronoun Animacy Disambiguation: Inanimate/spatial/temporal deictics are disambiguated from human pronouns, preventing animate psych/honorific conflicts.
4. Nominal Copula Coda Sandhi: Statives ending in nominal copula (통화중이다, 오랜만이다, 유행이다) correctly conjugate to -이에요/-예요 and -이었어요/-였어요 based on coda batchim.
5. Determiner & Exclamation Concord: Head noun selection and clausal predicates strictly obey selectional restrictions.

---

## 2. Detailed Linguistic Audit Findings

### Unit #2 저 (Pronoun) - "I"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_2.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '저' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #3 제 (Pronoun) - "my"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 3 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_3.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '제' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #4 네 (Exclamation) - "yes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 4 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_4.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '네' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #19 어느 (Determiner) - "which"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 19 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_19.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어느' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #26 아니요 (Exclamation) - "no"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 26 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_26.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아니요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #30 누구 (Pronoun) - "who"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 30 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_30.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '누구' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #59 그것 (Pronoun) - "that (near you)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 59 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_59.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그것' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #60 무엇 (Pronoun) - "what"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 60 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_60.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '무엇' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #61 여기 (Pronoun) - "here"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 61 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_61.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #62 우리 (Pronoun) - "we/us/our"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 62 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_62.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '우리' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #63 이것 (Pronoun) - "this (thing)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 63 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_63.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이것' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #66 누가 (Pronoun) - "who (subject)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 66 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_66.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '누가' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #73 저것 (Pronoun) - "that (thing)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 73 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_73.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '저것' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #100 어디 (Pronoun) - "where"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 100 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_100.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어디' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #114 저기 (Pronoun) - "over there"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 114 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_114.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '저기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #177 언제 (Pronoun) - "when"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 177 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_177.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '언제' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #201 몇 (Pronoun) - "what/how many"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 201 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_201.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '몇' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #205 아홉 (Number) - "nine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 205 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_205.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아홉' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #207 한 (Number) - "one"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 207 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_207.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #213 두 (Number) - "two"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 213 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_213.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '두' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #214 세 (Number) - "three"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 214 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_214.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '세' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #215 네 (Number) - "four"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 215 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_215.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '네' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #216 다섯 (Number) - "five"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 216 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_216.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다섯' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #217 여섯 (Number) - "six"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 217 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_217.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여섯' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #218 일곱 (Number) - "seven"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 218 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_218.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '일곱' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #219 여덟 (Number) - "eight"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 219 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_219.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여덟' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #220 열 (Number) - "ten"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 220 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_220.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #221 열한 (Number) - "eleven"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 221 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_221.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열한' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #222 열두 (Number) - "twelve"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 222 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_222.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열두' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #223 삼십 (Number) - "thirty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 223 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_223.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '삼십' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #236 일 (Number) - "one"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 236 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_236.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '일' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #237 이 (Number) - "two"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 237 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_237.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #238 삼 (Number) - "three"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 238 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_238.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '삼' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #239 사 (Number) - "four"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 239 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_239.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #240 오 (Number) - "five"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 240 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_240.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #241 육 (Number) - "six"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 241 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_241.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '육' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #242 칠 (Number) - "seven"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 242 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_242.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '칠' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #243 팔 (Number) - "eight"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 243 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_243.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '팔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #244 구 (Number) - "nine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 244 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_244.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '구' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #245 십 (Number) - "ten"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 245 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_245.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '십' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #246 이십 (Number) - "twenty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 246 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_246.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이십' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #247 사십 (Number) - "forty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 247 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_247.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사십' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #248 오십 (Number) - "fifty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 248 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_248.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오십' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #252 하나 (Number) - "one"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 252 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_252.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '하나' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #253 둘 (Number) - "two"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 253 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_253.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '둘' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #254 셋 (Number) - "three"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 254 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_254.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '셋' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #255 넷 (Number) - "four"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 255 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_255.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '넷' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #256 열하나 (Number) - "eleven"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 256 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_256.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열하나' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #257 열둘 (Number) - "twelve"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 257 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_257.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열둘' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #258 스물 (Number) - "twenty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 258 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_258.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '스물' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #259 스무 (Number) - "twenty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 259 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_259.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '스무' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #260 서른 (Number) - "thirty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 260 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_260.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '서른' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #261 마흔 (Number) - "forty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 261 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_261.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '마흔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #262 쉰 (Number) - "fifty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 262 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_262.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쉰' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #263 예순 (Number) - "sixty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 263 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_263.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '예순' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #264 일흔 (Number) - "seventy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 264 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_264.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '일흔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #265 여든 (Number) - "eighty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 265 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_265.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여든' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #266 아흔 (Number) - "ninety"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 266 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_266.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아흔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #267 육십 (Number) - "sixty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 267 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_267.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '육십' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #268 칠십 (Number) - "seventy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 268 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_268.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '칠십' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #269 팔십 (Number) - "eighty"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 269 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_269.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '팔십' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #270 구십 (Number) - "ninety"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 270 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_270.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '구십' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #271 백 (Number) - "hundred"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 271 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_271.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '백' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #272 천 (Number) - "thousand"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 272 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_272.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '천' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #273 만 (Number) - "ten thousand"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 273 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_273.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '만' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #323 여기요 (Exclamation) - "excuse me, over here!"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 323 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_323.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여기요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #340 며칠 (Pronoun) - "what date"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 340 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_340.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '며칠' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #355 뭘 (Pronoun) - "what"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 355 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_355.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '뭘' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #477 글쎄요 (Exclamation) - "well"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 477 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_477.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '글쎄요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #490 이분 (Pronoun) - "this person"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 490 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_490.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이분' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #510 뭐 (Pronoun) - "what"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 510 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_510.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '뭐' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #512 와 (Exclamation) - "wow"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 512 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_512.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '와' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #514 누구 (Pronoun) - "who"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 514 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_514.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '누구' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #515 무엇 (Pronoun) - "what"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 515 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_515.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '무엇' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #516 이거 (Pronoun) - "this (thing)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 516 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_516.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이거' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #525 얼마 (Pronoun) - "how much/many"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 525 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_525.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '얼마' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #528 그래요 (Exclamation) - "yes, it is"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 528 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_528.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그래요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #556 어서 오세요 (Exclamation) - "welcome"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 556 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_556.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어서 오세요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #623 잠깐만요 (Exclamation) - "one moment"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 623 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_623.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잠깐만요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #629 여보세요 (Exclamation) - "hello"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 629 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_629.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여보세요' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #685 실례지만 (Exclamation) - "excuse me"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 685 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_685.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '실례지만' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #686 저 (Exclamation) - "uhm"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 686 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_686.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '저' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1142 그래 (Exclamation) - "yes, alright, okay (informal)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1142 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1142.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그래' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1143 너희 (Pronoun) - "you guys, you all (informal plural)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1143 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1143.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '너희' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1151 여러분 (Pronoun) - "everyone, ladies and gentlemen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1151 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1151.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여러분' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1153 저희 (Pronoun) - "we, us, our (humble)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1153 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1153.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '저희' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1163 마흔 (Number) - "forty (Native Korean)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1163 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1163.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '마흔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1167 서른 (Number) - "thirty (Native Korean)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1167 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1167.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '서른' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1172 쉰 (Number) - "fifty (Native Korean)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1172 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1172.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쉰' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1173 아흔 (Number) - "ninety (Native Korean)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1173 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1173.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아흔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1174 여든 (Number) - "eighty (Native Korean)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1174 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1174.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여든' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1176 예순 (Number) - "sixty (Native Korean)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1176 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1176.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '예순' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1178 일흔 (Number) - "seventy (Native Korean)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1178 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1178.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '일흔' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1202 아 (Exclamation) - "ah, oh (exclamation)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1202 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1202.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '아' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1203 어 (Exclamation) - "uh, oh (exclamation, casual yes)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1203 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1203.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1204 음 (Exclamation) - "um, mmm (hesitation sound)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1204 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1204.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '음' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1206 자 (Exclamation) - "well, now (interjection encouraging action)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1206 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1206.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '자' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1207 저 (Pronoun) - "I (humble), that (over there), um (filler)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1207 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1207.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '저' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1208 저기 (Pronoun) - "over there, excuse me (filler)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1208 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1208.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '저기' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1618 이 (Determiner) - "this (determiner)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1618 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1618.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1619 그 (Determiner) - "that, the (determiner)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1619 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1619.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1626 저 (Determiner) - "that (over there, determiner)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1626 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1626.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '저' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1650 셋째 (Number) - "third (ordinal)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1650 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1650.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '셋째' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1653 그곳 (Pronoun) - "that place, there"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1653 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1653.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그곳' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1667 영 (Number) - "zero"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1667 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1667.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '영' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1681 열셋 (Number) - "thirteen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1681 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1681.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열셋' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1682 열세 (Number) - "thirteen (attributive)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1682 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1682.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열세' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1683 열넷 (Number) - "fourteen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1683 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1683.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열넷' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1684 열네 (Number) - "fourteen (attributive)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1684 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1684.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열네' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1685 열다섯 (Number) - "fifteen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1685 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1685.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열다섯' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1686 열여섯 (Number) - "sixteen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1686 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1686.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열여섯' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1687 열일곱 (Number) - "seventeen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1687 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1687.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열일곱' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1688 열여덟 (Number) - "eighteen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1688 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1688.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열여덟' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1689 열아홉 (Number) - "nineteen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1689 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1689.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열아홉' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1699 나 (Pronoun) - "I, me (plain/informal 1st-person pronoun)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1699 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1699.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '나' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1700 너 (Pronoun) - "you (informal/banmal 2nd-person pronoun)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1700 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1700.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '너' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1731 이곳 (Pronoun) - "this place, here"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1731 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1731.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이곳' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1732 저곳 (Pronoun) - "that place over there"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1732 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1732.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '저곳' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1733 그거 (Pronoun) - "that thing (near you, colloquial)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1733 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1733.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그거' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1734 저거 (Pronoun) - "that thing over there (distal, colloquial)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1734 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1734.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '저거' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1735 어떤 (Determiner) - "which, what kind of, some"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1735 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1735.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어떤' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1775 내 (Pronoun) - "my (plain 1st-person possessive pronoun)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1775 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1775.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '내' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1799 모든 (Determiner) - "all, every (determiner)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1799 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1799.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '모든' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1801 여러 (Determiner) - "several, various, multiple (determiner)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1801 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1801.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여러' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1835 안녕 (Exclamation) - "hi, hello, goodbye (informal greeting); peace, well-being"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1835 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1835.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '안녕' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1850 글쎄 (Exclamation) - "well..., let me see (informal hesitation interjection)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1850 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1850.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '글쎄' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1998 한두 (Determiner) - "one or two (determiner)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1998 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_1998.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '한두' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2000 이런 (Determiner) - "this kind of, such, like this"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2000 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_2000.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이런' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2018 그런 (Determiner) - "such, that kind of, like that"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2018 -eng none --ast -sentence 10 --seed 1793700100000 -o scratch/audit/unit_2018.txt`
- **Seed:** `1793700100000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그런' functions correctly within its syntactic slot without allomorphic or case errors.

