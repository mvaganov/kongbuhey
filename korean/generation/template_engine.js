/**
 * Korean Sentence Template Token Parsing & Slot Expansion Engine
 *
 * Implements:
 * 1. Combinatorial token slot options generator (generateTemplateOptions, generateTemplateTokenOptions).
 * 2. Proper name extraction and random name sampling.
 * 3. Part-of-speech slot filling with lexical cutoffs to prevent combinatorial explosion.
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
const { TokenOption, deduplicateTokenOptions, getFilteredWords, getNumberTokenOptions } =
	(typeof require !== 'undefined' ? require('../core/numbers.js') : window);
const {
	getConjugatedStem,
	attachParticle,
	getVerbParticleType,
	getNounCandidatesForVerb,
	getSubjectCandidatesForDescriptiveVerb
} = (typeof require !== 'undefined' ? require('../core/morphology.js') : window);
const { getSpatialPositions } = (typeof require !== 'undefined' ? require('../concord/spatial_concord.js') : window);
const { ACTION_VERB_SPECS } = (typeof require !== 'undefined' ? require('../specs/verb_argument_specs.js') : window);

function getProperNames() {
	if (!state.properNames || state.properNames.length === 0) {
		state.initProperNames();
	}
	return state.properNames;
}

function setProperNames(names) {
	if (Array.isArray(names)) state.properNames = [...names];
}

function getRandomProperName() {
	const names = getProperNames();
	if (!names || names.length === 0) return "";
	return names[Math.floor(Math.random() * names.length)];
}

function getTokenOptions(token, depth = 0) {
	let options = [];
	const KoreanWord = DATA_SCHEMA.Korean;
	const Conjugation = DATA_SCHEMA.Conjugation;
	const getWords = dataModule.getWords || (typeof window !== 'undefined' ? window.getWords : () => []);

	if (token.type === "Name" || token.isProperName || (token.type === "N" && (token.tag === "name" || token.tag === "properName"))) {
		options = [new TokenOption(getRandomProperName(), [])];
	} else if (token.type === "properNoun") {
		const ssiSuffix = state.TITLE_SUFFIX_SSI || "씨";
		const seeGrammar = getFilteredWords("Grammar").find(g => hasTag(g, "properNoun", "honorific") || g[KoreanWord] === ssiSuffix) || getWords("Grammar").find(g => hasTag(g, "properNoun", "honorific") || g[KoreanWord] === ssiSuffix);
		options = [new TokenOption(getRandomProperName() + ssiSuffix, seeGrammar ? [seeGrammar] : [])];
	} else if (token.type === "N" || token.type === "Noun" || token.type === "N_Phrase") {
		options = getFilteredWords("Noun", token.tag).map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "AVst") {
		options = getFilteredWords("Action Verb", token.tag).map(w => new TokenOption(getConjugatedStem(w[KoreanWord], w[Conjugation]), [w]));
	} else if (token.type === "DVst") {
		options = getFilteredWords("Descriptive Verb", token.tag).map(w => new TokenOption(getConjugatedStem(w[KoreanWord], w[Conjugation]), [w]));
	} else if (token.type === "Number") {
		const rangeMatch = token.tag ? token.tag.match(/^([a-zA-Z_]+)\((\d+)\s*,\s*(\d+)\)$/) : null;
		if (rangeMatch) {
			options = getNumberTokenOptions(rangeMatch[1], parseInt(rangeMatch[2], 10), parseInt(rangeMatch[3], 10), !!token.isFollowedByMeasureWord);
		} else {
			let words = getFilteredWords("Number", token.tag);
			words = words.filter(w => token.isFollowedByMeasureWord
				? (!hasTag(w, "counting") || hasTag(w, "attributive"))
				: (!hasTag(w, "attributive") || hasTag(w, "counting")));
			options = words.map(w => new TokenOption(w[KoreanWord], [w]));
		}
	} else if (token.type === "Adv_Degree" || (token.type === "Adv" && token.tag === "degree")) {
		let words = Array.from(state.DEGREE_ADVERBS.values()).map(info => info.unit);
		if (token.tag && token.tag !== "degree") {
			words = words.filter(w => hasTag(w, token.tag));
		}
		if (token.affirmative || token.polarity === 1 || (!token.negated && !token.isNegative)) {
			words = words.filter(w => !state.ALL_NPI_WORDS.has(w[KoreanWord]));
		}
		options = words.map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "Adv_Manner" || (token.type === "Adv" && token.tag === "manner")) {
		let words = Array.from(state.MANNER_ADVERBS.values()).map(info => info.unit);
		if (token.tag && token.tag !== "manner") {
			words = words.filter(w => hasTag(w, token.tag));
		}
		if (token.target_pos === "Descriptive Verb" || token.isDV) {
			words = [];
		}
		options = words.map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "Adv_Discourse" || (token.type === "Adv" && (token.tag === "discourse" || token.tag === "conjunction"))) {
		let words = Array.from(state.DISCOURSE_ADVERBS.values()).map(info => info.unit);
		if (token.tag && token.tag !== "discourse" && token.tag !== "conjunction") {
			words = words.filter(w => hasTag(w, token.tag));
		}
		options = words.map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "Adv") {
		let words = getFilteredWords("Adverb", token.tag);
		if (token.target_pos === "Descriptive Verb" || token.isDV) {
			words = words.filter(w => {
				const ko = w[KoreanWord];
				if (state.SHORT_INABILITY_WORDS.has(ko)) return false;
				if (state.MANNER_ADVERBS.has(ko) && !state.DEGREE_ADVERBS.has(ko)) return false;
				return true;
			});
		}
		if (token.affirmative || token.polarity === 1 || (!token.negated && !token.isNegative)) {
			words = words.filter(w => !state.ALL_NPI_WORDS.has(w[KoreanWord]));
		}
		options = words.map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "Det" || token.type === "Determiner") {
		options = getFilteredWords("Determiner", token.tag).map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "Exclamation") {
		options = getFilteredWords("Exclamation", token.tag).map(w => new TokenOption(w[KoreanWord], [w]));
	} else if (token.type === "Clause" || token.type === "VP") {
		if (depth > 0) {
			options = [new TokenOption("갑니다"), new TokenOption("좋아요")];
		} else {
			const grammars = getFilteredWords("Grammar").filter(g => hasTag(g, "declarative", "suggestion"));
			if (grammars.length > 0) {
				grammars.forEach(g => {
					g[Conjugation].forEach(formula => {
						generateTemplateTokenOptions(formula, depth + 1).forEach(sub => {
							options.push(new TokenOption(sub.text, [g, ...sub.units]));
						});
					});
				});
			} else {
				options = [new TokenOption("갑니다"), new TokenOption("좋아요")];
			}
		}
	} else if (token.type === "VP_AVst") {
		getFilteredWords("Action Verb", token.tag).forEach(av => {
			const stem = getConjugatedStem(av[KoreanWord], av[Conjugation]);
			const isPureIntransitive = (hasTag(av, "intransitive_general") || hasTag(av, "intransitive_motion") || hasTag(av, "intransitive_place"))
				&& !ACTION_VERB_SPECS.some(s => s.particle === "object" && hasTag(av, s.tag))
				&& !parseSemanticVector(av).collocation_filter;

			if (isPureIntransitive) {
				if (hasTag(av, "intransitive_motion") || hasTag(av, "intransitive_place")) {
					getFilteredWords("Noun", "place").forEach(n => {
						options.push(new TokenOption(`${attachParticle(n, "location", av)} ${stem}`, [av, n]));
					});
				} else {
					options.push(new TokenOption(stem, [av]));
				}
				return;
			}

			const particleType = getVerbParticleType(av);
			const nouns = getNounCandidatesForVerb(av);
			nouns.forEach(n => {
				const phrase = `${attachParticle(n, particleType, av)} ${stem}`;
				options.push(new TokenOption(phrase, [av, n]));
			});
		});
	} else if (token.type === "VP_DVst") {
		getFilteredWords("Descriptive Verb", token.tag).forEach(dv => {
			const stem = getConjugatedStem(dv[KoreanWord], dv[Conjugation]);
			const candidates = getSubjectCandidatesForDescriptiveVerb(dv);
			candidates.forEach(n => {
				const phrase = `${attachParticle(n, "subject", dv)} ${stem}`;
				options.push(new TokenOption(phrase, [dv, n]));
			});
		});
	} else if (token.type === "Spatial_Phrase" || token.type === "Relational_Loc") {
		const positions = getSpatialPositions();
		let groundNouns = getFilteredWords("Noun", "place");
		if (groundNouns.length === 0) groundNouns = getFilteredWords("Noun", "furniture");
		if (groundNouns.length === 0) groundNouns = getFilteredWords("Noun", "object");
		groundNouns.slice(0, 5).forEach(gn => {
			const pos = positions[Math.floor(Math.random() * positions.length)];
			const posUnit = state.SPATIAL_POSITIONS.get(pos)?.unit;
			const phrase = `${gn[KoreanWord]} ${pos}에`;
			options.push(new TokenOption(phrase, posUnit ? [gn, posUnit] : [gn]));
		});
	} else if (token.type === "Deictic_NP") {
		const determiners = Array.from(state.DEICTIC_DETERMINERS.values());
		const nouns = getFilteredWords("Noun", "object").slice(0, 5);
		nouns.forEach(n => {
			const det = determiners[Math.floor(Math.random() * determiners.length)];
			const phrase = `${det.ko} ${n[KoreanWord]}`;
			options.push(new TokenOption(phrase, [det.unit, n]));
		});
	} else if (token.type === "Deictic_Loc") {
		const locs = Array.from(state.DEICTIC_LOCATIVES.values());
		options = locs.map(l => new TokenOption(l.ko, [l.unit]));
	} else if (token.type === "Deictic_Pronoun") {
		const pros = Array.from(state.DEICTIC_PRONOUNS.values());
		options = pros.map(p => new TokenOption(p.ko, [p.unit]));
	}

	options = deduplicateTokenOptions(options);
	if (!state.currentUsageFilter && options.length > 5) {
		state.totalOptionsCutToPreventCombinatorialExplosion += options.length - 5;
		options = options.sort(() => 0.5 - Math.random()).slice(0, 5);
	}
	return options;
}

function generateTemplateTokenOptions(template, depth = 0) {
	if (depth > 2) return [new TokenOption("갑니다"), new TokenOption("좋아요")];
	const tokenRegex = /\{([^}:]+)(?::([^}]+))?\}/;
	const match = template.match(tokenRegex);
	if (!match) return [new TokenOption(template, [])];

	const fullMatch = match[0];
	const tokenType = match[1];
	const tag = match[2];
	const afterToken = template.substring(match.index + fullMatch.length);
	const isFollowedByMeasureWord = /^\s*\{(?:Noun|N):.*measureWord/i.test(afterToken) || /^\s*[가-힣]/.test(afterToken);
	const ssiSuffix = state.TITLE_SUFFIX_SSI || "씨";
	const isProperName = tokenType === "Name" || tag === "properName" || tag === "name" || (tokenType === "N" && (afterToken.startsWith(ssiSuffix) || afterToken.startsWith(" " + ssiSuffix)));

	const options = getTokenOptions({ type: tokenType, tag, isFollowedByMeasureWord, isProperName }, depth);
	const combinations = [];

	for (let opt of options) {
		let remainder = template.substring(match.index + fullMatch.length);
		if (opt.text.endsWith(ssiSuffix) && remainder.startsWith(ssiSuffix)) remainder = remainder.substring(ssiSuffix.length).trimStart();
		const prefix = template.substring(0, match.index) + opt.text;
		const subOptions = generateTemplateTokenOptions(remainder, depth);

		for (let sub of subOptions) {
			combinations.push(new TokenOption(prefix + sub.text, [...opt.units, ...sub.units]));
		}
	}
	return combinations;
}

function generateTemplateOptions(template, depth = 0) {
	return generateTemplateTokenOptions(template, depth).map(opt => opt.text);
}

const templateEngineExports = {
	getProperNames,
	setProperNames,
	getRandomProperName,
	getTokenOptions,
	generateTemplateTokenOptions,
	generateTemplateOptions
};

if (typeof window !== 'undefined') {
	Object.assign(window, templateEngineExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = templateEngineExports;
}
