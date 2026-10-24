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

// -----------------------------------------------------------------------------
// 6. Performance & Arbitrary User Input (Homework / K-Pop Lyrics)
// -----------------------------------------------------------------------------
console.log("\n[6] Runtime Performance for Custom User Passages");

check("analyzePassage executes quickly on arbitrary user inputs (simulated song lyrics / homework)", () => {
	const userLyrics = `
		기억해 이 밤을.
		우리가 함께 걸었던 길.
		너를 처음 만난 날에 나는 많이 떨렸어.
		시간이 흘러도 나는 너를 사랑할 수 있어.
		언제나 내 곁에 있어 줘서 고마워요.
		다시 만날 때까지 건강하게 잘 지내십시오.
	`;

	const t0 = Date.now();
	const res = analyzer.analyzePassage(userLyrics, "UserKpopLyrics");
	const elapsed = Date.now() - t0;

	assert.ok(res.totalSentences >= 5, `Expected at least 5 sentences, got ${res.totalSentences}`);
	assert.ok(res.summary.knownVocabCount > 0, "Known vocab must be detected");
	assert.ok(res.summary.knownGrammarCount > 0, "Known grammar must be detected");
	assert.ok(elapsed < 50, `Analysis took ${elapsed}ms (target: < 50ms)`);
	console.log(`      (Processed ${res.totalSentences} sentences in ${elapsed}ms)`);
});

console.log("\n======================================================");
console.log(`RESULTS: ${passedTests}/${totalTests} tests passed, ${failedTests} failed.`);
console.log("======================================================");

if (failedTests > 0) {
	process.exit(1);
}
