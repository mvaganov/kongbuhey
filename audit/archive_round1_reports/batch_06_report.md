# Linguistic Audit Report: Batch 06 (Action Verbs Part B)

> **Batch ID:** 06  
> **Category:** Action Verbs (Part B: Complex, Compound & Sino-Korean Action Verbs)  
> **Target Manifest:** `audit/batches/batch_06_action_verbs_part_b.json`  
> **Total In-Scope Units:** 189  
> **PRNG Seed:** `1793700600000`  
> **Date:** 2026-11-04  
> **Evaluation Status:** **COMPLETE (189 / 189 Analyzed)**  
> **Audit Summary:** **Clean: 135 units (71%) | Flagged: 54 units (29%)**  

---

## 1. Executive Summary & Critical Linguistic Findings

Batch 06 audits 189 Action Verbs spanning complex native verbs, psychological/experiential predicates, movement and directional compounds, weather and physical state-change verbs, and Sino-Korean `-하다` action compounds.

### Key Discoveries & Root Causes:

1. **Stem Contraction Defect on `모으다` (ID 1103):**
   - In standard Korean, multisyllabic stems ending in `ㅡ` preceded by `ㅗ` (`모으-`) undergo `ㅡ`-elision when suffixed with `-아/어`, resulting in `모아-` (`모아요`, `모았어요`).
   - The engine erroneously contracted `모아` into a single diphthongized syllable `뫄` (*`뫄요`*, *`뫘어요`*), which is an ungrammatical non-standard contraction.

2. **Humilific Irregularity & Honorific Reversal on `뵙다` (ID 1164):**
   - The humble verb `뵙다` (to humbly meet an esteemed superior) was regularized as a simple consonant stem with vowel endings, producing impossible forms: *`뵙어요`*, *`뵙었어요`*, *`뵙을 거예요`*. Standard Korean conjugates `뵙다` via the alternate stem `뵈-` (`봬요`, `뵈었어요/뵀어요`, `뵐 거예요`) or formal `뵙겠습니다`.
   - Furthermore, humble `뵙다` was selected for junior/peer direct objects (*`조카를 뵙었어요`*, *`오빠를 뵙을 거예요`*), violating pragmatic humilific directionality.

3. **Existential Stative Frame Violation on `들어있다` (ID 2004):**
   - `들어있다` (to be contained in) is a stative existential predicate. Due to its classification as an Action Verb, the generator generated accusative direct objects (*`부엌을 들어있어요`*, *`서점을 들어있고 싶어요`*).
   - `들어있다` strictly requires the locative existential frame: `[Container/Location]에 [Entity]이/가 들어있다`.

4. **Honorific Agreement Clash & Semantic Mismatch on `말씀하다` (ID 1992):**
   - Subject honorific particle `-께서` collided with un-honorified speech endings: *`교수께서는 성격을 말씀해요`*, *`할머니께서 텔레비전을 말씀해요`*. Korean honorific concord strictly requires `-(으)시-` on predicates governed by `-께서` (`말씀하세요`, `말씀하셨어요`).
   - Additionally, concrete inanimate objects (frying pan, television, stamp) were assigned as direct objects of speech verb `말씀하다`.

5. **Physical / Weather / Device Inanimates Paired with Human Subjects & Volition:**
   - Involuntary, non-agentive predicates generated with bare human subjects and volitional desire (`-고 싶어하다`):
     - Mechanical failure: *`동창은 고장 나요`*, *`놈이 고장 나고 싶어해요`* (`고장 나다`, ID 1337).
     - Weather clearing: *`얘들은 개요`*, *`아이가 개고 싶어해요`* (`개다`, ID 1560).
     - Wind blowing: *`오빠는 불어요`*, *`공무원이 불고 싶어해요`* (`불다`, ID 1889).
     - Liquid boiling: *`우리는 끓어요`*, *`올리비아가 끓고 싶어해요`* (`끓다`, ID 1793).
     - Pressurized bursting: *`가수는 터져요`*, *`흐엉이 터지고 싶어해요`* (`터지다`, ID 2023).
     - Inchoative temperature: *`회사원은 뜨거워져요`* (`뜨거워지다`, ID 2017); *`요리사가 식어요`* (`식다`, ID 2020).

6. **Academic Locative Restriction Failures:**
   - Institutional verbs of attendance and tardiness (`결석하다` ID 1184, `지각하다` ID 1273, `출석하다` ID 1275, `입학하다` ID 1516) were tagged with generic `intransitive_place`, generating comical collocations: being absent from a crosswalk or sauna (*`횡단보도에 결석했어요`*, *`찜질방에 결석해요`*), tardy to a transit platform or district (*`승강장에 지각해요`*, *`마포구에 지각할 거예요`*), attending a veranda (*`베란다에 출석해요`*), or matriculating into a moving company (*`이삿짐센터에 입학해요`*).

7. **Systemic `나이` (ID 250) Tag Pollution:**
   - Continued to corrupt 31 verbs in this batch, producing *`나이를 소개해요`*, *`나이를 외워요`*, *`나이를 포장해요`*, *`나이를 펴요`*, *`나이에게 부탁해요`*.

---

## 2. Detailed Unit-by-Unit Linguistic Evaluations

### Unit #1102 들다 (Action Verb) - "to enter, hold, cost, raise"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1102 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1102.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `남동생은 제목을 들어요.`
  - *Var 8:* `제가 여유에 드라마를 들었어요.`
  - *Var 9:* `저는 토요일에 롤러코스터를 들 거예요.`
  - **Linguistic Error:** Collocation & polysemy failure: Physical lifting sense of '들다' (to hold, raise) paired with impossible massive objects (*'롤러코스터를 들 거예요'* - lifting a roller coaster) and abstract titles (*'제목을 들어요'*).
  - **Suggested Remediation:** Subcategorize '들다' into distinct semantic frames: manual lifting [portable_object] (가방, 우산, 잔) vs sensory listening '듣다' (드라마, 수업) vs financial cost [cost_money] (돈이 들다).

### Unit #1103 모으다 (Action Verb) - "to collect, save, gather"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1103 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1103.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `마리는 뭘 뫄요.`
  - *Var 4:* `부부가 현재 의자를 뫄요.`
  - *Var 5:* `저는 지난에 것을 뫘어요.`
  - *Var 7:* `의사는 바로 공책을 뫄요.`
  - *Var 8:* `아이가 날에 지하철을 뫘어요.`
  - *Var 10:* `여자가 우선 양말을 뫄요.`
  - **Linguistic Error:** Conjugation defect: Stem '모으-' (ㅡ-irregular) erroneously contracted to *'뫄요'* and *'뫘어요'* instead of standard Korean '모아요' and '모았어요'. In multisyllabic stems ending in ㅡ preceded by ㅗ, the ㅡ elides leaving 모 + 아 -> 모아, which does NOT contract to 뫄.
  - **Suggested Remediation:** Patch conjugator rule for ㅡ-elision in multisyllabic stems: ensure [모 + 아] preserves hiatus as '모아' rather than triggering monosyllabic diphthongization (오+아->와).

### Unit #1104 모이다 (Action Verb) - "to gather, assemble, get together"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1104 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1104.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1107 시작하다 (Action Verb) - "to start, begin"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1107 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1107.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1109 초대하다 (Action Verb) - "to invite"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1109 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1109.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1117 박수를 치다 (Action Verb) - "to clap, applaud"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1117 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1117.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1118 발로 차다 (Action Verb) - "to kick with a foot"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1118 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1118.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `사나이는 크리스마스에 똑바로 발로 찰 거예요.`
  - *Var 8:* `사나이가 오늘 발로 찼어요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1127 쓰다 (Action Verb) - "to use (money, tools)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1127 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1127.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1128 씹다 (Action Verb) - "to chew, bite"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1128 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1128.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사람은 설렁탕을 씹어요.`
  - *Var 7:* `형제는 가을에 빵집을 씹어요.`
  - **Linguistic Error:** Semantic selection violation: Mastication verb '씹다' (to chew) paired with liquid ox-bone soup (*'설렁탕을 씹어요'*) and a commercial bakery building (*'빵집을 씹어요'*).
  - **Suggested Remediation:** Restrict '씹다' direct objects to solid masticable foods [food_solid] (고기, 껌, 밥) and exclude liquids and commercial venues.

### Unit #1132 졸다 (Action Verb) - "to doze, nod off"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1132 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1132.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1154 지나다 (Action Verb) - "to pass, go by (time, place)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1154 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1154.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1164 뵙다 (Action Verb) - "to see, meet (humble form of 보다/만나다)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1164 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1164.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `여동생은 할머니를 뵙어요.`
  - *Var 3:* `기자는 날에 친척을 함께 뵙을 거예요.`
  - *Var 4:* `아랫사람이 차례에 교수를 뵙어요.`
  - *Var 5:* `회사원은 겨울에 이모를 뵙었어요.`
  - *Var 6:* `전문이 동안에 오빠를 뵙을 거예요.`
  - *Var 7:* `약사는 열흘에 엄마를 뵙어요.`
  - *Var 8:* `리포터가 금요일에 조카를 뵙었어요.`
  - *Var 9:* `놈은 오후에 사나이를 뵙을 거예요.`
  - *Var 10:* `가족이 잠시 간호사를 뵙어요.`
  - **Linguistic Error:** Morphological defect & honorific inversion: Humble stem '뵙-' incorrectly conjugated as regular consonant stem *'뵙어요'*, *'뵙었어요'*, *'뵙을 거예요'* instead of irregular/alternate stem '뵈-' ('봬요', '뵈었어요', '뵐 거예요'). Additionally, humble verb '뵙다' was used toward juniors/peers ('오빠', '조카', '사나이') rather than esteemed superiors.
  - **Suggested Remediation:** Map '뵙다' to stem '뵈-' for vowel suffixes (-(으)ㄹ 거예요 -> 뵐 거예요, -어요 -> 봬요), and enforce [object_honorific_superior] syntactic constraint.
  - *Var 9:* `놈은 오후에 사나이를 뵙을 거예요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1166 생기다 (Action Verb) - "to form, occur, arise, look like"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1166 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1166.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1171 세다 (Action Verb) - "to count, be strong"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1171 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1171.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1184 결석하다 (Action Verb) - "to be absent (from class or meeting)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1184 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1184.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `엄마는 여행사에 결석해요.`
  - *Var 3:* `얘들은 생신에 은행에 자세히 결석할 거예요.`
  - *Var 4:* `친척이 봄에 관광지에 결석해요.`
  - **Linguistic Error:** Semantic selection violation: Academic absence verb '결석하다' (to be absent) paired with non-academic public venues (*'찜질방에 결석해요'*, *'횡단보도에 결석했어요'*, *'영화관에 결석했어요'*) instead of educational classes/schools.
  - **Suggested Remediation:** Restrict locative goal of '결석하다' to [academic_institution, class] (학교, 수업, 학원, 대학교).

### Unit #1185 놓다 (Action Verb) - "to put down, lay, let go"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1185 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1185.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `누구는 역에 놓아요.`
  - *Var 2:* `조카가 이틀에 카페에 놓고 싶어해요.`
  - *Var 4:* `민준이 금요일에 이삿짐센터에 놓아요.`
  - **Linguistic Error:** Valency defect: Transitive placement verb '놓다' (to put down, lay) generated without an accusative direct object (*'누구는 역에 놓아요'*, *'조카가 이틀에 카페에 놓고 싶어해요'*), leaving the placed theme unspecified.
  - **Suggested Remediation:** Enforce obligatory direct object argument (NP-을/를) in the syntactic template for '놓다' ([NP-가 NP-을 NP-에 놓다]).

### Unit #1186 늘다 (Action Verb) - "to increase, grow, improve"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1186 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1186.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `여자는 늘어요.`
  - *Var 2:* `형이 종일에 늘고 싶어해요.`
  - *Var 3:* `남동생은 토요일에 꼭 늘 거예요.`
  - **Linguistic Error:** Semantic selection violation: Scalar change verb '늘다' (to to increase, grow, improve) generated with bare human subjects (*'여자는 늘어요.'*) without a dimension or attribute nominal (실력, 키, 몸무게, 인구).
  - **Suggested Remediation:** Restrict '늘다' subjects to scalar quantitative or skill nominals [scalar_dimension] (실력, 수량, 몸무게, 비용, 인구).

### Unit #1187 당기다 (Action Verb) - "to pull, drag, crave (food)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1187 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1187.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1188 들어주다 (Action Verb) - "to grant (request), listen to"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1188 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1188.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1189 밀다 (Action Verb) - "to push, shave"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1189 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1189.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1190 벗다 (Action Verb) - "to take off (clothing, shoes)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1190 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1190.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1192 빌려주다 (Action Verb) - "to lend, loan"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1192 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1192.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 9:* `누나는 이틀에 사나이를 빌려줄 거예요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1193 설명하다 (Action Verb) - "to explain"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1193 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1193.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1194 잡다 (Action Verb) - "to catch, hold, grab"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1194 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1194.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1195 접다 (Action Verb) - "to fold, give up (plan)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1195 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1195.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1196 줄다 (Action Verb) - "to decrease, shrink, lessen"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1196 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1196.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `리포터는 줄어요.`
  - *Var 2:* `민수가 이틀에 줄고 싶어해요.`
  - *Var 3:* `기사는 금요일에 자세히 줄 거예요.`
  - **Linguistic Error:** Semantic selection violation: Scalar change verb '줄다' (to to decrease, shrink, lessen) generated with bare human subjects (*'리포터는 줄어요.'*) without a dimension or attribute nominal (실력, 키, 몸무게, 인구).
  - **Suggested Remediation:** Restrict '줄다' subjects to scalar quantitative or skill nominals [scalar_dimension] (실력, 수량, 몸무게, 비용, 인구).

### Unit #1197 펴다 (Action Verb) - "to unfold, open (book, hand), spread"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1197 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1197.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 8:* `사나이가 일찍 영화를 폈어요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1209 전하다 (Action Verb) - "to deliver, convey, pass along"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1209 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1209.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1210 퇴근하다 (Action Verb) - "to leave work, get off work"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1210 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1210.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1215 깨다 (Action Verb) - "to wake up, break, smash"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1215 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1215.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 4:* `제가 오전에 휴지를 깨요.`
  - *Var 9:* `전문은 내일 노래를 깰 거예요.`
  - **Linguistic Error:** Semantic selection violation: Smashing/shattering verb '깨다' (to smash, break) paired with non-breakable entities (*'양말을 깰 거예요'*, *'한국말을 깨요'*, *'노래를 깰 거예요'*).
  - **Suggested Remediation:** Restrict direct objects of '깨다' to breakable brittle items [fragile_object] (유리, 접시, 컵, 거울, 달걀) or state nouns (잠, 술).

### Unit #1216 내다 (Action Verb) - "to pay, turn in, produce, cause"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1216 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1216.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1219 누르다 (Action Verb) - "to press, push (button)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1219 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1219.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 9:* `사나이는 아직 티셔츠를 누를 거예요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1221 대다 (Action Verb) - "to place against, touch, tag (card)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1221 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1221.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `동창은 경제학을 대요.`
  - *Var 4:* `놈이 오늘 제목을 대요.`
  - *Var 8:* `내가 월요일에 일본말을 댔어요.`
  - **Linguistic Error:** Semantic selection violation: Contact/tagging verb '대다' (to touch against, tag card) paired with abstract academic and linguistic entities (*'경제학을 대요'*, *'영어를 대요'*, *'성격을 대요'*).
  - **Suggested Remediation:** Restrict direct objects of '대다' to physical cards, body parts, or measuring devices [contact_object] (카드, 손, 체온계, 입).
  - *Var 3:* `사나이는 학기 중에 의자를 같이 댈 거예요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1224 서다 (Action Verb) - "to stand, stop"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1224 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1224.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1230 열리다 (Action Verb) - "to open, be opened"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1230 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1230.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `사나이는 지금 함께 열릴 거예요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1246 막히다 (Action Verb) - "to be clogged, blocked, jammed (traffic)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1246 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1246.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1247 밀리다 (Action Verb) - "to be pushed, be delayed, be backed up (traffic)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1247 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1247.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1249 세우다 (Action Verb) - "to stop (vehicle), erect, set up"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1249 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1249.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1253 좌회전하다 (Action Verb) - "to turn left"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1253 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1253.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 8:* `사나이가 지난에 좌회전했어요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1256 주차하다 (Action Verb) - "to park (a vehicle)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1256 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1256.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1261 기억하다 (Action Verb) - "to remember, recall"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1261 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1261.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1262 끝내다 (Action Verb) - "to finish, end"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1262 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1262.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1263 대답하다 (Action Verb) - "to answer, reply"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1263 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1263.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1266 발표하다 (Action Verb) - "to present, announce"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1266 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1266.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1268 사용하다 (Action Verb) - "to use, employ"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1268 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1268.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 6:* `사나이가 봄에 운동화를 사용할 거예요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1269 연습하다 (Action Verb) - "to practice, rehearse"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1269 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1269.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1270 외우다 (Action Verb) - "to memorize"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1270 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1270.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 노선도를 외워요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1271 잊어버리다 (Action Verb) - "to forget"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1271 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1271.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1273 지각하다 (Action Verb) - "to be late (tardy)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1273 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1273.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `올리비아는 삼거리에 지각해요.`
  - *Var 2:* `언니가 목요일에 예약석에 지각하고 싶어해요.`
  - *Var 3:* `회원은 종일에 마포구에 혼자 지각할 거예요.`
  - **Linguistic Error:** Semantic selection violation: Tardiness verb '지각하다' (to be late) paired with geographic districts and transit platforms (*'마포구에 지각할 거예요'*, *'삼거리에 지각해요'*, *'승강장에 지각해요'*) instead of school or work appointments.
  - **Suggested Remediation:** Restrict locative goal of '지각하다' to [academic_institution, workplace, meeting] (학교, 회사, 수업, 모임).

### Unit #1274 질문하다 (Action Verb) - "to ask a question"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1274 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1274.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1275 출석하다 (Action Verb) - "to attend, be present"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1275 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1275.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 2:* `배우가 과거에 러시아에 출석하고 싶어해요.`
  - *Var 4:* `여자가 낮에 백화점에 출석해요.`
  - *Var 5:* `회원은 벌써 거실에 출석했어요.`
  - **Linguistic Error:** Semantic selection violation: Attendance verb '출석하다' (to attend) paired with residential rooms and physical landmarks (*'베란다에 출석해요'*, *'거실에 출석했어요'*, *'백화점에 출석해요'*) instead of classes, meetings, or church.
  - **Suggested Remediation:** Restrict locative goal of '출석하다' to [academic_institution, meeting, assembly] (학교, 수업, 회의, 교회).

### Unit #1281 내다 (Action Verb) - "to pay, submit, produce"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1281 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1281.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1286 신청하다 (Action Verb) - "to apply, sign up"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1286 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1286.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1300 서명하다 (Action Verb) - "to sign (signature)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1300 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1300.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1302 씻다 (Action Verb) - "to wash"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1302 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1302.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1306 찾다 (Action Verb) - "to find, look for, withdraw (money)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1306 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1306.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1321 부치다 (Action Verb) - "to mail, send (letter, parcel)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1321 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1321.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 신청서를 부쳐요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1324 올려놓다 (Action Verb) - "to put on, place on top"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1324 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1324.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1330 포장하다 (Action Verb) - "to pack, wrap"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1330 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1330.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `사나이는 이전에 그걸 포장했어요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1335 검색하다 (Action Verb) - "to search (online, database)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1335 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1335.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1336 계산하다 (Action Verb) - "to calculate, pay the bill"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1336 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1336.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1337 고장 나다 (Action Verb) - "to break down, malfunction"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1337 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1337.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `동창은 고장 나요.`
  - *Var 2:* `놈이 후에 고장 나고 싶어해요.`
  - *Var 3:* `아랫사람은 처음에 다함께 고장 날 거예요.`
  - **Linguistic Error:** Semantic selection violation: Mechanical/device failure predicate '고장 나다' (to break down, malfunction) generated with human subjects (*'동창은 고장 나요'*, *'에릭은 고장 났어요'*), and paired with volitional desire auxiliary *'-고 싶어해요'*.
  - **Suggested Remediation:** Restrict '고장 나다' subjects to [device, machinery, vehicle] tags and prohibit volitional desire auxiliary '-고 싶다'.

### Unit #1338 고치다 (Action Verb) - "to fix, repair, correct"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1338 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1338.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1339 녹음하다 (Action Verb) - "to record (audio)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1339 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1339.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `사나이는 오전에 코미디 영화를 꼭 녹음할 거예요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1345 통화하다 (Action Verb) - "to speak on the phone"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1345 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1345.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1349 남기다 (Action Verb) - "to leave behind, save"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1349 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1349.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1352 데려오다 (Action Verb) - "to bring (a person, animal)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1352 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1352.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1357 싸우다 (Action Verb) - "to fight, argue"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1357 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1357.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1358 지우다 (Action Verb) - "to erase, delete, wipe off"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1358 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1358.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1361 확인하다 (Action Verb) - "to confirm, verify, check"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1361 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1361.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1365 꺼내다 (Action Verb) - "to take out, bring out, bring up (topic)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1365 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1365.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1367 남다 (Action Verb) - "to remain, be left over"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1367 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1367.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1368 마치다 (Action Verb) - "to finish, complete, end"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1368 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1368.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1386 결제하다 (Action Verb) - "to make a payment, pay"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1386 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1386.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1391 배달되다 (Action Verb) - "to be delivered"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1391 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1391.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1392 배달시키다 (Action Verb) - "to order delivery"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1392 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1392.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1398 잊다 (Action Verb) - "to forget"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1398 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1398.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1406 긋다 (Action Verb) - "to draw (a line), strike (a match)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1406 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1406.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1408 나다 (Action Verb) - "to break out, occur, sprout, grow"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1408 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1408.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1409 낫다 (Action Verb) - "to recover, get well, heal"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1409 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1409.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 10:* `사나이가 봄에 나아요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1415 목이 쉬다 (Action Verb) - "to be hoarse, lose one's voice"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1415 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1415.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 9:* `사나이는 출발에 목이 쉴 거예요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1416 몸이 떨리다 (Action Verb) - "body trembles, shiver"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1416 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1416.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 7:* `사나이는 학기에 몸이 떨려요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1419 붓다 (Action Verb) - "to swell, puff up"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1419 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1419.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 4:* `사나이가 이틀에 부어요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1420 붓다 (Action Verb) - "to pour (liquid), fill"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1420 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1420.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1426 잇다 (Action Verb) - "to connect, join, continue"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1426 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1426.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 8:* `사나이가 아까 이불을 이었어요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1427 젓다 (Action Verb) - "to stir, row (boat)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1427 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1427.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1428 짓다 (Action Verb) - "to build, make (meal, song, medicine), compose"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1428 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1428.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1437 다치다 (Action Verb) - "to get hurt, be injured"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1437 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1437.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1440 바르다 (Action Verb) - "to apply, smear, spread"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1440 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1440.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 발라요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1448 줄이다 (Action Verb) - "to reduce, decrease, lessen"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1448 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1448.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1459 달리다 (Action Verb) - "to run, hang, be suspended, be short of"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1459 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1459.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1468 즐기다 (Action Verb) - "to enjoy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1468 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1468.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1472 낚시하다 (Action Verb) - "to fish, go fishing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1472 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1472.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1477 매다 (Action Verb) - "to tie, fasten, wear (tie, scarf)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1477 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1477.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1484 올리다 (Action Verb) - "to raise, post (online), upload"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1484 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1484.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1485 조깅하다 (Action Verb) - "to jog"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1485 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1485.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1486 치다 (Action Verb) - "to play (piano, guitar, drums), strike"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1486 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1486.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1487 키우다 (Action Verb) - "to raise, grow, breed (pet, plant)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1487 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1487.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1498 벌다 (Action Verb) - "to earn (money), gain"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1498 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1498.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1500 쌓다 (Action Verb) - "to pile up, stack, build"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1500 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1500.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1503 연기하다 (Action Verb) - "to postpone, delay"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1503 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1503.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `은행원은 기차를 연기해요.`
  - *Var 3:* `저는 연휴에 디퓨저를 열심히 연기할 거예요.`
  - *Var 5:* `민준은 아침에 재료를 연기했어요.`
  - **Linguistic Error:** Semantic selection violation: Scheduling verb '연기하다' (to postpone) paired with physical concrete artifacts (*'디퓨저를 연기할 거예요'*, *'바지를 연기해요'*, *'구두를 연기했어요'*) instead of scheduled events or deadlines.
  - **Suggested Remediation:** Restrict direct objects of '연기하다' (postpone) to [event, schedule, meeting, exam] (회의, 시험, 약속, 출발, 일정).
  - *Var 4:* `사나이가 점심에 꽃다발을 연기해요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1508 결정하다 (Action Verb) - "to decide, determine"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1508 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1508.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1516 입학하다 (Action Verb) - "to enter school, matriculate"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1516 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1516.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `아랫사람은 하숙집에 입학해요.`
  - *Var 3:* `마리는 학기에 스케이트장에 다함께 입학할 거예요.`
  - *Var 4:* `리포터가 아직 역에 입학해요.`
  - **Linguistic Error:** Semantic selection violation: School matriculation verb '입학하다' (to enter school) paired with non-educational venues (*'이삿짐센터에 입학해요'*, *'테니스장에 입학할 거예요'*, *'하숙집에 입학해요'*).
  - **Suggested Remediation:** Restrict locative goal of '입학하다' strictly to [academic_institution] (초등학교, 중학교, 고등학교, 대학교, 대학원).
  - *Var 9:* `사나이는 방학에 외국에 입학할 거예요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1520 출국하다 (Action Verb) - "to depart from a country, leave the country"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1520 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1520.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1531 숙박하다 (Action Verb) - "to lodge, stay overnight"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1531 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1531.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1560 개다 (Action Verb) - "to clear up (weather)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1560 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1560.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `얘들은 개요.`
  - *Var 2:* `아이가 지난에 개고 싶어해요.`
  - *Var 4:* `의사가 말에 개요.`
  - **Linguistic Error:** Semantic selection violation: Impersonal weather predicate '개다' (to clear up) generated with human subjects (*'얘들은 개요'*, *'싸이는 갰어요'*) and paired with volitional desire auxiliary *'-고 싶어해요'*.
  - **Suggested Remediation:** Restrict '개다' subjects to [weather, sky, rain] tags (날씨가 개다, 비가 개다) and mark as non-volitional.

### Unit #1563 그치다 (Action Verb) - "to stop, cease (rain, snow, crying)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1563 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1563.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1565 끼다 (Action Verb) - "to wear, put on (ring, gloves)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1565 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1565.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1567 내리다 (Action Verb) - "to fall, come down (rain, snow)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1567 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1567.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1581 걸레질하다 (Action Verb) - "to wipe with a damp rag, mop"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1581 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1581.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1585 다림질하다 (Action Verb) - "to iron (clothes)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1585 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1585.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1589 설거지하다 (Action Verb) - "to wash dishes"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1589 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1589.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1591 쓸다 (Action Verb) - "to sweep (with a broom)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1591 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1591.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1592 오르다 (Action Verb) - "to rise, climb, ascend"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1592 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1592.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1615 되다 (Action Verb) - "to become, to elapse (time), to work out"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1615 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1615.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1621 이해하다 (Action Verb) - "to understand, comprehend"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1621 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1621.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1622 소개하다 (Action Verb) - "to introduce, present"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1622 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1622.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 4:* `제가 오전에 나이를 소개해요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1647 이야기하다 (Action Verb) - "to talk, converse, chat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1647 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1647.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1648 태어나다 (Action Verb) - "to be born"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1648 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1648.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1649 못하다 (Action Verb) - "to be poor at, cannot do"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1649 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1649.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1657 끼다 (Action Verb) - "to gather, settle, fog up (fog, clouds, dust)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1657 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1657.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1658 부치다 (Action Verb) - "to fry, griddle (pancake, jeon)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1658 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1658.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 7:* `팬은 적에 후추를 부쳐요.`
  - *Var 9:* `리포터는 일요일에 식초를 부칠 거예요.`
  - **Linguistic Error:** Semantic selection violation: Griddling verb '부치다' (to pan-fry pancakes/jeon) paired with soups (*'설렁탕을 부쳐요'*, *'짬뽕을 부칠 거예요'*), seasonings (*'식초를 부칠 거예요'*), and restaurant venues (*'북경반점을 부치고 싶어해요'*).
  - **Suggested Remediation:** Subdivide [food] tag into [food_batter_pancake] for '부치다' (전, 부침개, 전병, 계란후라이), and exclude liquids and venue nominals.
  - *Var 5:* `사나이는 월요일에 당면을 부쳤어요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1659 연기하다 (Action Verb) - "to act, perform (role in drama, play)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1659 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1659.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 4:* `사나이가 저녁에 연기해요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1660 개다 (Action Verb) - "to fold (clothes, laundry, bedding)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1660 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1660.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1672 나오다 (Action Verb) - "to come out, emerge, exit"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1672 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1672.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `사나이는 낮에 열심히 나올 거예요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1673 들어오다 (Action Verb) - "to come in, enter"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1673 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1673.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 6:* `사나이가 처음에 아시아에 들어올 거예요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1674 돌아가다 (Action Verb) - "to return, go back"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1674 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1674.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1675 올라오다 (Action Verb) - "to come up, ascend toward speaker"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1675 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1675.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1676 내려오다 (Action Verb) - "to come down, descend toward speaker"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1676 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1676.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1677 눕다 (Action Verb) - "to lie down"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1677 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1677.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1678 여쭈어보다 (Action Verb) - "to ask, inquire (honorific/humble)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1678 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1678.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1679 보여드리다 (Action Verb) - "to show (humble)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1679 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1679.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1680 도와드리다 (Action Verb) - "to help, assist (humble)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1680 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1680.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1694 죽다 (Action Verb) - "to die"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1694 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1694.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1695 돌아가시다 (Action Verb) - "to pass away (honorific form of 죽다)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1695 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1695.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1701 보여주다 (Action Verb) - "to show, let see"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1701 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1701.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1770 이용하다 (Action Verb) - "to use, utilize, make use of"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1770 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1770.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1777 사랑하다 (Action Verb) - "to love"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1777 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1777.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1784 선택하다 (Action Verb) - "to choose, select, pick"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1784 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1784.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1793 끓다 (Action Verb) - "to boil, bubble (intransitive)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1793 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1793.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `우리는 끓어요.`
  - *Var 2:* `올리비아가 올해에 끓고 싶어해요.`
  - *Var 3:* `엄마는 모레 빨리 끓을 거예요.`
  - **Linguistic Error:** Semantic selection violation: Liquid physical phase-change verb '끓다' (to boil, bubble - intransitive) generated with human subjects (*'우리는 끓어요'*, *'엄마는 끓을 거예요'*) and volitional desire *'-고 싶어해요'*. '끓다' requires liquid/soup subjects (물, 찌개, 국).
  - **Suggested Remediation:** Tag '끓다' with [liquid_subject_only] and prohibit volitional desire auxiliary; distinguish intransitive '끓다' from causative '끓이다'.

### Unit #1795 담다 (Action Verb) - "to put into, serve (onto a plate/bowl), fill"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1795 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1795.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1798 생활하다 (Action Verb) - "to live, lead a life, get by"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1798 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1798.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 10:* `사나이가 언제 생활해요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1805 사먹다 (Action Verb) - "to buy and eat (food), eat out"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1805 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1805.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1810 주문하다 (Action Verb) - "to order (goods, food)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1810 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1810.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1814 구매하다 (Action Verb) - "to purchase, buy"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1814 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1814.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1821 할인하다 (Action Verb) - "to discount, offer a discount"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1821 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1821.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1851 가지다 (Action Verb) - "to have, hold, possess, carry"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1851 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1851.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1857 바꾸다 (Action Verb) - "to change, exchange, swap, replace"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1857 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1857.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1863 부탁하다 (Action Verb) - "to ask a favor, request, ask of"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1863 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1863.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `가족은 아직 사나이에게 조금씩 부탁할 거예요.`
  - *Var 6:* `사나이가 사흘에 요리사에게 부탁할 거예요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1866 어려워하다 (Action Verb) - "to find (something) difficult, struggle with"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1866 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1866.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1867 나빠하다 (Action Verb) - "to feel unpleasant, take offense, feel bad (about)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1867 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1867.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 7:* `가족은 사흘에 스크린도어를 나빠해요.`
  - **Linguistic Error:** Semantic selection violation: Psychological emotional verb '나빠하다' paired with physical concrete artifacts (*'스크린도어를'*), which cannot function as psychological emotional objects.
  - **Suggested Remediation:** Restrict direct objects of '나빠하다' to cognitive tasks, academic studies, languages, or interpersonal relations [cognitive_task, situation].

### Unit #1868 힘들어하다 (Action Verb) - "to have a hard time, struggle with, suffer"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1868 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1868.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `리포터는 미리 주머니를 똑같이 힘들어할 거예요.`
  - *Var 4:* `학생이 크리스마스에 넥타이를 힘들어해요.`
  - *Var 7:* `얘들은 종일에 휴지를 힘들어해요.`
  - **Linguistic Error:** Semantic selection violation: Psychological emotional verb '힘들어하다' paired with physical concrete artifacts (*'주머니를'*), which cannot function as psychological emotional objects.
  - **Suggested Remediation:** Restrict direct objects of '힘들어하다' to cognitive tasks, academic studies, languages, or interpersonal relations [cognitive_task, situation].

### Unit #1872 지나가다 (Action Verb) - "to pass by, go by, walk past"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1872 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1872.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `학생은 베란다에 지나가요.`
  - *Var 2:* `기사가 저녁에 거리에 지나가고 싶어해요.`
  - *Var 4:* `친척이 어린이날에 빵집에 지나가요.`
  - **Linguistic Error:** Case marking defect: Transitive path motion verb '지나가다' (to pass by) generated with static goal particle '-에' (*'베란다에 지나가요'*, *'빵집에 지나가요'*) instead of path accusative '-을/를' (*'빵집을 지나가다'*) or directional '-앞으로/-로 지나가다'.
  - **Suggested Remediation:** Configure syntactic frame for '지나가다' to require path accusative [NP-을/를 지나가다] or relational spatial postposition [NP-앞을/옆을 지나가다].

### Unit #1873 실례하다 (Action Verb) - "to commit a discourtesy, excuse oneself, be impolite"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1873 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1873.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1878 찾아가다 (Action Verb) - "to visit, find one's way to, go to"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1878 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1878.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1879 걸어가다 (Action Verb) - "to walk, go on foot"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1879 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1879.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1880 하차하다 (Action Verb) - "to get off, alight, disembark (vehicle)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1880 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1880.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1881 따라하다 (Action Verb) - "to repeat after, imitate, follow"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1881 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1881.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1889 불다 (Action Verb) - "to blow (wind), play (wind instrument)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1889 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1889.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `오빠는 불어요.`
  - *Var 2:* `공무원이 학기에 불고 싶어해요.`
  - *Var 3:* `오빠는 휴가에 계속 불 거예요.`
  - **Linguistic Error:** Semantic selection violation: Weather verb '불다' (to blow) generated as bare intransitive with human subjects (*'오빠는 불어요'*, *'간호사가 불어요'*). As an intransitive weather verb, the subject must be '바람' (바람이 불다). When human, it requires an instrument or candle object (호각을 불다, 플루트를 불다).
  - **Suggested Remediation:** Define weather sub-frame requiring subject '바람' (바람이 불다), or require musical instrument direct object.

### Unit #1892 서두르다 (Action Verb) - "to hurry, rush"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1892 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1892.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 3:* `사나이는 수요일에 그렇게 서두를 거예요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1912 요리하다 (Action Verb) - "to cook, prepare food, make a dish"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1912 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1912.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1919 다운로드하다 (Action Verb) - "to download"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1919 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1919.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1925 주고받다 (Action Verb) - "to exchange, send and receive, trade"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1925 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1925.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1926 클릭하다 (Action Verb) - "to click"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1926 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1926.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 2:* `사나이가 금요일에 디퓨저를 클릭하고 싶어해요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #1931 배달하다 (Action Verb) - "to deliver"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1931 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1931.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1932 원하다 (Action Verb) - "to want, desire, wish"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1932 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1932.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1955 기뻐하다 (Action Verb) - "to rejoice, be glad, be pleased (3rd person)"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1955 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1955.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1958 안내하다 (Action Verb) - "to guide, escort, show around"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1958 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1958.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1959 맛보다 (Action Verb) - "to taste, sample food"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1959 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1959.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1961 알리다 (Action Verb) - "to inform, let know, announce"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1961 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1961.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1982 켜다 (Action Verb) - "to turn on, switch on (appliance, light)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1982 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1982.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 5:* `엄마는 낮에 옷장을 켰어요.`
  - *Var 8:* `아주머니가 여름에 사전을 켰어요.`
  - *Var 9:* `공무원은 여름에 도장을 켤 거예요.`
  - **Linguistic Error:** Semantic selection violation: Appliance/lighting verb '켜다' (to switch on) paired with non-electronic concrete objects (*'옷장을 켜요'*, *'사전을 켜고 싶어해요'*, *'도장을 켤 거예요'*).
  - **Suggested Remediation:** Restrict direct objects of '켜다' to [electronic_device, light] (텔레비전, 불, 전등, 컴퓨터, 에어컨, 라디오).

### Unit #1983 떨리다 (Action Verb) - "to tremble, shiver, shake"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1983 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1983.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1988 생각하다 (Action Verb) - "to think, consider, believe"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1988 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1988.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1991 검사하다 (Action Verb) - "to examine, inspect, check, test"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1991 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1991.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1992 말씀하다 (Action Verb) - "to speak, say (honorific or humble of 말하다)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 1992 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1992.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `교수께서는 성격을 말씀해요.`
  - *Var 2:* `사장님께서 오전에 비행기 표를 말씀했어요.`
  - *Var 3:* `할아버지께서는 한글날에 꽃을 조금씩 말씀할 거예요.`
  - **Linguistic Error:** Honorific agreement clash & object mismatch: Subject marked with honorific particle '-께서' was paired with non-honorified predicate ending *'말씀해요'*, *'말씀했어요'* instead of honorific suffix '말씀하세요', '말씀하셨어요'. Additionally, household physical objects (*'프라이팬을 말씀했어요'*, *'도장을 말씀했어요'*) were selected as direct objects of a speech verb.
  - **Suggested Remediation:** Enforce honorific concord requiring '-(으)시-' on predicates governed by '-께서', and restrict '말씀하다' direct objects to speech-content nominals (이야기, 말씀, 사실) or intransitive clausal complements.

### Unit #1995 치료하다 (Action Verb) - "to treat, cure, heal"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1995 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1995.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1996 넘어지다 (Action Verb) - "to fall down, trip over, tumble"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1996 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1996.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #1997 소독하다 (Action Verb) - "to disinfect, sanitize, sterilize"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 1997 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_1997.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #2003 흔들다 (Action Verb) - "to shake, wave, swing"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2003 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2003.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #2004 들어있다 (Action Verb) - "to be contained, to be inside"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 2004 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2004.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `회원은 부엌을 들어있어요.`
  - *Var 2:* `제가 오래 서점을 들어있고 싶어요.`
  - *Var 3:* `나는 처음에 방송국을 똑같이 들어있을 거예요.`
  - **Linguistic Error:** Syntactic frame defect: Existential stative compound '들어있다' (to be contained in) generated with accusative direct objects (*'부엌을 들어있다'*, *'서점을 들어있고 싶어요'*) as if it were a transitive action verb. '들어있다' strictly requires the existential locative frame '[Container/Place]에 [Entity]이/가 들어있다'.
  - **Suggested Remediation:** Reclassify '들어있다' to Descriptive Verb / Existential Predicate with frame [NP-에 NP-이/가 들어있다].

### Unit #2017 뜨거워지다 (Action Verb) - "to become hot, heat up, become passionate"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 2017 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2017.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `회사원은 뜨거워져요.`
  - *Var 2:* `오빠가 약속 시간에 뜨거워지고 싶어해요.`
  - *Var 3:* `회사원은 언제 열심히 뜨거워질 거예요.`
  - **Linguistic Error:** Semantic selection violation: Inchoative temperature predicate '뜨거워지다' (to become hot) generated with human subjects (*'회사원은 뜨거워져요'*, *'엄마가 뜨거워질 거예요'*). Humans feeling hot express '더워하다' or '열이 나다'.
  - **Suggested Remediation:** Restrict '뜨거워지다' subjects to inanimate objects, liquids, food, or atmosphere [temperature_target].

### Unit #2020 식다 (Action Verb) - "to cool down, get cold (food, temperature, passion)"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 2020 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2020.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 2:* `에릭이 언제 식고 싶어해요.`
  - *Var 5:* `배우는 금년에 식었어요.`
  - *Var 7:* `에릭은 토요일에 식어요.`
  - **Linguistic Error:** Semantic selection violation: Inanimate cooling predicate '식다' (to cool down, get cold) generated with human subjects (*'에릭이 식고 싶어해요'*, *'요리사가 식어요'*).
  - **Suggested Remediation:** Restrict '식다' subjects to hot food, liquids, or abstract fervor/passion (국이 식다, 커피가 식다, 열정이 식다).

### Unit #2022 때리다 (Action Verb) - "to hit, strike, beat"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2022 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2022.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #2023 터지다 (Action Verb) - "to burst, explode, pop"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 2023 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2023.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `가수는 터져요.`
  - *Var 2:* `흐엉이 봄에 터지고 싶어해요.`
  - *Var 3:* `언니는 늘 혼자 터질 거예요.`
  - **Linguistic Error:** Semantic selection violation: Explosion/bursting predicate '터지다' (to burst, pop, explode) generated with human subjects (*'가수는 터져요'*, *'흐엉이 터지고 싶어해요'*).
  - **Suggested Remediation:** Restrict '터지다' subjects to inflatable/pressurized objects (풍선, 타이어, 폭탄) or emotional bursts (웃음, 울음).

### Unit #2026 가보다 (Action Verb) - "to try going, go and see, visit"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2026 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2026.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #2030 묶다 (Action Verb) - "to tie, bind, bundle, knot"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2030 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2030.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #2032 풀다 (Action Verb) - "to untie, loosen, untangle; to solve"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2032 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2032.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

### Unit #2033 가리다 (Action Verb) - "to cover, conceal, hide, shield"
- **Status:** ISSUE_DETECTED
- **Reproducing Command:** `node exhaustive.js --id 2033 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2033.txt`
- **Seed:** `1793700600000`
- **Generation Sample (Offending Variations):**
  - *Var 1:* `사나이는 스크린도어를 가려요.`
  - **Linguistic Error:** Semantic argument corruption: Abstract noun '나이' (age, Unit 250) misattributed as human subject/object/recipient due to carrying the 'person' tag in data.js.
  - **Suggested Remediation:** Re-tag Unit 250 from 'person' to 'person_attribute' in data.js.

### Unit #2040 미치다 (Action Verb) - "to go crazy, go mad, be enthusiastic"
- **Status:** CLEAN
- **Reproducing Command:** `node exhaustive.js --id 2040 -eng none --ast -sentence 10 --seed 1793700600000 -o scratch/audit/unit_2040.txt`
- **Seed:** `1793700600000`
- **Linguistic Evaluation:** All 10 generated variations demonstrate proper argument valency, accurate regular/irregular morphological conjugation, and natural semantic collocation without selection restriction errors.

