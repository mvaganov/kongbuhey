#!/usr/bin/env node
/**
 * test/analyzer_modular_test.js
 *
 * Automated regression test suite for the modularized Korean Text Analyzer
 * subsystem (korean/analyzer/).
 *
 * Validates:
 *  1. Zero platform dependencies (no fs/path leaks in korean/analyzer/*).
 *  2. Fast indexer and dynamic semantic category extraction from data.js.
 *  3. Syntax frame evaluation and pedagogical ambiguity preservation.
 *  4. Composable verb morphology & irregular stem recovery.
 *  5. Sentence-level multi-word constructions (e.g. -(으)ㄹ 수 있다, -(으)ㄴ 후에).
 *  6. Runtime performance for arbitrary user inputs (homework / K-pop lyrics).
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const korean = require('../korean.js');
const analyzer = korean.analyzer;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function check(desc, fn) {
	totalTests++;
	try {
		fn();
		passedTests++;
		console.log(`  [PASS] ${desc}`);
	} catch (err) {
		failedTests++;
		console.error(`  [FAIL] ${desc}`);
		console.error(`         ${err.message}`);
	}
}

console.log("======================================================");
console.log("       KOREAN TEXT ANALYZER MODULAR TEST SUITE        ");
console.log("======================================================\n");

// -----------------------------------------------------------------------------
// 1. Browser Independence & Architecture Integrity
// -----------------------------------------------------------------------------
console.log("[1] Browser Independence & Clean Module Separation");

check("korean/analyzer core modules must NOT require Node 'fs' or 'path'", () => {
	const analyzerDir = path.resolve(__dirname, '..', 'korean', 'analyzer');
	const files = fs.readdirSync(analyzerDir).filter(f => f.endsWith('.js'));
	assert.ok(files.length >= 6, `Expected at least 6 analyzer modules, found ${files.length}`);

	for (const file of files) {
		const content = fs.readFileSync(path.join(analyzerDir, file), 'utf8');
		assert.ok(!content.includes("require('fs')"), `${file} must not require 'fs'`);
		assert.ok(!content.includes('require("fs")'), `${file} must not require "fs"`);
		assert.ok(!content.includes("require('path')"), `${file} must not require 'path'`);
		assert.ok(!content.includes('require("path")'), `${file} must not require "path"`);
	}
});

check("korean.js re-exports analyzer subsystem cleanly", () => {
	assert.ok(korean.analyzer, "korean.analyzer must be defined");
	assert.strictEqual(typeof korean.analyzePassage, 'function', "analyzePassage must be exported");
	assert.strictEqual(typeof korean.analyzeSentence, 'function', "analyzeSentence must be exported");
	assert.strictEqual(typeof korean.analyzeSingleToken, 'function', "analyzeSingleToken must be exported");
});

// -----------------------------------------------------------------------------
// 2. Dynamic Indexing & Semantic Classification
// -----------------------------------------------------------------------------
console.log("\n[2] Dynamic Indexing & Semantic Stems");

check("Fast index caches semantic tags and dynamically classifies verb stems", () => {
	const index = analyzer.getIndex();
	assert.ok(index.unitById instanceof Map, "unitById must be a Map");
	assert.ok(index.vocabByKo instanceof Map, "vocabByKo must be a Map");
	assert.ok(index.motionVerbStems instanceof Set, "motionVerbStems must be a Set");
	assert.ok(index.stativeVerbStems instanceof Set, "stativeVerbStems must be a Set");

	// Motion verbs from data.js
	assert.ok(index.motionVerbStems.has("가"), "가 must be in motionVerbStems");
	assert.ok(index.motionVerbStems.has("오"), "오 must be in motionVerbStems");

	// Stative verbs from data.js
	assert.ok(index.stativeVerbStems.has("있"), "있 must be in stativeVerbStems");
	assert.ok(index.stativeVerbStems.has("많"), "많 must be in stativeVerbStems");

	// Pre-computed semantic tags
	const id132Tags = index.semanticTagsByUnitId.get(132); // 에 (location)
	assert.ok(id132Tags instanceof Set, "Tags for unit 132 must be a Set");
});

check("Pronoun sandhi map is populated dynamically from data.js", () => {
	const index = analyzer.getIndex();
	assert.ok(index.pronounSandhiMap.has("제"), "제 must be in pronounSandhiMap");
	assert.ok(index.pronounSandhiMap.has("내"), "내 must be in pronounSandhiMap");
	assert.ok(index.pronounSandhiMap.has("네"), "네 must be in pronounSandhiMap");
});

// -----------------------------------------------------------------------------
// 3. SyntaxFrame Evaluation & Disambiguation
// -----------------------------------------------------------------------------
console.log("\n[3] SyntaxFrame & Disambiguation");

check("evaluateSyntaxFrame distinguishes directional vs locative 에 based on motion predicate", () => {
	const index = analyzer.getIndex();
	const unit200 = index.unitById.get(200); // 에 (direction)
	const unit132 = index.unitById.get(132); // 에 (location)
	const placeUnit = index.vocabByKo.get("학교")[0];
	const motionPred = index.vocabByKo.get("가다")[0];
	const stativePred = index.vocabByKo.get("있다")[0];

	// School + motion (가다) -> directional should score higher
	const dirEval = analyzer.evaluateSyntaxFrame(unit200, {
		nounStemUnit: placeUnit,
		clausePredicate: motionPred
	}, index);
	assert.strictEqual(dirEval.matches, true);
	assert.strictEqual(dirEval.score, 1.0);

	// School + stative (있다) -> locational should score higher
	const locEval = analyzer.evaluateSyntaxFrame(unit132, {
		nounStemUnit: placeUnit,
		clausePredicate: stativePred
	}, index);
	assert.strictEqual(locEval.matches, true);
	assert.strictEqual(locEval.score, 0.95);
});

// -----------------------------------------------------------------------------
// 4. Verb Morphology & Irregular Deconstruction
// -----------------------------------------------------------------------------
console.log("\n[4] Verb Morphology & Irregular Deconstruction");

check("matchVerbSuffix deconstructs irregular and compound inflected verbs", () => {
	const index = analyzer.getIndex();

	// ㅂ-irregular: 어려웠어요 -> 어렵다
	const v1 = analyzer.matchVerbSuffix("어려웠어요", "", "", index, analyzer.evaluateSyntaxFrame);
	assert.ok(v1, "어려웠어요 must match verb suffix");
	assert.strictEqual(v1.lexical.text, "어렵다");
	assert.strictEqual(v1.lexical.pos, "Descriptive Verb");

	// Inchoative: 익숙해졌어요 -> 익숙하다 + -어지다 (801)
	const v2 = analyzer.matchVerbSuffix("익숙해졌어요", "", "", index, analyzer.evaluateSyntaxFrame);
	assert.ok(v2, "익숙해졌어요 must match verb suffix");
	assert.strictEqual(v2.lexical.text, "익숙하다");
	assert.ok(v2.grammar.some(g => g.unit && g.unit[0] === 801), "Must include -어지다 (ID 801)");

	// Open stem formal: 배웁니다 -> 배우다 + -ㅂ니다 (50)
	const v3 = analyzer.matchVerbSuffix("배웁니다", "", "", index, analyzer.evaluateSyntaxFrame);
	assert.ok(v3, "배웁니다 must match verb suffix");
	assert.strictEqual(v3.lexical.text, "배우다");

	// Contracted past: 가서 -> 가다 + -아/어서 (459)
	const v4 = analyzer.matchVerbSuffix("가서", "", "", index, analyzer.evaluateSyntaxFrame);
	assert.ok(v4, "가서 must match verb suffix");
	assert.strictEqual(v4.lexical.text, "가다");
});

// -----------------------------------------------------------------------------
// 5. Multi-Word Sentence Constructions (/*js:matcher*/ Engine)
// -----------------------------------------------------------------------------
console.log("\n[5] Multi-Word Sentence Constructions");

check("index compiles and registers SyntaxFrame /*js:matcher*/ rules", () => {
	const index = analyzer.getIndex();
	assert.ok(Array.isArray(index.mweRules), "index.mweRules must be an array");
	assert.ok(index.mweRules.length >= 17, `Expected at least 17 MWE rules, got ${index.mweRules.length}`);

	// Test compilation of custom matcher
	const customFn = analyzer.compileMweMatcher("/*js:matcher*/ ({ w1 }) => w1 === '테스트' ? { span: 1 } : null");
	assert.strictEqual(typeof customFn, "function", "compileMweMatcher must return a function");
	assert.deepStrictEqual(customFn({ w1: "테스트" }), { span: 1 });
	assert.strictEqual(customFn({ w1: "다른단어" }), null);
});

check("analyzeSentence parses auxiliary and bound noun patterns via SyntaxFrame matchers", () => {
	// -(으)ㄹ 수 있다 (ID 522)
	const s1 = analyzer.analyzeSentence("한국어를 배울 수 있습니다.");
	const aux1 = s1.tokens.find(t => t.category === "auxiliary_construction");
	assert.ok(aux1, "Must recognize auxiliary construction for -(으)ㄹ 수 있다");
	assert.ok(aux1.surface.includes("배울 수 있습니다"));

	// -(으)ㄴ 후에 (ID 710)
	const s2 = analyzer.analyzeSentence("밥을 먹은 후에 운동을 합니다.");
	const aux2 = s2.tokens.find(t => t.category === "auxiliary_construction");
	assert.ok(aux2, "Must recognize auxiliary construction for -(으)ㄴ 후에");
	assert.ok(aux2.surface.includes("먹은 후에"));

	// -고 싶다 (ID 417)
	const s3 = analyzer.analyzeSentence("한국에 가고 싶어요.");
	const aux3 = s3.tokens.find(t => t.category === "auxiliary_construction");
	assert.ok(aux3, "Must recognize auxiliary construction for -고 싶다");
	assert.ok(aux3.surface.includes("가고 싶어요"));

	// -지 않다 (ID 274)
	const s4 = analyzer.analyzeSentence("맵지 않아요.");
	const aux4 = s4.tokens.find(t => t.category === "auxiliary_construction");
	assert.ok(aux4, "Must recognize auxiliary construction for -지 않다");
	assert.ok(aux4.surface.includes("맵지 않아요"));
});

check("isInformalConnective checks against Set populated during initialization", () => {
	const index = analyzer.getIndex();
	assert.ok(index.informalConnectiveEndings instanceof Set, "informalConnectiveEndings must be a Set");
	assert.ok(index.informalConnectiveEndings.size > 20, "informalConnectiveEndings must be dynamically populated with verb endings");

	// Key informal connective endings derived from verbs or default baseline
	assert.ok(index.informalConnectiveEndings.has("해"), "해 must be in informalConnectiveEndings");
	assert.ok(index.informalConnectiveEndings.has("돼"), "돼 must be in informalConnectiveEndings");
	assert.ok(index.informalConnectiveEndings.has("가"), "가 must be in informalConnectiveEndings");
	assert.ok(index.informalConnectiveEndings.has("와"), "와 must be in informalConnectiveEndings");
	assert.ok(index.informalConnectiveEndings.has("봐"), "봐 must be in informalConnectiveEndings");
	assert.ok(index.informalConnectiveEndings.has("드셔"), "드셔 must be in informalConnectiveEndings");

	// Evaluation with index
	assert.strictEqual(analyzer.isInformalConnective("사", index), true);
	assert.strictEqual(analyzer.isInformalConnective("가", index), true);
	assert.strictEqual(analyzer.isInformalConnective("먹어", index), true);
	assert.strictEqual(analyzer.isInformalConnective("공부해", index), true);
	assert.strictEqual(analyzer.isInformalConnective("책상", index), false);
	assert.strictEqual(analyzer.isInformalConnective("공부", index), false);

	// Evaluation without index (graceful fallback to dynamically inferred DEFAULT_INFORMAL_CONNECTIVES)
	assert.strictEqual(analyzer.isInformalConnective("해"), true);
	assert.strictEqual(analyzer.isInformalConnective("가"), true);
	assert.strictEqual(analyzer.isInformalConnective("책상"), false);

	// Verify buildInformalConnectives dynamically infers 90+ endings from units and morphology
	assert.strictEqual(typeof analyzer.buildInformalConnectives, "function", "buildInformalConnectives must be exported");
	const inferredSet = analyzer.buildInformalConnectives();
	assert.ok(inferredSet.size >= 90, `Expected at least 90 dynamically inferred endings, got ${inferredSet.size}`);
	assert.ok(inferredSet.has("드셔"), "드셔 must be dynamically derived from 드시다");
	assert.ok(inferredSet.has("마셔"), "마셔 must be dynamically derived from 마시다");
});

// -----------------------------------------------------------------------------
// 7. Compound Particle Recognition & Decomposition
// -----------------------------------------------------------------------------
console.log("\n[7] Compound Particle Recognition & Dynamic Decomposition");

check("decomposeCompoundParticle breaks down multi-clitic stacks into constituent morphemes", () => {
	const decomp1 = analyzer.decomposeCompoundParticle("으로는");
	assert.ok(decomp1, "으로는 must decompose into compound particle");
	assert.strictEqual(decomp1.p1.text, "으로");
	assert.strictEqual(decomp1.p2.text, "는");
	assert.ok(decomp1.ids.includes(1240) && decomp1.ids.includes(36));

	const decomp2 = analyzer.decomposeCompoundParticle("와는");
	assert.ok(decomp2, "와는 must decompose");
	assert.strictEqual(decomp2.p1.text, "와");
	assert.strictEqual(decomp2.p2.text, "는");

	const decomp3 = analyzer.decomposeCompoundParticle("과도");
	assert.ok(decomp3, "과도 must decompose");
	assert.strictEqual(decomp3.p1.text, "과");
	assert.strictEqual(decomp3.p2.text, "도");

	// Non-compound single particles must not false-positive
	assert.strictEqual(analyzer.decomposeCompoundParticle("는"), null);
	assert.strictEqual(analyzer.decomposeCompoundParticle(""), null);
});

check("recognizeCompoundParticle scans words and isolates known nominal stems", () => {
	const index = analyzer.getIndex();

	// Existing compound particle on dictionary noun: 선생님께서도
	const r1 = analyzer.recognizeCompoundParticle("선생님께서도", index.vocabByKo);
	assert.ok(r1, "선생님께서도 must match compound particle");
	assert.strictEqual(r1.stem, "선생님");
	assert.strictEqual(r1.compoundText, "께서도");
	assert.strictEqual(r1.isExistingSpec, true);

	// Existing compound particle on dictionary noun: 중국에서는
	const r2 = analyzer.recognizeCompoundParticle("중국에서는", index.vocabByKo);
	assert.ok(r2, "중국에서는 must match compound particle");
	assert.strictEqual(r2.stem, "중국");
	assert.strictEqual(r2.compoundText, "에서는");

	// Candidate unspec'd compound particle on dictionary noun: 책상으로는
	const r3 = analyzer.recognizeCompoundParticle("책상으로는", index.vocabByKo);
	assert.ok(r3, "책상으로는 must recognize unspec'd compound particle");
	assert.strictEqual(r3.stem, "책상");
	assert.strictEqual(r3.compoundText, "으로는");
	assert.strictEqual(r3.isExistingSpec, false);
	assert.ok(r3.suggestedSpec.includes("으로는"));

	// allowUnknownStem allows isolating stem for unrepresented words
	const r4 = analyzer.recognizeCompoundParticle("북경반점에서는", index.vocabByKo, { allowUnknownStem: true });
	assert.ok(r4, "Must isolate stem even if word is unrepresented when allowUnknownStem is true");
	assert.strictEqual(r4.stem, "북경반점");
	assert.strictEqual(r4.compoundText, "에서는");
});

// -----------------------------------------------------------------------------
// 8. Proper Name & Diminutive Scaffolder Heuristic
// -----------------------------------------------------------------------------
console.log("\n[8] Proper Name & Diminutive Scaffolder Heuristic");

const { detectProperNameCandidate, scaffoldUnit } = require('../schema_analysis.js');

check("detectProperNameCandidate identifies vocative and diminutive suffixes", () => {
	// Consonant stem + vocative -아: 미진아 -> 미진
	const n1 = detectProperNameCandidate("미진아");
	assert.ok(n1, "미진아 must be detected as proper name");
	assert.strictEqual(n1.baseName, "미진");

	// Open vowel stem + vocative -야: 영수야 -> 영수
	const n2 = detectProperNameCandidate("영수야");
	assert.ok(n2, "영수야 must be detected as proper name");
	assert.strictEqual(n2.baseName, "영수");

	// Consonant stem + diminutive -이: 미진이 -> 미진
	const n3 = detectProperNameCandidate("미진이");
	assert.ok(n3, "미진이 must be detected as proper name");
	assert.strictEqual(n3.baseName, "미진");

	// Non-Hangul or discourse words must NOT be detected as names
	assert.strictEqual(detectProperNameCandidate("오전9:40"), null);
	assert.strictEqual(detectProperNameCandidate("근데"), null);
	assert.strictEqual(detectProperNameCandidate("그리고"), null);
});

check("detectProperNameCandidate extracts dialogue speakers and event associations", () => {
	const sampleDialogue = `
오늘 리타오 집들이가 있는 거 알고 있지?
오전9:47
흐엉
그럼 근데 뭘 사가지고 가지?
에릭
글쎄...
민준
오전9:40
그거 괜찮을 것 같아.
	`;

	// Associated celebration: "리타오 집들이"
	const d1 = detectProperNameCandidate("리타오", sampleDialogue);
	assert.ok(d1, "리타오 must be detected via event association");
	assert.strictEqual(d1.baseName, "리타오");

	// Dialogue speaker turns: 흐엉, 에릭, 민준
	const d2 = detectProperNameCandidate("흐엉", sampleDialogue);
	assert.ok(d2, "흐엉 must be detected via speaker turn");
	assert.strictEqual(d2.baseName, "흐엉");

	const d3 = detectProperNameCandidate("에릭", sampleDialogue);
	assert.ok(d3, "에릭 must be detected via speaker turn");

	const d4 = detectProperNameCandidate("민준", sampleDialogue);
	assert.ok(d4, "민준 must be detected via speaker turn");

	// Timestamps must not be recognized as names
	assert.strictEqual(detectProperNameCandidate("오전9:47", sampleDialogue), null);
});

check("scaffoldUnit automatically scaffolds proper names with taxonomy tags", () => {
	const unit = scaffoldUnit("수현", "studytext99", {
		passageText: "오늘 수현 집들이가 있는 거 알고 있지?"
	});
	assert.ok(unit, "scaffoldUnit must generate unit");
	assert.strictEqual(unit.Korean, "수현");
	assert.strictEqual(unit.PartofSpeech, "Noun");
	assert.deepStrictEqual(unit.SemanticTags, ["name", "proper_noun"]);
	const vector = JSON.parse(unit.SemanticVector);
	assert.strictEqual(vector.domain, "person");
	assert.strictEqual(vector.type, "name");
});

console.log("\n======================================================");
console.log(`RESULTS: ${passedTests}/${totalTests} tests passed, ${failedTests} failed.`);
console.log("======================================================");

if (failedTests > 0) {
	process.exit(1);
}
