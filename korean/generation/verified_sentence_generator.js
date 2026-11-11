(function() {
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * korean/generation/verified_sentence_generator.js
 *
 * Verified Sentence Structure Discovery, Slot-Filter Management, and
 * Template-Prioritized Sentence Generation Engine.
 *
 * Responsibilities:
 *   1. Discovers and extracts reusable "Verified Sentence" templates from
 *      analyzed Korean study texts, recording Grammar Language Units and
 *      Semantic Tags of each Part of Speech slot.
 *   2. Evaluates candidate Language Unit pools for each slot and detects
 *      when tag requirements narrow a slot down to a single choice (pool === 1).
 *   3. Supports runtime editing of Verified Sentence structures:
 *      - Editing entry titles for clearer listing descriptions
 *      - Adding or removing semantic tag filters on individual slots
 *      - Duplicating/cloning entries into new custom templates
 *      - Deleting custom entries while protecting hardcoded entries from deletion
 *   4. Generates new grammatical Korean sentences from Verified Sentence templates,
 *      and provides a prioritized sentence generation method that uses Verified
 *      Sentence structures first and falls back to random AST generation only when needed.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero external dependencies).
 */

let dataModule;
if (typeof require !== 'undefined') {
	try {
		dataModule = require('../../data.js');
	} catch (_) {
		dataModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	dataModule = typeof window !== 'undefined' ? window : {};
}

let verifiedDataModule;
if (typeof require !== 'undefined') {
	try {
		verifiedDataModule = require('../../verified_sentences.js');
	} catch (_) {
		verifiedDataModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	verifiedDataModule = typeof window !== 'undefined' ? window : {};
}

const state = (typeof require !== 'undefined' ? require('../state.js') : window);
const {
	DATA_SCHEMA,
	hasTag,
	parseSemanticData,
	getStem,
	decomposeHangul,
	setFinal,
	hasBatchim
} = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);

function _hasTag(unit, tag) {
	if (!unit || !tag) return false;
	if (typeof hasTag === 'function') return hasTag(unit, tag);
	const tags = unit[DATA_SCHEMA.SemanticTags];
	if (tags instanceof Set) return tags.has(tag);
	if (Array.isArray(tags)) return tags.includes(tag);
	return false;
}

const {
	getConjugatedStem,
	conjugateAoStem,
	resolvePureMorphology
} = (typeof require !== 'undefined' ? require('../core/stem_engine.js') : window);

const {
	getPronunciation
} = (typeof require !== 'undefined' ? require('../phonetics/pronunciation.js') : window);

const {
	getUnitLiteralStem,
	getParticleLiteralTag
} = (typeof require !== 'undefined' ? require('../translation/literal_realizer.js') : window);

const {
	getUnitNaturalPhrase
} = (typeof require !== 'undefined' ? require('../translation/natural_realizer.js') : window);

const {
	makeSegment,
	splitNounAndParticleSegments,
	splitSingleVerbWordSegments
} = (typeof require !== 'undefined' ? require('./sentence_ast.js') : window);

const {
	generateSentenceForUnit,
	generateSentencesForUnit
} = (typeof require !== 'undefined' ? require('./unit_sentence_generator.js') : window);

let sentenceValidatorModule;
if (typeof require !== 'undefined') {
	try {
		sentenceValidatorModule = require('./sentence_validator.js');
	} catch (_) {
		sentenceValidatorModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	sentenceValidatorModule = typeof window !== 'undefined' ? window : {};
}
const validateSentenceAST = (sentenceValidatorModule && sentenceValidatorModule.validateSentenceAST) || (typeof window !== 'undefined' ? window.validateSentenceAST : null);
const validateSentenceString = (sentenceValidatorModule && sentenceValidatorModule.validateSentenceString) || (typeof window !== 'undefined' ? window.validateSentenceString : null);

let morphologyModule;
if (typeof require !== 'undefined') {
	try {
		morphologyModule = require('../core/morphology.js');
	} catch (_) {
		morphologyModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	morphologyModule = typeof window !== 'undefined' ? window : {};
}
const getNounCandidatesForVerb = (morphologyModule && morphologyModule.getNounCandidatesForVerb) || (typeof window !== 'undefined' ? window.getNounCandidatesForVerb : null);
const getSubjectCandidatesForDescriptiveVerb = (morphologyModule && morphologyModule.getSubjectCandidatesForDescriptiveVerb) || (typeof window !== 'undefined' ? window.getSubjectCandidatesForDescriptiveVerb : null);
const validateTemporalConcord = (morphologyModule && morphologyModule.validateTemporalConcord) || (typeof window !== 'undefined' ? window.validateTemporalConcord : null);
const validateHonorificConcord = (morphologyModule && morphologyModule.validateHonorificConcord) || (typeof window !== 'undefined' ? window.validateHonorificConcord : null);

let spatialModule;
if (typeof require !== 'undefined') {
	try {
		spatialModule = require('../concord/spatial_concord.js');
	} catch (_) {
		spatialModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	spatialModule = typeof window !== 'undefined' ? window : {};
}
const validateSpatialConcord = (spatialModule && spatialModule.validateSpatialConcord) || (typeof window !== 'undefined' ? window.validateSpatialConcord : null);

let adverbialModule;
if (typeof require !== 'undefined') {
	try {
		adverbialModule = require('../concord/adverbial_concord.js');
	} catch (_) {
		adverbialModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	adverbialModule = typeof window !== 'undefined' ? window : {};
}
const validateAdverbConcord = (adverbialModule && adverbialModule.validateAdverbConcord) || (typeof window !== 'undefined' ? window.validateAdverbConcord : null);

const VERIFIED_TEMPLATE_SCHEMA = (verifiedDataModule && verifiedDataModule.VERIFIED_TEMPLATE_SCHEMA) || {
	Id: 0,
	Title: 1,
	Source: 2,
	OriginalKo: 3,
	Punctuation: 4,
	Slots: 5,
	0: 'Id',
	1: 'Title',
	2: 'Source',
	3: 'OriginalKo',
	4: 'Punctuation',
	5: 'Slots'
};

const VERIFIED_SLOT_SCHEMA = (verifiedDataModule && verifiedDataModule.VERIFIED_SLOT_SCHEMA) || {
	UnitId: 0,
	Surface: 1,
	Category: 2,
	StemForm: 3,
	Suffix: 4,
	Prefix: 5,
	Grammar: 6,
	CustomTags: 7,
	TrailingPunct: 8,
	0: 'UnitId',
	1: 'Surface',
	2: 'Category',
	3: 'StemForm',
	4: 'Suffix',
	5: 'Prefix',
	6: K.POS_GRAMMAR,
	7: 'CustomTags',
	8: 'TrailingPunct'
};

function getUnitsArray() {
	return dataModule.KR_EN_languageUnits || (typeof window !== 'undefined' ? window.KR_EN_languageUnits : []) || [];
}

/**
 * Hydrates a compact Verified Sentence row (array-of-arrays) into a rich canonical template object.
 * If the input is already a rich template object, it returns it unchanged.
 *
 * Derives originalKo, originalEn, pos, default tags from data.js via originalUnitId,
 * as well as template-level grammarUnitIds from slot grammar attachments.
 */
function hydrateVerifiedSentence(raw) {
	if (!raw) return null;
	if (!Array.isArray(raw)) {
		return raw;
	}

	const id = raw[VERIFIED_TEMPLATE_SCHEMA.Id];
	const title = raw[VERIFIED_TEMPLATE_SCHEMA.Title];
	const source = raw[VERIFIED_TEMPLATE_SCHEMA.Source];
	const originalKo = raw[VERIFIED_TEMPLATE_SCHEMA.OriginalKo];
	const punctuation = raw[VERIFIED_TEMPLATE_SCHEMA.Punctuation] || '';
	const rawSlots = raw[VERIFIED_TEMPLATE_SCHEMA.Slots] || [];

	const units = getUnitsArray();
	const grammarUnitIdsSet = new Set();

	const hydratedSlots = rawSlots.map((s, idx) => {
		if (!Array.isArray(s)) return s;
		const unitId = s[VERIFIED_SLOT_SCHEMA.UnitId];
		const unit = (units && typeof unitId === 'number') ? units[unitId] : null;

		const originalKoStem = unit ? unit[DATA_SCHEMA.Korean] : '';
		const originalEn = unit ? unit[DATA_SCHEMA.English] : '';
		const pos = unit ? unit[DATA_SCHEMA.PartofSpeech] : '';

		// If CustomTags is explicitly provided as an array, use it; otherwise derive from language unit
		const customTags = s[VERIFIED_SLOT_SCHEMA.CustomTags];
		let tags;
		if (Array.isArray(customTags)) {
			tags = [...customTags];
		} else if (unit && unit[DATA_SCHEMA.SemanticTags]) {
			const rawTags = unit[DATA_SCHEMA.SemanticTags];
			tags = (rawTags instanceof Set ? Array.from(rawTags) : (Array.isArray(rawTags) ? [...rawTags] : [])).filter(Boolean);
		} else {
			tags = [];
		}

		// Grammar list hydration: [unitId, text, pos] -> { unitId, text, pos, ko, en }
		const rawGrammar = s[VERIFIED_SLOT_SCHEMA.Grammar] || [];
		const hydratedGrammar = rawGrammar.map(g => {
			if (!Array.isArray(g)) return g;
			const gUnitId = g[0];
			const gText = g[1];
			const gPos = g[2] || K.GRAMMAR;
			if (typeof gUnitId === 'number') {
				grammarUnitIdsSet.add(gUnitId);
			}
			const gUnit = (units && typeof gUnitId === 'number') ? units[gUnitId] : null;
			return {
				unitId: gUnitId,
				text: gText,
				pos: gPos,
				ko: gUnit ? gUnit[DATA_SCHEMA.Korean] : gText,
				en: gUnit ? gUnit[DATA_SCHEMA.English] : ''
			};
		});

		const stemForm = s[VERIFIED_SLOT_SCHEMA.StemForm] || '';
		const suffix = s[VERIFIED_SLOT_SCHEMA.Suffix] || '';
		const prefix = s[VERIFIED_SLOT_SCHEMA.Prefix] || '';
		const morphTemplate = (prefix && suffix) ? `${prefix}${suffix}` : (suffix || '');

		return {
			index: idx,
			originalSurface: s[VERIFIED_SLOT_SCHEMA.Surface] || '',
			trailingPunct: s[VERIFIED_SLOT_SCHEMA.TrailingPunct] || '',
			category: s[VERIFIED_SLOT_SCHEMA.Category] || '',
			pos: pos,
			originalUnitId: unitId,
			originalKo: originalKoStem,
			originalEn: originalEn,
			tags: tags,
			grammar: hydratedGrammar,
			morphTemplate: morphTemplate,
			inflection: {
				prefix: prefix,
				stemForm: stemForm,
				suffix: suffix
			}
		};
	});

	return {
		id: id,
		title: title,
		source: source,
		originalKo: originalKo,
		punctuation: punctuation,
		isHardcoded: true,
		grammarUnitIds: Array.from(grammarUnitIdsSet).sort((a, b) => a - b),
		slots: hydratedSlots
	};
}

/**
 * Serializes a rich Verified Sentence template into a compact array-of-arrays according to
 * VERIFIED_TEMPLATE_SCHEMA and VERIFIED_SLOT_SCHEMA, stripping redundant derivable fields.
 */
function serializeCompactTemplate(tpl) {
	if (!tpl) return null;
	if (Array.isArray(tpl)) return tpl;

	const slots = (tpl.slots || []).map(s => {
		if (Array.isArray(s)) return s;
		const stemForm = s.inflection ? (s.inflection.stemForm || '') : '';
		const suffix = s.inflection ? (s.inflection.suffix || '') : (s.morphTemplate || '');
		const prefix = s.inflection ? (s.inflection.prefix || '') : '';
		const rawGrammar = (s.grammar || []).map(g => {
			if (Array.isArray(g)) return g;
			return [g.unitId, g.text, g.pos || K.GRAMMAR];
		});

		// Determine if tags deviate from default unit semantic tags
		let customTags = null;
		if (Array.isArray(s.tags) && s.originalUnitId != null) {
			const units = getUnitsArray();
			const u = units && units[s.originalUnitId];
			if (u && u[DATA_SCHEMA.SemanticTags]) {
				const uTags = u[DATA_SCHEMA.SemanticTags];
				const uSet = uTags instanceof Set ? uTags : new Set(uTags || []);
				if (s.tags.length !== uSet.size || !s.tags.every(t => uSet.has(t))) {
					customTags = [...s.tags];
				}
			} else {
				customTags = [...s.tags];
			}
		}

		return [
			s.originalUnitId != null ? s.originalUnitId : null,
			s.originalSurface || '',
			s.category || '',
			stemForm,
			suffix,
			prefix,
			rawGrammar,
			customTags,
			s.trailingPunct || ''
		];
	});

	return [
		tpl.id || '',
		tpl.title || '',
		tpl.source || '',
		tpl.originalKo || '',
		tpl.punctuation || '',
		slots
	];
}

let cachedHydratedStatic = null;

function resetHardcodedVerifiedCache() {
	cachedHydratedStatic = null;
}

function getHardcodedVerifiedArray() {
	if (cachedHydratedStatic) {
		return cachedHydratedStatic;
	}
	let raw = null;
	if (verifiedDataModule && Array.isArray(verifiedDataModule.VERIFIED_SENTENCES)) {
		raw = verifiedDataModule.VERIFIED_SENTENCES;
	} else if (typeof require !== 'undefined') {
		try {
			delete require.cache[require.resolve('../../verified_sentences.js')];
			verifiedDataModule = require('../../verified_sentences.js');
			if (verifiedDataModule && Array.isArray(verifiedDataModule.VERIFIED_SENTENCES)) {
				raw = verifiedDataModule.VERIFIED_SENTENCES;
			}
		} catch (_) {}
	}
	if (!raw && typeof window !== 'undefined' && Array.isArray(window.VERIFIED_SENTENCES)) {
		raw = window.VERIFIED_SENTENCES;
	}
	if (!raw) return [];

	cachedHydratedStatic = raw.map(hydrateVerifiedSentence);
	return cachedHydratedStatic;
}

function getAnalyzer() {
	if (typeof window !== 'undefined' && window.koreanAnalyzer) {
		return window.koreanAnalyzer;
	}
	if (typeof require !== 'undefined') {
		try {
			return require('../analyzer/index.js');
		} catch (_) {}
	}
	return null;
}

// ============================================================================
// 1. Morphological Inflection Deduction & Slot Realization
// ============================================================================

function getEffectiveConjRule(ko, conj) {
	const rawRule = Array.isArray(conj) ? conj.join(' ') : String(conj || '');
	const stem = getStem(ko);
	if (stem.endsWith('하')) return K.HADA;
	if (stem.endsWith('르') && stem.length >= 2 && ko !== '치르다' && ko !== '들르다' && ko !== '따르다' && rawRule !== 'reo_irregular') {
		return K.REU_IRREGULAR || K.REU_IRREGULAR;
	}
	if (/^[a-z_]+$/i.test(rawRule) && rawRule !== K.REGULAR) return rawRule;
	return rawRule || K.REGULAR;
}

function toPastStem(aoStem) {
	if (!aoStem) return '';
	const lastChar = aoStem.slice(-1);
	return aoStem.slice(0, -1) + setFinal(lastChar, 20);
}

function applyCustomVerbMorph(conjStem, suffix) {
	let out = resolvePureMorphology(conjStem + suffix, state);
	out = out.replace(/([가-힣])(?:습니까\/ㅂ니까)/g, (_, ch) => {
		const d = decomposeHangul(ch);
		if (d && d.final !== 0) {
			return d.final === 8 ? setFinal(ch, 17) + "니까" : ch + "습니까";
		}
		return setFinal(ch, 17) + "니까";
	});
	out = out.replace(/([가-힣])(?:으\/십니까)/g, (_, ch) => {
		const d = decomposeHangul(ch);
		if (d && d.final === 8) return setFinal(ch, 0) + "십니까";
		return ch + (d && d.final !== 0 ? "으십니까" : "십니까");
	});
	return out;
}

// constants-disable-start
function normalizeNominalParticleMorph(grammarList) {
	if (!grammarList || grammarList.length === 0) return "";
	const parts = [];
	for (const g of grammarList) {
		const id = g.unit ? g.unit[DATA_SCHEMA.Id] : g.unitId;
		const t = g.text || "";
		if (id === 550 || t === "들") {
			parts.push("들");
		} else if (id === 36 || t === "은" || t === "는") {
			parts.push("은/는");
		} else if (id === 96 || t === "이" || t === "가") {
			parts.push("이/가");
		} else if (id === 173 || t === "을" || t === "를") {
			parts.push("을/를");
		} else if (id === 1624 || t === "와" || t === "과") {
			parts.push("와/과");
		} else if (id === 260 || t === "이랑" || t === "랑") {
			parts.push("이랑/랑");
		} else if (id === 475 || id === 1240 || id === 1241 || t === "으로" || t === "로") {
			parts.push("(으)로");
		} else if (id === 476 || t === "이나" || t === "나") {
			parts.push("이나/나");
		} else if (id === 1397 || t === "이라서" || t === "라서") {
			parts.push("이라서/라서");
		} else if (id === 1398 || t === "이라도" || t === "라도") {
			parts.push("이라도/라도");
		} else if (t === "과의" || t === "와의") {
			parts.push("와/과의");
		} else if (t === "과는" || t === "와는") {
			parts.push("와/과는");
		} else if (t === "과도" || t === "와도") {
			parts.push("와/과도");
		} else if (t === "으로는" || t === "로는") {
			parts.push("(으)로는");
		} else if (t === "으로도" || t === "로도") {
			parts.push("(으)로도");
		} else if (t === "으로만" || t === "로만") {
			parts.push("(으)로만");
		} else if (t === "이랑은" || t === "랑은") {
			parts.push("이랑/랑은");
		} else if (t === "이랑도" || t === "랑도") {
			parts.push("이랑/랑도");
		} else {
			parts.push(t);
		}
	}
	return parts.join("");
}

function deduceCopulaMorph(cleanSurface, origKo) {
	const tail = (origKo && cleanSurface.startsWith(origKo))
		? cleanSurface.slice(origKo.length)
		: cleanSurface;
	if (tail === "입니다") return "입니다";
	if (tail === "이에요" || tail === "예요") return "이/예요";
	if (tail === "이야" || tail === "야") return "이야/야";
	if (tail === "이었어요" || tail === "였어요") return "이었/였어요";
	if (tail === "이었습니다" || tail === "였습니다") return "이었/였습니다";
	if (tail === "이었으면" || tail === "였으면") return "이었/였으면";
	if (tail === "이었는데" || tail === "였는데") return "이었/였는데";
	if (tail === "이어서" || tail === "여서") return "이어/여서";
	if (tail === "이고") return "이고";
	if (tail === "인데") return "인데";
	if (tail === "인데요") return "인데요";
	if (tail === "인") return "인";
	if (tail === "일까요") return "일까요";
	if (tail === "이니까" || tail === "니까") return "(이)니까";
	if (tail === "이냐고" || tail === "냐고") return "(이)냐고";
	if (tail === "이다" || tail === "다") return "(이)다";
	return tail || "이/예요";
}

function realizeCopulaMorph(nounKo, morphTemplate) {
	const hasB = hasBatchim(nounKo.slice(-1));
	switch (morphTemplate) {
		case "입니다": return nounKo + "입니다";
		case "이/예요": return nounKo + (hasB ? "이에요" : "예요");
		case "이야/야": return nounKo + (hasB ? "이야" : "야");
		case "이었/였어요": return nounKo + (hasB ? "이었어요" : "였어요");
		case "이었/였습니다": return nounKo + (hasB ? "이었습니다" : "였습니다");
		case "이었/였으면": return nounKo + (hasB ? "이었으면" : "였으면");
		case "이었/였는데": return nounKo + (hasB ? "이었는데" : "였는데");
		case "이어/여서": return nounKo + (hasB ? "이어서" : "여서");
		case "(이)니까": return nounKo + (hasB ? "이니까" : "니까");
		case "(이)냐고": return nounKo + (hasB ? "이냐고" : "냐고");
		case "(이)다": return nounKo + (hasB ? "이다" : "다");
		default: return nounKo + (morphTemplate || "");
	}
}

function deduceVerbInflection(unit, cleanSurface, grammarList) {
	let surf = cleanSurface;
	let prefix = "";
	if (surf.startsWith("얼마나 ")) {
		prefix = "얼마나 ";
		surf = surf.slice(4).trim();
	} else if (grammarList && grammarList.some(g => g.text === "안") && surf.startsWith("안") && !unit[DATA_SCHEMA.Korean].startsWith("안")) {
		prefix = "안";
		surf = surf.slice(1).trim();
	} else if (grammarList && grammarList.some(g => g.text === "못") && surf.startsWith("못") && !unit[DATA_SCHEMA.Korean].startsWith("못")) {
		prefix = "못";
		surf = surf.slice(1).trim();
	}

	const ko = unit[DATA_SCHEMA.Korean];
	const conj = getEffectiveConjRule(ko, unit[DATA_SCHEMA.Conjugation]);
	const rawStem = getStem(ko);
	const conjStem = getConjugatedStem(ko, conj);
	const aoStem = conjugateAoStem(rawStem, conj);
	const pastStem = toPastStem(aoStem);

	if (pastStem && surf.startsWith(pastStem)) {
		return { prefix, stemForm: "past", suffix: surf.slice(pastStem.length) };
	}

	if (aoStem && aoStem !== rawStem && surf.startsWith(aoStem)) {
		return { prefix, stemForm: "ao", suffix: surf.slice(aoStem.length) };
	}

	const candidateConjSuffixes = [
		"습니다/ㅂ니다",
		"습니까/ㅂ니까",
		"으/십니까",
		"으/ㅂ시다",
		"으/십시오",
		"으/세요",
		"으/셨습니다",
		"으/셨어요",
		"으/셔서",
		"으/십니다",
		"으/신",
		"으/시는"
	];
	for (const cand of candidateConjSuffixes) {
		if (applyCustomVerbMorph(conjStem, cand) === surf) {
			return { prefix, stemForm: "conj", suffix: cand };
		}
	}

	const firstSpaceIdx = surf.indexOf(' ');
	const firstWord = firstSpaceIdx === -1 ? surf : surf.slice(0, firstSpaceIdx);
	const restWords = firstSpaceIdx === -1 ? "" : surf.slice(firstSpaceIdx);

	const morphPrefixes = [
		"으/ㄴ데", "으/ㄴ가요", "으/ㄴ지", "으/ㄴ",
		"으/ㄹ까요", "으/ㄹ까", "으/ㄹ래요", "으/ㄹ래", "으/ㄹ게요", "으/ㄹ게", "으/ㄹ",
		"으/면", "으/면서", "으/니까", "으/려고", "으/려면", "으/러",
		"으/시", "으/셔", "으/셨", "으/세",
		"(느)ㄴ다", "(느)ㄴ다고", "는"
	];
	for (const mp of morphPrefixes) {
		const resolvedFirst = applyCustomVerbMorph(conjStem, mp);
		if (resolvedFirst === firstWord) {
			return { prefix, stemForm: "conj", suffix: mp + restWords };
		}
		if (firstWord.startsWith(resolvedFirst) && resolvedFirst.length >= rawStem.length) {
			const extra = firstWord.slice(resolvedFirst.length);
			const testFull = applyCustomVerbMorph(conjStem, mp + extra + restWords);
			if (testFull === surf) {
				return { prefix, stemForm: "conj", suffix: mp + extra + restWords };
			}
		}
	}

	if (aoStem && surf.startsWith(aoStem)) {
		const tail = surf.slice(aoStem.length);
		if (/^(?:요|서|도|야|라|지|져|졌|집|\s|$)/.test(tail)) {
			return { prefix, stemForm: "ao", suffix: tail };
		}
	}

	if (rawStem && surf.startsWith(rawStem)) {
		return { prefix, stemForm: "raw", suffix: surf.slice(rawStem.length) };
	}
	const noSpaceSurf = surf.replace(/\s+/g, '');
	if (rawStem && noSpaceSurf.startsWith(rawStem)) {
		return { prefix, stemForm: "raw", suffix: noSpaceSurf.slice(rawStem.length) };
	}

	return { prefix, stemForm: "exact", suffix: cleanSurface };
}

function realizeVerbInflection(unit, inflection, isOriginalUnit = false, originalSurface = "") {
	if (isOriginalUnit && originalSurface) return originalSurface;
	const ko = unit[DATA_SCHEMA.Korean];
	const conj = getEffectiveConjRule(ko, unit[DATA_SCHEMA.Conjugation]);
	const rawStem = getStem(ko);
	const conjStem = getConjugatedStem(ko, conj);
	const aoStem = conjugateAoStem(rawStem, conj);
	const pastStem = toPastStem(aoStem);

	const { prefix = "", stemForm = "raw", suffix = "" } = inflection || {};
	if (stemForm === "exact") return suffix || ko;
	let body = "";
	if (stemForm === "past") {
		if (suffix === "어요" || suffix === "아요") {
			body = pastStem + "어요";
		} else {
			body = pastStem + suffix;
		}
	} else if (stemForm === "ao") {
		body = aoStem + suffix;
	} else if (stemForm === "conj") {
		body = applyCustomVerbMorph(conjStem, suffix);
	} else {
		body = rawStem + suffix;
	}
	return (prefix ? prefix + body : body);
}
// constants-disable-end

// ============================================================================
// 2. Passage Sentence Cleaning & Template Extraction
// ============================================================================

/**
 * Extracts clean, complete Korean sentences from a study text passage,
 * filtering out standalone headers, chat timestamps, and non-sentence metadata.
 */
function extractCleanSentenceStrings(passageText) {
	const rawLines = (passageText || '')
		.split(/\r?\n/)
		.map(l => l.replace(/^[#↳★①②③④⑤※•\-*\s]+/, '').replace(/^(?:[가나]|[AB]|Q|A):\s*|^(?:Q|A)\s+/, '').replace(/\[-\]/g, '').trim())
		.filter(Boolean);

	const normalizedLines = [];
	for (let i = 0; i < rawLines.length; i++) {
		const line = rawLines[i];
		if (/^(?:오전|오후)?\s*\d{1,2}:\d{2}$/.test(line)) continue;
		if (/^[A-Za-z0-9\s._@-]+$/.test(line)) continue;
		if (line.includes('→') || line.includes('|') || line.includes('▶')) continue;
		if (/^(?:제목|일시|장소|시간|배달\s*시간|배달\s*거리|주소|점수|전화|이메일|재료|양념|카테고리)\b/.test(line) && !/[.?!]$/.test(line)) continue;

		if (!/[.?!~]$/.test(line) && i + 1 < rawLines.length) {
			const words = line.split(/\s+/);
			const looksLikeWrappedClause = (words.length >= 3 && /(?:때|고|서|면|며|지만|는데|니까|어|아|해|여|은|는|이|가|을|를|에|에서|으로|로|와|과|,)$/.test(line));
			if (looksLikeWrappedClause) {
				rawLines[i + 1] = line + ' ' + rawLines[i + 1];
				continue;
			}
		}

		const parts = line
			.split(/(?<=[.?!~]["“”'‘’]?,?)\s+/)
			.map(s => s.replace(/^["“”'‘’]+|["“”'‘’]+$/g, '').trim())
			.filter(Boolean);

		for (const p of parts) {
			if (/[.?!~]$/.test(p) && /[가-힣]/.test(p)) {
				normalizedLines.push(p);
			} else if (rawLines.length === 1 && /[가-힣]/.test(p) && p.split(/\s+/).length >= 2) {
				// Single-line user input without trailing punctuation
				normalizedLines.push(p + '.');
			}
		}
	}
	return normalizedLines;
}

/**
 * Converts a single analyzed token from sentence_analyzer into a Verified Sentence slot.
 */
function buildSlotFromToken(token, slotIndex) {
	if (!token) return null;
	const rawSurface = String(token.surface || '').trim();
	const punctMatch = rawSurface.match(/([.?!,~]+)$/);
	const trailingPunct = punctMatch ? punctMatch[1] : "";
	const cleanSurface = rawSurface.replace(/[.?!,~"”'’]+$/g, '');

	const grammarItems = [];
	if (Array.isArray(token.grammar)) {
		for (const g of token.grammar) {
			const gUnit = g.unit || null;
			const gId = gUnit ? gUnit[DATA_SCHEMA.Id] : (typeof g.unitId === 'number' ? g.unitId : null);
			if (gId !== null || g.text) {
				grammarItems.push({
					unitId: gId,
					text: g.text || (gUnit ? gUnit[DATA_SCHEMA.Korean] : ""),
					ko: gUnit ? gUnit[DATA_SCHEMA.Korean] : (g.text || ""),
					pos: g.pos || K.POS_GRAMMAR,
					en: gUnit ? gUnit[DATA_SCHEMA.English] : (g.gloss || "")
				});
			}
		}
	}

	// Resolve primary lexical unit for this slot
	let lexUnit = null;
	let numberPrefix = "";
	let compoundPrefixKo = "";

	if (token.lexical) {
		if (token.category === "compound_noun" && Array.isArray(token.lexical.components) && token.lexical.components.length > 0) {
			const lastComp = token.lexical.components[token.lexical.components.length - 1];
			lexUnit = lastComp.unit || null;
			if (token.lexical.components.length > 1) {
				compoundPrefixKo = token.lexical.components.slice(0, -1).map(c => c.text).join('');
			}
		} else if (token.category === "numeric_phrase" && token.lexical.counter) {
			lexUnit = token.lexical.counter.unit || null;
			numberPrefix = token.lexical.number ? String(token.lexical.number.value || "") : "";
		} else {
			lexUnit = token.lexical.unit || null;
		}
	}

	// Standalone particle or pure grammar token
	if (!lexUnit && grammarItems.length > 0) {
		const primaryG = grammarItems[0];
		const units = getUnitsArray();
		const gUnit = primaryG.unitId !== null ? units[primaryG.unitId] : null;
		const gRaw = gUnit ? gUnit[DATA_SCHEMA.SemanticTags] : null;
		const gTags = (gRaw instanceof Set ? Array.from(gRaw) : (Array.isArray(gRaw) ? [...gRaw] : [])).filter(Boolean);
		return {
			index: slotIndex,
			originalSurface: cleanSurface,
			trailingPunct: trailingPunct === "," ? "," : "",
			category: token.category || "standalone_particle",
			pos: K.POS_GRAMMAR,
			originalUnitId: primaryG.unitId,
			originalKo: gUnit ? gUnit[DATA_SCHEMA.Korean] : cleanSurface,
			originalEn: gUnit ? gUnit[DATA_SCHEMA.English] : primaryG.en,
			tags: gTags.length > 0 ? gTags : [K.GRAMMAR],
			grammar: grammarItems,
			morphTemplate: "",
			inflection: { prefix: "", stemForm: "fixed_grammar", suffix: cleanSurface }
		};
	}

	if (!lexUnit) return null;

	const pos = lexUnit[DATA_SCHEMA.PartofSpeech] || K.NOUN;
	const origId = lexUnit[DATA_SCHEMA.Id];
	const origKo = lexUnit[DATA_SCHEMA.Korean];
	const origEn = lexUnit[DATA_SCHEMA.English];
	const rawTags = lexUnit[DATA_SCHEMA.SemanticTags];
	const tags = (rawTags instanceof Set ? Array.from(rawTags) : (Array.isArray(rawTags) ? [...rawTags] : [])).filter(Boolean);

	let morphTemplate = "";
	let inflection = { prefix: "", stemForm: "nominal", suffix: "" };

	if (pos === K.ACTION_VERB || pos === K.DESCRIPTIVE_VERB) {
		inflection = deduceVerbInflection(lexUnit, cleanSurface, grammarItems);
		morphTemplate = (inflection.prefix ? inflection.prefix : "") + (inflection.suffix || "");
	} else if (token.category && token.category.startsWith("noun_copula")) {
		morphTemplate = deduceCopulaMorph(cleanSurface, origKo);
		inflection = { prefix: "", stemForm: "copula", suffix: morphTemplate };
	} else if (token.category === "numeric_phrase") {
		morphTemplate = normalizeNominalParticleMorph(grammarItems);
		inflection = { prefix: numberPrefix, stemForm: "numeric", suffix: morphTemplate };
	} else {
		morphTemplate = normalizeNominalParticleMorph(grammarItems);
		inflection = { prefix: compoundPrefixKo, stemForm: "nominal", suffix: morphTemplate };
	}

	return {
		index: slotIndex,
		originalSurface: cleanSurface,
		trailingPunct: trailingPunct === "," ? "," : "",
		category: token.category || "exact_lexical",
		pos,
		originalUnitId: origId,
		originalKo: origKo,
		originalEn: origEn,
		tags,
		grammar: grammarItems,
		morphTemplate,
		inflection
	};
}

/**
 * Generates a concise default title describing a Verified Sentence template.
 */
function buildDefaultTemplateTitle(slots, sourceName, seqNum, originalKo) {
	const cleanKo = String(originalKo || '').trim();
	const posSummary = slots
		.slice(0, 4)
		.map(s => {
			const gText = (s.grammar && s.grammar.length > 0)
				? '+' + s.grammar.map(g => g.text).join('+')
				: '';
			return `${s.originalKo}${gText}`;
		})
		.join(' · ');
	const prefix = sourceName ? `[${sourceName}${seqNum ? ' #' + seqNum : ''}] ` : '';
	return `${prefix}${cleanKo || posSummary}`;
}

/**
 * Extracts a Verified Sentence template object from a sentence string or analyzed sentence object.
 */
function extractVerifiedSentenceTemplate(sentOrText, sourceName = K.CUSTOM_PASSAGE, explicitIndex = null, seqNum = 1) {
	const analyzer = getAnalyzer();
	let analyzed = sentOrText;
	if (typeof sentOrText === 'string') {
		if (!analyzer || typeof analyzer.analyzeSentence !== 'function') return null;
		analyzed = analyzer.analyzeSentence(sentOrText, seqNum, explicitIndex);
	}
	if (!analyzed || !Array.isArray(analyzed.tokens) || analyzed.tokens.length < 2) {
		return null;
	}

	// Ensure no unrecognized tokens or missing curriculum gaps in a Verified Sentence
	const hasMissing = analyzed.tokens.some(t =>
		!t ||
		t.category === 'unknown' ||
		(t.lexical && t.lexical.missing) ||
		(Array.isArray(t.grammar) && t.grammar.some(g => g.missing))
	);
	if (hasMissing) return null;

	const slots = [];
	const grammarUnitIdsSet = new Set();

	for (let i = 0; i < analyzed.tokens.length; i++) {
		const slot = buildSlotFromToken(analyzed.tokens[i], slots.length);
		if (!slot) return null;
		for (const g of slot.grammar) {
			if (typeof g.unitId === 'number') {
				grammarUnitIdsSet.add(g.unitId);
			}
		}
		slots.push(slot);
	}

	// Require at least one grammar or verb constituent so simple noun lists are excluded
	const hasPredicateOrGrammar = slots.some(s =>
		s.pos === K.ACTION_VERB ||
		s.pos === K.DESCRIPTIVE_VERB ||
		s.grammar.length > 0
	);
	if (!hasPredicateOrGrammar) return null;

	const originalKo = String(analyzed.text || '').trim();
	const punctMatch = originalKo.match(/([.?!~]+)$/);
	const punctuation = punctMatch ? punctMatch[1] : ".";
	const safeSource = String(sourceName || K.CUSTOM_PASSAGE).replace(/[^a-zA-Z0-9_-]/g, '_');
	const id = `vs_${safeSource}_${seqNum}`;

	const tpl = {
		id,
		title: buildDefaultTemplateTitle(slots, sourceName, seqNum, originalKo),
		source: sourceName || K.CUSTOM_PASSAGE,
		originalKo,
		punctuation,
		isHardcoded: false,
		grammarUnitIds: Array.from(grammarUnitIdsSet),
		slots
	};

	// AST Recomposition Validation Gate: Verify grammatical & syntactic integrity
	const units = getUnitsArray();
	const slotChoices = slots.map(s => {
		const u = s.originalUnitId != null ? (units && units[s.originalUnitId]) : null;
		return {
			slotIndex: s.index,
			chosenUnit: u,
			chosenUnitId: s.originalUnitId,
			surfaceKo: s.originalSurface,
			isVariedSlot: false,
			pos: u ? u[DATA_SCHEMA.PartofSpeech] : s.pos,
			grammar: s.grammar
		};
	});
	const realized = { ko: originalKo, en: '' };
	const ast = recomposeASTFromVerifiedSentence(tpl, slotChoices, realized);
	const valResult = validateVerifiedSentence(ast, realized, slotChoices);
	if (!valResult.valid || (valResult.errors && valResult.errors.length > 0)) {
		return null;
	}

	return tpl;
}

/**
 * Extracts all Verified Sentence templates from a Korean study text passage.
 */
function extractVerifiedSentencesFromPassage(passageText, sourceName = K.CUSTOM_PASSAGE, options = {}) {
	const analyzer = getAnalyzer();
	if (!analyzer || typeof analyzer.analyzeSentence !== 'function') return [];

	const index = options.index || (typeof analyzer.getIndex === 'function' ? analyzer.getIndex() : null);
	const cleanSentences = extractCleanSentenceStrings(passageText);
	const templates = [];
	const seenKo = new Set();

	for (let i = 0; i < cleanSentences.length; i++) {
		const sText = cleanSentences[i];
		if (seenKo.has(sText)) continue;
		const tpl = extractVerifiedSentenceTemplate(sText, sourceName, index, templates.length + 1);
		if (tpl) {
			if (options.isHardcoded) {
				tpl.isHardcoded = true;
			}
			seenKo.add(sText);
			templates.push(tpl);
		}
	}

	return templates;
}

// ============================================================================
// 3. Candidate Pool Evaluation & Single-Choice Detection
// ============================================================================

/**
 * Finds all candidate Language Units from data.js that satisfy a slot's
 * Part of Speech and Semantic Tag filter requirements.
 */
function getSlotCandidates(slot, options = {}) {
	const units = getUnitsArray();
	if (!slot || !units || units.length === 0) {
		return { candidates: [], count: 0, isSingleChoice: false, isZeroChoice: true, singleChoiceUnit: null };
	}

	if (slot.inflection && slot.inflection.stemForm === "fixed_grammar") {
		const fixedUnit = typeof slot.originalUnitId === 'number' ? units[slot.originalUnitId] : null;
		const list = fixedUnit ? [fixedUnit] : [];
		return {
			candidates: list,
			count: list.length,
			isSingleChoice: list.length === 1,
			isZeroChoice: list.length === 0,
			singleChoiceUnit: fixedUnit
		};
	}

	const requiredPos = slot.pos;
	const requiredTags = Array.isArray(slot.tags) ? slot.tags.filter(Boolean) : [];
	const onlyFromSet = Boolean(options.onlyFromSet);
	const allowedUnitIds = options.allowedUnitIds instanceof Set ? options.allowedUnitIds : null;
	const targetUnitId = typeof options.targetUnitId === 'number' ? options.targetUnitId : null;

	const candidates = [];
	for (let i = 0; i < units.length; i++) {
		const u = units[i];
		if (!u) continue;
		if (u[DATA_SCHEMA.PartofSpeech] !== requiredPos) continue;

		// Check all required semantic tags
		let matchesAllTags = true;
		for (let tIdx = 0; tIdx < requiredTags.length; tIdx++) {
			if (!_hasTag(u, requiredTags[tIdx])) {
				matchesAllTags = false;
				break;
			}
		}
		if (!matchesAllTags) continue;

		// Relational position nouns (e.g. 앞, 뒤, 위, 맞은편, 건너편) can only be substituted if slot explicitly requires 'position'
		if (!requiredTags.includes("position") && _hasTag(u, "position")) {
			continue;
		}

		// Measure words / counters (e.g. 개, 명, 권, 마리) can only be substituted if slot explicitly requires 'measureWord'
		if (!requiredTags.includes(K.MEASUREWORD) && !requiredTags.includes("counter") && _hasTag(u, K.MEASUREWORD, "counter")) {
			continue;
		}

		// NPI (Negative Polarity Item) adverbs can only be used in negative clauses
		if (requiredPos === K.POS_ADVERB) {
			const isNpi = _hasTag(u, "npi") || (state.ALL_NPI_WORDS && state.ALL_NPI_WORDS.has(u[DATA_SCHEMA.Korean]));
			if (isNpi) {
				const slotTpl = slot.morphTemplate || "";
				const isNegativeSlot = slotTpl.includes("지 않") || slotTpl.includes("없다") || slotTpl.includes("못하");
				if (!isNegativeSlot && !options.isNegativeClause) {
					continue;
				}
			}
		}

		if (onlyFromSet && allowedUnitIds) {
			const id = u[DATA_SCHEMA.Id];
			if (id !== targetUnitId && !allowedUnitIds.has(id)) {
				continue;
			}
		}

		candidates.push(u);
	}

	return {
		candidates,
		count: candidates.length,
		isSingleChoice: candidates.length === 1,
		isZeroChoice: candidates.length === 0,
		singleChoiceUnit: candidates.length === 1 ? candidates[0] : null
	};
}

/**
 * Analyzes all slots in a Verified Sentence template, computing candidate pool
 * sizes, single-choice flags, and total sentence combination capacity.
 */
function analyzeTemplateStructure(template, options = {}) {
	if (!template || !Array.isArray(template.slots)) {
		return { slotStats: [], singleChoiceCount: 0, zeroChoiceCount: 0, totalCombinations: 0 };
	}

	let singleChoiceCount = 0;
	let zeroChoiceCount = 0;
	let totalCombinations = 1;

	const slotStats = template.slots.map((slot, idx) => {
		const pool = getSlotCandidates(slot, options);
		if (pool.isSingleChoice) singleChoiceCount++;
		if (pool.isZeroChoice) zeroChoiceCount++;
		totalCombinations *= Math.max(1, pool.count);
		return {
			slotIndex: idx,
			pos: slot.pos,
			tags: [...(slot.tags || [])],
			grammar: slot.grammar || [],
			count: pool.count,
			isSingleChoice: pool.isSingleChoice,
			isZeroChoice: pool.isZeroChoice,
			singleChoiceUnit: pool.singleChoiceUnit,
			sampleUnits: pool.candidates.slice(0, 8).map(u => ({
				id: u[DATA_SCHEMA.Id],
				ko: u[DATA_SCHEMA.Korean],
				en: u[DATA_SCHEMA.English]
			}))
		};
	});

	return {
		slotStats,
		singleChoiceCount,
		hasSingleChoice: singleChoiceCount > 0,
		zeroChoiceCount,
		totalCombinations
	};
}

// ============================================================================
// 4. Realizing Slots & Generating Sentences from Verified Templates
// ============================================================================

function getGrammarLiteralSuffix(grammarItems) {
	if (!grammarItems || grammarItems.length === 0) return "";
	const units = getUnitsArray();
	const tags = [];
	for (const g of grammarItems) {
		const gUnit = typeof g.unitId === 'number' ? units[g.unitId] : null;
		if (g.pos === "Particle" && gUnit) {
			const pTag = getParticleLiteralTag(null, gUnit);
			if (pTag) {
				tags.push(pTag);
				continue;
			}
		}
		if (gUnit) {
			const sd = parseSemanticData(gUnit);
			if (sd && sd.en && (sd.en.lit || sd.en.role)) {
				const r = String(sd.en.lit || sd.en.role).replace(/^-+/, '');
				tags.push(`-${r}`);
				continue;
			}
		}
		const shortEn = String(g.en || g.text || '')
			.replace(/\([^)]*\)/g, '')
			.split(/[;,/]/)[0]
			.trim()
			.replace(/\s+/g, '-');
		if (shortEn) tags.push(`-[${shortEn}]`);
	}
	return tags.join('');
}

/**
 * Inflects a chosen Language Unit into a Verified Sentence slot, returning
 * surface Korean, eojeols with morpheme segments, and literal/natural English tokens.
 */
function realizeSlot(slot, chosenUnit) {
	const units = getUnitsArray();
	const activeUnit = chosenUnit || (typeof slot.originalUnitId === 'number' ? units[slot.originalUnitId] : null);
	const isOrig = Boolean(activeUnit && activeUnit[DATA_SCHEMA.Id] === slot.originalUnitId);

	const inf = slot.inflection || { prefix: "", stemForm: "nominal", suffix: slot.morphTemplate || "" };
	let surfaceKo = "";

	if (inf.stemForm === "fixed_grammar") {
		surfaceKo = slot.originalSurface || (activeUnit ? activeUnit[DATA_SCHEMA.Korean] : "");
	} else if (activeUnit) {
		const ko = activeUnit[DATA_SCHEMA.Korean];
		if (slot.pos === K.ACTION_VERB || slot.pos === K.DESCRIPTIVE_VERB) {
			surfaceKo = realizeVerbInflection(activeUnit, inf, isOrig, slot.originalSurface);
		} else if (inf.stemForm === "copula") {
			surfaceKo = isOrig && slot.originalSurface
				? slot.originalSurface
				: realizeCopulaMorph(ko, inf.suffix || slot.morphTemplate);
		} else if (inf.stemForm === "numeric") {
			const numPre = inf.prefix || "1";
			const rawNominal = numPre + ko + (inf.suffix || "");
			surfaceKo = resolvePureMorphology(rawNominal, state);
		} else {
			if (isOrig && slot.originalSurface) {
				surfaceKo = slot.originalSurface;
			} else {
				// Pronoun clitic allomorphy (저/제, 나/내, 너/네, 누구/누가)
				const mTemp = inf.suffix || slot.morphTemplate || "";
				const gTexts = (slot.grammar || []).map(g => g.text || "").join(" ");
				const isTopic = mTemp.includes("은/는") || gTexts.includes("은") || gTexts.includes("는");
				const isSubject = mTemp.includes("이/가") || gTexts.includes("이") || gTexts.includes("가");
				const isObject = mTemp.includes("을/를") || gTexts.includes("을") || gTexts.includes("를");

				if ((ko === "저" || ko === "제") && isTopic) {
					surfaceKo = "저는";
				} else if ((ko === "저" || ko === "제") && isSubject) {
					surfaceKo = "제가";
				} else if ((ko === "저" || ko === "제") && isObject) {
					surfaceKo = "저를";
				} else if ((ko === "나" || ko === "내") && isTopic) {
					surfaceKo = "나는";
				} else if ((ko === "나" || ko === "내") && isSubject) {
					surfaceKo = "내가";
				} else if ((ko === "나" || ko === "내") && isObject) {
					surfaceKo = "나를";
				} else if ((ko === "너" || ko === "네") && isTopic) {
					surfaceKo = "너는";
				} else if ((ko === "너" || ko === "네") && isSubject) {
					surfaceKo = "네가";
				} else if ((ko === "너" || ko === "네") && isObject) {
					surfaceKo = "너를";
				} else if (ko === "누구" && isSubject) {
					surfaceKo = "누가";
				} else {
					const rawNominal = ko + (inf.suffix || slot.morphTemplate || "");
					surfaceKo = resolvePureMorphology(rawNominal, state);
				}
			}
		}
	} else {
		surfaceKo = slot.originalSurface || "";
	}

	const surfaceWithComma = slot.trailingPunct ? (surfaceKo + slot.trailingPunct) : surfaceKo;

	// Build morpheme segments for eojeols
	const grammarUnits = (slot.grammar || [])
		.map(g => (typeof g.unitId === 'number' ? units[g.unitId] : null))
		.filter(Boolean);
	const primaryGrammarUnit = grammarUnits.length > 0 ? grammarUnits[grammarUnits.length - 1] : null;

	const words = surfaceKo.trim().split(/\s+/).filter(Boolean);
	const eojeols = [];

	const litStem = activeUnit ? getUnitLiteralStem(activeUnit) : surfaceKo;
	const gLitSuffix = getGrammarLiteralSuffix(slot.grammar);
	const surfaceEnLit = `${inf.stemForm === "numeric" && inf.prefix ? inf.prefix + "-" : ""}${litStem}${gLitSuffix}`;
	const natPhrase = activeUnit ? getUnitNaturalPhrase(activeUnit) : "";

	if (words.length <= 1) {
		const w = words[0] || surfaceKo;
		let segs;
		if (inf.stemForm === "fixed_grammar") {
			segs = [makeSegment(w, activeUnit || primaryGrammarUnit, K.GRAMMAR, K.GRAMMAR)];
		} else if (slot.pos === K.ACTION_VERB || slot.pos === K.DESCRIPTIVE_VERB) {
			segs = splitSingleVerbWordSegments(w, activeUnit, primaryGrammarUnit, "predicate");
		} else {
			segs = splitNounAndParticleSegments(w, activeUnit, primaryGrammarUnit, "constituent");
		}
		if (segs.length > 0) {
			segs[0].textEn = litStem;
			if (segs.length > 1 && gLitSuffix) {
				segs[segs.length - 1].textEn = gLitSuffix;
			}
		}
		const allUnitIds = Array.from(new Set([
			...(activeUnit ? [activeUnit[DATA_SCHEMA.Id]] : []),
			...grammarUnits.map(gu => gu[DATA_SCHEMA.Id])
		]));
		eojeols.push({
			surfaceKo: surfaceWithComma,
			surfaceEnLit,
			role: (slot.pos === K.ACTION_VERB || slot.pos === K.DESCRIPTIVE_VERB) ? "predicate" : "constituent",
			headUnitId: activeUnit ? activeUnit[DATA_SCHEMA.Id] : null,
			particleUnitId: (slot.pos !== K.ACTION_VERB && slot.pos !== K.DESCRIPTIVE_VERB && primaryGrammarUnit) ? primaryGrammarUnit[DATA_SCHEMA.Id] : null,
			endingUnitId: ((slot.pos === K.ACTION_VERB || slot.pos === K.DESCRIPTIVE_VERB) && primaryGrammarUnit) ? primaryGrammarUnit[DATA_SCHEMA.Id] : null,
			unitIds: allUnitIds,
			segments: segs
		});
	} else {
		// Multi-word slot (e.g. auxiliary construction "만난 후에", "알고 싶어했습니다", or multi-word noun "미국 사람는")
		for (let wIdx = 0; wIdx < words.length; wIdx++) {
			const isFirst = wIdx === 0;
			const isLast = wIdx === words.length - 1;
			const w = (isLast && slot.trailingPunct) ? (words[wIdx] + slot.trailingPunct) : words[wIdx];
			let segs;
			if (slot.pos === K.ACTION_VERB || slot.pos === K.DESCRIPTIVE_VERB) {
				if (isFirst) {
					segs = splitSingleVerbWordSegments(words[wIdx], activeUnit, grammarUnits[0] || primaryGrammarUnit, "predicate");
					if (segs.length > 0) segs[0].textEn = litStem;
				} else {
					const auxG = primaryGrammarUnit || activeUnit;
					const seg = makeSegment(words[wIdx], auxG, K.GRAMMAR, "predicate_aux");
					seg.textEn = gLitSuffix;
					segs = [seg];
				}
			} else {
				if (isLast) {
					segs = splitNounAndParticleSegments(words[wIdx], activeUnit, primaryGrammarUnit, "constituent");
					if (segs.length > 0) segs[0].textEn = litStem;
					if (segs.length > 1) segs[segs.length - 1].textEn = gLitSuffix;
				} else {
					const seg = makeSegment(words[wIdx], activeUnit, "lexical", "constituent");
					seg.textEn = litStem;
					segs = [seg];
				}
			}
			eojeols.push({
				surfaceKo: w,
				surfaceEnLit: isFirst ? surfaceEnLit : "",
				role: (slot.pos === K.ACTION_VERB || slot.pos === K.DESCRIPTIVE_VERB) ? "predicate" : "constituent",
				headUnitId: activeUnit ? activeUnit[DATA_SCHEMA.Id] : null,
				particleUnitId: (!isFirst && primaryGrammarUnit) ? primaryGrammarUnit[DATA_SCHEMA.Id] : null,
				endingUnitId: (isLast && primaryGrammarUnit) ? primaryGrammarUnit[DATA_SCHEMA.Id] : null,
				unitIds: segs.map(s => s.unitId).filter(id => id !== null),
				segments: segs
			});
		}
	}

	return {
		surfaceKo: surfaceWithComma,
		surfaceEnLit,
		surfaceEnNat: natPhrase,
		chosenUnit: activeUnit,
		grammarUnits,
		eojeols
	};
}

function pickCandidateFromPool(candidates, options = {}, slotIndex = 0) {
	if (!candidates || candidates.length === 0) return null;
	if (candidates.length === 1) return candidates[0];

	let pool = candidates;
	const tier = options.difficultyTier || options.tier;

	if (tier === 'easiest') {
		// Tier 1: Easiest vocabulary (lowest PriorityScore available)
		let minScore = 999;
		for (let i = 0; i < candidates.length; i++) {
			const sc = candidates[i][DATA_SCHEMA.PriorityScore] || 3;
			if (sc < minScore) minScore = sc;
		}
		const easyGroup = candidates.filter(u => (u[DATA_SCHEMA.PriorityScore] || 3) <= minScore);
		if (easyGroup.length > 0) pool = easyGroup;
	} else if (tier === 'easy_and_inset') {
		// Tier 2: 50% in-set vocabulary / 50% easy vocabulary (PriorityScore <= 2)
		const allowedSet = options.allowedUnitIds instanceof Set ? options.allowedUnitIds : null;
		const inSetPool = allowedSet ? candidates.filter(u => allowedSet.has(u[DATA_SCHEMA.Id])) : [];
		const easyPool = candidates.filter(u => (u[DATA_SCHEMA.PriorityScore] || 3) <= 2);

		const rndChoice = (state && typeof state.seededRandom === 'function') ? state.seededRandom() : Math.random();
		if (inSetPool.length > 0 && easyPool.length > 0) {
			pool = (rndChoice < 0.5) ? inSetPool : easyPool;
		} else if (inSetPool.length > 0) {
			pool = inSetPool;
		} else if (easyPool.length > 0) {
			pool = easyPool;
		}
	}
	// Tier 3 ('challenging') or default: use full candidate pool for maximum diversity & challenge

	if (options.random === true) {
		return pool[Math.floor(Math.random() * pool.length)];
	}
	if (typeof options.seedOffset === 'number' || typeof options.variationIndex === 'number') {
		const base = (Number(options.seedOffset) || 0) + (Number(options.variationIndex) || 0) * 7 + slotIndex * 13;
		return pool[Math.abs(base) % pool.length];
	}
	const rnd = (state && typeof state.seededRandom === 'function') ? state.seededRandom() : Math.random();
	return pool[Math.floor(rnd * pool.length)];
}

/**
 * Recomposes a candidate realized Verified Sentence into a full SentenceAST.
 * Maps non-predicate slots to ConstituentNodes and predicate slots to PredicateNodes,
 * structured into clauses matching the clausal boundary markers.
 */
function recomposeASTFromVerifiedSentence(template, slotChoices, realizedResult) {
	if (!template || !Array.isArray(slotChoices) || slotChoices.length === 0) {
		return null;
	}

	const punctuation = template.punctuation || (realizedResult && realizedResult.ko && realizedResult.ko.slice(-1)) || ".";
	const isQuestion = punctuation === "?";
	const speechAct = isQuestion ? "interrogative" : "declarative";

	const lastSlot = slotChoices[slotChoices.length - 1];
	let overallPoliteness = K.POLITE;
	let overallTense = "present";
	let overallPolarity = "affirmative";

	if (lastSlot) {
		const surf = lastSlot.surfaceKo || "";
		if (surf.includes("습니다") || surf.includes("ㅂ니다") || surf.includes("십니까") || surf.includes("십시오")) {
			overallPoliteness = "formal_high";
		} else if (surf.endsWith("다") && !surf.endsWith("마다") && !surf.endsWith("보다")) {
			overallPoliteness = K.PLAIN;
		}
		if (/(?:았|었|였)(?:다|습니다|어요|네요)/.test(surf)) {
			overallTense = "past";
		} else if (/(?:ㄹ|을)\s*거/.test(surf) || /(?:겠)(?:다|습니다|어요)/.test(surf)) {
			overallTense = "future";
		}
	}

	for (const sc of slotChoices) {
		const surf = sc.surfaceKo || "";
		if (surf === "안" || surf === "못" || surf.includes("지 않") || surf.includes("지 못하")) {
			overallPolarity = "negative";
			break;
		}
	}

	const units = getUnitsArray();
	const clauses = [];
	let currentConstituents = [];
	let currentPredicate = null;

	for (let i = 0; i < slotChoices.length; i++) {
		const sc = slotChoices[i];
		const templateSlot = template.slots && template.slots[i] ? template.slots[i] : {};
		const unit = sc.chosenUnit || (typeof sc.chosenUnitId === 'number' ? units[sc.chosenUnitId] : null);
		const pos = sc.pos || templateSlot.pos;
		const category = templateSlot.category || sc.category || "";
		const grammarList = templateSlot.grammar || sc.grammar || [];
		const surf = sc.surfaceKo || "";

		const isAdverbial = pos === K.POS_ADVERB || category === "adverbial_modifier" ||
			(templateSlot.inflection && templateSlot.inflection.stemForm === "adv") ||
			grammarList.some(g => {
				const gPos = Array.isArray(g) ? g[2] : g.pos;
				const gText = Array.isArray(g) ? g[1] : g.text;
				return gPos === "Adverbial Suffix" || gText === "-게" || gText === "게";
			});

		const isAdnominal = !isAdverbial && (category === "adnominal_modifier" ||
			(templateSlot.inflection && templateSlot.inflection.stemForm === "adnominal" && category !== "auxiliary_construction") ||
			grammarList.some(g => {
				const gPos = Array.isArray(g) ? g[2] : g.pos;
				return gPos === "Adnominal Ending";
			}));

		const isVerb = (pos === K.ACTION_VERB || pos === K.DESCRIPTIVE_VERB) && !isAdnominal && !isAdverbial;
		const isCopula = category.includes("copula") ||
			grammarList.some(g => {
				const gId = Array.isArray(g) ? g[0] : g.unitId;
				const gPos = Array.isArray(g) ? g[2] : g.pos;
				const gText = Array.isArray(g) ? g[1] : g.text;
				return gId === 56 || gPos === "Copula" || gText === "이다" || gText === "입니다" || gText === "이에요" || gText === "예요" || gText === "이야" || gText === "야" || gText === "이고";
			});

		if (isVerb) {
			currentPredicate = {
				role: "predicate",
				predType: pos === K.DESCRIPTIVE_VERB ? "descriptive" : K.ACTION,
				verbUnit: unit,
				endingUnit: grammarList.length > 0 ? grammarList[grammarList.length - 1].unit : null,
				isVariedSlot: sc.isVariedSlot,
				surfaceKo: surf,
				tense: /(?:았|었|였)/.test(surf) ? "past" : overallTense,
				polarity: overallPolarity,
				speechAct,
				politeness: overallPoliteness,
				eojeols: sc.eojeols || []
			};

			clauses.push({
				constituents: currentConstituents,
				predicate: currentPredicate
			});
			currentConstituents = [];
			currentPredicate = null;
		} else if (isCopula) {
			currentPredicate = {
				role: "predicate",
				predType: "copula",
				nounUnit: unit,
				copulaUnit: grammarList.length > 0 ? grammarList[0].unit : null,
				isVariedSlot: sc.isVariedSlot,
				surfaceKo: surf,
				tense: overallTense,
				polarity: overallPolarity,
				speechAct,
				politeness: overallPoliteness,
				eojeols: sc.eojeols || []
			};

			clauses.push({
				constituents: currentConstituents,
				predicate: currentPredicate
			});
			currentConstituents = [];
			currentPredicate = null;
		} else if (isAdnominal) {
			currentConstituents.push({
				role: "adnominal_modifier",
				category: "adnominal_modifier",
				unit,
				isVariedSlot: sc.isVariedSlot,
				surfaceKo: surf,
				eojeols: sc.eojeols || []
			});
		} else if (isAdverbial) {
			currentConstituents.push({
				role: K.ADVERB,
				category: "adverbial_modifier",
				unit,
				isVariedSlot: sc.isVariedSlot,
				surfaceKo: surf,
				eojeols: sc.eojeols || []
			});
		} else {
			let role = "constituent";
			let particleType = null;
			let primaryGrammar = grammarList.length > 0 ? grammarList[0].unit : null;

			const mTemp = templateSlot.morphTemplate || "";
			const isTopicParticle = mTemp.includes("은/는") || category.includes("topic") ||
				grammarList.some(g => g.unitId === 36 || (g.pos === "Particle" && (g.text === "은" || g.text === "는")));
			const isSubjectParticle = mTemp.includes("이/가") || category.includes("subject") ||
				grammarList.some(g => g.unitId === 96 || (g.pos === "Particle" && (g.text === "이" || g.text === "가")));
			const isObjectParticle = mTemp.includes("을/를") || category.includes(K.OBJECT) ||
				grammarList.some(g => g.unitId === 173 || (g.pos === "Particle" && (g.text === "을" || g.text === "를")));
			const isLocDyn = mTemp.includes("에서") || grammarList.some(g => g.unitId === 199 || (g.pos === "Particle" && g.text === "에서"));
			const isLocStat = (mTemp === "에" || grammarList.some(g => g.unitId === 132 || (g.pos === "Particle" && g.text === "에"))) && !isLocDyn;
			const isDir = mTemp.includes("로") || grammarList.some(g => g.unitId === 1241 || (g.pos === "Particle" && (g.text === "로" || g.text === "으로")));
			const isRecip = grammarList.some(g => g.pos === "Particle" && (g.text === "에게" || g.text === "한테" || g.text === "께"));

			if (isTopicParticle) {
				role = "topic";
				particleType = "topic";
			} else if (isSubjectParticle) {
				role = "subject";
				particleType = "subject";
			} else if (isObjectParticle) {
				role = K.OBJECT;
				particleType = K.OBJECT;
			} else if (isLocDyn) {
				role = "location_dynamic";
				particleType = "location_dynamic";
			} else if (isLocStat) {
				role = "location_static";
				particleType = "location_static";
			} else if (isDir) {
				role = "direction";
				particleType = "direction";
			} else if (isRecip) {
				role = "recipient";
				particleType = "recipient";
			} else if (pos === K.ADVERB || pos === K.POS_ADVERB) {
				role = K.ADVERB;
				particleType = K.ADVERB;
			} else if (pos === K.DETERMINER) {
				role = K.DETERMINER;
			} else if (pos === K.NUMBER) {
				role = "number";
			}

			currentConstituents.push({
				role,
				particleType,
				particleUnit: primaryGrammar,
				nounUnit: (pos === K.NOUN || pos === K.PRONOUN) ? unit : null,
				determinerUnit: pos === K.DETERMINER ? unit : null,
				numeralUnit: pos === K.NUMBER ? unit : null,
				unit,
				isVariedSlot: sc.isVariedSlot,
				surfaceKo: surf,
				eojeols: sc.eojeols || []
			});
		}
	}

	if (currentConstituents.length > 0 || currentPredicate) {
		clauses.push({
			constituents: currentConstituents,
			predicate: currentPredicate || { role: "predicate", predType: "unspecified", surfaceKo: "" }
		});
	}

	return {
		type: "Sentence",
		isVerifiedStructure: true,
		verifiedTemplateId: template.id,
		speechAct,
		politeness: overallPoliteness,
		tense: overallTense,
		polarity: overallPolarity,
		clauses
	};
}

/**
 * Validates a recomposed AST, realized string, and slot choices against standard
 * AST syntactic, valency, collocation, and phonological concord rules.
 */
function validateVerifiedSentence(ast, realized, slotChoices) {
	const errors = [];
	const warnings = [];

	if (!realized || !realized.ko) {
		return { valid: false, errors: [{ code: "EMPTY_REALIZATION", message: "Sentence has no realized Korean string" }], warnings };
	}

	// 1. Run standard AST and string validations if available
	if (typeof validateSentenceAST === 'function' && ast) {
		const astVal = validateSentenceAST(ast, realized);
		if (astVal && Array.isArray(astVal.errors)) errors.push(...astVal.errors);
		if (astVal && Array.isArray(astVal.warnings)) warnings.push(...astVal.warnings);
	}

	if (typeof validateSentenceString === 'function') {
		const strVal = validateSentenceString(realized.ko);
		if (strVal && Array.isArray(strVal.errors)) errors.push(...strVal.errors);
		if (strVal && Array.isArray(strVal.warnings)) warnings.push(...strVal.warnings);
	}

	// 2. Phonological & Pronoun-Particle Concord Checks
	const units = getUnitsArray();
	for (const sc of (slotChoices || [])) {
		const u = sc.chosenUnit || (typeof sc.chosenUnitId === 'number' ? units[sc.chosenUnitId] : null);
		if (!u) continue;
		const ko = u[DATA_SCHEMA.Korean] || "";
		const surf = sc.surfaceKo || "";

		// 제 cannot attach 는 (*제는 -> 저는) or 를 (*제를 -> 저를)
		if (ko === "제" && (/^제(?:는|은|를|을)/.test(surf))) {
			errors.push({
				code: "ILLEGAL_PRONOUN_PARTICLE_CONCORD",
				message: `Possessive pronoun '제' cannot attach topic/object particle ('${surf}'). Must be '저'.`
			});
		}
		// 내 cannot attach 는 (*내는 -> 나는) or 를 (*내를 -> 나를)
		if (ko === "내" && _hasTag(u, "pronoun_1st", "possessive") && (/^내(?:는|은|를|을)/.test(surf))) {
			errors.push({
				code: "ILLEGAL_PRONOUN_PARTICLE_CONCORD",
				message: `Possessive pronoun '내' cannot attach topic/object particle ('${surf}'). Must be '나'.`
			});
		}
		// 저 cannot attach 가 directly without allomorphic change (*저가 -> 제가)
		if (ko === "저" && (/^저가\b/.test(surf))) {
			errors.push({
				code: "ILLEGAL_PRONOUN_PARTICLE_CONCORD",
				message: `Pronoun '저' + '가' must contract to '제가', not '저가'.`
			});
		}
		// 나 cannot attach 가 directly without allomorphic change (*나가 -> 내가)
		if (ko === "나" && (/^나가\b/.test(surf))) {
			errors.push({
				code: "ILLEGAL_PRONOUN_PARTICLE_CONCORD",
				message: `Pronoun '나' + '가' must contract to '내가', not '나가'.`
			});
		}
		// 누구 cannot attach 가 directly without allomorphic change (*누구가 -> 누가)
		if (ko === "누구" && (/^누구가\b/.test(surf))) {
			errors.push({
				code: "ILLEGAL_PRONOUN_PARTICLE_CONCORD",
				message: `Interrogative '누구' + '가' must contract to '누가', not '누구가'.`
			});
		}
	}

	// 3. Clause-level Syntactic, Collocation, and Concord Checks
	if (ast && Array.isArray(ast.clauses)) {
		for (const clause of ast.clauses) {
			const constituents = clause.constituents || [];
			const pred = clause.predicate || {};
			const verbUnit = pred.verbUnit || null;
			const verbKo = verbUnit ? (verbUnit[DATA_SCHEMA.Korean] || "") : "";

			// A. Multiple topic markers in single clause
			const topicCount = constituents.filter(c => c.particleType === "topic" || c.role === "topic").length;
			if (topicCount > 1 && ast.clauses.length === 1) {
				errors.push({
					code: "REDUNDANT_TOPIC_MARKERS",
					message: `Single clause contains ${topicCount} topic markers, causing semantic ambiguity in: "${realized.ko}"`
				});
			}

			// B. Verb-Object Collocation Check
			const objCon = constituents.find(c => c.role === K.OBJECT || c.particleType === K.OBJECT);
			if (objCon && verbUnit && pred.predType === K.ACTION && typeof getNounCandidatesForVerb === 'function') {
				const objIndex = constituents.indexOf(objCon);
				const governingAdnominal = constituents.find((c, idx) =>
					idx > objIndex &&
					(c.role === "adnominal_modifier" || c.category === "adnominal_modifier" || (c.inflection && c.inflection.stemForm === "adnominal")) &&
					c.unit && (c.unit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB || _hasTag(c.unit, "transitive", K.TRANSITIVE_GENERAL))
				);
				const targetVerb = governingAdnominal ? governingAdnominal.unit : verbUnit;
				const objUnit = objCon.nounUnit || objCon.unit;
				if (objUnit && (objCon.isVariedSlot || pred.isVariedSlot)) {
					const vKo = targetVerb ? (targetVerb[DATA_SCHEMA.Korean] || "") : "";
					const STRICT_COLLOCATION_VERBS = new Set([
						"입다", "신다", "쓰다", "끼다", "매다", "벗다",
						"마시다", "먹다", "피우다", "타다", "치다"
					]);
					const targetSemData = parseSemanticData(targetVerb);
					const hasCollocationRestrictions = STRICT_COLLOCATION_VERBS.has(vKo) ||
						_hasTag(targetVerb, "transitive_clothing", "transitive_food", "transitive_drink", "transitive_vehicle", "transitive_instrument", "transitive_person") ||
						Boolean(targetSemData && targetSemData.collocation_filter) ||
						Boolean(targetSemData && targetSemData.req && targetSemData.req !== K.OBJECT && targetSemData.req !== "any");
					if (targetVerb && hasCollocationRestrictions) {
						const validCands = getNounCandidatesForVerb(targetVerb);
						if (Array.isArray(validCands) && validCands.length > 0 && !validCands.some(n => n[DATA_SCHEMA.Id] === objUnit[DATA_SCHEMA.Id])) {
							const objKo = objUnit[DATA_SCHEMA.Korean] || "";
							const hasGoverningAdnominal = constituents.some(c =>
								(c.role === "adnominal_modifier" || c.category === "adnominal_modifier" || (c.inflection && c.inflection.stemForm === "adnominal"))
							);
							if (objKo === "것" && hasGoverningAdnominal) {
								// Valid adnominally modified object pronoun (e.g. 다른 걸 먹읍시다)
							} else {
								errors.push({
									code: "VERB_OBJECT_COLLOCATION_MISMATCH",
									message: `Verb '${vKo}' does not collocate with direct object '${objKo}' in: "${realized.ko}"`
								});
							}
						}
					}
				}
			}

			// C. Descriptive Verb Subject Collocation Check
			const subjCon = constituents.find(c => c.role === "subject" || c.role === "topic");
			if (subjCon && verbUnit && pred.predType === "descriptive" && typeof getSubjectCandidatesForDescriptiveVerb === 'function') {
				const subjUnit = subjCon.nounUnit || subjCon.unit;
				if (subjUnit && (subjCon.isVariedSlot || pred.isVariedSlot)) {
					const vKo = verbUnit[DATA_SCHEMA.Korean] || "";
					const STRICT_DESCRIPTIVE_VERBS = new Set([
						"맵다", "달다", "짜다", "시다", "싱겁다",
						"높다", "낮다", "깊다", "넓다", "좁다", "무겁다", "가볍다",
						"따뜻하다", "춥다", "덥다", "쌀쌀하다", "시원하다"
					]);
					const isHumanSubj = _hasTag(subjUnit, K.PERSON, K.FAMILY, "pronoun_1st", "pronoun_2nd", "pronoun_3rd");
					const isWeatherOrTaste = _hasTag(verbUnit, K.WEATHER, "taste", "descriptive_weather", "descriptive_taste") ||
						["맵다", "달다", "짜다", "시다", "싱겁다", "따뜻하다", "춥다", "덥다", "쌀쌀하다", "시원하다"].includes(vKo);

					if (isHumanSubj && isWeatherOrTaste) {
						const subjKo = subjUnit[DATA_SCHEMA.Korean] || "";
						errors.push({
							code: "DESCRIPTIVE_VERB_SUBJECT_COLLOCATION_MISMATCH",
							message: `Weather/taste adjective '${vKo}' cannot take human subject '${subjKo}' in: "${realized.ko}"`
						});
					} else if (STRICT_DESCRIPTIVE_VERBS.has(vKo) || _hasTag(verbUnit, "taste", "spatial_dimension")) {
						const validSubjs = getSubjectCandidatesForDescriptiveVerb(verbUnit);
						if (Array.isArray(validSubjs) && validSubjs.length > 0 && !validSubjs.some(n => n[DATA_SCHEMA.Id] === subjUnit[DATA_SCHEMA.Id])) {
							const subjKo = subjUnit[DATA_SCHEMA.Korean] || "";
							errors.push({
								code: "DESCRIPTIVE_VERB_SUBJECT_COLLOCATION_MISMATCH",
								message: `Descriptive verb '${vKo}' does not collocate with subject '${subjKo}' in: "${realized.ko}"`
							});
						}
					}
				}
			}

			// Check for illegal adnominal modification of relational position nouns
			for (let i = 0; i < constituents.length - 1; i++) {
				const cCurrent = constituents[i];
				const cNext = constituents[i + 1];
				if (cCurrent && (cCurrent.role === "adnominal_modifier" || cCurrent.category === "adnominal_modifier") && cCurrent.unit) {
					const modVerb = cCurrent.unit;
					const headNoun = cNext ? (cNext.nounUnit || cNext.unit) : null;
					if (headNoun && _hasTag(headNoun, "position") && _hasTag(modVerb, "transitive", K.TRANSITIVE_GENERAL)) {
						errors.push({
							code: "INVALID_ADNOMINAL_POSITION_MODIFICATION",
							message: `Transitive verb '${modVerb[DATA_SCHEMA.Korean]}' cannot adnominally modify relational position noun '${headNoun[DATA_SCHEMA.Korean]}' in: "${realized.ko}"`
						});
					}
				}
			}

			// D. Spatial Concord Check
			if (typeof validateSpatialConcord === 'function' && verbUnit) {
				const locDynCon = constituents.find(c => c.particleType === "location_dynamic");
				if (locDynCon) {
					const locUnit = locDynCon.nounUnit || locDynCon.unit;
					const spatRes = validateSpatialConcord(verbUnit, locUnit, "location_action");
					if (spatRes && !spatRes.valid) {
						errors.push({
							code: "SPATIAL_CONCORD_MISMATCH",
							message: `Spatial mismatch: ${spatRes.reason} in: "${realized.ko}"`
						});
					}
				}
				const locStatCon = constituents.find(c => c.particleType === "location_static");
				if (locStatCon) {
					const locUnit = locStatCon.nounUnit || locStatCon.unit;
					const spatRes = validateSpatialConcord(verbUnit, locUnit, "location");
					if (spatRes && !spatRes.valid) {
						errors.push({
							code: "SPATIAL_CONCORD_MISMATCH",
							message: `Spatial mismatch: ${spatRes.reason} in: "${realized.ko}"`
						});
					}
				}
			}

			// E. Temporal Concord Check
			if (typeof validateTemporalConcord === 'function' && (pred.tense || ast.tense)) {
				const timeCon = constituents.find(c => _hasTag(c.nounUnit || c.unit, K.TIME, "temporal"));
				if (timeCon) {
					const timeUnit = timeCon.nounUnit || timeCon.unit;
					const tempRes = validateTemporalConcord(timeUnit, pred.tense || ast.tense);
					if (tempRes && !tempRes.valid) {
						errors.push({
							code: "TEMPORAL_CONCORD_MISMATCH",
							message: `Temporal mismatch: ${tempRes.reason} in: "${realized.ko}"`
						});
					}
				}
			}

			// F. Adverb Concord Check
			if (typeof validateAdverbConcord === 'function' && verbUnit) {
				const advCon = constituents.find(c => c.role === K.ADVERB);
				if (advCon) {
					const advUnit = advCon.unit || advCon.nounUnit;
					const advRes = validateAdverbConcord(advUnit, verbUnit, pred.polarity || ast.polarity || "affirmative");
					if (advRes && !advRes.valid) {
						errors.push({
							code: "ADVERB_CONCORD_MISMATCH",
							message: `Adverb mismatch: ${advRes.reason} in: "${realized.ko}"`
						});
					}
				}
			}
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings
	};
}

/**
 * Generates a complete Korean sentence from a Verified Sentence template.
 */
function generateSentenceFromTemplate(templateOrId, options = {}) {
	const template = (typeof templateOrId === 'string')
		? getVerifiedSentenceById(templateOrId)
		: templateOrId;

	if (!template || !Array.isArray(template.slots) || template.slots.length === 0) {
		return {
			ok: false,
			message: "Invalid or empty Verified Sentence template."
		};
	}

	const units = getUnitsArray();
	const targetUnitId = typeof options.targetUnitId === 'number' ? options.targetUnitId : null;
	const targetSlotIndex = typeof options.targetSlotIndex === 'number' ? options.targetSlotIndex : -1;
	const onlyFromSet = Boolean(options && options.onlyFromSet);
	const allowedSet = onlyFromSet && options.allowedUnitIds
		? (options.allowedUnitIds instanceof Set ? options.allowedUnitIds : new Set(options.allowedUnitIds))
		: null;

	if (onlyFromSet && allowedSet) {
		if (targetUnitId !== null && !allowedSet.has(targetUnitId)) {
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: [`Target unit #${targetUnitId} is not in the active Practice Set`],
				message: `Target unit #${targetUnitId} is not in the active Practice Set.`
			};
		}
		for (const slot of template.slots) {
			for (const g of (slot.grammar || [])) {
				if (typeof g.unitId === 'number' && !allowedSet.has(g.unitId)) {
					return {
						ok: false,
						insufficientSet: true,
						missingRoles: [`Grammar ${g.ko || g.text} (#${g.unitId})`],
						message: `Practice set lacks required grammar unit ${g.ko || g.text}.`
					};
				}
			}
		}
	}

	// Variation mode:
	// 'selected' (renamed from 'single') = selected slots are varied; unselected slots are locked to
	//                                     authentic study text Korean words, particles, and conjugations.
	// 'all'                               = full random generation across all candidate slots (legacy mode).
	const rawMode = options.varyMode || (options.unlockedSlots || options.varySlotIndices || options.varySlotIndex !== undefined || targetSlotIndex >= 0 ? 'selected' : 'all');
	const isSelectedMode = (rawMode === 'selected' || rawMode === 'single');
	const varyMode = isSelectedMode ? (rawMode === 'single' ? 'single' : 'selected') : 'all';

	// Determine unlocked slots set in selected variability mode
	let unlockedSlotSet = null;
	if (isSelectedMode) {
		unlockedSlotSet = new Set();
		if (options.unlockedSlots) {
			const arr = (options.unlockedSlots instanceof Set) ? Array.from(options.unlockedSlots) : options.unlockedSlots;
			if (Array.isArray(arr)) {
				for (const idx of arr) unlockedSlotSet.add(Number(idx));
			}
		} else if (options.varySlotIndices) {
			const arr = (options.varySlotIndices instanceof Set) ? Array.from(options.varySlotIndices) : options.varySlotIndices;
			if (Array.isArray(arr)) {
				for (const idx of arr) unlockedSlotSet.add(Number(idx));
			}
		} else if (typeof options.varySlotIndex === 'number' && options.varySlotIndex >= 0) {
			unlockedSlotSet.add(options.varySlotIndex);
		} else if (targetSlotIndex >= 0) {
			unlockedSlotSet.add(targetSlotIndex);
		} else {
			const nonFixedIndex = template.slots.findIndex(s => !(s.inflection && s.inflection.stemForm === "fixed_grammar"));
			unlockedSlotSet.add(nonFixedIndex >= 0 ? nonFixedIndex : 0);
		}

		if (targetSlotIndex >= 0) {
			unlockedSlotSet.add(targetSlotIndex);
		}
	}

	const MAX_VALIDATION_ATTEMPTS = 10;
	let lastValidationResult = null;

	for (let attempt = 0; attempt < MAX_VALIDATION_ATTEMPTS; attempt++) {
		const wordParts = [];
		const litParts = [];
		const allEojeols = [];
		const slotChoices = [];
		let attemptInsufficientSet = false;
		let attemptMissingRoles = [];
		let attemptMessage = "";

		for (let sIdx = 0; sIdx < template.slots.length; sIdx++) {
			const slot = template.slots[sIdx];
			const slotPool = getSlotCandidates(slot, options);
			let chosenUnit = null;
			let isVariedSlot = false;

			// Slot should vary if in 'all' mode, or if unlocked in 'selected' mode
			const shouldVary = isSelectedMode ? unlockedSlotSet.has(sIdx) : true;

			if (!shouldVary) {
				// In selected mode, locked slots strictly use the original verified unit & surface
				isVariedSlot = false;
				if (typeof slot.originalUnitId === 'number' && units[slot.originalUnitId]) {
					chosenUnit = units[slot.originalUnitId];
				}
			} else {
				// Slot is selected for variation (or varyMode is 'all')
				isVariedSlot = true;
				if (targetUnitId !== null && sIdx === targetSlotIndex && units[targetUnitId] && units[targetUnitId][DATA_SCHEMA.PartofSpeech] === slot.pos) {
					const tUnit = units[targetUnitId];
					const reqTags = Array.isArray(slot.tags) ? slot.tags : [];
					const satisfiesSlotTags = reqTags.every(t => _hasTag(tUnit, t)) || slot.originalUnitId === targetUnitId;
					if (satisfiesSlotTags) {
						chosenUnit = tUnit;
					}
				} else {
					let candidatePool = slotPool.candidates;

					// In selected mode, if multiple candidates exist, prefer picking a candidate other than
					// the original unit so generating a variation actually substitutes the term.
					if (isSelectedMode && candidatePool.length > 1 && typeof slot.originalUnitId === 'number') {
						const withoutOrig = candidatePool.filter(c => c[DATA_SCHEMA.Id] !== slot.originalUnitId);
						if (withoutOrig.length > 0) {
							candidatePool = withoutOrig;
						}
					}

					if (candidatePool.length > 0) {
						const attemptOpts = attempt > 0 ? {
							...options,
							seedOffset: (options.seedOffset || 0) + attempt * 7 + sIdx * 3
						} : options;
						chosenUnit = pickCandidateFromPool(candidatePool, attemptOpts, sIdx);
					} else if (onlyFromSet) {
						attemptInsufficientSet = true;
						attemptMissingRoles = [`${slot.pos} (${(slot.tags || []).join(', ') || 'any'})`];
						attemptMessage = `Practice set lacks a compatible ${slot.pos} for slot #${sIdx + 1}.`;
						break;
					} else if (typeof slot.originalUnitId === 'number' && units[slot.originalUnitId]) {
						chosenUnit = units[slot.originalUnitId];
					}
				}
			}

			const realizedSlot = realizeSlot(slot, chosenUnit);
			wordParts.push(realizedSlot.surfaceKo);
			if (realizedSlot.surfaceEnLit) litParts.push(realizedSlot.surfaceEnLit);
			allEojeols.push(...realizedSlot.eojeols);

			slotChoices.push({
				slotIndex: sIdx,
				pos: slot.pos,
				tags: [...(slot.tags || [])],
				isVariedSlot,
				isSingleChoice: slotPool.isSingleChoice,
				candidateCount: slotPool.count,
				originalUnitId: slot.originalUnitId,
				originalKo: slot.originalKo,
				originalEn: slot.originalEn,
				originalSurface: slot.originalSurface,
				chosenUnit: realizedSlot.chosenUnit || null,
				chosenUnitId: realizedSlot.chosenUnit ? realizedSlot.chosenUnit[DATA_SCHEMA.Id] : null,
				chosenKo: realizedSlot.chosenUnit ? realizedSlot.chosenUnit[DATA_SCHEMA.Korean] : "",
				chosenEn: realizedSlot.chosenUnit ? realizedSlot.chosenUnit[DATA_SCHEMA.English] : "",
				category: slot.category || "",
				grammar: slot.grammar || [],
				inflection: slot.inflection || null,
				morphTemplate: slot.morphTemplate || "",
				surfaceKo: realizedSlot.surfaceKo,
				surfaceEnLit: realizedSlot.surfaceEnLit,
				eojeols: realizedSlot.eojeols || []
			});
		}

		if (attemptInsufficientSet) {
			return {
				ok: false,
				insufficientSet: true,
				missingRoles: attemptMissingRoles,
				message: attemptMessage
			};
		}

		const rawJoined = wordParts.join(" ").trim();
		const punct = template.punctuation || ".";
		const koWithPunct = /[.?!~]$/.test(rawJoined) ? rawJoined : (rawJoined ? rawJoined + punct : "");
		const koBare = koWithPunct.replace(/[.?!~]+$/, '');

		const enLiteralRaw = litParts.join(" ").trim();
		const enLiteral = enLiteralRaw
			? (enLiteralRaw.charAt(0).toUpperCase() + enLiteralRaw.slice(1) + (/[.?!]$/.test(enLiteralRaw) ? "" : punct))
			: "";

		// Build a clean natural English summary from slot glosses
		const natClauses = slotChoices
			.filter(sc => sc.chosenEn)
			.map(sc => {
				const cleanGloss = String(sc.chosenEn).replace(/\([^)]*\)/g, '').split(/[;,/]/)[0].trim();
				return cleanGloss;
			});
		const enNatural = natClauses.length > 0
			? (natClauses.join(" · ") + (/[.?!]$/.test(natClauses[natClauses.length - 1]) ? "" : punct))
			: enLiteral;

		const unitsUsed = [];
		const seenUnitIds = new Set();

		allEojeols.forEach((eojeol, idx) => {
			eojeol.index = idx;
			for (const seg of (eojeol.segments || [])) {
				if (typeof seg.unitId === 'number' && !seenUnitIds.has(seg.unitId)) {
					seenUnitIds.add(seg.unitId);
					unitsUsed.push({
						unitId: seg.unitId,
						ko: seg.koDict,
						en: seg.enDict,
						pos: seg.pos,
						kind: seg.kind,
						role: seg.role || eojeol.role,
						surfaceKo: seg.textKo,
						surfaceEn: seg.textEn || "",
						eojeolIndex: idx
					});
				}
			}
		});

		// Also ensure all grammar unit IDs from slots are recorded in unitsUsed / unitIds
		for (const slot of template.slots) {
			for (const g of (slot.grammar || [])) {
				if (typeof g.unitId === 'number' && !seenUnitIds.has(g.unitId) && units[g.unitId]) {
					seenUnitIds.add(g.unitId);
					const gu = units[g.unitId];
					unitsUsed.push({
						unitId: g.unitId,
						ko: gu[DATA_SCHEMA.Korean],
						en: gu[DATA_SCHEMA.English],
						pos: gu[DATA_SCHEMA.PartofSpeech],
						kind: K.GRAMMAR,
						role: g.pos || K.GRAMMAR,
						surfaceKo: g.text || gu[DATA_SCHEMA.Korean],
						surfaceEn: g.en || gu[DATA_SCHEMA.English],
						eojeolIndex: 0
					});
				}
			}
		}

		const unitIds = Array.from(seenUnitIds);

		const candidateResult = {
			ko: koWithPunct,
			eojeols: allEojeols,
			unitsUsed
		};

		// Recompose AST from slot choices and candidate realization
		const ast = recomposeASTFromVerifiedSentence(template, slotChoices, candidateResult);

		// Validate using AST syntactic, valency, collocation, and concord validators
		const valResult = validateVerifiedSentence(ast, candidateResult, slotChoices);

		if (valResult.valid) {
			const unlockedList = isSelectedMode ? Array.from(unlockedSlotSet) : template.slots.map((_, i) => i);
			const singleSlotIdx = isSelectedMode && unlockedSlotSet.size === 1 ? Array.from(unlockedSlotSet)[0] : -1;

			return {
				ok: true,
				insufficientSet: false,
				isVerifiedStructure: true,
				verifiedTemplateId: template.id,
				verifiedTemplateTitle: template.title,
				verifiedSource: template.source,
				originalKo: template.originalKo,
				varyMode,
				unlockedSlots: unlockedList,
				varySlotIndex: singleSlotIdx,
				targetUnitId,
				ko: koWithPunct,
				koBare,
				pronunciation: koWithPunct ? getPronunciation(koWithPunct) : "",
				enLiteral,
				enNatural,
				en: enLiteral,
				difficultyTier: options.difficultyTier || null,
				difficultyLabel: options.difficultyTier === 'easiest' ? 'Easiest' : (options.difficultyTier === 'easy_and_inset' ? 'Easy + In-Set' : (options.difficultyTier === 'challenging' ? 'Challenging' : null)),
				templateDifficulty: template ? computeTemplateDifficulty(template).difficultyScore : null,
				eojeols: allEojeols,
				unitsUsed,
				unitIds,
				tree: unitIds,
				ast,
				validation: valResult,
				slotChoices
			};
		}

		lastValidationResult = valResult;
	}

	return {
		ok: false,
		insufficientSet: false,
		isVerifiedStructure: true,
		verifiedTemplateId: template.id,
		message: "Failed to generate a valid sentence satisfying AST and collocation rules: " + ((lastValidationResult && lastValidationResult.errors[0]) ? lastValidationResult.errors[0].message : "Validation failed"),
		validation: lastValidationResult
	};
}

/**
 * Generates `count` test sentences from a specific Verified Sentence template.
 */
function generateSentencesFromTemplate(templateOrId, count = 3, options = {}) {
	const sentences = [];
	const seenKo = new Set();
	const maxAttempts = count * 6;

	for (let attempt = 0; attempt < maxAttempts && sentences.length < count; attempt++) {
		const res = generateSentenceFromTemplate(templateOrId, {
			...options,
			variationIndex: (Number(options.variationIndex) || 0) + attempt
		});
		if (!res || !res.ok) break;
		if (res.ko && !seenKo.has(res.ko)) {
			seenKo.add(res.ko);
			sentences.push(res);
		}
	}

	while (sentences.length > 0 && sentences.length < count) {
		const res = generateSentenceFromTemplate(templateOrId, {
			...options,
			variationIndex: sentences.length
		});
		if (res && res.ok) {
			sentences.push(res);
		} else {
			break;
		}
	}

	return {
		ok: sentences.length > 0,
		sentences
	};
}

// ============================================================================
// 5. Runtime Editable Store (Hardcoded + Custom Templates, Titles, Slot Tags)
// ============================================================================

const STORAGE_KEY = 'kongbuhey_verified_sentences_v1';

let _runtimeInitialized = false;
let _hardcodedOverrides = new Map(); // id -> { title, slotTags: { [slotIdx]: string[] } }
let _customTemplates = [];           // Array of user-cloned or runtime-ingested templates

function deepCloneTemplate(tpl) {
	return JSON.parse(JSON.stringify(tpl));
}

function _loadStateFromLocalStorage() {
	if (typeof window === 'undefined' || !window.localStorage) return;
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (raw) {
			importVerifiedSentencesState(JSON.parse(raw));
		}
	} catch (_) {}
}

function _saveStateToLocalStorage() {
	if (typeof window === 'undefined' || !window.localStorage) return;
	try {
		const stateObj = exportVerifiedSentencesState();
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
	} catch (_) {}
}

let _posDecks = null;
let _prioritizedTemplates = null;

/**
 * Builds prioritized POS decks sorted by Difficulty / PriorityScore (element 8) ascending (1 easiest..5 hardest).
 * Secondary sort by Id ascending.
 */
function buildPosDecks(unitsArray = null) {
	const units = unitsArray || getUnitsArray();
	if (!units || units.length === 0) return {};
	const decks = {};
	for (let i = 0; i < units.length; i++) {
		const u = units[i];
		if (!u) continue;
		const pos = u[DATA_SCHEMA.PartofSpeech];
		if (!pos) continue;
		if (!decks[pos]) decks[pos] = [];
		decks[pos].push(u);
	}
	for (const pos of Object.keys(decks)) {
		decks[pos].sort((a, b) => {
			const pa = a[DATA_SCHEMA.PriorityScore] || 3;
			const pb = b[DATA_SCHEMA.PriorityScore] || 3;
			if (pa !== pb) return pa - pb;
			return a[DATA_SCHEMA.Id] - b[DATA_SCHEMA.Id];
		});
	}
	_posDecks = decks;
	return _posDecks;
}

function getPosDecks() {
	if (!_posDecks) buildPosDecks();
	return _posDecks;
}

function getPosDeck(pos) {
	const decks = getPosDecks();
	return (decks && decks[pos]) ? decks[pos] : [];
}

/**
 * Computes the difficulty score of a Verified Sentence structure based on the
 * average PriorityScore of its mandatory slots (fixed grammar or single choice) and grammar units.
 */
function computeTemplateDifficulty(tpl) {
	if (!tpl) return { difficultyScore: 2.5, mandatoryElements: [], mandatoryElementsCount: 0 };
	const units = getUnitsArray();
	const mandatoryScores = [];
	const mandatoryElements = [];

	(tpl.slots || []).forEach((slot, sIdx) => {
		if (slot.inflection && slot.inflection.stemForm === "fixed_grammar") {
			const u = typeof slot.originalUnitId === 'number' ? units[slot.originalUnitId] : null;
			if (u) {
				const sc = u[DATA_SCHEMA.PriorityScore] || 1;
				mandatoryScores.push(sc);
				mandatoryElements.push({ type: 'fixed_grammar', slotIndex: sIdx, unitId: u[DATA_SCHEMA.Id], ko: u[DATA_SCHEMA.Korean], score: sc });
			}
		} else {
			const cands = getSlotCandidates(slot);
			if (cands.isSingleChoice && cands.singleChoiceUnit) {
				const u = cands.singleChoiceUnit;
				const sc = u[DATA_SCHEMA.PriorityScore] || 1;
				mandatoryScores.push(sc);
				mandatoryElements.push({ type: 'single_choice', slotIndex: sIdx, unitId: u[DATA_SCHEMA.Id], ko: u[DATA_SCHEMA.Korean], score: sc });
			}
		}
	});

	const grammarIds = new Set(tpl.grammarUnitIds || []);
	(tpl.slots || []).forEach(slot => {
		(slot.grammar || []).forEach(g => {
			if (typeof g.unitId === 'number') grammarIds.add(g.unitId);
		});
	});

	grammarIds.forEach(gId => {
		const gu = units[gId];
		if (gu) {
			const sc = gu[DATA_SCHEMA.PriorityScore] || 1;
			mandatoryScores.push(sc);
			mandatoryElements.push({ type: 'grammar_unit', unitId: gId, ko: gu[DATA_SCHEMA.Korean], score: sc });
		}
	});

	if (mandatoryScores.length === 0) {
		(tpl.slots || []).forEach(slot => {
			if (typeof slot.originalUnitId === 'number' && units[slot.originalUnitId]) {
				const u = units[slot.originalUnitId];
				const sc = u[DATA_SCHEMA.PriorityScore] || 2;
				mandatoryScores.push(sc);
				mandatoryElements.push({ type: 'slot_original', unitId: u[DATA_SCHEMA.Id], ko: u[DATA_SCHEMA.Korean], score: sc });
			}
		});
	}

	const avg = mandatoryScores.length > 0
		? mandatoryScores.reduce((a, b) => a + b, 0) / mandatoryScores.length
		: 2.0;

	return {
		id: tpl.id,
		title: tpl.title,
		originalKo: tpl.originalKo,
		difficultyScore: Number(avg.toFixed(2)),
		mandatoryElementsCount: mandatoryScores.length,
		mandatoryElements
	};
}

function getPrioritizedVerifiedSentences() {
	ensureRuntimeInitialized();
	const all = getAllVerifiedSentences();
	const scored = all.map(tpl => ({
		template: tpl,
		...computeTemplateDifficulty(tpl)
	}));
	scored.sort((a, b) => a.difficultyScore - b.difficultyScore || a.id.localeCompare(b.id));
	_prioritizedTemplates = scored;
	return scored;
}

function ensureRuntimeInitialized() {
	if (_runtimeInitialized) return;
	_runtimeInitialized = true;
	_loadStateFromLocalStorage();
	buildPosDecks();
	getPrioritizedVerifiedSentences();
}

function exportVerifiedSentencesState() {
	ensureRuntimeInitialized();
	return {
		hardcodedOverrides: Object.fromEntries(_hardcodedOverrides.entries()),
		customTemplates: _customTemplates.map(deepCloneTemplate),
		updatedAt: Date.now()
	};
}

function importVerifiedSentencesState(stateObj) {
	_runtimeInitialized = true;
	_hardcodedOverrides.clear();
	_customTemplates = [];
	if (!stateObj || typeof stateObj !== 'object') return;

	if (stateObj.hardcodedOverrides && typeof stateObj.hardcodedOverrides === 'object') {
		for (const [id, ov] of Object.entries(stateObj.hardcodedOverrides)) {
			_hardcodedOverrides.set(id, ov);
		}
	}
	if (Array.isArray(stateObj.customTemplates)) {
		_customTemplates = stateObj.customTemplates.map(t => ({
			...deepCloneTemplate(t),
			isHardcoded: false
		}));
	}
}

function applyOverridesToHardcoded(rawTpl) {
	const copy = deepCloneTemplate(rawTpl);
	copy.isHardcoded = true;
	const ov = _hardcodedOverrides.get(copy.id);
	if (ov) {
		if (typeof ov.title === 'string' && ov.title.trim()) {
			copy.title = ov.title.trim();
		}
		if (ov.slotTags && typeof ov.slotTags === 'object' && Array.isArray(copy.slots)) {
			for (const [sIdxStr, tagsArr] of Object.entries(ov.slotTags)) {
				const sIdx = Number(sIdxStr);
				if (copy.slots[sIdx] && Array.isArray(tagsArr)) {
					copy.slots[sIdx].tags = [...tagsArr];
				}
			}
		}
	}
	return copy;
}

/**
 * Returns all Verified Sentence templates (hardcoded with any active tag/title edits
 * followed by custom/runtime entries).
 */
function getAllVerifiedSentences() {
	ensureRuntimeInitialized();
	const hardcoded = getHardcodedVerifiedArray().map(applyOverridesToHardcoded);
	const custom = _customTemplates.map(t => ({ ...deepCloneTemplate(t), isHardcoded: false }));
	return [...hardcoded, ...custom];
}

function getVerifiedSentenceById(id) {
	ensureRuntimeInitialized();
	const customMatch = _customTemplates.find(t => t.id === id);
	if (customMatch) {
		return { ...deepCloneTemplate(customMatch), isHardcoded: false };
	}
	const hardcodedMatch = getHardcodedVerifiedArray().find(t => t.id === id);
	if (hardcodedMatch) {
		return applyOverridesToHardcoded(hardcodedMatch);
	}
	return null;
}

/**
 * Updates the title of a Verified Sentence (hardcoded or custom).
 */
function updateVerifiedSentenceTitle(id, newTitle) {
	ensureRuntimeInitialized();
	const cleanTitle = String(newTitle || '').trim();
	if (!cleanTitle) throw new Error("Title cannot be empty.");

	const customIdx = _customTemplates.findIndex(t => t.id === id);
	if (customIdx !== -1) {
		_customTemplates[customIdx].title = cleanTitle;
		_saveStateToLocalStorage();
		return getVerifiedSentenceById(id);
	}

	const hardcodedMatch = getHardcodedVerifiedArray().find(t => t.id === id);
	if (hardcodedMatch) {
		const existingOv = _hardcodedOverrides.get(id) || { slotTags: {} };
		existingOv.title = cleanTitle;
		_hardcodedOverrides.set(id, existingOv);
		_saveStateToLocalStorage();
		return getVerifiedSentenceById(id);
	}

	throw new Error(`Verified Sentence not found: ${id}`);
}

/**
 * Updates the semantic tag filter list on a specific slot of a Verified Sentence.
 */
function updateVerifiedSentenceSlotTags(id, slotIndex, newTags) {
	ensureRuntimeInitialized();
	const cleanTags = Array.from(new Set(
		(Array.isArray(newTags) ? newTags : String(newTags || '').split(','))
			.map(t => String(t).trim())
			.filter(Boolean)
	));

	const customIdx = _customTemplates.findIndex(t => t.id === id);
	if (customIdx !== -1) {
		const tpl = _customTemplates[customIdx];
		if (!tpl.slots || !tpl.slots[slotIndex]) {
			throw new Error(`Slot index ${slotIndex} out of range.`);
		}
		tpl.slots[slotIndex].tags = cleanTags;
		_saveStateToLocalStorage();
		return getVerifiedSentenceById(id);
	}

	const hardcodedMatch = getHardcodedVerifiedArray().find(t => t.id === id);
	if (hardcodedMatch) {
		if (!hardcodedMatch.slots || !hardcodedMatch.slots[slotIndex]) {
			throw new Error(`Slot index ${slotIndex} out of range.`);
		}
		const existingOv = _hardcodedOverrides.get(id) || { slotTags: {} };
		if (!existingOv.slotTags) existingOv.slotTags = {};
		existingOv.slotTags[slotIndex] = cleanTags;
		_hardcodedOverrides.set(id, existingOv);
		_saveStateToLocalStorage();
		return getVerifiedSentenceById(id);
	}

	throw new Error(`Verified Sentence not found: ${id}`);
}

function addTagToVerifiedSlot(id, slotIndex, tag) {
	const cleanTag = String(tag || '').trim();
	if (!cleanTag) return getVerifiedSentenceById(id);
	const tpl = getVerifiedSentenceById(id);
	if (!tpl || !tpl.slots || !tpl.slots[slotIndex]) {
		throw new Error(`Verified Sentence or slot not found: ${id}[${slotIndex}]`);
	}
	const currentTags = tpl.slots[slotIndex].tags || [];
	if (currentTags.includes(cleanTag)) return tpl;
	return updateVerifiedSentenceSlotTags(id, slotIndex, [...currentTags, cleanTag]);
}

function removeTagFromVerifiedSlot(id, slotIndex, tag) {
	const cleanTag = String(tag || '').trim();
	const tpl = getVerifiedSentenceById(id);
	if (!tpl || !tpl.slots || !tpl.slots[slotIndex]) {
		throw new Error(`Verified Sentence or slot not found: ${id}[${slotIndex}]`);
	}
	const currentTags = tpl.slots[slotIndex].tags || [];
	return updateVerifiedSentenceSlotTags(id, slotIndex, currentTags.filter(t => t !== cleanTag));
}

/**
 * Resets the semantic tag filters on a specific slot of a Verified Sentence back
 * to the original filters of the default language unit in that slot.
 */
function resetVerifiedSlotTags(id, slotIndex) {
	ensureRuntimeInitialized();
	const tpl = getVerifiedSentenceById(id);
	if (!tpl || !tpl.slots || !tpl.slots[slotIndex]) {
		throw new Error(`Verified Sentence or slot not found: ${id}[${slotIndex}]`);
	}
	const slot = tpl.slots[slotIndex];
	const units = getUnitsArray();
	let originalTags = [];
	if (typeof slot.originalUnitId === 'number' && units[slot.originalUnitId]) {
		const origUnit = units[slot.originalUnitId];
		const raw = origUnit[DATA_SCHEMA.SemanticTags];
		originalTags = (raw instanceof Set ? Array.from(raw) : (Array.isArray(raw) ? [...raw] : [])).filter(Boolean);
	} else if (slot.inflection && slot.inflection.stemForm === 'fixed_grammar') {
		originalTags = [K.GRAMMAR];
	}

	// If hardcoded, also clear the specific slotTags override if present
	if (tpl.isHardcoded) {
		const existingOv = _hardcodedOverrides.get(id);
		if (existingOv && existingOv.slotTags && existingOv.slotTags[slotIndex]) {
			delete existingOv.slotTags[slotIndex];
			if (Object.keys(existingOv.slotTags).length === 0 && !existingOv.title) {
				_hardcodedOverrides.delete(id);
			} else {
				_hardcodedOverrides.set(id, existingOv);
			}
			_saveStateToLocalStorage();
			return getVerifiedSentenceById(id);
		}
	}

	return updateVerifiedSentenceSlotTags(id, slotIndex, originalTags);
}

/**
 * Resets a hardcoded Verified Sentence's title and slot tag filters back to its original definition.
 */
function resetHardcodedVerifiedSentence(id) {
	ensureRuntimeInitialized();
	_hardcodedOverrides.delete(id);
	_saveStateToLocalStorage();
	return getVerifiedSentenceById(id);
}

/**
 * Creates a new editable copy (clone) of an existing Verified Sentence template.
 * Cloned entries have `isHardcoded: false` and can be freely modified or deleted.
 */
function cloneVerifiedSentence(id, customTitleOrOptions = null) {
	ensureRuntimeInitialized();
	const sourceTpl = getVerifiedSentenceById(id);
	if (!sourceTpl) {
		throw new Error(`Verified Sentence not found: ${id}`);
	}

	const customTitle = (customTitleOrOptions && typeof customTitleOrOptions === 'object')
		? customTitleOrOptions.title
		: customTitleOrOptions;

	const cloned = deepCloneTemplate(sourceTpl);
	const uniqueSuffix = `${Date.now()}_${Math.floor(Math.random() * 1000)}`;
	cloned.id = `vs_custom_copy_${uniqueSuffix}`;
	cloned.isHardcoded = false;
	cloned.clonedFromId = sourceTpl.id;
	cloned.title = (customTitle && String(customTitle).trim())
		? String(customTitle).trim()
		: `Copy of ${sourceTpl.title}`;

	_customTemplates.unshift(cloned);
	_saveStateToLocalStorage();
	return deepCloneTemplate(cloned);
}

/**
 * Deletes a custom Verified Sentence entry.
 * Hardcoded entries from verified_sentences.js cannot be deleted.
 */
function deleteVerifiedSentence(id) {
	ensureRuntimeInitialized();
	const hardcodedMatch = getHardcodedVerifiedArray().find(t => t.id === id);
	if (hardcodedMatch) {
		return {
			ok: false,
			reason: `Hardcoded Verified Sentence "${id}" cannot be deleted.`
		};
	}

	const customIdx = _customTemplates.findIndex(t => t.id === id);
	if (customIdx === -1) {
		return {
			ok: false,
			reason: `Custom Verified Sentence "${id}" not found.`
		};
	}

	_customTemplates.splice(customIdx, 1);
	_saveStateToLocalStorage();
	return { ok: true, id };
}

/**
 * Adds newly discovered Verified Sentence templates at runtime (e.g. from Text Importer UI).
 * Deduplicates against existing hardcoded and custom templates by `originalKo`.
 */
function addRuntimeVerifiedSentences(templates, sourceName = null) {
	ensureRuntimeInitialized();
	if (!Array.isArray(templates) || templates.length === 0) return [];

	const allExisting = getAllVerifiedSentences();
	const existingKoSet = new Set(allExisting.map(t => String(t.originalKo || '').trim()));
	const added = [];

	for (let i = 0; i < templates.length; i++) {
		const raw = templates[i];
		if (!raw || !Array.isArray(raw.slots) || raw.slots.length === 0) continue;
		const ko = String(raw.originalKo || '').trim();
		if (ko && existingKoSet.has(ko)) continue;

		const copy = deepCloneTemplate(raw);
		copy.isHardcoded = false;
		if (sourceName && !copy.source) copy.source = sourceName;
		if (!copy.id || allExisting.some(e => e.id === copy.id) || added.some(a => a.id === copy.id)) {
			copy.id = `vs_runtime_${copy.source || 'custom'}_${Date.now()}_${i}`;
		}

		// AST Recomposition Validation Gate: Verify grammatical & syntactic integrity
		const units = getUnitsArray();
		const slotChoices = (copy.slots || []).map(s => {
			const u = s.originalUnitId != null ? (units && units[s.originalUnitId]) : null;
			return {
				slotIndex: s.index,
				chosenUnit: u,
				chosenUnitId: s.originalUnitId,
				surfaceKo: s.originalSurface,
				isVariedSlot: false,
				pos: u ? u[DATA_SCHEMA.PartofSpeech] : s.pos,
				grammar: s.grammar
			};
		});
		const realized = { ko: ko, en: '' };
		const ast = recomposeASTFromVerifiedSentence(copy, slotChoices, realized);
		const valResult = validateVerifiedSentence(ast, realized, slotChoices);
		if (!valResult.valid || (valResult.errors && valResult.errors.length > 0)) {
			continue;
		}

		if (ko) existingKoSet.add(ko);
		_customTemplates.unshift(copy);
		added.push(copy);
	}

	if (added.length > 0) {
		_saveStateToLocalStorage();
	}
	return added;
}

// ============================================================================
// 6. Prioritized Sentence Generation for Any Language Unit
// ============================================================================

/**
 * Finds all Verified Sentence templates (with matching slot indices) that can
 * showcase the given target Language Unit.
 */
function findMatchingTemplatesForUnit(unitOrId) {
	const units = getUnitsArray();
	const targetUnit = Array.isArray(unitOrId)
		? unitOrId
		: (typeof unitOrId === 'number' ? units[unitOrId] : null);
	if (!targetUnit) return [];

	const targetId = targetUnit[DATA_SCHEMA.Id];
	const targetPos = targetUnit[DATA_SCHEMA.PartofSpeech];
	const allTemplates = getAllVerifiedSentences();

	const exactMatches = [];
	const tagMatches = [];

	for (const tpl of allTemplates) {
		if (!tpl || !Array.isArray(tpl.slots)) continue;

		if (targetPos === K.POS_GRAMMAR) {
			// Check if any slot uses this Grammar unit ID
			for (let sIdx = 0; sIdx < tpl.slots.length; sIdx++) {
				const slot = tpl.slots[sIdx];
				const usesGrammar = (slot.grammar || []).some(g => g.unitId === targetId) || slot.originalUnitId === targetId;
				if (usesGrammar) {
					exactMatches.push({ template: tpl, slotIndex: sIdx, matchType: "grammar_exact" });
					break;
				}
			}
			continue;
		}

		// Lexical unit: check slots with matching POS and satisfied tag requirements
		for (let sIdx = 0; sIdx < tpl.slots.length; sIdx++) {
			const slot = tpl.slots[sIdx];
			if (slot.pos !== targetPos) continue;
			if (slot.inflection && slot.inflection.stemForm === "fixed_grammar") continue;

			const reqTags = Array.isArray(slot.tags) ? slot.tags : [];
			let satisfiesTags = true;
			for (let t = 0; t < reqTags.length; t++) {
				if (!_hasTag(targetUnit, reqTags[t])) {
					satisfiesTags = false;
					break;
				}
			}

			if (!satisfiesTags) continue;

			if (slot.originalUnitId === targetId) {
				exactMatches.push({ template: tpl, slotIndex: sIdx, matchType: "lexical_original" });
			} else {
				tagMatches.push({ template: tpl, slotIndex: sIdx, matchType: "lexical_tags" });
			}
		}
	}

	return [...exactMatches, ...tagMatches];
}

/**
 * Generates a single sentence for `unitOrId`, prioritizing Verified Sentence
 * structures and falling back to the random AST generator if no template matches.
 */
function generateVerifiedSentenceForUnit(unitOrId, options = {}) {
	const units = getUnitsArray();
	const targetUnit = Array.isArray(unitOrId)
		? unitOrId
		: (typeof unitOrId === 'number' ? units[unitOrId] : null);

	if (!targetUnit) {
		return {
			ok: false,
			insufficientSet: false,
			missingRoles: [],
			message: `Language unit not found: ${unitOrId}`
		};
	}

	if (options.onlyFromSet && (!options.allowedUnitIds || options.allowedUnitIds.size === 0)) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Active Set is empty"],
			message: "Your active practice set is empty. Select some language units on the left to generate sentences from your set."
		};
	}

	const targetId = targetUnit[DATA_SCHEMA.Id];
	const matches = findMatchingTemplatesForUnit(targetUnit);

	if (matches.length > 0) {
		const varIdx = typeof options.variationIndex === 'number' ? options.variationIndex : 0;
		const seedOff = typeof options.seedOffset === 'number' ? options.seedOffset : 0;
		for (let mAttempt = 0; mAttempt < matches.length; mAttempt++) {
			const pickIdx = Math.abs(varIdx + seedOff + mAttempt) % matches.length;
			const chosen = matches[pickIdx];

			const res = generateSentenceFromTemplate(chosen.template, {
				...options,
				targetUnitId: targetId,
				targetSlotIndex: chosen.slotIndex
			});
			if (res && res.ok) {
				return res;
			}
		}
	}

	// Fallback to random AST sentence generator
	const fallback = generateSentenceForUnit(targetUnit, options);
	if (fallback && fallback.ok) {
		return {
			...fallback,
			isVerifiedStructure: false,
			verifiedTemplateId: null,
			verifiedTemplateTitle: null
		};
	}
	return fallback;
}

function getTierForIndex(i, totalCount) {
	if (i === 0) return 'easiest';
	if (totalCount >= 3 && i === totalCount - 1) return 'challenging';
	return 'easy_and_inset';
}

function getTierLabel(tier) {
	if (tier === 'easiest') return 'Easiest';
	if (tier === 'easy_and_inset') return 'Easy + In-Set';
	if (tier === 'challenging') return 'Challenging';
	return 'Standard';
}

/**
 * Generates `count` (default 3) sentences for `unitOrId`, prioritizing Verified
 * Sentence structures first and using random AST generation as a fallback.
 * Generates sentences in progressive difficulty order:
 *  - Sentence 0: Easiest possible vocabulary and grammar (PriorityScore 1)
 *  - Sentences 1..N-2: 50% In-Set + 50% Easy vocabulary
 *  - Sentence N-1 (when N>=3): Full curriculum variability (challenging)
 */
function generateVerifiedSentencesForUnit(unitOrId, count = 3, options = {}) {
	const units = getUnitsArray();
	const targetUnit = Array.isArray(unitOrId)
		? unitOrId
		: (typeof unitOrId === 'number' ? units[unitOrId] : null);

	if (!targetUnit) {
		return {
			ok: false,
			insufficientSet: false,
			missingRoles: [],
			message: `Language unit not found: ${unitOrId}`,
			sentences: []
		};
	}

	if (options.onlyFromSet && (!options.allowedUnitIds || options.allowedUnitIds.size === 0)) {
		return {
			ok: false,
			insufficientSet: true,
			missingRoles: ["Active Set is empty"],
			message: "Your active practice set is empty. Select some language units on the left to generate sentences from your set.",
			sentences: []
		};
	}

	const numSentences = Math.max(1, Number(count) || 3);
	const targetId = targetUnit[DATA_SCHEMA.Id];
	const rawMatches = findMatchingTemplatesForUnit(targetUnit);

	// Pre-score all matching templates by difficulty and sort ascending
	const scoredMatches = rawMatches.map(m => ({
		...m,
		diff: computeTemplateDifficulty(m.template)
	}));
	scoredMatches.sort((a, b) => a.diff.difficultyScore - b.diff.difficultyScore || a.template.id.localeCompare(b.template.id));

	const sentences = [];
	const seenKo = new Set();
	const seedOff = typeof options.seedOffset === 'number' ? options.seedOffset : 0;

	if (scoredMatches.length > 0) {
		// Pass 1: Try distinct matching templates with tiered difficulty progression
		for (let attempt = 0; attempt < scoredMatches.length && sentences.length < numSentences; attempt++) {
			const targetIdx = sentences.length;
			const tier = getTierForIndex(targetIdx, numSentences);

			let matchItem;
			if (tier === 'easiest') {
				matchItem = scoredMatches[seedOff % Math.min(3, scoredMatches.length)];
			} else if (tier === 'challenging' && scoredMatches.length > 2) {
				matchItem = scoredMatches[scoredMatches.length - 1 - (seedOff % Math.min(3, scoredMatches.length))];
			} else {
				matchItem = scoredMatches[(attempt + seedOff) % scoredMatches.length];
			}

			const res = generateSentenceFromTemplate(matchItem.template, {
				...options,
				targetUnitId: targetId,
				targetSlotIndex: matchItem.slotIndex,
				varyMode: 'selected',
				unlockedSlots: [matchItem.slotIndex],
				difficultyTier: tier,
				variationIndex: attempt,
				seedOffset: seedOff + attempt * 5
			});
			if (res && res.ok && res.ko && !seenKo.has(res.ko)) {
				seenKo.add(res.ko);
				res.difficultyTier = tier;
				res.difficultyLabel = getTierLabel(tier);
				res.templateDifficulty = matchItem.diff.difficultyScore;
				sentences.push(res);
			}
		}

		// Pass 2: Multi-variation for remaining sentences with tier-conforming candidate selection
		if (sentences.length < numSentences) {
			const maxVariationPasses = Math.max(numSentences * 6, scoredMatches.length * 4);
			for (let v = 0; v < maxVariationPasses && sentences.length < numSentences; v++) {
				const targetIdx = sentences.length;
				const tier = getTierForIndex(targetIdx, numSentences);
				const matchItem = scoredMatches[(v + seedOff) % scoredMatches.length];
				const tpl = matchItem.template;
				if (!tpl || !Array.isArray(tpl.slots)) continue;

				// Find variable slots
				const variableSlots = [];
				for (let sIdx = 0; sIdx < tpl.slots.length; sIdx++) {
					if (sIdx === matchItem.slotIndex) continue;
					const sl = tpl.slots[sIdx];
					if (sl.inflection && sl.inflection.stemForm === "fixed_grammar") continue;
					const pool = getSlotCandidates(sl, options);
					if (pool.count > 1) {
						variableSlots.push(sIdx);
					}
				}

				if (variableSlots.length === 0) continue;

				const chosenSlotToVary = variableSlots[v % variableSlots.length];
				const unlocked = [matchItem.slotIndex, chosenSlotToVary];

				const res = generateSentenceFromTemplate(tpl, {
					...options,
					targetUnitId: targetId,
					targetSlotIndex: matchItem.slotIndex,
					unlockedSlots: unlocked,
					varyMode: 'selected',
					difficultyTier: tier,
					variationIndex: v + 1,
					seedOffset: seedOff + v * 11 + 7
				});

				if (res && res.ok && res.ko && !seenKo.has(res.ko)) {
					seenKo.add(res.ko);
					res.difficultyTier = tier;
					res.difficultyLabel = getTierLabel(tier);
					res.templateDifficulty = matchItem.diff.difficultyScore;
					sentences.push(res);
				}
			}
		}
	}

	// Fallback to AST generator for any remaining slots up to `numSentences`
	if (sentences.length < numSentences) {
		const needed = numSentences - sentences.length;
		for (let a = 0; a < needed * 4 && sentences.length < numSentences; a++) {
			const targetIdx = sentences.length;
			const tier = getTierForIndex(targetIdx, numSentences);
			const fallback = generateSentenceForUnit(targetUnit, {
				...options,
				difficultyTier: tier,
				variationIndex: a + 10,
				seedOffset: seedOff + (a + 1) * 11
			});
			if (fallback && fallback.ok && fallback.ko && !seenKo.has(fallback.ko)) {
				seenKo.add(fallback.ko);
				sentences.push({
					...fallback,
					isVerifiedStructure: false,
					verifiedTemplateId: null,
					verifiedTemplateTitle: null,
					difficultyTier: tier,
					difficultyLabel: getTierLabel(tier),
					templateDifficulty: null
				});
			}
		}
	}

	return {
		ok: sentences.length > 0,
		insufficientSet: false,
		missingRoles: [],
		message: null,
		sentences
	};
}

const verifiedGeneratorExports = {
	VERIFIED_TEMPLATE_SCHEMA,
	VERIFIED_SLOT_SCHEMA,
	recomposeASTFromVerifiedSentence,
	validateVerifiedSentence,
	hydrateVerifiedSentence,
	serializeCompactTemplate,
	resetHardcodedVerifiedCache,
	extractCleanSentenceStrings,
	buildSlotFromToken,
	extractVerifiedSentenceTemplate,
	extractVerifiedSentencesFromPassage,
	getSlotCandidates,
	analyzeTemplateStructure,
	realizeSlot,
	generateSentenceFromTemplate,
	generateSentencesFromTemplate,
	getAllVerifiedSentences,
	getVerifiedSentenceById,
	updateVerifiedSentenceTitle,
	updateVerifiedSentenceSlotTags,
	addTagToVerifiedSlot,
	removeTagFromVerifiedSlot,
	resetVerifiedSlotTags,
	resetHardcodedVerifiedSentence,
	cloneVerifiedSentence,
	deleteVerifiedSentence,
	addRuntimeVerifiedSentences,
	exportVerifiedSentencesState,
	importVerifiedSentencesState,
	findMatchingTemplatesForUnit,
	generateVerifiedSentenceForUnit,
	generateVerifiedSentencesForUnit,
	buildPosDecks,
	getPosDecks,
	getPosDeck,
	computeTemplateDifficulty,
	getPrioritizedVerifiedSentences,
	getTierForIndex,
	getTierLabel
};

if (typeof window !== 'undefined') {
	window.verifiedSentenceGenerator = verifiedGeneratorExports;
	Object.assign(window, verifiedGeneratorExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = verifiedGeneratorExports;
}
})();
