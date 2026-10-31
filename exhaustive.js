/**
 * exhaustive.js - Comprehensive Sentence Generation Engine & Linguistic Triage Dashboard
 *
 * Exhaustively exercises both Korean generation engines:
 *   1. Engine v2 (Unit-Based AST Generator): Generates dual-translated sentences across
 *      all 9 Parts of Speech with full AST provenance and semantic constraints.
 *   2. Engine v1 (Legacy Template Formulas): Expands all grammar formula permutations.
 *
 * Automatically inspects every sentence using `SentenceValidator` to discover:
 *   - Valency/transitivity mismatches (accusative with intransitive/passive/weather verbs)
 *   - Inanimate agent mismatches (inanimate nouns doing volitional human actions)
 *   - Redundant double objects in multi-word verb phrases
 *   - Classifier domain mismatches (e.g. counting humans with 개 or books with 마리)
 *   - AST provenance desync (mismatches between surface Korean, eojeols, and morpheme segments)
 *   - Unresolved template placeholders, particle alternations, or conjugation tags
 *
 * Produces a structured Triage Dashboard in `exhaustive_output.txt` prioritizing
 * any suspicious sentences in an LLM Agent Triage Queue for rapid review.
 *
 * USAGE:
 *   node exhaustive.js [OPTIONS] [TAGS/SOURCES...]
 */

const fs = require('fs');
const { getPartOfSpeechCached, DATA_SCHEMA, cache, KR_EN_languageUnits, hasTag } = require('./data.js');
const {
	applyMorphology,
	getFilteredWords,
	setCurrentUsageFilter,
	generateTemplateTokenOptions,
	getTotalOptionsCut,
	resetTotalOptionsCut,
	markUnitUsed,
	getUsedUnitIds,
	resetUsedUnits,
	generateSemanticSentence,
	reconstructFromLanguageUnitTree,
	encodeLanguageUnitIds,
	findGrammarUnitForTemplate,
	parseSemanticVector,
	getPronunciation,
	generateSentencesForUnit,
	validateSentenceAST,
	validateSentenceString,
	setRandomSeed,
	getRandomSeed
} = require('./korean.js');

function printHelp() {
	console.log(`exhaustive.js - Exhaustive Korean sentence generator & linguistic validation dashboard

USAGE:
  node exhaustive.js [OPTIONS] [TAGS/SOURCES...]

OPTIONS:
  --id <id|id1,id2,...>  Filter testing to specific language unit ID(s)
  --range <start>-<end>  Filter testing to a range of IDs (e.g. 0-40 or 0..40)
  --pos <pos>            Filter testing to a specific Part of Speech (e.g. Noun, Adverb)
  --unit, --ast          Run only Unit AST sentence generation (Engine v2)
  --legacy, --templates  Run only Legacy Template formula generation (Engine v1)
  --tokens, --lut        Show encoded Language Unit Tree tokens for generated sentences
  --pronunciation, --pr  Show phonetic pronunciation in brackets
  --seed <number>        Deterministic PRNG seed (default: Date.now() timestamp)
  -h, --help             Show this help message

EXAMPLES:
  node exhaustive.js                     # Test full curriculum (both engines)
  node exhaustive.js SUOBI01             # Scope to source SUOBI01
  node exhaustive.js --id 361            # Test unit ID 361 (이, teeth)
  node exhaustive.js --pos Adverb        # Test all Adverb units
  node exhaustive.js --range 0-40        # Test units in ID range 0..40
`);
}

// --- CLI Option Parsing ---
let showTokens = false;
let showPronunciation = false;
let modeOnlyUnit = false;
let modeOnlyLegacy = false;
let targetPosFilter = null;
let requestedTags = undefined;
let cliSeed = null;

if (process.argv.length > 2) {
	for (let i = 2; i < process.argv.length; ++i) {
		const arg = process.argv[i];
		if (arg === '-h' || arg === '--help' || arg === 'help') {
			printHelp();
			process.exit(0);
		}
		if (arg === '--seed' || arg === '-seed') {
			const val = parseInt(process.argv[++i], 10);
			if (!isNaN(val)) cliSeed = val;
			continue;
		}
		if (arg.startsWith('--seed=')) {
			const val = parseInt(arg.slice(7), 10);
			if (!isNaN(val)) cliSeed = val;
			continue;
		}
		if (arg === '--tokens' || arg === '--token' || arg === '--lut' || arg === 'tokens') {
			showTokens = true;
			continue;
		}
		if (arg === '--pronunciation' || arg === '--pronounce' || arg === '--pr' || arg === '--pron' || arg === 'pronunciation') {
			showPronunciation = true;
			continue;
		}
		if (arg === '--unit' || arg === '--ast') {
			modeOnlyUnit = true;
			continue;
		}
		if (arg === '--legacy' || arg === '--templates') {
			modeOnlyLegacy = true;
			continue;
		}
		if (arg === '--pos') {
			targetPosFilter = process.argv[++i];
			continue;
		}
		if (arg === '--id' || arg === '-id') {
			const val = process.argv[++i];
			if (val) {
				if (!requestedTags) requestedTags = {};
				if (!requestedTags._ids) requestedTags._ids = new Set();
				val.split(',').forEach(idStr => {
					const num = parseInt(idStr.trim(), 10);
					if (!isNaN(num)) requestedTags._ids.add(num);
				});
			}
			continue;
		}
		if (arg === '--range' || arg === '-range') {
			const val = process.argv[++i];
			if (val) {
				const match = val.match(/^(\d+)(?:\.\.|-)(\d+)$/);
				if (match) {
					if (!requestedTags) requestedTags = {};
					if (!requestedTags._ids) requestedTags._ids = new Set();
					const start = parseInt(match[1], 10);
					const end = parseInt(match[2], 10);
					for (let n = Math.min(start, end); n <= Math.max(start, end); n++) {
						requestedTags._ids.add(n);
					}
				}
			}
			continue;
		}
		const posTags = getPartOfSpeechCached(arg);
		if (posTags.length > 0 || cache[arg]) {
			if (!requestedTags) requestedTags = {};
			console.log(arg + " " + (posTags.length > 0 ? posTags : "Source"));
			requestedTags[arg] = true;
		} else {
			console.log(arg + " [Not found]");
		}
	}
}

const runSeed = cliSeed !== null ? cliSeed : Date.now();
setRandomSeed(runSeed);
console.log(`[PRNG] Deterministic Seed: ${runSeed}${cliSeed !== null ? ' (CLI override)' : ' (Timestamp default)'}`);

setCurrentUsageFilter(requestedTags);
resetUsedUnits();

// --- Scope Determination ---
let inScopeUnits = KR_EN_languageUnits;
if (requestedTags) {
	if (requestedTags._ids && requestedTags._ids.size > 0) {
		inScopeUnits = KR_EN_languageUnits.filter(u => requestedTags._ids.has(u[DATA_SCHEMA.Id]));
	} else {
		inScopeUnits = KR_EN_languageUnits.filter(u => {
			const src = u[DATA_SCHEMA.Source];
			if (requestedTags[src]) return true;
			const tags = u[DATA_SCHEMA.SemanticTags];
			if (tags) {
				for (const t of tags) {
					if (requestedTags[t]) return true;
				}
			}
			return false;
		});
	}
}

if (targetPosFilter) {
	inScopeUnits = inScopeUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === targetPosFilter);
}

// --- Tracking State ---
let validatedSentencesCount = 0;
let validationErrors = 0;
let validationWarnings = 0;
const triageQueue = [];

function registerTriageIssue(item) {
	triageQueue.push(item);
}

// --- Semantic Vector Integrity Check ---
function validateSemanticVectors() {
	const allPos = ["Noun", "Action Verb", "Descriptive Verb", "Adverb", "Grammar"];
	let totalCount = 0;
	let taggedCount = 0;
	let invalidCount = 0;

	allPos.forEach(pos => {
		getFilteredWords(pos).forEach(unit => {
			totalCount++;
			const raw = unit[DATA_SCHEMA.SemanticData];
			if (raw && raw !== "") {
				taggedCount++;
				try {
					if (typeof raw === 'string') JSON.parse(raw);
				} catch (e) {
					invalidCount++;
					console.error(`Invalid SemanticData JSON for ${unit[DATA_SCHEMA.Korean]}:`, raw);
				}
			}
		});
	});

	console.log(`Semantic Vector Status: ${taggedCount}/${totalCount} units have semantic vectors (${invalidCount} JSON errors).`);
}

validateSemanticVectors();

// =========================================================================
// Engine v2: AST Unit-Based Exhaustive Sentence Generation
// =========================================================================
let astOutputStr = "";
let astGeneratedCount = 0;

if (!modeOnlyLegacy) {
	const totalUnitsToTest = inScopeUnits.length;
	console.log(`\n[Engine v2: AST Sentence Generation] Processing ${totalUnitsToTest} in-scope units...`);

	inScopeUnits.forEach((unit, idx) => {
		if ((idx + 1) % 200 === 0 || idx + 1 === totalUnitsToTest) {
			process.stdout.write(`\rGenerating AST sentences: ${idx + 1}/${totalUnitsToTest} units processed...`);
		}

		markUnitUsed(unit);
		const genRes = generateSentencesForUnit(unit, 3, { allowedUnitIds: requestedTags?._ids });
		if (!genRes || !Array.isArray(genRes.sentences)) return;

		const unitId = unit[DATA_SCHEMA.Id];
		const unitKo = unit[DATA_SCHEMA.Korean];
		const unitPos = unit[DATA_SCHEMA.PartofSpeech];
		const unitEn = unit[DATA_SCHEMA.English];

		genRes.sentences.forEach((s, sIdx) => {
			astGeneratedCount++;
			validatedSentencesCount++;

			// Mark all units utilized by this sentence
			if (Array.isArray(s.unitsUsed)) {
				for (const uInfo of s.unitsUsed) {
					if (typeof uInfo.unitId === 'number' && KR_EN_languageUnits[uInfo.unitId]) {
						markUnitUsed(KR_EN_languageUnits[uInfo.unitId]);
					}
				}
			}

			// Automated Linguistic & Provenance Validation
			const valRes = validateSentenceAST(s.ast, s);
			const strRes = validateSentenceString(s.ko, unitKo);
			const allErrors = [...valRes.errors, ...strRes.errors];
			const allWarnings = [...valRes.warnings, ...strRes.warnings];

			if (allErrors.length > 0) validationErrors += allErrors.length;
			if (allWarnings.length > 0) validationWarnings += allWarnings.length;

			if (allErrors.length > 0 || allWarnings.length > 0) {
				registerTriageIssue({
					unitId,
					unitKo,
					unitPos,
					unitEn,
					variationIndex: sIdx,
					ko: s.ko,
					enLiteral: s.enLiteral,
					enNatural: s.enNatural,
					errors: allErrors,
					warnings: allWarnings
				});
			}

			// Format detailed sentence entry
			let line = `  [#${unitId} ${unitKo} (${unitPos}) var.${sIdx + 1}] ${s.ko}`;
			if (showPronunciation && s.pronunciation) {
				line += ` "${s.pronunciation}"`;
			}
			if (showTokens && Array.isArray(s.unitIds)) {
				line += ` [${encodeLanguageUnitIds(s.unitIds)}]`;
			}
			line += `\n        enLit: "${s.enLiteral}"\n        enNat: "${s.enNatural}"\n`;
			astOutputStr += line;
		});
	});
	process.stdout.write("\n");
}

// =========================================================================
// Engine v1: Legacy Template Formula Permutation Generation
// =========================================================================
let legacyOutputStr = "";
let legacyGeneratedCount = 0;

if (!modeOnlyUnit) {
	const grammarUnits = getFilteredWords("Grammar");
	let activeGrammarUnits = grammarUnits;
	if (requestedTags && requestedTags._ids && requestedTags._ids.size > 0) {
		const requestedGrammars = grammarUnits.filter(g => requestedTags._ids.has(g[DATA_SCHEMA.Id]));
		if (requestedGrammars.length > 0) {
			activeGrammarUnits = requestedGrammars;
		}
	}

	const templates = [];
	activeGrammarUnits.forEach(entry => {
		const conj = entry[DATA_SCHEMA.Conjugation];
		if (Array.isArray(conj)) {
			conj.forEach(formula => {
				templates.push({ formula, grammarUnit: entry });
			});
		}
	});

	console.log(`\n[Engine v1: Template Expansion] Processing ${templates.length} grammar formulas...`);

	templates.forEach(({ formula, grammarUnit }, index) => {
		resetTotalOptionsCut();
		if ((index + 1) % 50 === 0 || index + 1 === templates.length) {
			process.stdout.write(`\rGenerating templates: ${index + 1}/${templates.length} formulas processed...`);
		}

		legacyOutputStr += `\n--- Template: ${formula} ---\n`;
		const unresolvedCombinations = generateTemplateTokenOptions(formula, 1);
		if (unresolvedCombinations.length > 0) {
			markUnitUsed(grammarUnit);
		}

		unresolvedCombinations.forEach(c => {
			if (c && c.units) c.units.forEach(u => markUnitUsed(u));
			const rawKo = applyMorphology(c.text);
			legacyGeneratedCount++;
			validatedSentencesCount++;

			const strVal = validateSentenceString(rawKo, formula);
			if (strVal.errors.length > 0) {
				validationErrors += strVal.errors.length;
				registerTriageIssue({
					unitId: grammarUnit[DATA_SCHEMA.Id],
					unitKo: grammarUnit[DATA_SCHEMA.Korean],
					unitPos: "Grammar",
					unitEn: grammarUnit[DATA_SCHEMA.English],
					variationIndex: 0,
					ko: rawKo,
					enLiteral: "",
					enNatural: "",
					errors: strVal.errors,
					warnings: strVal.warnings
				});
			}

			let formatted = rawKo;
			if (showPronunciation) formatted += ` "${getPronunciation(rawKo)}"`;
			if (showTokens && grammarUnit) {
				const unitIds = [grammarUnit[DATA_SCHEMA.Id], ...(c.units || []).map(u => u[DATA_SCHEMA.Id])];
				formatted += ` [${encodeLanguageUnitIds(unitIds)}]`;
			}
			legacyOutputStr += formatted + "\n";
		});
	});
	const cutCount = getTotalOptionsCut();
	if (cutCount > 0) {
		process.stdout.write(`(${cutCount} options cut to prevent combinatorial explosion) `);
	}
	process.stdout.write("\n");
}

// =========================================================================
// Semantic Vector Context Tests
// =========================================================================
function runSemanticTests() {
	let resultLog = "\n--- Semantic Vector Context Tests ---\n";
	const semanticTests = [
		{ name: "Because A, B", template: "{VP_AVst}으/니까 {Clause}", context: { logic: "cause_effect", polarity_match: true } },
		{ name: "But A, B", template: "{VP_AVst}는데 {Clause}", context: { logic: "contrast", polarity_match: false } },
		{ name: "If A, B", template: "{VP_AVst}으/면 {Clause}", context: { logic: "condition" } },
		{ name: "While doing A, B", template: "{AVst}으/면서 {Clause}", context: { logic: "parallel" } }
	];

	semanticTests.forEach(t => {
		const match = findGrammarUnitForTemplate(t.template);
		const targetUnit = (match && match.grammarUnit) ? match.grammarUnit : t.template;
		resultLog += `\n--- [Test] ${t.name} (${t.template}) ---\n`;

		for (let i = 0; i < 3; i++) {
			const res = generateSemanticSentence(targetUnit, 0, t.context);
			const resolved = applyMorphology(res.ko);
			validatedSentencesCount++;

			const strVal = validateSentenceString(resolved, t.name);
			if (strVal.errors.length > 0) {
				validationErrors += strVal.errors.length;
				registerTriageIssue({
					unitId: null,
					unitKo: t.template,
					unitPos: "Grammar",
					unitEn: t.name,
					variationIndex: i,
					ko: resolved,
					enLiteral: "",
					enNatural: "",
					errors: strVal.errors,
					warnings: strVal.warnings
				});
			}

			// Verify Language Unit Tree reconstruction
			const reconstructed = reconstructFromLanguageUnitTree(res.tree);
			if (reconstructed !== res.ko) {
				console.error(`  [LUT Reconstruction Error] "${reconstructed}" !== "${res.ko}"`);
			}

			let line = `  Sample ${i + 1}: ${resolved}`;
			if (showPronunciation) line += ` [${getPronunciation(resolved)}]`;
			if (showTokens && res.tree) line += ` [${encodeLanguageUnitIds(res.tree)}]`;
			resultLog += line + "\n";
		}
	});

	return resultLog;
}

const semanticResults = (!modeOnlyUnit) ? runSemanticTests() : "";

// =========================================================================
// Coverage Reporting
// =========================================================================
function generateCoverageReport(filter) {
	const usedIds = getUsedUnitIds();
	let scopeUnits = [];
	let scopeName = "";

	if (filter) {
		if (filter._ids && filter._ids.size > 0) {
			const sortedIds = Array.from(filter._ids).sort((a, b) => a - b);
			scopeName = sortedIds.length <= 10
				? `IDs: ${sortedIds.join(', ')}`
				: `IDs: ${sortedIds[0]}..${sortedIds[sortedIds.length - 1]} (${sortedIds.length} units)`;
			scopeUnits = KR_EN_languageUnits.filter(u => filter._ids.has(u[DATA_SCHEMA.Id]));
		} else {
			scopeName = Object.keys(filter).filter(k => !k.startsWith('_')).join(", ");
			scopeUnits = KR_EN_languageUnits.filter(u => {
				const src = u[DATA_SCHEMA.Source];
				if (filter[src]) return true;
				const tags = u[DATA_SCHEMA.SemanticTags];
				if (tags) {
					for (const t of tags) {
						if (filter[t]) return true;
					}
				}
				return false;
			});
		}
	} else {
		scopeName = "All Units (Entire Curriculum)";
		scopeUnits = KR_EN_languageUnits;
	}

	if (targetPosFilter) {
		scopeName += ` [POS: ${targetPosFilter}]`;
		scopeUnits = scopeUnits.filter(u => u[DATA_SCHEMA.PartofSpeech] === targetPosFilter);
	}

	const usedInScope = scopeUnits.filter(u => usedIds.has(u[DATA_SCHEMA.Id]));
	const unusedInScope = scopeUnits.filter(u => !usedIds.has(u[DATA_SCHEMA.Id]));

	const totalInScope = scopeUnits.length;
	const usedCount = usedInScope.length;
	const unusedCount = unusedInScope.length;
	const usedPct = totalInScope > 0 ? ((usedCount / totalInScope) * 100).toFixed(1) : "0.0";
	const unusedPct = totalInScope > 0 ? ((unusedCount / totalInScope) * 100).toFixed(1) : "0.0";

	const reportLines = [];
	reportLines.push("==================================================");
	reportLines.push("           LANGUAGE UNIT COVERAGE REPORT          ");
	reportLines.push("==================================================");
	reportLines.push(`Scope: ${scopeName}`);
	reportLines.push(`In-Scope Units:  ${totalInScope}`);
	reportLines.push(`Used Units:      ${usedCount} (${usedPct}%)`);
	reportLines.push(`Unused Units:    ${unusedCount} (${unusedPct}%)`);
	reportLines.push(`Total Used Across All Curriculum Units: ${usedIds.size}/${KR_EN_languageUnits.length}`);
	reportLines.push("--------------------------------------------------");

	if (unusedInScope.length === 0) {
		reportLines.push("All in-scope language units were used in sentence generation! (100% Coverage)");
	} else {
		reportLines.push(`Unused Language Units in Scope (${unusedInScope.length}):`);
		unusedInScope.forEach(unit => {
			const id = String(unit[DATA_SCHEMA.Id]).padStart(4, ' ');
			const ko = unit[DATA_SCHEMA.Korean];
			const en = unit[DATA_SCHEMA.English];
			const pos = unit[DATA_SCHEMA.PartofSpeech];
			const src = unit[DATA_SCHEMA.Source];
			const tags = Array.from(unit[DATA_SCHEMA.SemanticTags] || []).join(", ");
			const tagStr = tags ? ` [tags: ${tags}]` : "";
			reportLines.push(`  [ID ${id}] ${ko} (${pos}, ${src}) - "${en}"${tagStr}`);
		});
	}
	reportLines.push("==================================================");

	return { reportLines, usedCount, unusedCount, totalInScope, scopeName };
}

const coverage = generateCoverageReport(requestedTags);

// =========================================================================
// Assemble Triage Dashboard & Output Files
// =========================================================================
let dashboardHeader = "";
dashboardHeader += "======================================================================\n";
dashboardHeader += "               EXHAUSTIVE TEST & LINGUISTIC TRIAGE DASHBOARD          \n";
dashboardHeader += "======================================================================\n";
dashboardHeader += `Scope:                    ${coverage.scopeName}\n`;
dashboardHeader += `Seed:                     ${runSeed} (Reproduce with: node exhaustive.js --seed ${runSeed})\n`;
dashboardHeader += `Total Sentences Checked:  ${validatedSentencesCount.toLocaleString()} (AST: ${astGeneratedCount}, Templates: ${legacyGeneratedCount})\n`;
dashboardHeader += `Validation Errors:        ${validationErrors}\n`;
dashboardHeader += `Validation Warnings:      ${validationWarnings}\n`;
dashboardHeader += `Unit Curriculum Coverage: ${coverage.usedCount}/${coverage.totalInScope} in-scope units (${((coverage.usedCount / (coverage.totalInScope || 1)) * 100).toFixed(1)}%)\n`;
dashboardHeader += "======================================================================\n\n";

dashboardHeader += "----------------------------------------------------------------------\n";
dashboardHeader += `>>> LLM AGENT TRIAGE QUEUE (${triageQueue.length} flagged sentences requiring inspection) <<<\n`;
if (triageQueue.length > 0) {
	dashboardHeader += `>>> Run Seed: ${runSeed} (To reproduce: node exhaustive.js --seed ${runSeed}) <<<\n`;
}
dashboardHeader += "----------------------------------------------------------------------\n";

if (triageQueue.length === 0) {
	dashboardHeader += "All generated sentences passed grammatical, morphological, and valency verification.\n";
	dashboardHeader += "No items in triage queue.\n";
} else {
	triageQueue.forEach((item, qIdx) => {
		const flag = item.errors.length > 0 ? "[FAIL]" : "[WARN]";
		dashboardHeader += `\n#${qIdx + 1} ${flag} Unit: [ID ${item.unitId}] ${item.unitKo} (${item.unitPos}) - "${item.unitEn}"\n`;
		dashboardHeader += `    Hangul:   ${item.ko}\n`;
		if (item.enLiteral) dashboardHeader += `    Literal:  ${item.enLiteral}\n`;
		if (item.enNatural) dashboardHeader += `    Natural:  ${item.enNatural}\n`;
		dashboardHeader += `    Diagnoses:\n`;
		item.errors.forEach(e => {
			dashboardHeader += `      - [ERROR ${e.code}] ${e.message}\n`;
		});
		item.warnings.forEach(w => {
			dashboardHeader += `      - [WARN ${w.code}] ${w.message}\n`;
		});
	});
}
dashboardHeader += "----------------------------------------------------------------------\n\n";

let fullFileContent = dashboardHeader;

if (astOutputStr) {
	fullFileContent += "\n======================================================================\n";
	fullFileContent += "                 ENGINE v2: AST UNIT SENTENCES GENERATED               \n";
	fullFileContent += "======================================================================\n";
	fullFileContent += astOutputStr;
}

if (legacyOutputStr) {
	fullFileContent += "\n======================================================================\n";
	fullFileContent += "               ENGINE v1: TEMPLATE PERMUTATIONS GENERATED              \n";
	fullFileContent += "======================================================================\n";
	fullFileContent += legacyOutputStr;
}

if (semanticResults) {
	fullFileContent += "\n======================================================================\n";
	fullFileContent += "                     SEMANTIC VECTOR CONTEXT TESTS                     \n";
	fullFileContent += "======================================================================\n";
	fullFileContent += semanticResults;
}

// Append coverage report to file with '--- ' prefix on every line so sentence parsers skip it
fullFileContent += "\n" + coverage.reportLines.map(line => `--- ${line}`).join("\n") + "\n";

// Write files
let tagLabel = "";
if (requestedTags) {
	if (requestedTags._ids) {
		const sorted = Array.from(requestedTags._ids).sort((a, b) => a - b);
		tagLabel = `ids_${sorted[0]}_${sorted[sorted.length - 1]}`;
	} else {
		tagLabel = Object.keys(requestedTags).filter(k => !k.startsWith('_')).join('_');
	}
}
if (targetPosFilter) {
	tagLabel += (tagLabel ? '_' : '') + targetPosFilter;
}

const outputFilename = tagLabel ? `exhaustive_output_${tagLabel}.txt` : 'exhaustive_output.txt';
fs.writeFileSync('exhaustive_output.txt', fullFileContent, 'utf8');
if (outputFilename !== 'exhaustive_output.txt') {
	fs.writeFileSync(outputFilename, fullFileContent, 'utf8');
}

// Print Coverage Report to Console
console.log("\n" + coverage.reportLines.join("\n"));

console.log(`\nWrote output directly to exhaustive_output.txt${outputFilename !== 'exhaustive_output.txt' ? ' and ' + outputFilename : ''} in UTF-8 format.`);

// Triage summary for LLM agent
if (triageQueue.length > 0) {
	console.log(`Triage Queue: ${validationErrors} errors, ${validationWarnings} warnings flagged in exhaustive_output.txt for inspection.`);
	console.log(`Run Seed: ${runSeed} - Re-run with '--seed ${runSeed}' to reproduce.`);
} else {
	console.log(`Triage Queue: 0 errors, 0 warnings (100% clean linguistic audit).`);
}

// Exit reporting (Exact string required by test.js Stage 4)
if (validationErrors === 0) {
	console.log(`Validation: ALL ${validatedSentencesCount} generated sentences PASSED morphology and grammar checks (0 errors).`);
	process.exit(0);
} else {
	console.error(`Validation: FAILED - ${validationErrors} syntax/morphology errors detected across ${validatedSentencesCount} sentences.`);
	console.error(`Run Seed: ${runSeed} - Re-run with: node exhaustive.js --seed ${runSeed}`);
	process.exit(1);
}
