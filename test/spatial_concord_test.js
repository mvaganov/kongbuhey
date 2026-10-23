#!/usr/bin/env node
/**
 * test/spatial_concord_test.js - Feature 7: Deictic Demonstratives & Spatial Relational Test Suite
 *
 * Validates:
 *  1. Dynamic Spatial Sets Extraction & Zero Hardcoded Hangul:
 *     - SPATIAL_POSITIONS, DEICTIC_DETERMINERS, DEICTIC_PRONOUNS, DEICTIC_LOCATIVES, DEICTIC_DIRECTIONS
 *     - Zero hardcoded Hangul literals in korean.js
 *  2. Tripartite Deictic Proximity System:
 *     - Proximal (이, 이것/이거, 여기/이곳, 이쪽)
 *     - Medial (그, 그것/그거, 거기/그곳, 그쪽)
 *     - Distal (저, 저것/저거, 저기/저곳, 저쪽)
 *     - Interrogative (어느/어떤/무슨, 무엇/뭐, 어디)
 *  3. Determiner + Noun Syntax & Illegal Particle Prevention:
 *     - Determiners strictly modify following nouns (이 책, 그 사람, 저 건물).
 *     - Bare determiners with case particles (*이가, *이를, *그을, *어느를) are forbidden.
 *  4. Spatial Relational Phrase Generation (buildSpatialPhrase):
 *     - [Reference Noun (+의)] + [Position] + [Locative Particle]
 *     - Zero-genitive spoken ellipsis (책상 위) vs explicit genitive (책상 위의).
 *     - Prenominal modifying phrases (책상 위의 책).
 *  5. Locative Particle Concord with Static vs Dynamic Verbs:
 *     - Static existence verbs (있다, 없다, 계시다, 살다, 앉다, 두다) require -에.
 *     - Dynamic action verbs (만나다, 먹다, 공부하다, 사다) require -에서.
 *  6. Directional Motion Particle Concord (-(으)로):
 *     - Directional positions take -(으)로 with correct batchim allomorphs (위로, 앞으로, 오른쪽으로).
 *  7. Case-Contracted Demonstratives:
 *     - Subject (이게, 그게, 저게), Topic (이건, 그건, 저건), Object (이걸, 그걸, 저걸).
 *  8. Semantic Template Expansion (generateSemanticSentence):
 *     - {Spatial_Phrase}, {Relational_Loc}, {Deictic_NP}, {Deictic_Loc}, {Deictic_Pronoun}.
 *  9. Concord Validation & Repair (validateSpatialConcord, applySpatialConcord):
 *     - Accurate detection and automatic repair of spatial and determiner errors.
 * 10. Exhaustive Cartesian Cross-Validation:
 *     - Validates all spatial positions across static, dynamic, and directional frames.
 *
 * Usage:
 *   node test/spatial_concord_test.js
 */

const fs = require('fs');
const path = require('path');
const {
	KR_EN_languageUnits,
	DATA_SCHEMA,
	getWords,
	getFilteredWords,
	hasTag
} = require('../data.js');

const korean = require('../korean.js');
const {
	SPATIAL_POSITIONS,
	DEICTIC_DETERMINERS,
	DEICTIC_PRONOUNS,
	DEICTIC_LOCATIVES,
	DEICTIC_DIRECTIONS,
	STATIC_EXISTENCE_VERBS,
	getSpatialPositions,
	getDeicticDemonstratives,
	buildSpatialPhrase,
	buildDeicticPhrase,
	isStaticExistenceVerb,
	validateSpatialConcord,
	applySpatialConcord,
	attachParticle,
	applyMorphology,
	generateSemanticSentence,
	hasBatchim,
	hasRieulBatchim
} = korean;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
	totalTests++;
	if (!condition) {
		failedTests++;
		console.error(`  [FAIL] ${message}`);
	} else {
		passedTests++;
	}
}

console.log("======================================================");
console.log("   FEATURE 7: DEICTIC & SPATIAL RELATIONAL TEST SUITE  ");
console.log("======================================================");

// -----------------------------------------------------------------------------
// [1/10] Dynamic Spatial Sets Extraction & Zero Hardcoded Hangul
// -----------------------------------------------------------------------------
console.log("\n[1/10] Dynamic Spatial Sets Extraction & Zero Hardcoded Hangul");

assert(SPATIAL_POSITIONS instanceof Map, "SPATIAL_POSITIONS is a Map");
assert(SPATIAL_POSITIONS.size >= 15, `SPATIAL_POSITIONS has >= 15 entries (found ${SPATIAL_POSITIONS.size})`);

const expectedCanonicalPositions = [
	"위", "아래", "밑", "앞", "뒤", "옆", "안", "속", "밖",
	"사이", "가운데", "중간", "근처", "건너편", "맞은편", "오른쪽", "왼쪽"
];
for (const pos of expectedCanonicalPositions) {
	assert(SPATIAL_POSITIONS.has(pos), `SPATIAL_POSITIONS contains canonical position '${pos}'`);
	const entry = SPATIAL_POSITIONS.get(pos);
	assert(entry && entry.unit, `Entry for '${pos}' contains language unit reference`);
}

// Zero hardcoded Hangul arrays in korean.js
const koreanCode = fs.readFileSync(path.resolve(__dirname, '../korean.js'), 'utf8');
assert(!koreanCode.includes('const SPATIAL_POSITIONS = new Map([["위"'), "SPATIAL_POSITIONS is not hardcoded Map literal");
assert(!koreanCode.includes('const SPATIAL_POSITIONS = ["위"'), "SPATIAL_POSITIONS is not hardcoded array literal");
assert(!koreanCode.includes('const DEICTIC_DETERMINERS = new Map([["이"'), "DEICTIC_DETERMINERS is not hardcoded Map literal");
assert(!koreanCode.includes('const DEICTIC_PRONOUNS = new Map([["이것"'), "DEICTIC_PRONOUNS is not hardcoded Map literal");

// -----------------------------------------------------------------------------
// [2/10] Tripartite Deictic Proximity Paradigm
// -----------------------------------------------------------------------------
console.log("\n[2/10] Tripartite Deictic Proximity Paradigm");

assert(DEICTIC_DETERMINERS instanceof Map, "DEICTIC_DETERMINERS is a Map");
assert(DEICTIC_PRONOUNS instanceof Map, "DEICTIC_PRONOUNS is a Map");
assert(DEICTIC_LOCATIVES instanceof Map, "DEICTIC_LOCATIVES is a Map");
assert(DEICTIC_DIRECTIONS instanceof Map, "DEICTIC_DIRECTIONS is a Map");

// Determiners
assert(DEICTIC_DETERMINERS.has("이"), "DEICTIC_DETERMINERS has proximal '이'");
assert(DEICTIC_DETERMINERS.get("이").proximity === "proximal", "'이' is marked proximal");
assert(DEICTIC_DETERMINERS.has("그"), "DEICTIC_DETERMINERS has medial '그'");
assert(DEICTIC_DETERMINERS.get("그").proximity === "medial", "'그' is marked medial");
assert(DEICTIC_DETERMINERS.has("저"), "DEICTIC_DETERMINERS has distal '저'");
assert(DEICTIC_DETERMINERS.get("저").proximity === "distal", "'저' is marked distal");
assert(DEICTIC_DETERMINERS.has("어느"), "DEICTIC_DETERMINERS has interrogative '어느'");

// Pronouns (things)
assert(DEICTIC_PRONOUNS.has("이것") && DEICTIC_PRONOUNS.has("이거"), "DEICTIC_PRONOUNS has proximal '이것' and '이거'");
assert(DEICTIC_PRONOUNS.has("그것") && DEICTIC_PRONOUNS.has("그거"), "DEICTIC_PRONOUNS has medial '그것' and '그거'");
assert(DEICTIC_PRONOUNS.has("저것") && DEICTIC_PRONOUNS.has("저거"), "DEICTIC_PRONOUNS has distal '저것' and '저거'");

// Locatives (places)
assert(DEICTIC_LOCATIVES.has("여기") && DEICTIC_LOCATIVES.has("이곳"), "DEICTIC_LOCATIVES has proximal '여기' and '이곳'");
assert(DEICTIC_LOCATIVES.has("거기") && DEICTIC_LOCATIVES.has("그곳"), "DEICTIC_LOCATIVES has medial '거기' and '그곳'");
assert(DEICTIC_LOCATIVES.has("저기") && DEICTIC_LOCATIVES.has("저곳"), "DEICTIC_LOCATIVES has distal '저기' and '저곳'");
assert(DEICTIC_LOCATIVES.has("어디"), "DEICTIC_LOCATIVES has interrogative '어디'");

// Directions
assert(DEICTIC_DIRECTIONS.has("이쪽"), "DEICTIC_DIRECTIONS has proximal '이쪽'");
assert(DEICTIC_DIRECTIONS.has("그쪽"), "DEICTIC_DIRECTIONS has medial '그쪽'");
assert(DEICTIC_DIRECTIONS.has("저쪽"), "DEICTIC_DIRECTIONS has distal '저쪽'");

// -----------------------------------------------------------------------------
// [3/10] Determiner + Noun Syntax & Illegal Particle Prevention
// -----------------------------------------------------------------------------
console.log("\n[3/10] Determiner + Noun Syntax & Illegal Particle Prevention");

// Determiners modify nominals
assert(buildDeicticPhrase("proximal", "noun", { noun: "책" }) === "이 책", "Proximal NP: '이 책'");
assert(buildDeicticPhrase("medial", "noun", { noun: "사람" }) === "그 사람", "Medial NP: '그 사람'");
assert(buildDeicticPhrase("distal", "noun", { noun: "건물" }) === "저 건물", "Distal NP: '저 건물'");
assert(buildDeicticPhrase("proximal", "noun", { noun: "가방", particle: "object" }) === "이 가방을", "NP with object particle: '이 가방을'");
assert(buildDeicticPhrase("medial", "noun", { noun: "학생", particle: "subject" }) === "그 학생이", "NP with subject particle: '그 학생이'");

// Bare determiner particle prohibition (*이가, *이를, *그을, *어느를)
const bareDet1 = validateSpatialConcord("이가 샀어요");
assert(!bareDet1.valid, "Bare '이가' without noun detected as invalid");
const bareDet2 = validateSpatialConcord("이를 보세요");
assert(!bareDet2.valid, "Bare '이를' without noun detected as invalid");
const bareDet3 = validateSpatialConcord("그을 만났어요");
assert(!bareDet3.valid, "Bare '그을' without noun detected as invalid");
const bareDet4 = validateSpatialConcord("어느를 골라요");
assert(!bareDet4.valid, "Bare '어느를' without noun detected as invalid");

// Legitimate sentences with determiners modifying nouns must be valid
const validNP1 = validateSpatialConcord("이 책을 읽어요");
assert(validNP1.valid, "'이 책을 읽어요' is valid");
const validNP2 = validateSpatialConcord("그 사람이 와요");
assert(validNP2.valid, "'그 사람이 와요' is valid");
const validNP3 = validateSpatialConcord("저 건물이 높아요");
assert(validNP3.valid, "'저 건물이 높아요' is valid");

// -----------------------------------------------------------------------------
// [4/10] Spatial Relational Phrase Generation (buildSpatialPhrase)
// -----------------------------------------------------------------------------
console.log("\n[4/10] Spatial Relational Phrase Generation (buildSpatialPhrase)");

// Zero-genitive ellipsis (colloquial standard)
assert(buildSpatialPhrase("책상", "위") === "책상 위에", "Zero-genitive: '책상 위에'");
assert(buildSpatialPhrase("의자", "밑") === "의자 밑에", "Zero-genitive: '의자 밑에'");
assert(buildSpatialPhrase("학교", "앞") === "학교 앞에", "Zero-genitive: '학교 앞에'");
assert(buildSpatialPhrase("문", "뒤") === "문 뒤에", "Zero-genitive: '문 뒤에'");
assert(buildSpatialPhrase("방", "안") === "방 안에", "Zero-genitive: '방 안에'");

// Explicit genitive '의'
assert(buildSpatialPhrase("책상", "위", { genitive: true }) === "책상의 위에", "Genitive: '책상의 위에'");
assert(buildSpatialPhrase("건물", "앞", { genitive: true }) === "건물의 앞에", "Genitive: '건물의 앞에'");

// Prenominal modifying noun phrase: [Ground] 위의 [Modifying Noun]
assert(buildSpatialPhrase("책상", "위", { modifyingNoun: "책" }) === "책상 위의 책", "Prenominal modifier: '책상 위의 책'");
assert(buildSpatialPhrase("나무", "아래", { modifyingNoun: "벤치" }) === "나무 아래의 벤치", "Prenominal modifier: '나무 아래의 벤치'");

// Standalone spatial noun calls
assert(buildSpatialPhrase("위") === "위에", "Standalone: '위에'");
assert(buildSpatialPhrase("앞") === "앞에", "Standalone: '앞에'");
assert(buildSpatialPhrase("오른쪽", { particle: "direction" }) === "오른쪽으로", "Standalone directional: '오른쪽으로'");

// -----------------------------------------------------------------------------
// [5/10] Locative Particle Concord with Static vs Dynamic Verbs
// -----------------------------------------------------------------------------
console.log("\n[5/10] Locative Particle Concord with Static vs Dynamic Verbs");

// Static existence verbs select -에
assert(isStaticExistenceVerb("있다"), "'있다' is static existence verb");
assert(isStaticExistenceVerb("없다"), "'없다' is static existence verb");
assert(isStaticExistenceVerb("계시다"), "'계시다' is static existence verb");
assert(isStaticExistenceVerb("살다"), "'살다' is static existence verb");
assert(isStaticExistenceVerb("앉다"), "'앉다' is static existence verb");
assert(isStaticExistenceVerb("두다"), "'두다' is static existence verb");
assert(!isStaticExistenceVerb("만나다"), "'만나다' is NOT static existence verb");
assert(!isStaticExistenceVerb("먹다"), "'먹다' is NOT static existence verb");

assert(buildSpatialPhrase("책상", "위", { verb: "있다" }) === "책상 위에", "Static verb '있다' -> '책상 위에'");
assert(buildSpatialPhrase("방", "안", { verb: "계시다" }) === "방 안에", "Static verb '계시다' -> '방 안에'");
assert(buildSpatialPhrase("의자", "밑", { verb: "두다" }) === "의자 밑에", "Static verb '두다' -> '의자 밑에'");
assert(buildSpatialPhrase("소파", "옆", { verb: "앉다" }) === "소파 옆에", "Static verb '앉다' -> '소파 옆에'");

// Dynamic action verbs select -에서
assert(buildSpatialPhrase("학교", "앞", { verb: "만나다" }) === "학교 앞에서", "Dynamic verb '만나다' -> '학교 앞에서'");
assert(buildSpatialPhrase("식당", "안", { verb: "먹다" }) === "식당 안에서", "Dynamic verb '먹다' -> '식당 안에서'");
assert(buildSpatialPhrase("도서관", "근처", { verb: "공부하다" }) === "도서관 근처에서", "Dynamic verb '공부하다' -> '도서관 근처에서'");
assert(buildSpatialPhrase("가게", "앞", { verb: "기다리다" }) === "가게 앞에서", "Dynamic verb '기다리다' -> '가게 앞에서'");

// -----------------------------------------------------------------------------
// [6/10] Directional Motion Particle Concord (-(으)로)
// -----------------------------------------------------------------------------
console.log("\n[6/10] Directional Motion Particle Concord (-(으)로)");

// Vowel or Rieul coda -> 로
assert(buildSpatialPhrase(null, "위", { particle: "direction" }) === "위로", "Vowel coda: '위로'");
assert(buildSpatialPhrase(null, "뒤", { particle: "direction" }) === "뒤로", "Vowel coda: '뒤로'");
assert(buildSpatialPhrase(null, "아래", { particle: "direction" }) === "아래로", "Vowel coda: '아래로'");
assert(buildSpatialPhrase(null, "사이", { particle: "direction" }) === "사이로", "Vowel coda: '사이로'");

// Non-Rieul batchim -> 으로
assert(buildSpatialPhrase(null, "앞", { particle: "direction" }) === "앞으로", "Batchim ㅍ: '앞으로'");
assert(buildSpatialPhrase(null, "밑", { particle: "direction" }) === "밑으로", "Batchim ㅌ: '밑으로'");
assert(buildSpatialPhrase(null, "옆", { particle: "direction" }) === "옆으로", "Batchim ㅍ: '옆으로'");
assert(buildSpatialPhrase(null, "안", { particle: "direction" }) === "안으로", "Batchim ㄴ: '안으로'");
assert(buildSpatialPhrase(null, "밖", { particle: "direction" }) === "밖으로", "Batchim ㄲ: '밖으로'");
assert(buildSpatialPhrase(null, "속", { particle: "direction" }) === "속으로", "Batchim ㄱ: '속으로'");
assert(buildSpatialPhrase(null, "오른쪽", { particle: "direction" }) === "오른쪽으로", "Batchim ㄱ: '오른쪽으로'");
assert(buildSpatialPhrase(null, "왼쪽", { particle: "direction" }) === "왼쪽으로", "Batchim ㄱ: '왼쪽으로'");
assert(buildSpatialPhrase(null, "맞은편", { particle: "direction" }) === "맞은편으로", "Batchim ㄴ: '맞은편으로'");

// -----------------------------------------------------------------------------
// [7/10] Case-Contracted Demonstratives (이게, 그건, 저걸)
// -----------------------------------------------------------------------------
console.log("\n[7/10] Case-Contracted Demonstratives (이게, 그건, 저걸)");

// Subject contractions (-이/가)
assert(buildDeicticPhrase("proximal", "thing", { particle: "subject" }) === "이게", "이것 + 이 -> 이게");
assert(buildDeicticPhrase("medial", "thing", { particle: "subject" }) === "그게", "그것 + 이 -> 그게");
assert(buildDeicticPhrase("distal", "thing", { particle: "subject" }) === "저게", "저것 + 이 -> 저게");

// Topic contractions (-은/는)
assert(buildDeicticPhrase("proximal", "thing", { particle: "topic" }) === "이건", "이것 + 은 -> 이건");
assert(buildDeicticPhrase("medial", "thing", { particle: "topic" }) === "그건", "그것 + 은 -> 그건");
assert(buildDeicticPhrase("distal", "thing", { particle: "topic" }) === "저건", "저것 + 은 -> 저건");

// Object contractions (-을/를)
assert(buildDeicticPhrase("proximal", "thing", { particle: "object" }) === "이걸", "이것 + 을 -> 이걸");
assert(buildDeicticPhrase("medial", "thing", { particle: "object" }) === "그걸", "그것 + 을 -> 그걸");
assert(buildDeicticPhrase("distal", "thing", { particle: "object" }) === "저걸", "저것 + 을 -> 저걸");

// Morphology engine automatic sandhi verification
assert(applyMorphology("이것이 좋아요") === "이게 좋아요", "applyMorphology resolves 이것이 -> 이게");
assert(applyMorphology("그것은 뭐예요?") === "그건 뭐예요?", "applyMorphology resolves 그것은 -> 그건");
assert(applyMorphology("저것을 주세요") === "저걸 주세요", "applyMorphology resolves 저것을 -> 저걸");
assert(applyMorphology("이거가 맛있어요") === "이게 맛있어요", "applyMorphology resolves 이거가 -> 이게");
assert(applyMorphology("그거는 제 책이에요") === "그건 제 책이에요", "applyMorphology resolves 그거는 -> 그건");
assert(applyMorphology("저거를 봐요") === "저걸 봐요", "applyMorphology resolves 저거를 -> 저걸");

// -----------------------------------------------------------------------------
// [8/10] Semantic Template Expansion (generateSemanticSentence)
// -----------------------------------------------------------------------------
console.log("\n[8/10] Semantic Template Expansion (generateSemanticSentence)");

for (let i = 0; i < 5; i++) {
	const resSpatial = generateSemanticSentence("{Spatial_Phrase} 책이 있어요");
	assert(resSpatial && resSpatial.ko.includes("에 책이 있어요"), `Spatial phrase expansion: "${resSpatial.ko}"`);
	const resDynamic = generateSemanticSentence("{Relational_Loc:dynamic} 친구를 만나요");
	assert(resDynamic && resDynamic.ko.includes("에서 친구를 만나요"), `Dynamic relational loc expansion: "${resDynamic.ko}"`);
	const resProxNP = generateSemanticSentence("{Deictic_NP:proximal} 좋아요");
	assert(resProxNP && resProxNP.ko.startsWith("이 "), `Proximal deictic NP expansion: "${resProxNP.ko}"`);
	const resMedNP = generateSemanticSentence("{Deictic_NP:medial} 좋아요");
	assert(resMedNP && resMedNP.ko.startsWith("그 "), `Medial deictic NP expansion: "${resMedNP.ko}"`);
	const resDistNP = generateSemanticSentence("{Deictic_NP:distal} 좋아요");
	assert(resDistNP && resDistNP.ko.startsWith("저 "), `Distal deictic NP expansion: "${resDistNP.ko}"`);
	const resLoc = generateSemanticSentence("{Deictic_Loc} 살아요");
	assert(resLoc && /(여기|거기|저기|이곳|그곳|저곳)/.test(resLoc.ko), `Deictic locative expansion: "${resLoc.ko}"`);
}

// -----------------------------------------------------------------------------
// [9/10] Concord Validation & Repair (validateSpatialConcord, applySpatialConcord)
// -----------------------------------------------------------------------------
console.log("\n[9/10] Concord Validation & Repair (validateSpatialConcord, applySpatialConcord)");

// 1. Static verb error detection and repair
const staticErr1 = validateSpatialConcord("책상 위에서 책이 있어요");
assert(!staticErr1.valid, "Static verb with -에서 detected as error: '책상 위에서 책이 있어요'");
assert(applySpatialConcord("책상 위에서 책이 있어요") === "책상 위에 책이 있어요", "applySpatialConcord repairs '책상 위에서 있다' -> '책상 위에 있다'");

const staticErr2 = validateSpatialConcord("방 안에서 할머니가 계세요");
assert(!staticErr2.valid, "Static verb 계시다 with -에서 detected as error: '방 안에서 할머니가 계세요'");
assert(applySpatialConcord("방 안에서 할머니가 계세요") === "방 안에 할머니가 계세요", "applySpatialConcord repairs '방 안에서 계시다' -> '방 안에 계시다'");

// 2. Dynamic verb error detection and repair
const dynamicErr1 = validateSpatialConcord("학교 앞에 친구를 만나요");
assert(!dynamicErr1.valid, "Dynamic verb 만나다 with -에 detected as error: '학교 앞에 친구를 만나요'");
assert(applySpatialConcord("학교 앞에 친구를 만나요") === "학교 앞에서 친구를 만나요", "applySpatialConcord repairs '학교 앞에 만나다' -> '학교 앞에서 만나다'");

const dynamicErr2 = validateSpatialConcord("식당 안에 밥을 먹어요");
assert(!dynamicErr2.valid, "Dynamic verb 먹다 with -에 detected as error: '식당 안에 밥을 먹어요'");
assert(applySpatialConcord("식당 안에 밥을 먹어요") === "식당 안에서 밥을 먹어요", "applySpatialConcord repairs '식당 안에 먹다' -> '식당 안에서 먹다'");

// 3. Bare determiner error repair
assert(applySpatialConcord("이를 샀어요") === "이걸 샀어요", "applySpatialConcord repairs '이를' -> '이걸'");
assert(applySpatialConcord("이가 좋아요") === "이게 좋아요", "applySpatialConcord repairs '이가' -> '이게'");
assert(applySpatialConcord("그를 봤어요") === "그걸 봤어요", "applySpatialConcord repairs '그를' -> '그걸'");
assert(applySpatialConcord("그가 뭐예요?") === "그게 뭐예요?", "applySpatialConcord repairs '그가' -> '그게'");

// -----------------------------------------------------------------------------
// [10/10] Exhaustive Cartesian Cross-Validation
// -----------------------------------------------------------------------------
console.log("\n[10/10] Exhaustive Cartesian Cross-Validation");

const staticTestVerbs = ["있어요", "없어요", "계십니다", "살아요"];
const dynamicTestVerbs = ["만나요", "먹어요", "공부해요", "기다려요"];

// Cross-validate all 17 spatial positions with static verbs
for (const pos of expectedCanonicalPositions) {
	for (const verb of staticTestVerbs) {
		const phrase = `건물 ${pos}에 ${verb}`;
		const validation = validateSpatialConcord(phrase);
		assert(validation.valid, `Harmonious static frame valid: '${phrase}'`);

		// Deliberate error test
		const badPhrase = `건물 ${pos}에서 ${verb}`;
		const badValidation = validateSpatialConcord(badPhrase);
		assert(!badValidation.valid, `Static conflict correctly flagged: '${badPhrase}'`);
		const repaired = applySpatialConcord(badPhrase);
		assert(repaired === phrase, `Bad static phrase successfully repaired: '${badPhrase}' -> '${repaired}'`);
	}
}

// Cross-validate all 17 spatial positions with dynamic verbs
for (const pos of expectedCanonicalPositions) {
	for (const verb of dynamicTestVerbs) {
		const phrase = `건물 ${pos}에서 친구를 ${verb}`;
		const validation = validateSpatialConcord(phrase);
		assert(validation.valid, `Harmonious dynamic frame valid: '${phrase}'`);

		// Deliberate error test
		const badPhrase = `건물 ${pos}에 친구를 ${verb}`;
		const badValidation = validateSpatialConcord(badPhrase);
		assert(!badValidation.valid, `Dynamic conflict correctly flagged: '${badPhrase}'`);
		const repaired = applySpatialConcord(badPhrase);
		assert(repaired === phrase, `Bad dynamic phrase successfully repaired: '${badPhrase}' -> '${repaired}'`);
	}
}

// Validate directional morphology across all positions
for (const pos of expectedCanonicalPositions) {
	const dirPhrase = buildSpatialPhrase(null, pos, { particle: "direction" });
	const lastChar = pos.slice(-1);
	const expectsRo = !hasBatchim(lastChar) || hasRieulBatchim(lastChar);
	if (expectsRo) {
		assert(dirPhrase.endsWith("로") && !dirPhrase.endsWith("으로"), `Position '${pos}' correctly attaches '-로': '${dirPhrase}'`);
	} else {
		assert(dirPhrase.endsWith("으로"), `Position '${pos}' correctly attaches '-으로': '${dirPhrase}'`);
	}
}

console.log("\n======================================================");
console.log(`TOTAL TESTS: ${totalTests}`);
console.log(`PASSED:      ${passedTests}`);
console.log(`FAILED:      ${failedTests}`);
console.log("======================================================\n");

if (failedTests > 0) {
	console.error(`>>> FAILED: ${failedTests} assertion(s) failed in Feature 7 test suite. <<<`);
	process.exit(1);
} else {
	console.log(">>> FEATURE 7 (DEICTIC & SPATIAL RELATIONAL) 100% VALIDATED! <<<\n");
}
