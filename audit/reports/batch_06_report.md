# Linguistic Audit Report: Batch 06 (Action Verbs (Part B))

> **Batch ID:** 06  
> **Category:** Action Verbs (Part B)  
> **Target Manifest:** `audit/batches/batch_06_action_verbs_part_b.json`  
> **Total In-Scope Units:** 189  
> **PRNG Seed:** `1793700600000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (189 / 189 Analyzed)**  
> **Audit Summary:** **Clean: 189 units (100.0%) | Flagged: 0 units (0.0%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 06 audits 189 Action Verbs spanning complex native verbs, psychological/experiential predicates, movement and directional compounds, weather and physical state-change verbs, and Sino-Korean '-하다' action compounds.
Following Round 1 findings and Round 2 targeted remediation, all 189 units were re-evaluated and confirmed to achieve 100% clean sentence generation.

### Key Round 2 Remediations Verified:
1. Honorific Speech Verb Concord ('말씀하다', ID 1992): Enforces subject honorific concord with senior subjects ('고모부께서는 말씀하세요', '어머니께서는 말씀하십니다'), strictly barring accusative concrete objects (*'프라이팬을 말씀했어요'*).
2. Physical State-Change Subject Concord ('끓다', '식다', '터지다'): Restricts subject slots to semantic domain items (liquids for '끓다', warm food/drinks for '식다', inflatables for '터지다'), and blocks volitional desire auxiliary '-고 싶어하다' from involuntary physical occurrences (*'누나가 끓고 싶어해요'*).
3. Stem Contraction Precision on '모으다' (ID 1103): Preserves standard multisyllabic contraction '모아요' / '모았어요', completely avoiding non-standard '*뫄요'.
4. Humilific Directionality on '뵙다' (ID 1164): Correctly conjugates via suppletive stem '봬요' / '뵀어요' / '뵙겠습니다' and aligns with senior recipients.
5. Existential Stative Frame ('들어있다', ID 2004): Enforces locative static frame ('[Container]에 [Entity]가 들어있다'), barring direct accusative objects.

---

## 2. Detailed Linguistic Audit Findings

### Unit #1102 들다 (Action Verb) - "to enter, hold, cost, raise"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1102 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1102.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '들다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1103 모으다 (Action Verb) - "to collect, save, gather"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1103 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1103.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '모으다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1104 모이다 (Action Verb) - "to gather, assemble, get together"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1104 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1104.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '모이다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1107 시작하다 (Action Verb) - "to start, begin"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1107 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1107.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '시작하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1109 초대하다 (Action Verb) - "to invite"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1109 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1109.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '초대하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1117 박수를 치다 (Action Verb) - "to clap, applaud"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1117 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1117.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '박수를 치다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1118 발로 차다 (Action Verb) - "to kick with a foot"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1118 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1118.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '발로 차다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1127 쓰다 (Action Verb) - "to use (money, tools)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1127 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1127.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쓰다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1128 씹다 (Action Verb) - "to chew, bite"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1128 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1128.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '씹다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1132 졸다 (Action Verb) - "to doze, nod off"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1132 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1132.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '졸다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1154 지나다 (Action Verb) - "to pass, go by (time, place)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1154 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1154.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지나다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1164 뵙다 (Action Verb) - "to see, meet (humble form of 보다/만나다)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1164 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1164.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '뵙다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1166 생기다 (Action Verb) - "to form, occur, arise, look like"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1166 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1166.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '생기다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1171 세다 (Action Verb) - "to count, be strong"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1171 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1171.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '세다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1184 결석하다 (Action Verb) - "to be absent (from class or meeting)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1184 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1184.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '결석하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1185 놓다 (Action Verb) - "to put down, lay, let go"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1185 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1185.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '놓다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1186 늘다 (Action Verb) - "to increase, grow, improve"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1186 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1186.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '늘다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1187 당기다 (Action Verb) - "to pull, drag, crave (food)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1187 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1187.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '당기다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1188 들어주다 (Action Verb) - "to grant (request), listen to"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1188 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1188.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '들어주다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1189 밀다 (Action Verb) - "to push, shave"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1189 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1189.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '밀다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1190 벗다 (Action Verb) - "to take off (clothing, shoes)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1190 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1190.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '벗다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1192 빌려주다 (Action Verb) - "to lend, loan"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1192 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1192.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '빌려주다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1193 설명하다 (Action Verb) - "to explain"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1193 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1193.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '설명하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1194 잡다 (Action Verb) - "to catch, hold, grab"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1194 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1194.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잡다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1195 접다 (Action Verb) - "to fold, give up (plan)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1195 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1195.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '접다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1196 줄다 (Action Verb) - "to decrease, shrink, lessen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1196 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1196.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '줄다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1197 펴다 (Action Verb) - "to unfold, open (book, hand), spread"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1197 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1197.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '펴다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1209 전하다 (Action Verb) - "to deliver, convey, pass along"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1209 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1209.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '전하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1210 퇴근하다 (Action Verb) - "to leave work, get off work"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1210 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1210.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '퇴근하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1215 깨다 (Action Verb) - "to wake up, break, smash"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1215 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1215.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '깨다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1216 내다 (Action Verb) - "to pay, turn in, produce, cause"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1216 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1216.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '내다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1219 누르다 (Action Verb) - "to press, push (button)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1219 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1219.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '누르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1221 대다 (Action Verb) - "to place against, touch, tag (card)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1221 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1221.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '대다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1224 서다 (Action Verb) - "to stand, stop"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1224 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1224.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '서다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1230 열리다 (Action Verb) - "to open, be opened"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1230 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1230.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '열리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1246 막히다 (Action Verb) - "to be clogged, blocked, jammed (traffic)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1246 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1246.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '막히다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1247 밀리다 (Action Verb) - "to be pushed, be delayed, be backed up (traffic)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1247 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1247.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '밀리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1249 세우다 (Action Verb) - "to stop (vehicle), erect, set up"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1249 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1249.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '세우다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1253 좌회전하다 (Action Verb) - "to turn left"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1253 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1253.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '좌회전하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1256 주차하다 (Action Verb) - "to park (a vehicle)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1256 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1256.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주차하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1261 기억하다 (Action Verb) - "to remember, recall"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1261 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1261.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '기억하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1262 끝내다 (Action Verb) - "to finish, end"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1262 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1262.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '끝내다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1263 대답하다 (Action Verb) - "to answer, reply"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1263 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1263.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '대답하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1266 발표하다 (Action Verb) - "to present, announce"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1266 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1266.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '발표하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1268 사용하다 (Action Verb) - "to use, employ"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1268 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1268.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사용하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1269 연습하다 (Action Verb) - "to practice, rehearse"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1269 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1269.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '연습하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1270 외우다 (Action Verb) - "to memorize"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1270 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1270.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '외우다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1271 잊어버리다 (Action Verb) - "to forget"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1271 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1271.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잊어버리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1273 지각하다 (Action Verb) - "to be late (tardy)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1273 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1273.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지각하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1274 질문하다 (Action Verb) - "to ask a question"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1274 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1274.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '질문하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1275 출석하다 (Action Verb) - "to attend, be present"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1275 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1275.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '출석하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1281 내다 (Action Verb) - "to pay, submit, produce"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1281 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1281.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '내다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1286 신청하다 (Action Verb) - "to apply, sign up"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1286 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1286.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '신청하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1300 서명하다 (Action Verb) - "to sign (signature)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1300 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1300.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '서명하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1302 씻다 (Action Verb) - "to wash"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1302 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1302.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '씻다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1306 찾다 (Action Verb) - "to find, look for, withdraw (money)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1306 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1306.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '찾다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1321 부치다 (Action Verb) - "to mail, send (letter, parcel)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1321 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1321.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부치다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1324 올려놓다 (Action Verb) - "to put on, place on top"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1324 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1324.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '올려놓다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1330 포장하다 (Action Verb) - "to pack, wrap"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1330 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1330.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '포장하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1335 검색하다 (Action Verb) - "to search (online, database)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1335 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1335.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '검색하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1336 계산하다 (Action Verb) - "to calculate, pay the bill"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1336 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1336.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '계산하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1337 고장 나다 (Action Verb) - "to break down, malfunction"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1337 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1337.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고장 나다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1338 고치다 (Action Verb) - "to fix, repair, correct"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1338 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1338.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '고치다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1339 녹음하다 (Action Verb) - "to record (audio)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1339 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1339.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '녹음하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1345 통화하다 (Action Verb) - "to speak on the phone"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1345 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1345.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '통화하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1349 남기다 (Action Verb) - "to leave behind, save"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1349 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1349.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '남기다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1352 데려오다 (Action Verb) - "to bring (a person, animal)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1352 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1352.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '데려오다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1357 싸우다 (Action Verb) - "to fight, argue"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1357 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1357.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '싸우다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1358 지우다 (Action Verb) - "to erase, delete, wipe off"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1358 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1358.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지우다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1361 확인하다 (Action Verb) - "to confirm, verify, check"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1361 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1361.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '확인하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1365 꺼내다 (Action Verb) - "to take out, bring out, bring up (topic)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1365 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1365.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '꺼내다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1367 남다 (Action Verb) - "to remain, be left over"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1367 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1367.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '남다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1368 마치다 (Action Verb) - "to finish, complete, end"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1368 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1368.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '마치다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1386 결제하다 (Action Verb) - "to make a payment, pay"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1386 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1386.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '결제하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1391 배달되다 (Action Verb) - "to be delivered"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1391 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1391.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '배달되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1392 배달시키다 (Action Verb) - "to order delivery"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1392 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1392.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '배달시키다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1398 잊다 (Action Verb) - "to forget"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1398 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1398.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잊다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1406 긋다 (Action Verb) - "to draw (a line), strike (a match)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1406 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1406.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '긋다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1408 나다 (Action Verb) - "to break out, occur, sprout, grow"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1408 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1408.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '나다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1409 낫다 (Action Verb) - "to recover, get well, heal"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1409 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1409.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '낫다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1415 목이 쉬다 (Action Verb) - "to be hoarse, lose one's voice"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1415 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1415.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '목이 쉬다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1416 몸이 떨리다 (Action Verb) - "body trembles, shiver"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1416 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1416.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '몸이 떨리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1419 붓다 (Action Verb) - "to swell, puff up"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1419 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1419.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '붓다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1420 붓다 (Action Verb) - "to pour (liquid), fill"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1420 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1420.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '붓다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1426 잇다 (Action Verb) - "to connect, join, continue"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1426 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1426.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '잇다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1427 젓다 (Action Verb) - "to stir, row (boat)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1427 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1427.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '젓다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1428 짓다 (Action Verb) - "to build, make (meal, song, medicine), compose"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1428 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1428.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '짓다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1437 다치다 (Action Verb) - "to get hurt, be injured"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1437 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1437.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다치다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1440 바르다 (Action Verb) - "to apply, smear, spread"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1440 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1440.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '바르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1448 줄이다 (Action Verb) - "to reduce, decrease, lessen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1448 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1448.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '줄이다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1459 달리다 (Action Verb) - "to run, hang, be suspended, be short of"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1459 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1459.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '달리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1468 즐기다 (Action Verb) - "to enjoy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1468 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1468.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '즐기다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1472 낚시하다 (Action Verb) - "to fish, go fishing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1472 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1472.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '낚시하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1477 매다 (Action Verb) - "to tie, fasten, wear (tie, scarf)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1477 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1477.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '매다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1484 올리다 (Action Verb) - "to raise, post (online), upload"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1484 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1484.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '올리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1485 조깅하다 (Action Verb) - "to jog"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1485 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1485.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '조깅하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1486 치다 (Action Verb) - "to play (piano, guitar, drums), strike"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1486 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1486.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '치다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1487 키우다 (Action Verb) - "to raise, grow, breed (pet, plant)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1487 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1487.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '키우다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1498 벌다 (Action Verb) - "to earn (money), gain"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1498 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1498.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '벌다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1500 쌓다 (Action Verb) - "to pile up, stack, build"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1500 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1500.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쌓다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1503 연기하다 (Action Verb) - "to postpone, delay"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1503 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1503.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '연기하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1508 결정하다 (Action Verb) - "to decide, determine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1508 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1508.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '결정하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1516 입학하다 (Action Verb) - "to enter school, matriculate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1516 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1516.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '입학하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1520 출국하다 (Action Verb) - "to depart from a country, leave the country"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1520 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1520.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '출국하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1531 숙박하다 (Action Verb) - "to lodge, stay overnight"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1531 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1531.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '숙박하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1560 개다 (Action Verb) - "to clear up (weather)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1560 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1560.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '개다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1563 그치다 (Action Verb) - "to stop, cease (rain, snow, crying)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1563 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1563.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '그치다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1565 끼다 (Action Verb) - "to wear, put on (ring, gloves)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1565 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1565.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '끼다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1567 내리다 (Action Verb) - "to fall, come down (rain, snow)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1567 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1567.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '내리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1581 걸레질하다 (Action Verb) - "to wipe with a damp rag, mop"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1581 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1581.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '걸레질하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1585 다림질하다 (Action Verb) - "to iron (clothes)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1585 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1585.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다림질하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1589 설거지하다 (Action Verb) - "to wash dishes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1589 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1589.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '설거지하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1591 쓸다 (Action Verb) - "to sweep (with a broom)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1591 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1591.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '쓸다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1592 오르다 (Action Verb) - "to rise, climb, ascend"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1592 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1592.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '오르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1615 되다 (Action Verb) - "to become, to elapse (time), to work out"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1615 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1615.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '되다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1621 이해하다 (Action Verb) - "to understand, comprehend"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1621 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1621.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이해하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1622 소개하다 (Action Verb) - "to introduce, present"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1622 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1622.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '소개하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1647 이야기하다 (Action Verb) - "to talk, converse, chat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1647 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1647.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이야기하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1648 태어나다 (Action Verb) - "to be born"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1648 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1648.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '태어나다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1649 못하다 (Action Verb) - "to be poor at, cannot do"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1649 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1649.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '못하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1657 끼다 (Action Verb) - "to gather, settle, fog up (fog, clouds, dust)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1657 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1657.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '끼다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1658 부치다 (Action Verb) - "to fry, griddle (pancake, jeon)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1658 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1658.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부치다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1659 연기하다 (Action Verb) - "to act, perform (role in drama, play)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1659 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1659.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '연기하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1660 개다 (Action Verb) - "to fold (clothes, laundry, bedding)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1660 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1660.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '개다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1672 나오다 (Action Verb) - "to come out, emerge, exit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1672 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1672.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '나오다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1673 들어오다 (Action Verb) - "to come in, enter"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1673 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1673.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '들어오다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1674 돌아가다 (Action Verb) - "to return, go back"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1674 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1674.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '돌아가다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1675 올라오다 (Action Verb) - "to come up, ascend toward speaker"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1675 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1675.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '올라오다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1676 내려오다 (Action Verb) - "to come down, descend toward speaker"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1676 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1676.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '내려오다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1677 눕다 (Action Verb) - "to lie down"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1677 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1677.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '눕다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1678 여쭈어보다 (Action Verb) - "to ask, inquire (honorific/humble)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1678 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1678.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '여쭈어보다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1679 보여드리다 (Action Verb) - "to show (humble)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1679 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1679.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '보여드리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1680 도와드리다 (Action Verb) - "to help, assist (humble)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1680 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1680.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '도와드리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1694 죽다 (Action Verb) - "to die"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1694 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1694.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '죽다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1695 돌아가시다 (Action Verb) - "to pass away (honorific form of 죽다)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1695 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1695.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '돌아가시다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1701 보여주다 (Action Verb) - "to show, let see"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1701 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1701.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '보여주다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1770 이용하다 (Action Verb) - "to use, utilize, make use of"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1770 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1770.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '이용하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1777 사랑하다 (Action Verb) - "to love"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1777 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1777.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사랑하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1784 선택하다 (Action Verb) - "to choose, select, pick"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1784 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1784.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '선택하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1793 끓다 (Action Verb) - "to boil, bubble (intransitive)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1793 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1793.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '끓다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1795 담다 (Action Verb) - "to put into, serve (onto a plate/bowl), fill"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1795 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1795.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '담다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1798 생활하다 (Action Verb) - "to live, lead a life, get by"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1798 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1798.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '생활하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1805 사먹다 (Action Verb) - "to buy and eat (food), eat out"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1805 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1805.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '사먹다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1810 주문하다 (Action Verb) - "to order (goods, food)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1810 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1810.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주문하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1814 구매하다 (Action Verb) - "to purchase, buy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1814 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1814.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '구매하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1821 할인하다 (Action Verb) - "to discount, offer a discount"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1821 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1821.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '할인하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1851 가지다 (Action Verb) - "to have, hold, possess, carry"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1851 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1851.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가지다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1857 바꾸다 (Action Verb) - "to change, exchange, swap, replace"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1857 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1857.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '바꾸다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1863 부탁하다 (Action Verb) - "to ask a favor, request, ask of"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1863 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1863.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '부탁하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1866 어려워하다 (Action Verb) - "to find (something) difficult, struggle with"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1866 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1866.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '어려워하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1867 나빠하다 (Action Verb) - "to feel unpleasant, take offense, feel bad (about)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1867 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1867.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '나빠하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1868 힘들어하다 (Action Verb) - "to have a hard time, struggle with, suffer"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1868 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1868.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '힘들어하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1872 지나가다 (Action Verb) - "to pass by, go by, walk past"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1872 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1872.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '지나가다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1873 실례하다 (Action Verb) - "to commit a discourtesy, excuse oneself, be impolite"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1873 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1873.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '실례하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1878 찾아가다 (Action Verb) - "to visit, find one's way to, go to"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1878 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1878.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '찾아가다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1879 걸어가다 (Action Verb) - "to walk, go on foot"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1879 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1879.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '걸어가다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1880 하차하다 (Action Verb) - "to get off, alight, disembark (vehicle)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1880 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1880.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '하차하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1881 따라하다 (Action Verb) - "to repeat after, imitate, follow"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1881 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1881.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '따라하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1889 불다 (Action Verb) - "to blow (wind), play (wind instrument)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1889 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1889.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '불다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1892 서두르다 (Action Verb) - "to hurry, rush"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1892 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1892.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '서두르다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1912 요리하다 (Action Verb) - "to cook, prepare food, make a dish"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1912 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1912.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '요리하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1919 다운로드하다 (Action Verb) - "to download"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1919 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1919.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '다운로드하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1925 주고받다 (Action Verb) - "to exchange, send and receive, trade"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1925 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1925.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '주고받다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1926 클릭하다 (Action Verb) - "to click"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1926 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1926.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '클릭하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1931 배달하다 (Action Verb) - "to deliver"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1931 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1931.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '배달하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1932 원하다 (Action Verb) - "to want, desire, wish"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1932 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1932.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '원하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1955 기뻐하다 (Action Verb) - "to rejoice, be glad, be pleased (3rd person)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1955 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1955.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '기뻐하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1958 안내하다 (Action Verb) - "to guide, escort, show around"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1958 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1958.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '안내하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1959 맛보다 (Action Verb) - "to taste, sample food"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1959 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1959.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '맛보다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1961 알리다 (Action Verb) - "to inform, let know, announce"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1961 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1961.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '알리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1982 켜다 (Action Verb) - "to turn on, switch on (appliance, light)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1982 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1982.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '켜다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1983 떨리다 (Action Verb) - "to tremble, shiver, shake"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1983 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1983.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '떨리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1988 생각하다 (Action Verb) - "to think, consider, believe"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1988 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1988.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '생각하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1991 검사하다 (Action Verb) - "to examine, inspect, check, test"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1991 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1991.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '검사하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1992 말씀하다 (Action Verb) - "to speak, say (honorific or humble of 말하다)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1992 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1992.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '말씀하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1995 치료하다 (Action Verb) - "to treat, cure, heal"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1995 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1995.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '치료하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1996 넘어지다 (Action Verb) - "to fall down, trip over, tumble"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1996 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1996.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '넘어지다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #1997 소독하다 (Action Verb) - "to disinfect, sanitize, sterilize"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1997 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1997.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '소독하다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2003 흔들다 (Action Verb) - "to shake, wave, swing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2003 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2003.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '흔들다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2004 들어있다 (Action Verb) - "to be contained, to be inside"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2004 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2004.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '들어있다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2017 뜨거워지다 (Action Verb) - "to become hot, heat up, become passionate"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2017 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2017.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '뜨거워지다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2020 식다 (Action Verb) - "to cool down, get cold (food, temperature, passion)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2020 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2020.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '식다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2022 때리다 (Action Verb) - "to hit, strike, beat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2022 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2022.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '때리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2023 터지다 (Action Verb) - "to burst, explode, pop"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2023 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2023.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '터지다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2026 가보다 (Action Verb) - "to try going, go and see, visit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2026 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2026.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가보다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2030 묶다 (Action Verb) - "to tie, bind, bundle, knot"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2030 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2030.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '묶다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2032 풀다 (Action Verb) - "to untie, loosen, untangle; to solve"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2032 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2032.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '풀다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2033 가리다 (Action Verb) - "to cover, conceal, hide, shield"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2033 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2033.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '가리다' functions correctly within its syntactic slot without allomorphic or case errors.

### Unit #2040 미치다 (Action Verb) - "to go crazy, go mad, be enthusiastic"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2040 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2040.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated sentence variations adhere strictly to standard Korean morphosyntax, concord constraints, and register appropriateness. Target unit '미치다' functions correctly within its syntactic slot without allomorphic or case errors.

