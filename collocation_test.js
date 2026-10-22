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
	getSubjectCandidatesForDescriptiveVerb,
	getVerbParticleType,
	buildActionVerbPhrase,
	buildDescriptiveVerbPhrase,
	getTokenOptions,
	getStem,
	hasBatchim,
	parseSemanticVector,
	parseAndValidateCollocationFilter,
	DESCRIPTIVE_VERB_SPECS,
	ACTION_VERB_SPECS
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
console.log("    FEATURES 1 & 2: VERB-NOUN & DESCRIPTIVE MATRIX   ");
console.log("======================================================\n");

// -----------------------------------------------------------------------------
// [Suite 1] Apparel Donning & Doffing Collocations
// -----------------------------------------------------------------------------
console.log("[1/13] Apparel Donning & Doffing Collocations");

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

// 끼다 (handwear: gloves, ring - Unit 1565)
const handCandidates = getNounCandidatesForVerb(wearHand);
assert(handCandidates.length > 0, "끼다 (wearable) has matching noun candidates", `Found ${handCandidates.length}`);
assert(handCandidates.every(n => hasTag(n, "handwear")), "All 끼다 (wearable) candidates have 'handwear' tag (장갑, 반지)");
assert(!hasTag(wearHand, "weather"), "Wearable 끼다 (1565) does NOT have 'weather' tag");

// 끼다 (meteorological accumulation: fog, clouds - Unit 1657)
const weatherFogVerb = KR_EN_languageUnits[1657];
assert(weatherFogVerb && weatherFogVerb[KoreanWord] === "끼다", "Unit 1657 is meteorological 끼다");
assert(hasTag(weatherFogVerb, "weather"), "Meteorological 끼다 (1657) has 'weather' tag");
assert(!hasTag(weatherFogVerb, "transitive_handwear"), "Meteorological 끼다 (1657) does NOT have 'transitive_handwear'");
assert(!hasTag(weatherFogVerb, "wearable"), "Meteorological 끼다 (1657) does NOT have 'wearable'");

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
console.log("\n[2/13] Consumption Collocations (Food vs Drink vs Medicine)");

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
console.log("\n[3/13] Media, Arts, Expression & Sports Collocations");

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

// 치다 (sports: 396) vs 치다 (musical instruments: 1486)
const playCandidates = getNounCandidatesForVerb(playVerb);
assert(playCandidates.length > 0, "치다 (396) has matching noun candidates", `Found ${playCandidates.length}`);
assert(playCandidates.every(n => hasTag(n, "racketSports")), "치다 (396) strictly takes racketSports");
assert(playCandidates.every(n => !hasTag(n, "instrument")), "치다 (396) never takes musical instruments");
assert(playCandidates.every(n => n[KoreanWord] !== "축구" && n[KoreanWord] !== "농구"), "치다 never takes 축구 or 농구 (*축구를 치다)");

const playCandidates2 = getNounCandidatesForVerb(playVerb2);
assert(playCandidates2.length > 0, "치다 (1486) has matching noun candidates", `Found ${playCandidates2.length}`);
assert(playCandidates2.every(n => hasTag(n, "instrument")), "치다 (1486) strictly takes instrument");
assert(playCandidates2.every(n => !hasTag(n, "racketSports")), "치다 (1486) never takes racketSports");

// -----------------------------------------------------------------------------
// [Suite 4] Hygiene & Chore Collocations
// -----------------------------------------------------------------------------
console.log("\n[4/13] Hygiene & Chore Collocations");

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
console.log("\n[5/13] Phrase Generation & Batchim Particle Concord");

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
console.log("\n[6/13] Header Validation & Language Security Check (collocation_filter)");

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

// =============================================================================
// FEATURE 2: DESCRIPTIVE VERB SENSORY, DIMENSIONAL & AFFECTIVE SELECTION
// =============================================================================

// -----------------------------------------------------------------------------
// [Suite 7] Taste & Flavor Predicate Selection
// -----------------------------------------------------------------------------
console.log("\n[7/13] Taste & Flavor Predicate Selection");

const deliciousVerb = KR_EN_languageUnits[43];  // 맛있다
const spicyVerb = KR_EN_languageUnits[287];    // 맵다
const sweetVerb = KR_EN_languageUnits[314];    // 달다
const unpalatableVerb = KR_EN_languageUnits[311]; // 맛없다
const freshVerb = KR_EN_languageUnits[870];    // 신선하다

const spicyCands = getSubjectCandidatesForDescriptiveVerb(spicyVerb);
assert(spicyCands.length > 0, "맵다 has matching subject candidates", `Found ${spicyCands.length}`);
assert(spicyCands.every(n => hasTag(n, "food")), "All 맵다 candidates have 'food' tag");
assert(spicyCands.every(n => !hasTag(n, "weather")), "맵다 never pairs with weather (*날씨가 맵다)");
assert(spicyCands.every(n => !hasTag(n, "clothing")), "맵다 never pairs with clothing (*바지가 맵다)");
assert(spicyCands.every(n => !hasTag(n, "person")), "맵다 never pairs with person (*선생님이 맵다)");

const deliciousCands = getSubjectCandidatesForDescriptiveVerb(deliciousVerb);
assert(deliciousCands.length > 0, "맛있다 has matching subject candidates", `Found ${deliciousCands.length}`);
assert(deliciousCands.every(n => hasTag(n, "food") || hasTag(n, "drink")), "맛있다 candidates are food or drink");
assert(deliciousCands.every(n => !hasTag(n, "facility")), "맛있다 excludes dining facilities/places (*식당이 맛있다)");

const sweetCands = getSubjectCandidatesForDescriptiveVerb(sweetVerb);
assert(sweetCands.length > 0, "달다 has matching subject candidates", `Found ${sweetCands.length}`);
assert(sweetCands.every(n => hasTag(n, "food") || hasTag(n, "drink")), "달다 candidates are food or drink");

// -----------------------------------------------------------------------------
// [Suite 8] Weather vs. Tactile Temperature Selection
// -----------------------------------------------------------------------------
console.log("\n[8/13] Weather vs. Tactile Temperature Selection");

const hotWeatherVerb = KR_EN_languageUnits[125];  // 덥다
const coldWeatherVerb = KR_EN_languageUnits[131]; // 춥다
const warmWeatherVerb = KR_EN_languageUnits[713]; // 따뜻하다
const clearWeatherVerb = KR_EN_languageUnits[718]; // 맑다
const cloudyWeatherVerb = KR_EN_languageUnits[721]; // 흐리다
const hotTouchVerb = KR_EN_languageUnits[1414];   // 뜨겁다

const hotWeatherCands = getSubjectCandidatesForDescriptiveVerb(hotWeatherVerb);
assert(hotWeatherCands.length > 0, "덥다 has matching subject candidates", `Found ${hotWeatherCands.length}`);
assert(hotWeatherCands.some(n => n[KoreanWord] === "날씨"), "덥다 candidate list includes '날씨'");
assert(hotWeatherCands.some(n => n[KoreanWord] === "기온"), "덥다 candidate list includes '기온'");
assert(hotWeatherCands.every(n => !hasTag(n, "clothing")), "덥다 never pairs with clothing (*옷이 덥다)");
assert(hotWeatherCands.every(n => !hasTag(n, "wearable")), "덥다 never pairs with footwear/wearables (*장화가 덥다)");
assert(hotWeatherCands.every(n => !hasTag(n, "food")), "덥다 never pairs with food (*사과가 덥다)");
assert(hotWeatherCands.every(n => !hasTag(n, "person")), "덥다 never pairs with person (*선생님이 덥다)");

const coldWeatherCands = getSubjectCandidatesForDescriptiveVerb(coldWeatherVerb);
assert(coldWeatherCands.length > 0, "춥다 has matching subject candidates", `Found ${coldWeatherCands.length}`);
assert(coldWeatherCands.some(n => n[KoreanWord] === "날씨"), "춥다 candidate list includes '날씨'");
assert(coldWeatherCands.every(n => !hasTag(n, "clothing")), "춥다 never pairs with clothing");

const hotTouchCands = getSubjectCandidatesForDescriptiveVerb(hotTouchVerb);
assert(hotTouchCands.length > 0, "뜨겁다 has matching subject candidates", `Found ${hotTouchCands.length}`);
assert(hotTouchCands.some(n => n[KoreanWord] === "물"), "뜨겁다 candidate list includes '물' (water)");
assert(hotTouchCands.every(n => n[KoreanWord] !== "날씨"), "뜨겁다 strictly disallows weather (*날씨가 뜨겁다)");
assert(hotTouchCands.every(n => !hasTag(n, "facility")), "뜨겁다 excludes dining facilities (*식당이 뜨겁다)");

// -----------------------------------------------------------------------------
// [Suite 9] Physical Dimensions & Scale
// -----------------------------------------------------------------------------
console.log("\n[9/13] Physical Dimensions & Scale");

const narrowVerb = KR_EN_languageUnits[415];  // 좁다
const longVerb = KR_EN_languageUnits[312];    // 길다
const shortVerb = KR_EN_languageUnits[529];   // 짧다
const highVerb = KR_EN_languageUnits[1316];   // 높다
const lowVerb = KR_EN_languageUnits[1315];    // 낮다
const heavyVerb = KR_EN_languageUnits[547];   // 무겁다
const lightVerb = KR_EN_languageUnits[545];   // 가볍다
const thickVerb = KR_EN_languageUnits[546];   // 두껍다
const thinVerb = KR_EN_languageUnits[549];    // 얇다
const bigVerb = KR_EN_languageUnits[42];      // 크다
const smallVerb = KR_EN_languageUnits[128];   // 작다

// 좁다 (spatial)
const narrowCands = getSubjectCandidatesForDescriptiveVerb(narrowVerb);
assert(narrowCands.length > 0, "좁다 has matching subject candidates", `Found ${narrowCands.length}`);
assert(narrowCands.every(n => !hasTag(n, "food")), "좁다 never pairs with food (*사과가 좁다)");
assert(narrowCands.every(n => !hasTag(n, "person")), "좁다 never pairs with person (*선생님이 좁다)");

// 길다 / 짧다 (linear length)
const longCands = getSubjectCandidatesForDescriptiveVerb(longVerb);
assert(longCands.length > 0, "길다 has matching subject candidates", `Found ${longCands.length}`);
assert(longCands.some(n => ["치마", "바지", "줄", "시간", "거리"].includes(n[KoreanWord])), "길다 includes linear items (치마, 바지, 줄, 시간)");
assert(longCands.every(n => !hasTag(n, "room")), "길다 never pairs with rooms (*방이 길다)");
assert(longCands.every(n => !hasTag(n, "food")), "길다 never pairs with food (*김치가 길다)");

// 높다 / 낮다 (height/elevation)
const highCands = getSubjectCandidatesForDescriptiveVerb(highVerb);
assert(highCands.length > 0, "높다 has matching subject candidates", `Found ${highCands.length}`);
assert(highCands.some(n => ["산", "빌딩", "건물", "키", "기온", "값"].includes(n[KoreanWord])), "높다 pairs with vertical scale (산, 빌딩, 키, 기온, 값)");
assert(highCands.every(n => !hasTag(n, "clothing")), "높다 never pairs with clothing (*바지가 높다)");

// 무겁다 / 가볍다 (weight)
const heavyCands = getSubjectCandidatesForDescriptiveVerb(heavyVerb);
assert(heavyCands.length > 0, "무겁다 has matching subject candidates", `Found ${heavyCands.length}`);
assert(heavyCands.some(n => ["가방", "짐", "책"].includes(n[KoreanWord])), "무겁다 pairs with luggage/books (가방, 짐, 책)");
assert(heavyCands.every(n => !hasTag(n, "weather")), "무겁다 never pairs with weather (*날씨가 무겁다)");

// 두껍다 / 얇다 (thickness)
const thickCands = getSubjectCandidatesForDescriptiveVerb(thickVerb);
assert(thickCands.length > 0, "두껍다 has matching subject candidates", `Found ${thickCands.length}`);
assert(thickCands.some(n => ["책", "옷", "치마", "바지"].includes(n[KoreanWord])), "두껍다 pairs with books and clothing");

// 크다 / 작다 (scale)
const bigCands = getSubjectCandidatesForDescriptiveVerb(bigVerb);
assert(bigCands.length > 0, "크다 has matching subject candidates", `Found ${bigCands.length}`);
assert(bigCands.some(n => hasTag(n, "room") || hasTag(n, "clothing") || hasTag(n, "object")), "크다 pairs with rooms, clothing, or objects");

// -----------------------------------------------------------------------------
// [Suite 10] Price, Cleanliness & Acoustic Predicates
// -----------------------------------------------------------------------------
console.log("\n[10/13] Price, Cleanliness & Acoustic Predicates");

const expensiveVerb = KR_EN_languageUnits[392]; // 비싸다
const cheapVerb = KR_EN_languageUnits[548];     // 싸다
const cleanVerb = KR_EN_languageUnits[191];     // 깨끗하다
const dirtyVerb = KR_EN_languageUnits[192];     // 더럽다
const noisyVerb = KR_EN_languageUnits[127];     // 시끄럽다
const quietVerb = KR_EN_languageUnits[130];     // 조용하다

const expCands = getSubjectCandidatesForDescriptiveVerb(expensiveVerb);
assert(expCands.length > 0, "비싸다 has matching subject candidates", `Found ${expCands.length}`);
assert(expCands.some(n => hasTag(n, "clothing") || hasTag(n, "commodity") || n[KoreanWord] === "값"), "비싸다 pairs with commodities, clothing, and price");
assert(expCands.every(n => !hasTag(n, "person")), "비싸다 strictly disallows human subjects (*선생님이 비싸다)");

const cleanCands = getSubjectCandidatesForDescriptiveVerb(cleanVerb);
assert(cleanCands.length > 0, "깨끗하다 has matching subject candidates", `Found ${cleanCands.length}`);
assert(cleanCands.some(n => hasTag(n, "room") || hasTag(n, "place")), "깨끗하다 pairs with rooms and places");

const noisyCands = getSubjectCandidatesForDescriptiveVerb(noisyVerb);
assert(noisyCands.length > 0, "시끄럽다 has matching subject candidates", `Found ${noisyCands.length}`);
assert(noisyCands.some(n => ["교실", "방", "동네", "식당", "거리"].includes(n[KoreanWord])), "시끄럽다 pairs with environments (교실, 방, 동네)");

// -----------------------------------------------------------------------------
// [Suite 11] Personal Traits, Emotions & Cognitive Difficulty
// -----------------------------------------------------------------------------
console.log("\n[11/13] Personal Traits, Emotions & Cognitive Difficulty");

const kindVerb = KR_EN_languageUnits[197];       // 친절하다
const smartVerb = KR_EN_languageUnits[821];      // 똑똑하다
const handsomeVerb = KR_EN_languageUnits[833];   // 잘생기다
const goodNaturedVerb = KR_EN_languageUnits[834];// 착하다
const busyVerb = KR_EN_languageUnits[193];       // 바쁘다
const gladVerb = KR_EN_languageUnits[882];       // 기쁘다
const happyVerb = KR_EN_languageUnits[890];      // 행복하다
const lonelyVerb = KR_EN_languageUnits[888];     // 외롭다
const easyVerb = KR_EN_languageUnits[413];       // 쉽다
const difficultVerb = KR_EN_languageUnits[414];  // 어렵다
const fastVerb = KR_EN_languageUnits[394];       // 빠르다

// Personal traits
const kindCands = getSubjectCandidatesForDescriptiveVerb(kindVerb);
assert(kindCands.length > 0, "친절하다 has matching subject candidates", `Found ${kindCands.length}`);
assert(kindCands.every(n => hasTag(n, "person")), "All 친절하다 candidates have 'person' tag");
assert(kindCands.every(n => !hasTag(n, "food")), "친절하다 never pairs with food (*사과가 친절해요)");
assert(kindCands.every(n => !hasTag(n, "weather")), "친절하다 never pairs with weather (*날씨가 친절해요)");

const smartCands = getSubjectCandidatesForDescriptiveVerb(smartVerb);
assert(smartCands.every(n => hasTag(n, "person")), "All 똑똑하다 candidates have 'person' tag");
assert(smartCands.every(n => !hasTag(n, "object")), "똑똑하다 never pairs with inanimate objects (*책이 똑똑하다)");

// Emotions
const happyCands = getSubjectCandidatesForDescriptiveVerb(happyVerb);
assert(happyCands.length > 0, "행복하다 has matching subject candidates", `Found ${happyCands.length}`);
assert(happyCands.every(n => hasTag(n, "person") || hasTag(n, "emotion") || ["기분", "마음", "가족"].includes(n[KoreanWord])), "행복하다 pairs with people or internal emotional state");
assert(happyCands.every(n => !hasTag(n, "weather")), "행복하다 never pairs with weather (*날씨가 행복하다)");

// Difficulty
const easyCands = getSubjectCandidatesForDescriptiveVerb(easyVerb);
assert(easyCands.length > 0, "쉽다 has matching subject candidates", `Found ${easyCands.length}`);
assert(easyCands.some(n => ["한국어", "한국말", "숙제", "토픽", "시험", "문제"].includes(n[KoreanWord])), "쉽다 pairs with language/task (한국어, 숙제, 토픽)");
assert(easyCands.every(n => !hasTag(n, "food")), "쉽다 never pairs with food (*사과가 쉽다)");

// Speed
const fastCands = getSubjectCandidatesForDescriptiveVerb(fastVerb);
assert(fastCands.length > 0, "빠르다 has matching subject candidates", `Found ${fastCands.length}`);
assert(fastCands.some(n => hasTag(n, "vehicle")), "빠르다 pairs with transit vehicles (지하철, 기차, 비행기, 차)");
assert(fastCands.every(n => !hasTag(n, "food")), "빠르다 never pairs with food (*초밥이 빠르다)");

// -----------------------------------------------------------------------------
// [Suite 12] Descriptive Verb Phrase Generation & Subject Batchim Concord
// -----------------------------------------------------------------------------
console.log("\n[12/13] Descriptive Verb Phrase Generation & Subject Batchim Concord");

const sampleDescriptiveVerbs = [
	spicyVerb, hotWeatherVerb, hotTouchVerb, narrowVerb, longVerb, highVerb,
	heavyVerb, expensiveVerb, kindVerb, happyVerb, easyVerb, fastVerb
];

sampleDescriptiveVerbs.forEach(dv => {
	const stem = getStem(dv[KoreanWord]);
	for (let i = 0; i < 5; i++) {
		const phrase = buildDescriptiveVerbPhrase(dv, stem);
		assert(phrase && phrase.text, `buildDescriptiveVerbPhrase generates phrase for ${dv[KoreanWord]}`, phrase ? phrase.text : "null");
		assert(phrase.noun !== null, `${dv[KoreanWord]} phrase selected a valid subject noun`);

		if (phrase && phrase.noun) {
			const nKo = phrase.noun[KoreanWord];
			const hasB = hasBatchim(nKo.slice(-1));
			const expectedParticle = hasB ? "이" : "가";
			assert(phrase.text.startsWith(nKo + expectedParticle), `Subject particle concord: '${nKo}' + '${expectedParticle}' in "${phrase.text}"`);
		}
	}
});

// Verify VP_DVst token option generation
const dvOptions = getTokenOptions({ type: "VP_DVst" }, 0);
assert(dvOptions.length > 0, "getTokenOptions('VP_DVst') returns valid options", `Found ${dvOptions.length} options`);
dvOptions.forEach(opt => {
	assert(opt.text && opt.units.length >= 1, `VP_DVst option is valid: "${opt.text}"`);
	assert(!opt.text.includes("이/가"), `VP_DVst option has resolved real particle without unresolved slash: "${opt.text}"`);
});

// -----------------------------------------------------------------------------
// [Suite 13] Descriptive Verb Candidate Pool Viability & Diversity Safeguard
// -----------------------------------------------------------------------------
console.log("\n[13/13] Descriptive Verb Candidate Pool Viability & Diversity Safeguard");

const allDescriptiveVerbs = KR_EN_languageUnits.filter(
	u => u && u[DATA_SCHEMA.PartofSpeech] === "Descriptive Verb"
);

assert(allDescriptiveVerbs.length >= 123, "All descriptive verbs identified in curriculum (>= 123)", `Found ${allDescriptiveVerbs.length}`);

const zeroCandidateDVs = [];
const lowCandidateDVs = [];
const unregisteredDVTags = [];
const registeredDVTagSet = new Set(DESCRIPTIVE_VERB_SPECS.map(s => s.tag));

allDescriptiveVerbs.forEach(dv => {
	const cands = getSubjectCandidatesForDescriptiveVerb(dv);
	if (cands.length === 0) zeroCandidateDVs.push(dv);
	if (cands.length < 3) lowCandidateDVs.push({ dv, count: cands.length });

	const tags = Array.from(dv[DATA_SCHEMA.SemanticTags] || []);
	tags.forEach(t => {
		if (t.startsWith("descriptive_") && !registeredDVTagSet.has(t)) {
			unregisteredDVTags.push({ dv, tag: t });
		}
	});

	// Verify sample generation and batchim concord
	const stem = getStem(dv[KoreanWord]);
	const phrase = buildDescriptiveVerbPhrase(dv, stem);
	assert(phrase && phrase.text, `${dv[KoreanWord]} generates valid phrase`);
	if (phrase && phrase.noun) {
		const nKo = phrase.noun[KoreanWord];
		const hasB = hasBatchim(nKo.slice(-1));
		const expectedParticle = hasB ? "이" : "가";
		assert(phrase.text.startsWith(nKo + expectedParticle), `${dv[KoreanWord]}: subject particle batchim concord '${nKo}${expectedParticle}'`);
	}
});

assert(zeroCandidateDVs.length === 0, "Zero descriptive verbs are starved (all 123 have >= 1 valid candidate subjects)", `Starved count: ${zeroCandidateDVs.length}`);
assert(lowCandidateDVs.length === 0, "Zero descriptive verbs have < 3 candidates (all 123 satisfy diversity contract)", `Low diversity count: ${lowCandidateDVs.length}`);
assert(unregisteredDVTags.length === 0, "All descriptive_* tags are registered in DESCRIPTIVE_VERB_SPECS in korean.js", `Unregistered count: ${unregisteredDVTags.length}`);

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
	console.log("\n>>> FEATURES 1 & 2 (COLLOCATION & SENSORY SELECTION) 100% VALIDATED! <<<\n");
	process.exit(0);
}
