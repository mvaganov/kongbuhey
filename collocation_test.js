#!/usr/bin/env node
/**
 * collocation_test.js - Feature 1: Selectional Restriction & Verb-Noun Collocation Matrix Test Suite
 *
 * Validates that:
 *  1. Action verbs only collocate with semantically compatible direct object nouns.
 *  2. Cross-domain semantic mismatches (e.g. *컴퓨터를 입다, *구두를 먹다, *사과를 타다) are strictly impossible.
 *  3. Executable JavaScript collocation filters embedded in SemanticVector execute correctly.
 *  4. Correct accusative/locative particle attachment (을/를, 에, 에게) is maintained with batchim concord.
 *  5. Both buildActionVerbPhrase and getTokenOptions (VP_AVst) produce 100% semantically valid phrases.
 *
 * Usage:
 *   node collocation_test.js
 */

const {
	KR_EN_languageUnits,
	DATA_SCHEMA,
	getWords,
	hasTag
} = require('./data.js');

const {
	getNounCandidatesForVerb,
	getVerbParticleType,
	buildActionVerbPhrase,
	getTokenOptions,
	getStem,
	hasBatchim,
	parseSemanticVector,
	parseAndValidateCollocationFilter
} = require('./korean.js');

const KoreanWord = DATA_SCHEMA.Korean;
const EnglishDef = DATA_SCHEMA.English;
const Idx = DATA_SCHEMA.Id;

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

console.log("======================================================");
console.log("    FEATURE 1: VERB-NOUN COLLOCATION MATRIX TEST     ");
console.log("======================================================\n");

// -----------------------------------------------------------------------------
// [Suite 1] Apparel Donning & Doffing Collocations
// -----------------------------------------------------------------------------
console.log("[1/5] Apparel Donning & Doffing Collocations");

const wearBody = KR_EN_languageUnits[153]; // 입다
const wearShoes = KR_EN_languageUnits[756]; // 신다
const wearHead = KR_EN_languageUnits[757]; // 쓰다 (wear on head)
const wearHead2 = KR_EN_languageUnits[1036]; // 쓰다 (wear hat/glasses)
const wearHand = KR_EN_languageUnits[1565]; // 끼다 (gloves, ring)
const wearNeck = KR_EN_languageUnits[1477]; // 매다 (tie, scarf)
const wearWatch = KR_EN_languageUnits[1039]; // 차다 (watch)
const removeWear = KR_EN_languageUnits[1190]; // 벗다 (take off)

// 입다 (body clothes only)
const bodyClothesCandidates = getNounCandidatesForVerb(wearBody);
assert(bodyClothesCandidates.length > 0, "입다 has matching noun candidates", `Found ${bodyClothesCandidates.length}`);
assert(bodyClothesCandidates.every(n => hasTag(n, "clothing")), "All 입다 candidates have 'clothing' tag");
assert(bodyClothesCandidates.every(n => !hasTag(n, "footwear")), "입다 never collocates with footwear (신발, 구두)");
assert(bodyClothesCandidates.every(n => !hasTag(n, "food")), "입다 never collocates with food");

// 신다 (footwear only)
const shoesCandidates = getNounCandidatesForVerb(wearShoes);
assert(shoesCandidates.length > 0, "신다 has matching noun candidates", `Found ${shoesCandidates.length}`);
assert(shoesCandidates.every(n => hasTag(n, "footwear")), "All 신다 candidates have 'footwear' tag");
assert(shoesCandidates.every(n => !hasTag(n, "clothing")), "신다 never collocates with body clothes (바지, 치마)");

// 쓰다 (headwear/eyewear only)
const headCandidates = getNounCandidatesForVerb(wearHead);
assert(headCandidates.length > 0, "쓰다 (head) has matching noun candidates", `Found ${headCandidates.length}`);
assert(headCandidates.every(n => hasTag(n, "headwear")), "All 쓰다 (head) candidates have 'headwear' tag");
const headCandidates2 = getNounCandidatesForVerb(wearHead2);
assert(headCandidates2.every(n => hasTag(n, "headwear")), "All 쓰다 (1036) candidates have 'headwear' tag");

// 끼다 (handwear: gloves, ring)
const handCandidates = getNounCandidatesForVerb(wearHand);
assert(handCandidates.length > 0, "끼다 has matching noun candidates", `Found ${handCandidates.length}`);
assert(handCandidates.every(n => hasTag(n, "handwear")), "All 끼다 candidates have 'handwear' tag (장갑, 반지)");

// 매다 (neckwear: tie, scarf)
const neckCandidates = getNounCandidatesForVerb(wearNeck);
assert(neckCandidates.length > 0, "매다 has matching noun candidates", `Found ${neckCandidates.length}`);
assert(neckCandidates.every(n => hasTag(n, "neckwear")), "All 매다 candidates have 'neckwear' tag (넥타이, 목걸이)");

// 차다 (watch)
const wristwatchCandidates = getNounCandidatesForVerb(wearWatch);
assert(wristwatchCandidates.length > 0, "차다 has matching noun candidates", `Found ${wristwatchCandidates.length}`);
assert(wristwatchCandidates.every(n => hasTag(n, "watch")), "All 차다 candidates have 'watch' tag (시계)");

// 벗다 (universal wearable removal)
const unwearCandidates = getNounCandidatesForVerb(removeWear);
assert(unwearCandidates.length > 0, "벗다 has matching noun candidates", `Found ${unwearCandidates.length}`);
assert(unwearCandidates.every(n => hasTag(n, "wearable")), "All 벗다 candidates have 'wearable' tag");
assert(unwearCandidates.some(n => hasTag(n, "clothing")), "벗다 can remove clothing (옷, 바지)");
assert(unwearCandidates.some(n => hasTag(n, "footwear")), "벗다 can remove footwear (신발, 구두)");
assert(unwearCandidates.some(n => hasTag(n, "headwear")), "벗다 can remove headwear (모자, 선글라스)");

// -----------------------------------------------------------------------------
// [Suite 2] Consumption Collocations (Food vs Drink vs Medicine)
// -----------------------------------------------------------------------------
console.log("\n[2/5] Consumption Collocations (Food vs Drink vs Medicine)");

const eatVerb = KR_EN_languageUnits[40]; // 먹다
const drinkVerb = KR_EN_languageUnits[41]; // 마시다

const eatCandidates = getNounCandidatesForVerb(eatVerb);
assert(eatCandidates.length > 0, "먹다 has matching noun candidates", `Found ${eatCandidates.length}`);
assert(eatCandidates.every(n => hasTag(n, "food") || hasTag(n, "medicine")), "All 먹다 candidates are food or medicine");
assert(eatCandidates.every(n => !hasTag(n, "clothing")), "먹다 never takes clothing (*옷을 먹다)");
assert(eatCandidates.every(n => !hasTag(n, "vehicle")), "먹다 never takes vehicle (*버스를 먹다)");

const drinkCandidates = getNounCandidatesForVerb(drinkVerb);
assert(drinkCandidates.length > 0, "마시다 has matching noun candidates", `Found ${drinkCandidates.length}`);
assert(drinkCandidates.every(n => hasTag(n, "drink")), "All 마시다 candidates have 'drink' tag");
assert(drinkCandidates.every(n => !hasTag(n, "medicine")), "마시다 never takes medicine (in Korean medicine is strictly 먹다)");
assert(drinkCandidates.every(n => n[KoreanWord] !== "사과"), "마시다 never takes solid food like 사과 (*사과를 마시다)");

// -----------------------------------------------------------------------------
// [Suite 3] Media, Arts, Expression & Sports Collocations
// -----------------------------------------------------------------------------
console.log("\n[3/5] Media, Arts, Expression & Sports Collocations");

const readVerb = KR_EN_languageUnits[152]; // 읽다
const watchVerb = KR_EN_languageUnits[149]; // 보다
const listenVerb = KR_EN_languageUnits[147]; // 듣다
const singVerb = KR_EN_languageUnits[616]; // 부르다
const writeVerb = KR_EN_languageUnits[151]; // 쓰다 (write)
const driveVerb = KR_EN_languageUnits[233]; // 운전하다
const rideVerb = KR_EN_languageUnits[397]; // 타다
const playVerb = KR_EN_languageUnits[396]; // 치다
const playVerb2 = KR_EN_languageUnits[1486]; // 치다 (1486)

// 읽다 (reading material only)
const readCandidates = getNounCandidatesForVerb(readVerb);
assert(readCandidates.length > 0, "읽다 has matching noun candidates", `Found ${readCandidates.length}`);
assert(readCandidates.every(n => hasTag(n, "reading")), "All 읽다 candidates have 'reading' tag (책, 신문, 잡지, 교과서, 만화책)");

// 보다 (visual media)
const visualCandidates = getNounCandidatesForVerb(watchVerb);
assert(visualCandidates.length > 0, "보다 has matching noun candidates", `Found ${visualCandidates.length}`);
assert(visualCandidates.every(n => hasTag(n, "visual_media")), "All 보다 candidates have 'visual_media' tag (영화, 드라마, 뉴스, 텔레비전)");

// 듣다 (audio/music)
const listenCandidates = getNounCandidatesForVerb(listenVerb);
assert(listenCandidates.length > 0, "듣다 has matching noun candidates", `Found ${listenCandidates.length}`);
assert(listenCandidates.every(n => hasTag(n, "audio")), "All 듣다 candidates have 'audio' tag (음악, 소리, 노래)");

// 부르다 (song)
const singCandidates = getNounCandidatesForVerb(singVerb);
assert(singCandidates.length > 0, "부르다 has matching noun candidates", `Found ${singCandidates.length}`);
assert(singCandidates.every(n => hasTag(n, "song")), "All 부르다 candidates have 'song' tag (노래)");

// 쓰다 (written documents)
const writeCandidates = getNounCandidatesForVerb(writeVerb);
assert(writeCandidates.length > 0, "쓰다 (write) has matching noun candidates", `Found ${writeCandidates.length}`);
assert(writeCandidates.every(n => hasTag(n, "writing")), "All 쓰다 (write) candidates have 'writing' tag (이메일, 메모, 답장, 엽서)");

// 운전하다 (vehicles)
const driveCandidates = getNounCandidatesForVerb(driveVerb);
assert(driveCandidates.length > 0, "운전하다 has matching noun candidates", `Found ${driveCandidates.length}`);
assert(driveCandidates.every(n => hasTag(n, "vehicle")), "All 운전하다 candidates have 'vehicle' tag");

// 타다 (vehicle / transportation)
const rideCandidates = getNounCandidatesForVerb(rideVerb);
assert(rideCandidates.length > 0, "타다 has matching noun candidates", `Found ${rideCandidates.length}`);
assert(rideCandidates.every(n => hasTag(n, "vehicle")), "All 타다 candidates have 'vehicle' tag (지하철, 택시, 버스, 기차, 배, 비행기, 자전거, 차)");
assert(rideCandidates.every(n => n[KoreanWord] !== "택배" && n[KoreanWord] !== "교통카드"), "타다 never takes non-vehicle items like 택배 or 교통카드");

// 치다 (racket/cue sports or musical instruments)
const playCandidates = getNounCandidatesForVerb(playVerb);
assert(playCandidates.length > 0, "치다 (396) has matching noun candidates", `Found ${playCandidates.length}`);
assert(playCandidates.every(n => hasTag(n, "racketSports") || hasTag(n, "instrument")), "치다 (396) strictly takes racketSports or instrument");
assert(playCandidates.every(n => n[KoreanWord] !== "축구" && n[KoreanWord] !== "농구"), "치다 never takes 축구 or 농구 (*축구를 치다)");

const playCandidates2 = getNounCandidatesForVerb(playVerb2);
assert(playCandidates2.length > 0, "치다 (1486) has matching noun candidates", `Found ${playCandidates2.length}`);
assert(playCandidates2.every(n => hasTag(n, "racketSports") || hasTag(n, "instrument")), "치다 (1486) strictly takes racketSports or instrument");

// -----------------------------------------------------------------------------
// [Suite 4] Hygiene & Chore Collocations
// -----------------------------------------------------------------------------
console.log("\n[4/5] Hygiene & Chore Collocations");

const brushTeeth = KR_EN_languageUnits[360]; // 닦다
const washBody = KR_EN_languageUnits[1302]; // 씻다
const cleanRoom = KR_EN_languageUnits[399]; // 청소하다

const teethCandidates = getNounCandidatesForVerb(brushTeeth);
assert(teethCandidates.length > 0, "닦다 has matching noun candidates", `Found ${teethCandidates.length}`);
assert(teethCandidates.every(n => hasTag(n, "teeth")), "닦다 strictly takes teeth (이)");

const washCandidates = getNounCandidatesForVerb(washBody);
assert(washCandidates.length > 0, "씻다 has matching noun candidates", `Found ${washCandidates.length}`);
assert(washCandidates.every(n => hasTag(n, "bodyPart")), "씻다 strictly takes body parts (손, 발, 얼굴)");

const cleanCandidates = getNounCandidatesForVerb(cleanRoom);
assert(cleanCandidates.length > 0, "청소하다 has matching noun candidates", `Found ${cleanCandidates.length}`);
assert(cleanCandidates.every(n => hasTag(n, "room")), "청소하다 strictly takes rooms (방, 집, 사무실, 화장실)");

// -----------------------------------------------------------------------------
// [Suite 5] Phrase Generation & Morphological Particle Validation
// -----------------------------------------------------------------------------
console.log("\n[5/5] Phrase Generation & Batchim Particle Concord");

const sampleVerbs = [wearBody, wearShoes, wearHead, eatVerb, drinkVerb, readVerb, watchVerb, rideVerb, playVerb, washBody];

sampleVerbs.forEach(v => {
	const stem = getStem(v[KoreanWord]);
	for (let i = 0; i < 5; i++) {
		const phrase = buildActionVerbPhrase(v, stem);
		assert(phrase && phrase.text, `buildActionVerbPhrase successfully generates phrase for ${v[KoreanWord]}`, phrase ? phrase.text : "null");
		assert(phrase.noun !== null, `${v[KoreanWord]} phrase selected a valid direct object noun`);

		// Verify particle attachment conforms to batchim
		if (phrase && phrase.noun) {
			const nKo = phrase.noun[KoreanWord];
			const hasB = hasBatchim(nKo.slice(-1));
			const expectedParticle = hasB ? "을" : "를";
			assert(phrase.text.startsWith(nKo + expectedParticle), `Accusative particle concord: '${nKo}' + '${expectedParticle}' in "${phrase.text}"`);
		}
	}
});

// Verify VP_AVst token option generation
const vpOptions = getTokenOptions({ type: "VP_AVst" }, 0);
assert(vpOptions.length > 0, "getTokenOptions('VP_AVst') returns valid options", `Found ${vpOptions.length} options`);
vpOptions.forEach(opt => {
	assert(opt.text && opt.units.length >= 1, `VP option is valid: "${opt.text}"`);
});

// -----------------------------------------------------------------------------
// [Suite 6] Header Validation & Language Security Check (collocation_filter)
// -----------------------------------------------------------------------------
console.log("\n[6/6] Header Validation & Language Security Check (collocation_filter)");

// 1. Valid /*js:filter*/ header
let parsed = parseAndValidateCollocationFilter("/*js:filter*/ (n, hasTag) => hasTag(n, 'food')", 40);
assert(parsed.lang === "js", "Valid /*js:filter*/ extracts lang 'js'");
assert(parsed.subtype === "filter", "Valid /*js:filter*/ extracts subtype 'filter'");
assert(parsed.code.includes("hasTag"), "Valid /*js:filter*/ extracts code body");

// 2. Valid /*js*/ header without subtype
let parsedSimple = parseAndValidateCollocationFilter("/*js*/ (n) => true", 9999);
assert(parsedSimple.lang === "js", "Valid /*js*/ extracts lang 'js'");
assert(parsedSimple.code === "(n) => true", "Valid /*js*/ extracts code body");

// 3. Rejects missing header comment
let missingHeaderThrew = false;
try {
	parseAndValidateCollocationFilter("(n, hasTag) => hasTag(n, 'food')", 40);
} catch (e) {
	missingHeaderThrew = e.message.includes("missing or malformed header comment");
}
assert(missingHeaderThrew, "Throws error when header comment is missing");

// 4. Rejects non-JavaScript headers (e.g. python, regex, dsl)
let nonJsThrew = false;
let nonJsErrorMsg = "";
try {
	parseAndValidateCollocationFilter("/*python:filter*/ (n, hasTag) => True", 40);
} catch (e) {
	nonJsThrew = true;
	nonJsErrorMsg = e.message;
}
assert(nonJsThrew && nonJsErrorMsg.includes("Unsupported collocation_filter language 'python'"), "Throws error for non-js header (/*python:filter*/)");

let regexHeaderThrew = false;
try {
	parseAndValidateCollocationFilter("/*regex:filter*/ /^(손|발)$/", 1302);
} catch (e) {
	regexHeaderThrew = e.message.includes("Unsupported collocation_filter language 'regex'");
}
assert(regexHeaderThrew, "Throws error for unsupported non-js header (/*regex:filter*/)");

// 5. Rejects empty code body
let emptyBodyThrew = false;
try {
	parseAndValidateCollocationFilter("/*js:filter*/    ", 40);
} catch (e) {
	emptyBodyThrew = e.message.includes("Empty code body");
}
assert(emptyBodyThrew, "Throws error when code body is empty");

// 6. Graceful fallback on unit with invalid header in getNounCandidatesForVerb without crashing
const mockInvalidUnit = [
	9998, "테스트하다", "to test", "Action Verb", ["transitive_general"], "", "hada", "TEST", 1, "", "",
	JSON.stringify({ domain: "action", req: "object", collocation_filter: "/*unsupported:engine*/ n => true" }), ""
];
const candidates = getNounCandidatesForVerb(mockInvalidUnit);
assert(Array.isArray(candidates) && candidates.length > 0, "getNounCandidatesForVerb gracefully falls back when filter header is invalid");

// -----------------------------------------------------------------------------
// Summary
// -----------------------------------------------------------------------------
console.log("\n======================================================");
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log("======================================================");

if (failedTests > 0) {
	process.exit(1);
} else {
	console.log("\n>>> FEATURE 1 (COLLOCATION MATRIX) 100% VALIDATED! <<<\n");
	process.exit(0);
}
