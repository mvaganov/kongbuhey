const { getPartOfSpeechCached, DATA_SCHEMA, cache, KR_EN_languageUnits, hasTag } = require('./data.js');
const {
	applyMorphology,
	getFilteredWords,
	setCurrentUsageFilter,
	generateTemplateOptions,
	generateTemplateTokenOptions,
	getTotalOptionsCut,
	resetTotalOptionsCut,
	hasBatchim,
	getStem,
	markUnitUsed,
	getUsedUnitIds,
	resetUsedUnits,
	SemanticConfig,
	generateSemanticSentence,
	reconstructFromLanguageUnitTree,
	flattenLanguageUnitTree,
	encodeLanguageUnitIds,
	decodeLanguageUnitIds,
	findGrammarUnitForTemplate,
	parseSemanticVector,
	getRandom,
	getPronunciation
} = require('./korean.js');
const fs = require('fs');

let showTokens = false;
let showPronunciation = false;
var requestedTags = undefined;
if (process.argv.length > 2) {
	for (let i = 2; i < process.argv.length; ++i) {
		let arg = process.argv[i];
		if (arg === '--tokens' || arg === '--token' || arg === '--lut' || arg === 'tokens') {
			showTokens = true;
			continue;
		}
		if (arg === '--pronunciation' || arg === '--pronounce' || arg === '--pr' || arg === '--pron' || arg === 'pronunciation') {
			showPronunciation = true;
			continue;
		}
		let posTags = getPartOfSpeechCached(arg);
		if (posTags.length > 0 || cache[arg]) {
			if (!requestedTags) requestedTags = {};
			console.log(arg + " " + (posTags.length > 0 ? posTags : "Source"));
			requestedTags[arg] = true;
		} else {
			console.log(arg + " [Not found]");
		}
	}
}
setCurrentUsageFilter(requestedTags);

function generateExhaustive(template, grammarUnit) {
	let unresolvedCombinations = generateTemplateTokenOptions(template, 1);
	return unresolvedCombinations.map(c => {
		if (c && c.units) c.units.forEach(u => markUnitUsed(u));
		const s = applyMorphology(c.text);
		let formatted = s;
		if (showPronunciation) {
			formatted += ` \"${getPronunciation(s)}\"`;
		}
		if (showTokens && grammarUnit) {
			const unitIds = [grammarUnit[DATA_SCHEMA.Id], ...(c.units || []).map(u => u[DATA_SCHEMA.Id])];
			const token = encodeLanguageUnitIds(unitIds);
			formatted += ` [${token}]`;
		}
		return { raw: s, formatted: formatted };
	});
}

const KoreanWord = DATA_SCHEMA.Korean;

function validateSemanticVectors() {
	let allPos = ["Noun", "Action Verb", "Descriptive Verb", "Adverb", "Grammar"];
	let totalCount = 0;
	let taggedCount = 0;
	let invalidCount = 0;

	allPos.forEach(pos => {
		getFilteredWords(pos).forEach(unit => {
			totalCount++;
			const raw = unit[DATA_SCHEMA.SemanticVector];
			if (raw && raw !== "") {
				taggedCount++;
				try {
					if (typeof raw === 'string') JSON.parse(raw);
				} catch (e) {
					invalidCount++;
					console.error(`Invalid SemanticVector JSON for ${unit[DATA_SCHEMA.Korean]}:`, raw);
				}
			}
		});
	});

	console.log(`Semantic Vector Status: ${taggedCount}/${totalCount} units have semantic vectors (${invalidCount} JSON errors).`);
}

const badPatterns = [
	{ pattern: /\{[^}]*\}/, name: "Unresolved placeholder" },
	{ pattern: /이\/가|은\/는|을\/를|\(이\)랑|\(이\)나|이\/나|\(이\)라서|이\/라서|\(이\)라도|이\/라도|\(이\)든지|이\/든지|과\/와|와\/과/, name: "Unresolved particle alternation" },
	{ pattern: /아\/어|으\//, name: "Unresolved vowel harmony / stem marker" },
	{ pattern: /\[[a-z_]+\]/, name: "Unresolved conjugation rule tag" }
];

let validationErrors = 0;
let validatedSentencesCount = 0;

function validateSentence(sentence, contextName) {
	validatedSentencesCount++;
	for (let bp of badPatterns) {
		if (bp.pattern.test(sentence)) {
			console.error(`\n  [Grammar/Morphology Bug] ${bp.name} in "${sentence}" (${contextName})`);
			validationErrors++;
			return false;
		}
	}
	return true;
}

function runSemanticTests(currentGrammarUnits) {
	let resultLog = "\n--- Semantic Vector Context Tests ---\n";
	console.log("\n=== Semantic Vector Context Tests ===");

	const semanticTests = [
		{ name: "Because A, B", template: "{VP_AVst}으/니까 {Clause}", context: { logic: "cause_effect", polarity_match: true } },
		{ name: "But A, B", template: "{VP_AVst}는데 {Clause}", context: { logic: "contrast", polarity_match: false } },
		{ name: "If A, B", template: "{VP_AVst}으/면 {Clause}", context: { logic: "condition" } },
		{ name: "While doing A, B", template: "{AVst}으/면서 {Clause}", context: { logic: "parallel" } }
	];

	semanticTests.forEach(t => {
		const match = findGrammarUnitForTemplate(t.template);
		const targetUnit = (match && match.grammarUnit) ? match.grammarUnit : t.template;
		const header = `\n--- [Test] ${t.name} (${t.template}) ---`;
		console.log(`\n[Test] ${t.name} (${t.template}):`);
		resultLog += header + "\n";
		for (let i = 0; i < 3; i++) {
			const res = generateSemanticSentence(targetUnit, 0, t.context);
			const resolved = applyMorphology(res.ko);
			validateSentence(resolved, t.name);

			// Verify Language Unit Tree reconstruction
			const reconstructed = reconstructFromLanguageUnitTree(res.tree);
			if (reconstructed !== res.ko) {
				console.error(`  [LUT Reconstruction Error] "${reconstructed}" !== "${res.ko}"`);
			}

			let line = `  Sample ${i + 1}: ${resolved}`;
			if (showPronunciation) {
				line += ` [${getPronunciation(resolved)}]`;
			}
			if (showTokens && res.tree) {
				const token = encodeLanguageUnitIds(res.tree);
				line += ` [${token}]`;
			}
			console.log(line);
			resultLog += line + "\n";
		}
	});

	// Exercise in-scope Number units if present
	const inScopeNumbers = getFilteredWords("Number");
	if (inScopeNumbers.length > 0) {
		const numOptions = generateTemplateTokenOptions("{Number} {Noun}", 0);
		numOptions.forEach(opt => {
			if (opt.units) opt.units.forEach(u => markUnitUsed(u));
			const resolved = applyMorphology(opt.text);
			validateSentence(resolved, "Number phrase");
		});
	}

	// Also run contextual semantic samples on current source grammar templates
	if (currentGrammarUnits && currentGrammarUnits.length > 0) {
		console.log("\n--- Source Grammar Semantic Generation ---");
		resultLog += "\n--- Source Grammar Semantic Generation ---\n";
		currentGrammarUnits.forEach(gu => {
			const formulas = gu[DATA_SCHEMA.Conjugation];
			formulas.forEach(formula => {
				const sv = parseSemanticVector(gu);
				const header = `\n--- [Template] ${gu[KoreanWord]} (${formula}) ---`;
				resultLog += header + "\n";
				for (let i = 0; i < 2; i++) {
					const res = generateSemanticSentence(formula, 0, sv);
					markUnitUsed(gu);
					const resolved = applyMorphology(res.ko);
					validateSentence(resolved, gu[KoreanWord]);

					// Verify Language Unit Tree reconstruction
					const reconstructed = reconstructFromLanguageUnitTree(res.tree);
					if (reconstructed !== res.ko) {
						console.error(`  [LUT Reconstruction Error] "${reconstructed}" !== "${res.ko}"`);
					}

					let line = `  Sample ${i + 1}: ${resolved}`;
					if (showPronunciation) {
						line += ` [${getPronunciation(resolved)}]`;
					}
					if (showTokens && res.tree) {
						const token = encodeLanguageUnitIds(res.tree);
						line += ` [${token}]`;
					}
					resultLog += line + "\n";
				}
			});
		});
	}

	return resultLog;
}

// --- Execution ---

resetUsedUnits();
validateSemanticVectors();

const grammarUnits = getFilteredWords("Grammar");
const templates = [];
grammarUnits.forEach(entry => {
	entry[DATA_SCHEMA.Conjugation].forEach(formula => {
		templates.push({ formula, grammarUnit: entry });
	});
});

let outputStr = "";
templates.forEach(({ formula, grammarUnit }, index) => {
	resetTotalOptionsCut();
	process.stdout.write(`\rGenerating: ${index + 1}/${templates.length} templates processed...`);
	outputStr += `\n--- Template: ${formula} ---\n`;
	const generated = generateExhaustive(formula, grammarUnit);
	if (generated.length > 0) {
		markUnitUsed(grammarUnit);
	}
	generated.forEach(item => {
		validateSentence(item.raw, formula);
		outputStr += item.formatted + "\n";
	});
	let cutCount = getTotalOptionsCut();
	if (cutCount > 0) {
		process.stdout.write(`(${cutCount} options cut to prevent combinatorial explosion) `)
	}
});
process.stdout.write("\n");

// Append semantic tests to exhaustive output
const semanticResults = runSemanticTests(grammarUnits);
outputStr += semanticResults;

function generateCoverageReport(filter) {
	const usedIds = getUsedUnitIds();
	let inScopeUnits = [];
	let scopeName = "";

	if (filter) {
		scopeName = Object.keys(filter).join(", ");
		inScopeUnits = KR_EN_languageUnits.filter(u => {
			const src = u[DATA_SCHEMA.Source];
			if (filter[src]) return true;
			const tags = u[DATA_SCHEMA.SemanticTags];
			if (tags) {
				for (let t of tags) {
					if (filter[t]) return true;
				}
			}
			return false;
		});
	} else {
		scopeName = "All Units (Entire Curriculum)";
		inScopeUnits = KR_EN_languageUnits;
	}

	const usedInScope = inScopeUnits.filter(u => usedIds.has(u[DATA_SCHEMA.Id]));
	const unusedInScope = inScopeUnits.filter(u => !usedIds.has(u[DATA_SCHEMA.Id]));

	const totalInScope = inScopeUnits.length;
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

	return reportLines;
}

const coverageReport = generateCoverageReport(requestedTags);

// Print coverage report to console
console.log("\n" + coverageReport.join("\n"));

// Append coverage report to exhaustive_output.txt with '--- ' prefix on every line so validator skips it
outputStr += "\n" + coverageReport.map(line => `--- ${line}`).join("\n") + "\n";

const outputFilename = requestedTags ? `exhaustive_output_${Object.keys(requestedTags).join('_')}.txt` : 'exhaustive_output.txt';
fs.writeFileSync('exhaustive_output.txt', outputStr, 'utf8');
if (outputFilename !== 'exhaustive_output.txt') {
	fs.writeFileSync(outputFilename, outputStr, 'utf8');
}
console.log(`\nWrote output directly to exhaustive_output.txt${outputFilename !== 'exhaustive_output.txt' ? ' and ' + outputFilename : ''} in UTF-8 format.`);
if (validationErrors === 0) {
	console.log(`Validation: ALL ${validatedSentencesCount} generated sentences PASSED morphology and grammar checks (0 errors).`);
} else {
	console.error(`Validation: FAILED - ${validationErrors} syntax/morphology errors detected across ${validatedSentencesCount} sentences.`);
}
