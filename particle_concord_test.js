#!/usr/bin/env node
/**
 * particle_concord_test.js - Feature 3: Case Particle Semantic Specialization Test Suite
 *
 * Validates:
 *  1. Locative Duality:
 *     - Destination / Goal / Static existence strictly takes '-에' (학교에 가다, 집에 있다).
 *     - Origin / Departure strictly takes '-에서' (역에서 출발하다, 버스에서 내리다).
 *     - Dynamic activity site strictly takes '-에서' (식당에서 먹다, 도서관에서 공부하다).
 *     - Cross-locative violations (*식당에 밥을 먹다, *서울역에 출발하다) are strictly impossible.
 *  2. Dative Animacy & Respect:
 *     - Respected elders & humble verbs strictly take '-께' (선생님께 드리다, 부모님께 여쭙다).
 *     - Inanimate institutions/locations strictly take '-에' (회사에 전화하다, 은행에 보내다).
 *     - Animate non-elder humans/animals take '-에게' (formal) or '-한테' (spoken).
 *     - Cross-animacy violations (*회사에게 전화하다, *선생님에게 드리다) are strictly impossible.
 *  3. Instrumental '-(으)로':
 *     - Coda 'ㄹ' exception strictly takes '-로' (지하철로, 연필로; never *지하철으로).
 *     - Vowel coda strictly takes '-로' (버스로, 한국어로).
 *     - Non-ㄹ consonant coda strictly takes '-으로' (젓가락으로, 손으로).
 *  4. Comitative & Ablative Concord:
 *     - Formal -와/과, spoken -하고, informal -(이)랑.
 *     - Person source -에게서 / -한테서.
 *  5. Phrase Builders & Token Option Integration:
 *     - buildActionVerbPhrase & getTokenOptions('VP_AVst') generate 100% valid case particles.
 *
 * Usage:
 *   node particle_concord_test.js
 */

const {
	KR_EN_languageUnits,
	DATA_SCHEMA,
	getWords,
	hasTag
} = require('./data.js');

const {
	attachParticle,
	hasRieulBatchim,
	hasBatchim,
	buildActionVerbPhrase,
	getTokenOptions,
	getStem
} = require('./korean.js');

const KoreanWord = DATA_SCHEMA.Korean;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message, detail = "") {
	totalTests++;
	if (condition) {
		passedTests++;
	} else {
		failedTests++;
		console.error(`  [FAIL] ${message}`);
		if (detail) console.error(`         Detail: ${detail}`);
	}
}

// Dynamic unit lookup helper
const findUnit = (ko, pos = null) => KR_EN_languageUnits.find(u => u[KoreanWord] === ko && (!pos || u[DATA_SCHEMA.PartofSpeech] === pos));

console.log("======================================================");
console.log("   FEATURE 3: CASE PARTICLE SEMANTIC SPECIALIZATION   ");
console.log("======================================================\n");

// -----------------------------------------------------------------------------
// [Suite 1] Locative Duality: Destination & Static Existence (-에)
// -----------------------------------------------------------------------------
console.log("[1/10] Locative Duality: Destination & Static Existence (-에)");

const schoolUnit = findUnit("학교", "Noun");
const homeUnit = findUnit("집", "Noun");
const roomUnit = findUnit("방", "Noun");
const mountainUnit = findUnit("산", "Noun");
const companyUnit = findUnit("회사", "Noun");

const goVerb = findUnit("가다", "Action Verb");
const comeVerb = findUnit("오다", "Action Verb");
const attendVerb = findUnit("다니다", "Action Verb");
const enterVerb = findUnit("들어가다", "Action Verb");
const climbVerb = findUnit("오르다", "Action Verb");
const existVerb = findUnit("있다");
const liveVerb = findUnit("살다");
const sitVerb = findUnit("앉다");

// Destination / Goal verbs with places
assert(attachParticle(schoolUnit, "location", goVerb) === "학교에", "학교 + 가다 -> 학교에");
assert(attachParticle(homeUnit, "location", comeVerb) === "집에", "집 + 오다 -> 집에");
assert(attachParticle(companyUnit, "location", attendVerb) === "회사에", "회사 + 다니다 -> 회사에");
assert(attachParticle(roomUnit, "location", enterVerb) === "방에", "방 + 들어가다 -> 방에");
assert(attachParticle(mountainUnit, "location", climbVerb) === "산에", "산 + 오르다 -> 산에");

// Static existence / Residence verbs with places
assert(attachParticle(homeUnit, "location", existVerb) === "집에", "집 + 있다 -> 집에");
assert(attachParticle(homeUnit, "location", liveVerb) === "집에", "집 + 살다 -> 집에");
assert(attachParticle("의자", "location", sitVerb) === "의자에", "의자 + 앉다 -> 의자에");

// Explicit goal/destination type override
assert(attachParticle("한국", "location", null, { locativeType: "goal" }) === "한국에", "Explicit goal type -> 한국에");
assert(attachParticle("도서관", "location_goal") === "도서관에", "location_goal -> 도서관에");
assert(attachParticle("방", "location_static") === "방에", "location_static -> 방에");

// Negative assertions
assert(attachParticle(schoolUnit, "location", goVerb) !== "학교에서", "학교 + 가다 NEVER produces *학교에서");
assert(attachParticle(homeUnit, "location", existVerb) !== "집에서", "집 + 있다 NEVER produces *집에서");

// -----------------------------------------------------------------------------
// [Suite 2] Locative Duality: Origin & Departure (-에서)
// -----------------------------------------------------------------------------
console.log("\n[2/10] Locative Duality: Origin & Departure (-에서)");

const stationUnit = findUnit("역", "Noun");
const busUnit = findUnit("버스", "Noun");
const airportUnit = findUnit("공항", "Noun");
const departVerb = findUnit("출발하다", "Action Verb");
const alightVerb = findUnit("내리다", "Action Verb");
const leaveCountryVerb = findUnit("출국하다", "Action Verb");
const exitVerb = findUnit("나가다", "Action Verb");
const bornVerb = findUnit("태어나다", "Action Verb");

assert(attachParticle(stationUnit, "location", departVerb) === "역에서", "역 + 출발하다 -> 역에서");
assert(attachParticle("서울역", "location", departVerb) === "서울역에서", "서울역 + 출발하다 -> 서울역에서");
assert(attachParticle(busUnit, "location", alightVerb) === "버스에서", "버스 + 내리다 -> 버스에서");
assert(attachParticle(airportUnit, "location", leaveCountryVerb) === "공항에서", "공항 + 출국하다 -> 공항에서");
assert(attachParticle(roomUnit, "location", exitVerb) === "방에서", "방 + 나가다 -> 방에서");
assert(attachParticle("한국", "location", bornVerb) === "한국에서", "한국 + 태어나다 -> 한국에서");

// Explicit origin type override
assert(attachParticle("서울", "location", null, { locativeType: "origin" }) === "서울에서", "Explicit origin type -> 서울에서");
assert(attachParticle("고향", "location_origin") === "고향에서", "location_origin -> 고향에서");

// Negative assertions
assert(attachParticle("서울역", "location", departVerb) !== "서울역에", "서울역 + 출발하다 NEVER produces *서울역에");
assert(attachParticle(busUnit, "location", alightVerb) !== "버스에", "버스 + 내리다 NEVER produces *버스에");

// -----------------------------------------------------------------------------
// [Suite 3] Locative Duality: Dynamic Activity Site (-에서)
// -----------------------------------------------------------------------------
console.log("\n[3/10] Locative Duality: Dynamic Activity Site (-에서)");

const restaurantUnit = findUnit("식당", "Noun");
const libraryUnit = findUnit("도서관", "Noun");
const cafeUnit = findUnit("카페", "Noun");
const parkUnit = findUnit("공원", "Noun");
const hotelUnit = findUnit("호텔", "Noun");
const marketUnit = findUnit("시장", "Noun");

const eatVerb = findUnit("먹다", "Action Verb");
const studyVerb = findUnit("공부하다", "Action Verb");
const meetVerb = findUnit("만나다", "Action Verb");
const jogVerb = findUnit("조깅하다", "Action Verb");
const lodgeVerb = findUnit("숙박하다", "Action Verb");
const buyVerb = findUnit("사다", "Action Verb");
const restVerb = findUnit("쉬다", "Action Verb");
const workVerb = findUnit("일하다", "Action Verb");

assert(attachParticle(restaurantUnit, "location", eatVerb) === "식당에서", "식당 + 먹다 -> 식당에서");
assert(attachParticle(libraryUnit, "location", studyVerb) === "도서관에서", "도서관 + 공부하다 -> 도서관에서");
assert(attachParticle(companyUnit, "location", workVerb) === "회사에서", "회사 + 일하다 -> 회사에서");
assert(attachParticle(cafeUnit, "location", meetVerb) === "카페에서", "카페 + 만나다 -> 카페에서");
assert(attachParticle(parkUnit, "location", jogVerb) === "공원에서", "공원 + 조깅하다 -> 공원에서");
assert(attachParticle(hotelUnit, "location", lodgeVerb) === "호텔에서", "호텔 + 숙박하다 -> 호텔에서");
assert(attachParticle(marketUnit, "location", buyVerb) === "시장에서", "시장 + 사다 -> 시장에서");
assert(attachParticle(homeUnit, "location", restVerb) === "집에서", "집 + 쉬다 -> 집에서");

// Explicit dynamic type override
assert(attachParticle("피시방", "location", null, { locativeType: "dynamic" }) === "피시방에서", "Explicit dynamic type -> 피시방에서");
assert(attachParticle("노래방", "location_dynamic") === "노래방에서", "location_dynamic -> 노래방에서");

// Negative assertions: Dynamic activity site never takes -에
assert(attachParticle(restaurantUnit, "location", eatVerb) !== "식당에", "식당 + 먹다 NEVER produces *식당에");
assert(attachParticle(libraryUnit, "location", studyVerb) !== "도서관에", "도서관 + 공부하다 NEVER produces *도서관에");
assert(attachParticle(parkUnit, "location", jogVerb) !== "공원에", "공원 + 조깅하다 NEVER produces *공원에");
assert(attachParticle(hotelUnit, "location", lodgeVerb) !== "호텔에", "호텔 + 숙박하다 NEVER produces *호텔에");

// -----------------------------------------------------------------------------
// [Suite 4] Dative Animacy & Respect: Respected Elders (-께)
// -----------------------------------------------------------------------------
console.log("\n[4/10] Dative Animacy & Respect: Respected Elders (-께)");

const teacherUnit = findUnit("선생님", "Noun");
const parentsUnit = findUnit("부모님", "Noun");
const fatherUnit = findUnit("아버지", "Noun");
const motherUnit = findUnit("어머니", "Noun");
const grandpaUnit = findUnit("할아버지", "Noun");
const grandmaUnit = findUnit("할머니", "Noun");

const giveHumble = findUnit("드리다", "Action Verb");
const tellHumble = findUnit("말씀드리다", "Action Verb");
const askHumble = findUnit("여쭙다", "Action Verb");
const greetHumble = findUnit("인사드리다", "Action Verb");
const callHumble = findUnit("전화드리다", "Action Verb");
const generalCall = findUnit("전화하다", "Action Verb");
const generalAsk = findUnit("묻다", "Action Verb");

// Respected elder nouns taking dative
assert(attachParticle(teacherUnit, "dative", giveHumble) === "선생님께", "선생님 + 드리다 -> 선생님께");
assert(attachParticle(parentsUnit, "dative", tellHumble) === "부모님께", "부모님 + 말씀드리다 -> 부모님께");
assert(attachParticle("교수님", "dative", askHumble) === "교수님께", "교수님 + 여쭙다 -> 교수님께");
assert(attachParticle(grandmaUnit, "dative", giveHumble) === "할머니께", "할머니 + 드리다 -> 할머니께");
assert(attachParticle(fatherUnit, "dative", callHumble) === "아버지께", "아버지 + 전화드리다 -> 아버지께");
assert(attachParticle(motherUnit, "dative", greetHumble) === "어머니께", "어머니 + 인사드리다 -> 어머니께");

// Elder nouns with general verbs also take -께
assert(attachParticle(teacherUnit, "dative", generalCall) === "선생님께", "선생님 + 전화하다 -> 선생님께");
assert(attachParticle(parentsUnit, "dative", generalAsk) === "부모님께", "부모님 + 묻다 -> 부모님께");

// Explicit dative_honorific override
assert(attachParticle("어르신", "dative_honorific") === "어르신께", "dative_honorific -> 어르신께");
assert(attachParticle("선배", "dative", null, { honorific: true }) === "선배께", "dative + { honorific: true } -> 선배께");

// Negative assertions
assert(attachParticle(teacherUnit, "dative", giveHumble) !== "선생님에게", "선생님 + 드리다 NEVER produces *선생님에게");
assert(attachParticle(parentsUnit, "dative", tellHumble) !== "부모님한테", "부모님 + 말씀드리다 NEVER produces *부모님한테");

// -----------------------------------------------------------------------------
// [Suite 5] Dative Animacy & Respect: Inanimate Institutions (-에)
// -----------------------------------------------------------------------------
console.log("\n[5/10] Dative Animacy & Respect: Inanimate Institutions (-에)");

const bankUnit = findUnit("은행", "Noun");
const hospitalUnit = findUnit("병원", "Noun");
const postOfficeUnit = findUnit("우체국", "Noun");

const sendVerb = findUnit("보내다", "Action Verb");
const contactVerb = findUnit("연락하다", "Action Verb");

assert(attachParticle(companyUnit, "dative", generalCall) === "회사에", "회사 + 전화하다 -> 회사에");
assert(attachParticle(bankUnit, "dative", sendVerb) === "은행에", "은행 + 보내다 -> 은행에");
assert(attachParticle(schoolUnit, "dative", generalCall) === "학교에", "학교 + 전화하다 -> 학교에");
assert(attachParticle(hospitalUnit, "dative", contactVerb) === "병원에", "병원 + 연락하다 -> 병원에");
assert(attachParticle(postOfficeUnit, "dative", sendVerb) === "우체국에", "우체국 + 보내다 -> 우체국에");

// Explicit dative_inanimate override
assert(attachParticle("시청", "dative_inanimate") === "시청에", "dative_inanimate -> 시청에");
assert(attachParticle("경찰서", "dative", null, { dativeType: "inanimate" }) === "경찰서에", "dative + { dativeType: 'inanimate' } -> 경찰서에");

// Negative assertions: Inanimate institutions strictly NEVER take -에게 or -한테
assert(attachParticle(companyUnit, "dative", generalCall) !== "회사에게", "회사 + 전화하다 NEVER produces *회사에게");
assert(attachParticle(bankUnit, "dative", sendVerb) !== "은행에게", "은행 + 보내다 NEVER produces *은행에게");
assert(attachParticle(schoolUnit, "dative", generalCall) !== "학교한테", "학교 + 전화하다 NEVER produces *학교한테");

// -----------------------------------------------------------------------------
// [Suite 6] Dative Animacy & Respect: Animate Non-Elders (-에게 vs -한테)
// -----------------------------------------------------------------------------
console.log("\n[6/10] Dative Animacy & Respect: Animate Non-Elders (-에게 vs -한테)");

const friendUnit = findUnit("친구", "Noun");
const studentUnit = findUnit("학생", "Noun");
const youngerBrother = findUnit("남동생", "Noun");
const dogUnit = findUnit("강아지", "Noun");
const giveVerb = findUnit("주다", "Action Verb");
const teachVerb = findUnit("가르치다", "Action Verb");

// Formal / Written mode (-에게)
assert(attachParticle(friendUnit, "dative", giveVerb) === "친구에게", "친구 + 주다 -> 친구에게");
assert(attachParticle(youngerBrother, "dative", generalCall) === "남동생에게", "남동생 + 전화하다 -> 남동생에게");
assert(attachParticle(studentUnit, "dative", teachVerb) === "학생에게", "학생 + 가르치다 -> 학생에게");
assert(attachParticle(dogUnit, "dative", giveVerb) === "강아지에게", "강아지 + 주다 -> 강아지에게");
assert(attachParticle("고양이", "dative", giveVerb) === "고양이에게", "고양이 + 주다 -> 고양이에게");

// Spoken / Colloquial mode (-한테)
assert(attachParticle(friendUnit, "dative", giveVerb, { spoken: true }) === "친구한테", "친구 + 주다 { spoken: true } -> 친구한테");
assert(attachParticle(youngerBrother, "dative", generalCall, { formality: "spoken" }) === "남동생한테", "남동생 + 전화하다 { formality: 'spoken' } -> 남동생한테");
assert(attachParticle("아이", "dative_spoken") === "아이한테", "dative_spoken -> 아이한테");

// Negative assertions
assert(attachParticle(friendUnit, "dative", giveVerb) !== "친구에", "친구 + 주다 NEVER produces *친구에");
assert(attachParticle(youngerBrother, "dative", generalCall) !== "남동생에", "남동생 + 전화하다 NEVER produces *남동생에");

// -----------------------------------------------------------------------------
// [Suite 7] Instrumental -(으)로 Batchim & Coda ㄹ Exception Concord
// -----------------------------------------------------------------------------
console.log("\n[7/10] Instrumental -(으)로 Batchim & Coda ㄹ Exception Concord");

const subwayUnit = findUnit("지하철", "Noun");
const pencilUnit = findUnit("연필", "Noun");
const chopsticksUnit = findUnit("젓가락", "Noun");
const handUnit = findUnit("손", "Noun");
const koreanLangUnit = findUnit("한국어", "Noun");

// 1. Coda ㄹ Exception: strictly takes -로 (never -으로)
assert(hasRieulBatchim("철"), "철 has coda ㄹ");
assert(hasRieulBatchim("필"), "필 has coda ㄹ");
assert(attachParticle(subwayUnit, "instrumental") === "지하철로", "지하철 (coda ㄹ) -> 지하철로");
assert(attachParticle(pencilUnit, "instrumental") === "연필로", "연필 (coda ㄹ) -> 연필로");
assert(attachParticle("칼", "instrumental") === "칼로", "칼 (coda ㄹ) -> 칼로");
assert(attachParticle("이메일", "instrumental") === "이메일로", "이메일 (coda ㄹ) -> 이메일로");

assert(attachParticle(subwayUnit, "instrumental") !== "지하철으로", "지하철 NEVER produces *지하철으로");
assert(attachParticle(pencilUnit, "instrumental") !== "연필으로", "연필 NEVER produces *연필으로");

// 2. Vowel Coda: strictly takes -로
assert(!hasBatchim("스"), "스 has no batchim");
assert(!hasBatchim("어"), "어 has no batchim");
assert(attachParticle(busUnit, "instrumental") === "버스로", "버스 (vowel) -> 버스로");
assert(attachParticle(koreanLangUnit, "instrumental") === "한국어로", "한국어 (vowel) -> 한국어로");
assert(attachParticle("자전거", "instrumental") === "자전거로", "자전거 (vowel) -> 자전거로");
assert(attachParticle("택시", "instrumental") === "택시로", "택시 (vowel) -> 택시로");
assert(attachParticle("비행기", "instrumental") === "비행기로", "비행기 (vowel) -> 비행기로");
assert(attachParticle("배", "instrumental") === "배로", "배 (vowel) -> 배로");

assert(attachParticle(busUnit, "instrumental") !== "버스으로", "버스 NEVER produces *버스으로");

// 3. Non-ㄹ Consonant Coda: strictly takes -으로
assert(hasBatchim("락") && !hasRieulBatchim("락"), "락 has non-ㄹ batchim");
assert(hasBatchim("손") && !hasRieulBatchim("손"), "손 has non-ㄹ batchim");
assert(attachParticle(chopsticksUnit, "instrumental") === "젓가락으로", "젓가락 (coda ㄱ) -> 젓가락으로");
assert(attachParticle(handUnit, "instrumental") === "손으로", "손 (coda ㄴ) -> 손으로");
assert(attachParticle("인터넷", "instrumental") === "인터넷으로", "인터넷 (coda ㅅ) -> 인터넷으로");
assert(attachParticle("오른쪽", "instrumental") === "오른쪽으로", "오른쪽 (coda ㄱ) -> 오른쪽으로");
assert(attachParticle("왼쪽", "instrumental") === "왼쪽으로", "왼쪽 (coda ㄱ) -> 왼쪽으로");
assert(attachParticle("볼펜", "instrumental") === "볼펜으로", "볼펜 (coda ㄴ) -> 볼펜으로");

assert(attachParticle(chopsticksUnit, "instrumental") !== "젓가락로", "젓가락 NEVER produces *젓가락로");
assert(attachParticle(handUnit, "instrumental") !== "손로", "손 NEVER produces *손로");

// -----------------------------------------------------------------------------
// [Suite 8] Comitative Concord (-와/과, -하고, -(이)랑)
// -----------------------------------------------------------------------------
console.log("\n[8/10] Comitative Concord (-와/과, -하고, -(이)랑)");

// Written / Formal: vowel -> -와, batchim -> -과
assert(attachParticle(friendUnit, "comitative") === "친구와", "친구 (vowel) -> 친구와");
assert(attachParticle(teacherUnit, "comitative") === "선생님과", "선생님 (batchim) -> 선생님과");
assert(attachParticle(youngerBrother, "comitative") === "남동생과", "남동생 (batchim) -> 남동생과");
assert(attachParticle("사과", "comitative") === "사과와", "사과 (vowel) -> 사과와");

// Spoken: invariable -하고
assert(attachParticle(friendUnit, "comitative", null, { spoken: true }) === "친구하고", "친구 + { spoken: true } -> 친구하고");
assert(attachParticle(teacherUnit, "comitative", null, { spoken: true }) === "선생님하고", "선생님 + { spoken: true } -> 선생님하고");

// Informal: vowel -> -랑, batchim -> -이랑
assert(attachParticle(friendUnit, "comitative", null, { formality: "informal" }) === "친구랑", "친구 + { informal } -> 친구랑");
assert(attachParticle(teacherUnit, "comitative", null, { formality: "informal" }) === "선생님이랑", "선생님 + { informal } -> 선생님이랑");

// -----------------------------------------------------------------------------
// [Suite 9] Person Source Ablative (-에게서/-한테서) & Subject Honorific (-께서)
// -----------------------------------------------------------------------------
console.log("\n[9/10] Person Source Ablative (-에게서/-한테서) & Subject Honorific (-께서)");

assert(attachParticle(friendUnit, "source_person") === "친구에게서", "친구 source_person -> 친구에게서");
assert(attachParticle(friendUnit, "source_person", null, { spoken: true }) === "친구한테서", "친구 source_person { spoken } -> 친구한테서");
assert(attachParticle(parentsUnit, "source_person") === "부모님에게서", "부모님 source_person -> 부모님에게서");

assert(attachParticle(teacherUnit, "subject_honorific") === "선생님께서", "선생님 subject_honorific -> 선생님께서");
assert(attachParticle(parentsUnit, "subject_honorific") === "부모님께서", "부모님 subject_honorific -> 부모님께서");
assert(attachParticle(teacherUnit, "subject", null, { honorific: true }) === "선생님께서", "선생님 subject { honorific: true } -> 선생님께서");

// Standard subject and object
assert(attachParticle(teacherUnit, "subject") === "선생님이", "선생님 subject -> 선생님이");
assert(attachParticle(friendUnit, "subject") === "친구가", "친구 subject -> 친구가");
assert(attachParticle(pencilUnit, "object") === "연필을", "연필 object -> 연필을");
assert(attachParticle("사과", "object") === "사과를", "사과 object -> 사과를");
assert(attachParticle(teacherUnit, "topic") === "선생님은", "선생님 topic -> 선생님은");
assert(attachParticle(friendUnit, "topic") === "친구는", "친구 topic -> 친구는");

// -----------------------------------------------------------------------------
// [Suite 10] Phrase Builders & VP_AVst Token Option Integration
// -----------------------------------------------------------------------------
console.log("\n[10/10] Phrase Builders & VP_AVst Token Option Integration");

// 1. buildActionVerbPhrase with motion verbs attaches correct locative particle
const goPhrase = buildActionVerbPhrase(goVerb, "가요", schoolUnit);
assert(goPhrase && goPhrase.text.startsWith("학교에"), `Destination verb phrase: "${goPhrase.text}"`);

const departPhrase = buildActionVerbPhrase(departVerb, "출발해요", stationUnit);
assert(departPhrase && departPhrase.text.startsWith("역에서"), `Origin verb phrase: "${departPhrase.text}"`);

const jogPhrase = buildActionVerbPhrase(jogVerb, "조깅해요", parkUnit);
assert(jogPhrase && jogPhrase.text.startsWith("공원에서"), `Dynamic verb phrase: "${jogPhrase.text}"`);

// 2. buildActionVerbPhrase with dative verbs attaches correct dative particle
const giveHumblePhrase = buildActionVerbPhrase(giveHumble, "드려요", teacherUnit);
assert(giveHumblePhrase && giveHumblePhrase.text.startsWith("선생님께"), `Humble dative phrase: "${giveHumblePhrase.text}"`);

const callCompanyPhrase = buildActionVerbPhrase(generalCall, "전화해요", companyUnit);
assert(callCompanyPhrase && callCompanyPhrase.text.startsWith("회사에"), `Inanimate dative phrase: "${callCompanyPhrase.text}"`);

const callFriendPhrase = buildActionVerbPhrase(generalCall, "전화해요", friendUnit);
assert(callFriendPhrase && callFriendPhrase.text.startsWith("친구에게"), `Animate dative phrase: "${callFriendPhrase.text}"`);

// 3. getTokenOptions('VP_AVst') produces valid options with zero invalid cross-locatives
const vpAvOptions = getTokenOptions({ type: "VP_AVst" }, 0);
assert(vpAvOptions.length > 0, "getTokenOptions('VP_AVst') returns valid options", `Found ${vpAvOptions.length} options`);

vpAvOptions.forEach(opt => {
	assert(opt.text && opt.units.length >= 1, `VP_AVst option is non-empty: "${opt.text}"`);
	// Origin verbs must take 에서
	if (opt.units.some(u => u[KoreanWord] === "출발하다" || u[KoreanWord] === "출국하다")) {
		assert(opt.text.includes("에서"), `Origin VP option correctly uses -에서: "${opt.text}"`);
	}
	// Humble dative verbs must take 께
	if (opt.units.some(u => u[KoreanWord] === "드리다" || u[KoreanWord] === "말씀드리다" || u[KoreanWord] === "인사드리다")) {
		assert(opt.text.includes("께"), `Humble dative VP option correctly uses -께: "${opt.text}"`);
	}
});

console.log("\n======================================================");
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log("======================================================");

if (failedTests === 0) {
	console.log("\n>>> FEATURE 3 (CASE PARTICLE SPECIALIZATION) 100% VALIDATED! <<<\n");
	process.exit(0);
} else {
	console.error(`\n>>> FEATURE 3 VALIDATION FAILED WITH ${failedTests} ERRORS! <<<\n`);
	process.exit(1);
}
