(function() {
/**
 * korean/analyzer/passage_analyzer.js
 *
 * Passage-Level Ingestion, Aggregation, and Dual Report Generation Engine.
 * Pure platform-independent core: safe for both Node.js and browser web apps.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero dependencies).
 */

const { DATA_SCHEMA } =
	(typeof require !== 'undefined' ? require('../core/primitives.js') : window);

const { analyzeSentence } =
	(typeof require !== 'undefined' ? require('./sentence_analyzer.js') : window);

const { getIndex } =
	(typeof require !== 'undefined' ? require('./indexer.js') : window);

/**
 * Analyzes an entire Korean text passage, decomposing it into sentences, tokens,
 * active curriculum vocabulary/grammar units, and curriculum gap inventory.
 * 
 * @param {string} passageText Natural Korean text passage
 * @param {string} passageName Human-readable identifier or key
 * @param {Object} explicitIndex Optional pre-built index
 * @returns {Object} Comprehensive passage analysis result
 */
function analyzePassage(passageText, passageName = "Passage", explicitIndex = null) {
	const index = explicitIndex || getIndex();

	// Clean boilerplate / metadata headers
	let cleanedText = (passageText || "")
		.replace(/^#+.*$/gm, '')
		.replace(/^[↳\s]+/gm, '')
		.trim();

	if (!/^[가-힣]/.test(cleanedText)) {
		cleanedText = cleanedText.replace(/^[^가-힣]+/, '').trim();
	}

	// Split into sentences using Korean punctuation terminators
	const rawSentences = cleanedText
		.split(/(?<=[.?!])\s+/)
		.map(s => s.trim())
		.filter(s => s.length > 0 && /[가-힣]/.test(s));

	const sentences = rawSentences.map((s, idx) => analyzeSentence(s, idx + 1, index));

	// Aggregate statistics
	const knownVocab = new Map();
	const knownGrammar = new Map();
	const missingVocab = new Map();
	const missingGrammar = new Map();
	const disambiguations = [];

	sentences.forEach(sent => {
		sent.tokens.forEach(t => {
			if (!t) return;

			// Disambiguations
			if (t.disambiguation) {
				disambiguations.push({
					sentenceIndex: sent.sentenceIndex,
					surface: t.surface,
					target: t.disambiguation.target,
					rule: t.disambiguation.rule,
					intentional_ambiguity: t.disambiguation.intentional_ambiguity
				});
			}

			// Lexical unit
			if (t.lexical) {
				if (t.category === "compound_noun" && t.lexical.components) {
					t.lexical.components.forEach(comp => {
						if (comp.unit) {
							const id = comp.unit[DATA_SCHEMA.Id];
							if (!knownVocab.has(id)) knownVocab.set(id, { unit: comp.unit, count: 0 });
							knownVocab.get(id).count++;
						} else if (comp.missing) {
							const k = comp.text;
							if (!missingVocab.has(k)) missingVocab.set(k, { text: k, pos: "Noun", gloss: comp.gloss, count: 0, contexts: [] });
							missingVocab.get(k).count++;
							missingVocab.get(k).contexts.push(`Sent ${sent.sentenceIndex}: ${t.surface}`);
						}
					});
				} else if (t.category === "numeric_phrase" && t.lexical.counter) {
					const c = t.lexical.counter;
					if (c.unit) {
						const id = c.unit[DATA_SCHEMA.Id];
						if (!knownVocab.has(id)) knownVocab.set(id, { unit: c.unit, count: 0 });
						knownVocab.get(id).count++;
					} else if (c.missing) {
						const k = c.text;
						if (!missingVocab.has(k)) missingVocab.set(k, { text: k, pos: "Noun (Counter)", gloss: c.gloss, count: 0, contexts: [] });
						missingVocab.get(k).count++;
						missingVocab.get(k).contexts.push(`Sent ${sent.sentenceIndex}: ${t.surface}`);
					}
				} else if (t.lexical.unit) {
					const id = t.lexical.unit[DATA_SCHEMA.Id];
					if (!knownVocab.has(id)) knownVocab.set(id, { unit: t.lexical.unit, count: 0 });
					knownVocab.get(id).count++;
				} else if (t.lexical.missing) {
					const k = t.lexical.text;
					if (!missingVocab.has(k)) {
						missingVocab.set(k, {
							text: k,
							pos: t.lexical.pos,
							gloss: t.lexical.gloss,
							tags: t.lexical.suggestedTags || [],
							count: 0,
							contexts: []
						});
					}
					missingVocab.get(k).count++;
					missingVocab.get(k).contexts.push(`Sent ${sent.sentenceIndex}: ${t.surface}`);
				}
			}

			// Grammar units
			if (t.grammar && Array.isArray(t.grammar)) {
				t.grammar.forEach(g => {
					if (g.unit) {
						const id = g.unit[DATA_SCHEMA.Id];
						if (!knownGrammar.has(id)) knownGrammar.set(id, { unit: g.unit, count: 0 });
						knownGrammar.get(id).count++;
					} else if (g.missing) {
						const k = g.text;
						if (!missingGrammar.has(k)) missingGrammar.set(k, { text: k, pos: g.pos, gloss: g.gloss, count: 0, contexts: [] });
						missingGrammar.get(k).count++;
						missingGrammar.get(k).contexts.push(`Sent ${sent.sentenceIndex}: ${t.surface}`);
					}
				});
			}
		});
	});

	return {
		passageName,
		totalSentences: sentences.length,
		sentences,
		draftFile: null,
		summary: {
			knownVocabCount: knownVocab.size,
			knownGrammarCount: knownGrammar.size,
			missingVocabCount: missingVocab.size,
			missingGrammarCount: missingGrammar.size,
			disambiguationsCount: disambiguations.length
		},
		knownVocab: Array.from(knownVocab.values()),
		knownGrammar: Array.from(knownGrammar.values()),
		missingVocab: Array.from(missingVocab.values()),
		missingGrammar: Array.from(missingGrammar.values()),
		disambiguations
	};
}

/**
 * Formats a comprehensive text report of the passage analysis.
 * 
 * @param {Object} result Output from analyzePassage
 * @returns {string} Formatted report
 */
function formatAnalysisReport(result) {
	const lines = [];
	lines.push("================================================================================");
	lines.push(`PASSAGE MORPHOLOGICAL ANALYSIS REPORT: ${result.passageName}`);
	lines.push("================================================================================");
	lines.push(`Total Sentences: ${result.totalSentences}`);
	lines.push(`Known Vocabulary Units:    ${result.summary.knownVocabCount}`);
	lines.push(`Known Grammar Patterns:    ${result.summary.knownGrammarCount}`);
	lines.push(`Missing Vocabulary Gaps:   ${result.summary.missingVocabCount}`);
	lines.push(`Missing Grammar Gaps:      ${result.summary.missingGrammarCount}`);
	lines.push(`Disambiguations Resolved:  ${result.summary.disambiguationsCount}`);
	lines.push("--------------------------------------------------------------------------------");

	// 1. Sentence-by-Sentence Breakdown
	lines.push("\n1. SENTENCE-BY-SENTENCE DECOMPOSITION");
	lines.push("--------------------------------------------------------------------------------");
	result.sentences.forEach(s => {
		lines.push(`\n[Sentence ${s.sentenceIndex}] "${s.text}"`);
		s.tokens.forEach(t => {
			if (!t) return;
			let tokenLine = `  - "${t.surface}" (${t.category})`;
			if (t.lexical) {
				if (t.lexical.components) {
					const comps = t.lexical.components.map(c => `${c.text}${c.unit ? ` [ID ${c.unit[DATA_SCHEMA.Id]}]` : ' [MISSING]'}`).join(' + ');
					tokenLine += `\n      Lexical Compound: ${comps}`;
				} else {
					const idStr = t.lexical.unit ? `ID ${t.lexical.unit[DATA_SCHEMA.Id]}` : "MISSING";
					tokenLine += `\n      Lexical: ${t.lexical.text} [${t.lexical.pos}] (${idStr}) - "${t.lexical.gloss}"`;
				}
			}
			if (t.grammar && t.grammar.length > 0) {
				const gStrs = t.grammar.map(g => {
					const idStr = g.unit ? `ID ${g.unit[DATA_SCHEMA.Id]}` : "MISSING";
					return `${g.text} [${g.pos}] (${idStr})`;
				});
				tokenLine += `\n      Grammar: ${gStrs.join(', ')}`;
			}
			if (t.disambiguation) {
				tokenLine += `\n      Disambiguation: -> ${t.disambiguation.target}`;
				tokenLine += `\n      Rule: ${t.disambiguation.rule}`;
				if (t.disambiguation.intentional_ambiguity) {
					tokenLine += ` [NOTE: Pedagogical Ambiguity Preserved]`;
				}
			}
			lines.push(tokenLine);
		});
	});

	// 2. Student Study Guide
	lines.push("\n================================================================================");
	lines.push("2. LEARNER STUDY CHECKLIST (Active Language Units in this Passage)");
	lines.push("================================================================================");
	lines.push(`\n[A. Vocabulary to Master (${result.knownVocab.length} units)]`);
	result.knownVocab.forEach(item => {
		const u = item.unit;
		const id = String(u[DATA_SCHEMA.Id]).padStart(4, ' ');
		const ko = u[DATA_SCHEMA.Korean].padEnd(16, ' ');
		const en = `"${u[DATA_SCHEMA.English]}"`;
		const freq = `(freq: ${item.count}, source: ${u[DATA_SCHEMA.Source]})`;
		lines.push(`    - [ID ${id}] ${ko} ${en} ${freq}`);
	});

	lines.push(`\n[B. Active Grammar Patterns to Master (${result.knownGrammar.length} units)]`);
	result.knownGrammar.forEach(item => {
		const u = item.unit;
		const id = String(u[DATA_SCHEMA.Id]).padStart(4, ' ');
		const ko = u[DATA_SCHEMA.Korean].padEnd(24, ' ');
		const en = `"${u[DATA_SCHEMA.English]}"`;
		const freq = `(freq: ${item.count}, source: ${u[DATA_SCHEMA.Source]})`;
		lines.push(`    - [ID ${id}] ${ko} ${en} ${freq}`);
	});

	// 3. Curriculum Gap Inventory
	lines.push("\n--------------------------------------------------------------------------------");
	lines.push("3. CURRICULUM GAP INVENTORY (Units to Ingest into data.js & homonyms.js)");
	lines.push("--------------------------------------------------------------------------------");
	if (result.missingVocab.length === 0 && result.missingGrammar.length === 0) {
		lines.push("\n  ALL vocabulary and grammar units in this passage are fully covered in data.js! (0 Gaps)");
	} else {
		if (result.missingVocab.length > 0) {
			lines.push(`\n[A. Missing Vocabulary (${result.missingVocab.length} items)]`);
			result.missingVocab.forEach(item => {
				const tagStr = item.tags && item.tags.length > 0 ? `, tags: [${item.tags.join(', ')}]` : '';
				lines.push(`    - ${item.text.padEnd(14, ' ')} [${item.pos}] "${item.gloss}" (freq: ${item.count}${tagStr})`);
				lines.push(`      Contexts: ${item.contexts.join(', ')}`);
			});
		}
		if (result.missingGrammar.length > 0) {
			lines.push(`\n[B. Missing Grammar Patterns (${result.missingGrammar.length} items)]`);
			result.missingGrammar.forEach(item => {
				lines.push(`    - ${item.text.padEnd(18, ' ')} [${item.pos}] "${item.gloss}" (freq: ${item.count})`);
				lines.push(`      Contexts: ${item.contexts.join(', ')}`);
			});
		}
		if (result.draftFile) {
			lines.push(`\n  ✔ Pre-populated draft units file auto-generated: ${result.draftFile}`);
		}
	}

	// 4. Homonym Disambiguation Summary
	lines.push("\n--------------------------------------------------------------------------------");
	lines.push(`4. HOMONYM DISAMBIGUATION SUMMARY (${result.disambiguations.length} occurrences)`);
	lines.push("--------------------------------------------------------------------------------");
	result.disambiguations.forEach(d => {
		const tag = d.intentional_ambiguity ? " [INTENTIONAL AMBIGUITY]" : "";
		lines.push(`  [Sent ${d.sentenceIndex}] Token "${d.surface}":${tag}`);
		lines.push(`    -> Resolved Target: ${d.target}`);
		lines.push(`    -> Decision Rule:   ${d.rule}`);
	});
	lines.push("================================================================================\n");

	return lines.join("\n");
}

if (typeof window !== 'undefined') {
	window.analyzePassage = analyzePassage;
	window.formatAnalysisReport = formatAnalysisReport;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		analyzePassage,
		formatAnalysisReport
	};
}
})();
