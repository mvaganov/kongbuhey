/**
 * Korean Semantic Sentence Generation Engine
 *
 * Implements:
 * 1. Semantic vector guided context propagation (polarity, logic, produced state).
 * 2. Slot-filler selection complying with verb argument frames and tense agreement.
 * 3. High-level sentence synthesis yielding surface Korean text and parse tree metadata.
 */

let dataModule;
if (typeof require !== 'undefined') {
	try {
		dataModule = require('../../data.js');
	} catch (e) {
		dataModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	dataModule = typeof window !== 'undefined' ? window : {};
}

const state = (typeof require !== 'undefined' ? require('../state.js') : window);
const { DATA_SCHEMA, hasTag, parseSemanticVector } = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);
const { getFilteredWords, getSinoNumber, getKoreanNumber } = (typeof require !== 'undefined' ? require('../core/numbers.js') : window);
const { getRandomProperName } = (typeof require !== 'undefined' ? require('./template_engine.js') : window);
const {
	getConjugatedStem,
	filterWordsByTense,
	filterGrammarByTense,
	getTemporalPolarity,
	buildActionVerbPhrase,
	buildDescriptiveVerbPhrase
} = (typeof require !== 'undefined' ? require('../core/morphology.js') : window);
const { getMatchingClassifier, buildCountingPhrase } = (typeof require !== 'undefined' ? require('../concord/classifier_concord.js') : window);
const { getSpatialPositions, buildSpatialPhrase, buildDeicticPhrase } = (typeof require !== 'undefined' ? require('../concord/spatial_concord.js') : window);

const SemanticConfig = {
	strictness: { default: 0.8, contrast: 1.0, cause_effect: 0.9, sequence: 0.7, selection: 0.8 },
	getWeight(domainOrLogic) {
		if (domainOrLogic && this.strictness[domainOrLogic] !== undefined) return this.strictness[domainOrLogic];
		return this.strictness.default;
	}
};

function getRandom(arr) {
	if (!arr || arr.length === 0) return null;
	return arr[Math.floor(Math.random() * arr.length)];
}

function markUnitUsed(unit) {
	if (unit && typeof unit[DATA_SCHEMA.Id] === 'number') {
		state.usedUnitIds.add(unit[DATA_SCHEMA.Id]);
	}
}

function shouldApplySemanticConstraint(context) {
	if (!context || !context.logic) return false;
	const weight = SemanticConfig.getWeight(context.logic);
	if (weight >= 1.0) return true;
	if (weight <= 0.0) return false;
	return Math.random() < weight;
}

let templateToGrammarMap = null;
function initTemplateToGrammarMap() {
	if (templateToGrammarMap) return;
	templateToGrammarMap = new Map();
	const units = dataModule.KR_EN_languageUnits || (typeof window !== 'undefined' ? window.KR_EN_languageUnits : []);
	if (!units) return;
	units.filter(u => u && u[DATA_SCHEMA.PartofSpeech] === "Grammar").forEach(u => {
		const formulas = u[DATA_SCHEMA.Conjugation];
		if (Array.isArray(formulas)) {
			formulas.forEach((f, idx) => {
				if (!templateToGrammarMap.has(f)) {
					templateToGrammarMap.set(f, { grammarUnit: u, formulaIndex: idx });
				}
			});
		}
	});
}

function findGrammarUnitForTemplate(template) {
	initTemplateToGrammarMap();
	return templateToGrammarMap ? templateToGrammarMap.get(template) : null;
}

function expandSemanticVerb(pos, isAction, tokenType, currentContext, applyConstraint) {
	let words = getFilteredWords(pos);
	if (applyConstraint) {
		if (isAction && currentContext.req_domain) {
			const domainWords = words.filter(w => parseSemanticVector(w).domain === currentContext.req_domain);
			if (domainWords.length > 0) words = domainWords;
		} else if (!isAction && currentContext.logic === "cause_effect") {
			const matchingWords = words.filter(w => {
				const sv = parseSemanticVector(w);
				return (sv.polarity === currentContext.polarity) &&
					(sv.req === currentContext.produced_state || sv.req === "any" || sv.domain === "state");
			});
			if (matchingWords.length > 0) words = matchingWords;
		} else if (!isAction && currentContext.logic === "contrast") {
			const matchingWords = words.filter(w => {
				const sv = parseSemanticVector(w);
				return sv.polarity !== currentContext.polarity && sv.polarity !== 0;
			});
			if (matchingWords.length > 0) words = matchingWords;
		}
	}

	const svWords = words.filter(w => parseSemanticVector(w).domain);
	if (svWords.length > 0) words = svWords;

	const word = getRandom(words);
	if (!word) return { text: "N/A", verb: null, noun: null };

	markUnitUsed(word);
	const sv = parseSemanticVector(word);
	if (isAction) {
		if (sv.prod) currentContext.produced_state = sv.prod;
		if (sv.polarity !== undefined) currentContext.polarity = sv.polarity;
	}

	const stem = getConjugatedStem(word[DATA_SCHEMA.Korean], word[DATA_SCHEMA.Conjugation]);
	if (tokenType === "AVst" || tokenType === "DVst") {
		return { text: stem, verb: word, noun: null };
	}
	const phrase = isAction ? buildActionVerbPhrase(word, stem, null, currentContext) : buildDescriptiveVerbPhrase(word, stem, null, currentContext);
	return { text: phrase.text, verb: phrase.verb || word, noun: phrase.noun };
}

function expandSemanticActionVerb(tokenType, currentContext, applyConstraint) {
	return expandSemanticVerb("Action Verb", true, tokenType, currentContext, applyConstraint);
}

function expandSemanticDescriptiveVerb(tokenType, currentContext, applyConstraint) {
	return expandSemanticVerb("Descriptive Verb", false, tokenType, currentContext, applyConstraint);
}

function expandSemanticClause(depth, currentContext) {
	const KoreanWord = DATA_SCHEMA.Korean;
	const Conjugation = DATA_SCHEMA.Conjugation;

	let grammars = getFilteredWords("Grammar").filter(g => {
		const sv = parseSemanticVector(g);
		return hasTag(g, "declarative") && (sv.logic === "declarative" || g[KoreanWord].includes("아요") || g[KoreanWord].includes("습니다"));
	});
	if (grammars.length === 0) grammars = getFilteredWords("Grammar").filter(g => hasTag(g, "declarative"));
	if (grammars.length === 0) grammars = getFilteredWords("Grammar");

	if (currentContext.temporal_polarity) {
		const tenseGrammars = filterGrammarByTense(grammars, currentContext.temporal_polarity);
		if (tenseGrammars.length > 0) grammars = tenseGrammars;
	}

	const grammar = getRandom(grammars);
	if (grammar) {
		markUnitUsed(grammar);
		const sub = generateSemanticSentence(getRandom(grammar[Conjugation]), depth + 1, currentContext);
		return { text: sub.ko, tree: sub.tree };
	}
	return { text: "좋아요", tree: "좋아요" };
}

function expandSemanticTerminal(tokenType, tag, currentContext, applyConstraint) {
	const ssiSuffix = state.TITLE_SUFFIX_SSI || "씨";
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);

	if (tokenType === "Name" || tag === "name" || tag === "properName") {
		return { text: getRandomProperName(), unit: null };
	}
	if (tokenType === "properNoun") {
		const seeGrammar = getFilteredWords("Grammar").find(g => hasTag(g, "properNoun", "honorific") || g[DATA_SCHEMA.Korean] === ssiSuffix) || getWords("Grammar").find(g => hasTag(g, "properNoun", "honorific") || g[DATA_SCHEMA.Korean] === ssiSuffix);
		return { text: getRandomProperName() + ssiSuffix, unit: seeGrammar || null };
	}

	let posToFetch = "Noun";
	if (tokenType === "Number") posToFetch = "Number";
	else if (tokenType === "Adv" || tokenType === "Adv_Time" || tokenType === "Adv_Degree" || tokenType === "Adv_Manner" || tokenType === "Adv_Discourse") posToFetch = "Adverb";
	else if (tokenType === "Exclamation") posToFetch = "Exclamation";

	let words = [];
	if (tokenType === "Adv_Degree") {
		words = Array.from(state.DEGREE_ADVERBS.values()).map(info => info.unit);
		if (tag) words = words.filter(w => hasTag(w, tag));
	} else if (tokenType === "Adv_Manner") {
		words = Array.from(state.MANNER_ADVERBS.values()).map(info => info.unit);
		if (tag) words = words.filter(w => hasTag(w, tag));
	} else if (tokenType === "Adv_Discourse") {
		words = Array.from(state.DISCOURSE_ADVERBS.values()).map(info => info.unit);
		if (tag) words = words.filter(w => hasTag(w, tag));
	} else {
		words = getFilteredWords(posToFetch, tag);
	}

	if (applyConstraint && currentContext.logic === "cause_effect" && currentContext.produced_state) {
		const domainWords = words.filter(w => parseSemanticVector(w).domain);
		if (domainWords.length > 0) words = domainWords;
	}

	if (currentContext.temporal_polarity && (tokenType === "Adv" || tokenType === "Adv_Time" || tokenType === "Time" || tag === "time" || tag === "temporal" || tag === "adverb_time" || tag === "temporalNoun")) {
		const tenseFiltered = filterWordsByTense(words, currentContext.temporal_polarity);
		if (tenseFiltered.length > 0) words = tenseFiltered;
	}

	if ((tokenType === "Adv" || tokenType === "Adv_Degree" || tag === "adverb") && (currentContext.isDV || currentContext.target_pos === "Descriptive Verb")) {
		words = words.filter(w => {
			const ko = w[DATA_SCHEMA.Korean];
			if (state.SHORT_INABILITY_WORDS.has(ko)) return false;
			if (state.MANNER_ADVERBS.has(ko) && !state.DEGREE_ADVERBS.has(ko)) return false;
			return true;
		});
	}

	const isNegContext = currentContext.isNegative || currentContext.negated || currentContext.mood === "inability";
	if (!isNegContext && (tokenType.startsWith("Adv") || tag === "adverb")) {
		words = words.filter(w => !state.ALL_NPI_WORDS.has(w[DATA_SCHEMA.Korean]));
	}

	const chosen = getRandom(words);
	if (chosen) {
		markUnitUsed(chosen);
		const pol = getTemporalPolarity(chosen);
		if (pol && !currentContext.temporal_polarity) {
			currentContext.temporal_polarity = pol;
		}
		return { text: chosen[DATA_SCHEMA.Korean], unit: chosen };
	}
	return { text: "N/A", unit: null };
}

function generateSemanticSentence(templateOrUnit, depth = 0, incomingContext = {}) {
	if (depth > 2) return { ko: "좋아요", context: {}, tree: "좋아요" };

	let template = "", grammarId = null;
	const units = dataModule.KR_EN_languageUnits || (typeof window !== 'undefined' ? window.KR_EN_languageUnits : []);

	if (typeof templateOrUnit === 'number') {
		const gu = units ? units[templateOrUnit] : null;
		if (gu) {
			grammarId = gu[DATA_SCHEMA.Id];
			template = getRandom(gu[DATA_SCHEMA.Conjugation]) || "";
		} else {
			template = String(templateOrUnit);
			grammarId = template;
		}
	} else if (Array.isArray(templateOrUnit) && typeof templateOrUnit[DATA_SCHEMA.Id] === 'number') {
		grammarId = templateOrUnit[DATA_SCHEMA.Id];
		template = getRandom(templateOrUnit[DATA_SCHEMA.Conjugation]) || "";
	} else if (typeof templateOrUnit === 'string') {
		template = templateOrUnit;
		const match = findGrammarUnitForTemplate(template);
		if (match && match.grammarUnit) {
			const gu = match.grammarUnit;
			const formulas = gu[DATA_SCHEMA.Conjugation] || [];
			if (formulas.length > 1 && match.formulaIndex > 0) {
				const sigs = formulas.map(f => (f.match(/\{[^}]+\}/g) || []).join(','));
				grammarId = sigs.slice(0, match.formulaIndex).includes(sigs[match.formulaIndex]) ? template : gu[DATA_SCHEMA.Id];
			} else {
				grammarId = gu[DATA_SCHEMA.Id];
			}
		} else {
			grammarId = template;
		}
	} else {
		template = String(templateOrUnit);
		grammarId = template;
	}

	let currentContext = { ...incomingContext };
	if (/DVst/.test(template)) {
		currentContext.isDV = true;
	}
	if (typeof grammarId === 'number') {
		if (state.IMPERATIVE_GRAMMAR_IDS.has(grammarId)) currentContext.mood = "imperative";
		else if (state.PROPOSITIVE_GRAMMAR_IDS.has(grammarId)) currentContext.mood = "propositive";
		else if (state.INABILITY_NEGATION_IDS.has(grammarId)) currentContext.mood = "inability";
		else if (state.VOLITIONAL_GRAMMAR_IDS.has(grammarId)) currentContext.mood = "volitional";

		if (state.INABILITY_NEGATION_IDS.has(grammarId) || state.GENERAL_NEGATION_IDS.has(grammarId)) {
			currentContext.isNegative = true;
		}
	}
	if (/(?:않|못|마세|마십|없|아니)/.test(template)) {
		currentContext.isNegative = true;
	}
	if (!currentContext.temporal_polarity) {
		if (typeof grammarId === 'number') {
			if (state.PAST_GRAMMAR_IDS.has(grammarId)) currentContext.temporal_polarity = "past";
			else if (state.FUTURE_GRAMMAR_IDS.has(grammarId)) currentContext.temporal_polarity = "future";
			else if (state.PRESENT_GRAMMAR_IDS.has(grammarId)) currentContext.temporal_polarity = "present";
		}
	}

	let koResult = template;
	const childrenTree = [];
	const tokenRegex = /\{([^}:]+)(?::([^}]+))?\}/g;
	let match;

	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);
	const ssiSuffix = state.TITLE_SUFFIX_SSI || "씨";

	while ((match = tokenRegex.exec(koResult)) !== null) {
		const token = match[0], tokenType = match[1], tag = match[2];
		const applyConstraint = shouldApplySemanticConstraint(currentContext);
		let replacementKo = "", childNode = null;
		const afterToken = koResult.substring(match.index + token.length);
		const isProperName = tokenType === "Name" || tag === "properName" || tag === "name" || (tokenType === "N" && (afterToken.startsWith(ssiSuffix) || afterToken.startsWith(" " + ssiSuffix)));

		if (isProperName) {
			replacementKo = getRandomProperName();
			childNode = replacementKo;
		} else if (tokenType === "properNoun") {
			const seeGrammar = getFilteredWords("Grammar").find(g => hasTag(g, "properNoun", "honorific") || g[DATA_SCHEMA.Korean] === ssiSuffix) || getWords("Grammar").find(g => hasTag(g, "properNoun", "honorific") || g[DATA_SCHEMA.Korean] === ssiSuffix);
			const name = getRandomProperName();
			replacementKo = name + ssiSuffix;
			childNode = seeGrammar ? [seeGrammar[DATA_SCHEMA.Id], name] : replacementKo;
		} else if (tokenType === "VP_AVst" || tokenType === "AVst" || tokenType === "VP_DVst" || tokenType === "DVst") {
			const isAction = tokenType.includes("AVst");
			const exp = isAction
				? expandSemanticActionVerb(tokenType, currentContext, applyConstraint)
				: expandSemanticDescriptiveVerb(tokenType, currentContext, applyConstraint);
			replacementKo = exp.text;
			if (exp.verb) {
				childNode = exp.noun
					? [exp.verb[DATA_SCHEMA.Id], typeof exp.noun[DATA_SCHEMA.Id] === 'number' ? exp.noun[DATA_SCHEMA.Id] : exp.noun[DATA_SCHEMA.Korean]]
					: exp.verb[DATA_SCHEMA.Id];
			} else {
				childNode = replacementKo;
			}
		} else if (tokenType === "Clause" || tokenType === "VP") {
			const exp = expandSemanticClause(depth, currentContext);
			replacementKo = exp.text;
			childNode = exp.tree;
		} else if (tokenType === "CountPhrase" || tokenType === "Noun_Count") {
			let nouns = getWords("Noun").filter(n => !hasTag(n, "measureWord") && !hasTag(n, "counter") && !hasTag(n, "place"));
			if (tag && tag !== "object" && tag !== "subject" && tag !== "topic" && tag !== "AV" && tag !== "DV") {
				nouns = nouns.filter(n => hasTag(n, tag));
			}
			if (nouns.length === 0) nouns = getWords("Noun", "object");
			const sampledNoun = nouns[Math.floor(Math.random() * nouns.length)];
			const count = Math.floor(Math.random() * 5) + 1;
			const classifier = getMatchingClassifier(sampledNoun);
			const classifierUnit = state.CLASSIFIER_UNITS.get(classifier);

			let particle = null;
			if (tag === "object" || tag === "AV" || /을|를/.test(token)) particle = "object";
			else if (tag === "subject" || tag === "DV" || /이|가/.test(token)) particle = "subject";
			else if (tag === "topic" || /은|는/.test(token)) particle = "topic";

			replacementKo = buildCountingPhrase(sampledNoun, count, { classifier, particle });
			childNode = [
				sampledNoun ? sampledNoun[DATA_SCHEMA.Id] : 0,
				count,
				classifierUnit ? classifierUnit[DATA_SCHEMA.Id] : classifier
			];
		} else if (tokenType === "Spatial_Phrase" || tokenType === "Relational_Loc") {
			let groundNouns = getWords("Noun").filter(n => hasTag(n, "place") || hasTag(n, "furniture") || (hasTag(n, "object") && !hasTag(n, "measureWord") && !hasTag(n, "counter")));
			if (groundNouns.length === 0) groundNouns = getWords("Noun", "place");
			const sampledGround = groundNouns[Math.floor(Math.random() * groundNouns.length)];
			const positions = getSpatialPositions();
			const sampledPos = positions.length > 0 ? positions[Math.floor(Math.random() * positions.length)] : "위";
			const posUnit = state.SPATIAL_POSITIONS.get(sampledPos)?.unit;

			let particleType = "location";
			if (tag === "static" || /에$/.test(token)) particleType = "location_static";
			else if (tag === "dynamic" || /에서$/.test(token)) particleType = "location_dynamic";
			else if (tag === "direction" || /로$/.test(token)) particleType = "direction";

			replacementKo = buildSpatialPhrase(sampledGround, sampledPos, { particle: particleType });
			childNode = [
				sampledGround ? sampledGround[DATA_SCHEMA.Id] : 0,
				posUnit ? posUnit[DATA_SCHEMA.Id] : sampledPos
			];
		} else if (tokenType === "Deictic_NP") {
			const proximity = tag === "medial" ? "medial" : tag === "distal" ? "distal" : tag === "interrogative" ? "interrogative" : "proximal";
			let nouns = getWords("Noun").filter(n => !hasTag(n, "measureWord") && !hasTag(n, "counter") && !hasTag(n, "place"));
			const sampledNoun = nouns[Math.floor(Math.random() * nouns.length)];
			replacementKo = buildDeicticPhrase(proximity, "noun", { noun: sampledNoun });
			const detUnit = Array.from(state.DEICTIC_DETERMINERS.values()).find(d => d.proximity === proximity)?.unit;
			childNode = [
				detUnit ? detUnit[DATA_SCHEMA.Id] : 0,
				sampledNoun ? sampledNoun[DATA_SCHEMA.Id] : 0
			];
		} else if (tokenType === "Deictic_Loc") {
			const proximity = tag === "medial" ? "medial" : tag === "distal" ? "distal" : tag === "interrogative" ? "interrogative" : "proximal";
			replacementKo = buildDeicticPhrase(proximity, "place");
			const locUnit = Array.from(state.DEICTIC_LOCATIVES.values()).find(l => l.proximity === proximity && l.ko === replacementKo)?.unit;
			childNode = locUnit ? locUnit[DATA_SCHEMA.Id] : replacementKo;
		} else if (tokenType === "Deictic_Pronoun") {
			const proximity = tag === "medial" ? "medial" : tag === "distal" ? "distal" : tag === "interrogative" ? "interrogative" : "proximal";
			replacementKo = buildDeicticPhrase(proximity, "thing");
			const proUnit = Array.from(state.DEICTIC_PRONOUNS.values()).find(p => p.proximity === proximity && p.ko === replacementKo)?.unit;
			childNode = proUnit ? proUnit[DATA_SCHEMA.Id] : replacementKo;
		} else if (tokenType === "Number" && tag && tag.includes("(")) {
			const rangeMatch = tag.match(/^([a-zA-Z_]+)\((\d+)\s*,\s*(\d+)\)$/);
			if (rangeMatch) {
				const baseTag = rangeMatch[1];
				const min = parseInt(rangeMatch[2], 10), max = parseInt(rangeMatch[3], 10);
				const val = Math.floor(Math.random() * (max - min + 1)) + min;
				const isFollowedByMeasureWord = /^\s*\{(?:Noun|N):.*(?:measureWord|koreanMeasureWord|counter)/i.test(afterToken) || /^\s*[가-힣]/.test(afterToken);
				replacementKo = (baseTag === "sinoNumber") ? getSinoNumber(val) : getKoreanNumber(val, isFollowedByMeasureWord);
				const words = getFilteredWords("Number", baseTag);
				const matchedUnit = words.find(w => w[DATA_SCHEMA.Korean] === replacementKo);
				if (matchedUnit) {
					markUnitUsed(matchedUnit);
					childNode = matchedUnit[DATA_SCHEMA.Id];
				} else {
					childNode = replacementKo;
				}
			} else {
				const exp = expandSemanticTerminal(tokenType, tag, currentContext, applyConstraint);
				replacementKo = exp.text;
				childNode = exp.unit ? exp.unit[DATA_SCHEMA.Id] : replacementKo;
			}
		} else {
			const exp = expandSemanticTerminal(tokenType, tag, currentContext, applyConstraint);
			replacementKo = exp.text;
			childNode = exp.unit ? exp.unit[DATA_SCHEMA.Id] : replacementKo;
		}

		childrenTree.push(childNode);
		koResult = koResult.replace(token, replacementKo || "N/A");
		tokenRegex.lastIndex = 0;
	}

	return { ko: koResult, context: currentContext, tree: [grammarId, ...childrenTree] };
}

const semanticGeneratorExports = {
	SemanticConfig,
	shouldApplySemanticConstraint,
	findGrammarUnitForTemplate,
	expandSemanticVerb,
	expandSemanticActionVerb,
	expandSemanticDescriptiveVerb,
	expandSemanticClause,
	expandSemanticTerminal,
	generateSemanticSentence
};

if (typeof window !== 'undefined') {
	Object.assign(window, semanticGeneratorExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = semanticGeneratorExports;
}
