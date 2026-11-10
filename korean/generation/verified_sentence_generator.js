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
		.map(l => l.replace(/^[#↳★①②③④⑤\-*\s]+/, '').replace(/^(?:[가나]|[AB]):\s*/, '').replace(/\[-\]/g, '').trim())
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
			.split(/(?<=[.?!~])\s+/)
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

	return {
		id,
		title: buildDefaultTemplateTitle(slots, sourceName, seqNum, originalKo),
		source: sourceName || K.CUSTOM_PASSAGE,
		originalKo,
		punctuation,
		isHardcoded: false,
		grammarUnitIds: Array.from(grammarUnitIdsSet),
		slots
	};
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
				const rawNominal = ko + (inf.suffix || slot.morphTemplate || "");
				surfaceKo = resolvePureMorphology(rawNominal, state);
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

	const wordParts = [];
	const litParts = [];
	const allEojeols = [];
	const slotChoices = [];

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
					chosenUnit = pickCandidateFromPool(candidatePool, options, sIdx);
				} else if (onlyFromSet) {
					return {
						ok: false,
						insufficientSet: true,
						missingRoles: [`${slot.pos} (${(slot.tags || []).join(', ') || 'any'})`],
						message: `Practice set lacks a compatible ${slot.pos} for slot #${sIdx + 1}.`
					};
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
			chosenUnitId: realizedSlot.chosenUnit ? realizedSlot.chosenUnit[DATA_SCHEMA.Id] : null,
			chosenKo: realizedSlot.chosenUnit ? realizedSlot.chosenUnit[DATA_SCHEMA.Korean] : "",
			chosenEn: realizedSlot.chosenUnit ? realizedSlot.chosenUnit[DATA_SCHEMA.English] : "",
			surfaceKo: realizedSlot.surfaceKo,
			surfaceEnLit: realizedSlot.surfaceEnLit
		});
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
		slotChoices
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
		const pickIdx = Math.abs(varIdx + seedOff) % matches.length;
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
