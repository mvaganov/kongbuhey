/**
 * Feature 7: Deictic Demonstratives & Spatial Relational Noun Phrase Syntax
 *
 * Implements:
 * 1. Tripartite deictic proximity paradigm (이/그/저 - proximal, medial, distal).
 * 2. Spatial relational noun phrase synthesis ([Ground] + [Position] + [Locative Particle]).
 * 3. Static vs. dynamic verb locative particle harmony (-에 with 있다/없다 vs. -에서 with action verbs).
 * 4. Determiner bare particle prohibition validation and repair (*이가 -> 이게, *이를 -> 이걸).
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
const { ERROR_CODES } = (typeof require !== 'undefined' ? require('../constants/error_codes.js') : window);
const { getNounUnit, getVerbUnit, attachParticle, applyMorphology } = (typeof require !== 'undefined' ? require('../core/morphology.js') : window);

function getSpatialPositions(options = {}) {
	if (options.asUnits) {
		return Array.from(state.SPATIAL_POSITIONS.values()).map(v => v.unit);
	}
	return Array.from(state.SPATIAL_POSITIONS.keys());
}

function getDeicticDemonstratives(options = {}) {
	const results = [];
	const filterType = options.type;
	const filterProx = options.proximity;

	const mapsToSearch = [];
	if (!filterType || filterType === "determiner") mapsToSearch.push(state.DEICTIC_DETERMINERS);
	if (!filterType || filterType === "thing" || filterType === "pronoun") mapsToSearch.push(state.DEICTIC_PRONOUNS);
	if (!filterType || filterType === "place" || filterType === "locative") mapsToSearch.push(state.DEICTIC_LOCATIVES);
	if (!filterType || filterType === "direction") mapsToSearch.push(state.DEICTIC_DIRECTIONS);

	for (const m of mapsToSearch) {
		for (const [ko, entry] of m.entries()) {
			if (filterProx && entry.proximity !== filterProx) continue;
			results.push(entry);
		}
	}
	return results;
}

function isStaticExistenceVerb(verbOrKo) {
	if (!verbOrKo) return false;
	const ko = typeof verbOrKo === 'string' ? verbOrKo : (Array.isArray(verbOrKo) ? verbOrKo[DATA_SCHEMA.Korean] : "");
	if (state.STATIC_EXISTENCE_VERBS.has(ko)) return true;
	const unit = getVerbUnit(verbOrKo);
	if (unit) {
		if (hasTag(unit, "static", "existence", "residence", "locative_static")) return true;
		const sv = parseSemanticVector(unit);
		if (sv && sv.locative === "static") return true;
	}
	return false;
}

function buildSpatialPhrase(referenceNounOrPosition, positionOrOptions = null, maybeOptions = {}) {
	let referenceNoun = referenceNounOrPosition;
	let position = positionOrOptions;
	let options = maybeOptions;

	if (typeof positionOrOptions === 'object' && positionOrOptions !== null && !Array.isArray(positionOrOptions)) {
		options = positionOrOptions;
		position = null;
	}

	const refNounKo = typeof referenceNoun === 'string' ? referenceNoun : (Array.isArray(referenceNoun) ? referenceNoun[DATA_SCHEMA.Korean] : "");
	if (!position && state.SPATIAL_POSITIONS.has(refNounKo)) {
		position = referenceNoun;
		referenceNoun = null;
	}

	const refUnit = typeof referenceNoun === 'object' && Array.isArray(referenceNoun) ? referenceNoun : getNounUnit(referenceNoun);
	const refKo = typeof referenceNoun === 'string' ? referenceNoun : (refUnit ? refUnit[DATA_SCHEMA.Korean] : "");

	let posUnit = typeof position === 'object' && Array.isArray(position) ? position : null;
	let posKo = typeof position === 'string' ? position : (posUnit ? posUnit[DATA_SCHEMA.Korean] : "");

	if (!posKo) {
		const positions = getSpatialPositions();
		const rnd = (state && typeof state.seededRandom === 'function') ? state.seededRandom() : Math.random();
		posKo = positions.length > 0 ? positions[Math.floor(rnd * positions.length)] : "위";
		posUnit = state.SPATIAL_POSITIONS.get(posKo)?.unit;
	} else if (!posUnit && state.SPATIAL_POSITIONS.has(posKo)) {
		posUnit = state.SPATIAL_POSITIONS.get(posKo)?.unit;
	}

	if (options.modifyingNoun) {
		const modKo = typeof options.modifyingNoun === 'string' ? options.modifyingNoun : options.modifyingNoun[DATA_SCHEMA.Korean];
		return `${refKo ? refKo + " " : ""}${posKo}의 ${modKo}`;
	}

	const hasGenitive = options.genitive === true;
	const refPart = hasGenitive ? `${refKo}의` : refKo;

	let particle = options.particle;
	if (!particle) {
		if (options.verb) {
			particle = "location";
		} else {
			particle = "location_static";
		}
	} else if (particle === "static") {
		particle = "location_static";
	} else if (particle === "dynamic") {
		particle = "location_dynamic";
	}

	const attachedPos = attachParticle(posKo, particle, options.verb, options);
	return refPart ? `${refPart} ${attachedPos}` : attachedPos;
}

function buildDeicticPhrase(proximity = "proximal", targetType = "noun", options = {}) {
	if (targetType === "noun" || options.noun) {
		const determinerEntry = Array.from(state.DEICTIC_DETERMINERS.values()).find(d => d.proximity === proximity);
		const detKo = determinerEntry ? determinerEntry.ko : (proximity === "medial" ? "그" : proximity === "distal" ? "저" : "이");
		const nounKo = typeof options.noun === 'string' ? options.noun : (options.noun ? options.noun[DATA_SCHEMA.Korean] : (typeof targetType === 'string' && targetType !== "noun" ? targetType : "책"));
		if (options.particle) {
			return `${detKo} ` + attachParticle(nounKo, options.particle, options.verb, options);
		}
		return `${detKo} ${nounKo}`;
	}

	if (targetType === "thing" || targetType === "pronoun") {
		const candidates = Array.from(state.DEICTIC_PRONOUNS.values()).filter(p => p.proximity === proximity);
		const colloquial = options.colloquial === true;
		const entry = candidates.find(c => colloquial ? (c.formality === "informal_low" || c.ko.endsWith("거")) : !c.ko.endsWith("거")) || candidates[0];
		const baseKo = entry ? entry.ko : (proximity === "medial" ? "그것" : proximity === "distal" ? "저것" : "이것");
		if (options.particle) {
			return applyMorphology(attachParticle(baseKo, options.particle, options.verb, options));
		}
		return baseKo;
	}

	if (targetType === "place" || targetType === "locative") {
		const formal = options.formal === true;
		const candidates = Array.from(state.DEICTIC_LOCATIVES.values()).filter(l => l.proximity === proximity);
		const entry = candidates.find(c => formal ? c.ko.endsWith("곳") : !c.ko.endsWith("곳")) || candidates[0];
		const baseKo = entry ? entry.ko : (proximity === "medial" ? "거기" : proximity === "distal" ? "저기" : "여기");
		if (options.particle) {
			return attachParticle(baseKo, options.particle, options.verb, options);
		}
		return baseKo;
	}

	if (targetType === "direction") {
		const candidates = Array.from(state.DEICTIC_DIRECTIONS.values()).filter(d => d.proximity === proximity);
		const entry = candidates[0];
		const baseKo = entry ? entry.ko : (proximity === "medial" ? "그쪽" : proximity === "distal" ? "저쪽" : "이쪽");
		if (options.particle) {
			return attachParticle(baseKo, options.particle, options.verb, options);
		}
		return baseKo;
	}

	return "";
}

function validateSpatialConcord(input, context = {}) {
	const errors = [];
	const errorCodes = [];
	const text = typeof input === 'string' ? input : (input && input.text ? input.text : "");
	if (!text) return { valid: true, errors: [], errorCodes: [] };

	// 1. Determiner Bare Particle Prohibition
	const bareDeterminerMatches = text.match(/(^|[^가-힣])(?:(이)(가|를|을|에서)|(그)(가|를|을|에서)|(어느)(가|를|을|는|은|에|에서)|(저가))(?=[^가-힣]|$)/g);
	if (bareDeterminerMatches) {
		for (const m of bareDeterminerMatches) {
			errors.push(`Bare demonstrative determiner cannot attach case particle directly: "${m.trim()}" in "${text}"`);
			errorCodes.push(ERROR_CODES.DEICTIC_CATEGORY_MISMATCH);
		}
	}

	// 2. Spatial Relational Frame Static vs Dynamic Verb Particle Harmony
	const positionsPattern = Array.from(state.SPATIAL_POSITIONS.keys()).join('|');
	if (positionsPattern) {
		const staticStems = Array.from(state.STATIC_EXISTENCE_VERBS).map(v => v.replace(/다$/, '')).concat(['누워', '계세', '계십', '계셔', '계셨']);
		if (staticStems.length > 0) {
			const staticErrorRegex = new RegExp(`(?:${positionsPattern})에서\\s+(?:[^.!?]*\\s+)?(?:${staticStems.join('|')})`);
			if (staticErrorRegex.test(text)) {
				errors.push(`Spatial position noun takes '-에' (not '-에서') with static existence verb in: "${text}"`);
				errorCodes.push(ERROR_CODES.SPATIAL_RELATION_MISMATCH);
			}
		}

		const dynamicActionErrorRegex = new RegExp(`(?:${positionsPattern})에\\s+(?:[가-힣]+[을를]\\s+)(?:만나|공부(?:하|해|했)|일(?:하|해|했)|운동(?:하|해|했)|먹|사|놀|기다(?:리|려)|마시|마셔|읽)`);
		if (dynamicActionErrorRegex.test(text)) {
			errors.push(`Spatial position noun takes '-에서' (not '-에') with dynamic action verb in: "${text}"`);
			errorCodes.push(ERROR_CODES.SPATIAL_RELATION_MISMATCH);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		errorCodes
	};
}

function applySpatialConcord(input) {
	if (typeof input === 'object' && input !== null) {
		let text = input.text || "";
		if (text) {
			text = applySpatialConcord(text);
		}
		return { ...input, text };
	}

	let str = String(input);

	// Demonstrative contraction: 이가 -> 이게, 이를 -> 이걸 (protecting noun '이' [teeth]: 이를 닦다, 이가 아프다, etc.)
	str = str.replace(/(^|[^가-힣])이가(?=[^가-힣]|$)(?!\s+(?:[가-힣]+\s+)?(?:아프|시리|나(?:요|았|고|서|면|다)|빠지|흔들|썩|튼튼|치료|뽑))/g, '$1이게');
	str = str.replace(/(^|[^가-힣])이를(?=[^가-힣]|$)(?!\s+(?:[가-힣]+\s+)?(?:닦|뽑|치료|보(?:여|요|았|고|셨|시|면)|봤|갈(?:아|았|고)))/g, '$1이걸');
	str = str.replace(/(^|[^가-힣])그가(?=[^가-힣]|$)/g, '$1그게');
	str = str.replace(/(^|[^가-힣])그를(?=[^가-힣]|$)/g, '$1그걸');

	const positionsPattern = Array.from(state.SPATIAL_POSITIONS.keys()).join('|');
	if (positionsPattern) {
		const staticStems = Array.from(state.STATIC_EXISTENCE_VERBS).map(v => v.replace(/다$/, '')).concat(['누워', '계세', '계십', '계셔', '계셨']);
		if (staticStems.length > 0) {
			const repRegex = new RegExp(`(?<![가-힣])(${positionsPattern})에서(\\s+(?:[^.!?]*\\s+)?(?:${staticStems.join('|')}))`, 'g');
			str = str.replace(repRegex, '$1에$2');
		}

		const dynamicRepRegex = new RegExp(`(?<![가-힣]+[은ㄴ]\\s+)(?<![가-힣]+기\\s+)(?<!(?:학기|방학|수업|회의|식사|통화|여행|휴가|공부|근무)\\s*)(?<![가-힣])(${positionsPattern})에(\\s+(?:[가-힣]+[을를]\\s+)(?:만나|공부(?:하|해|했)|일(?:하|해|했)|운동(?:하|해|했)|먹|사|놀|기다(?:리|려)|마시|마셔|읽))`, 'g');
		str = str.replace(dynamicRepRegex, '$1에서$2');
	}

	return str;
}

const spatialExports = {
	getSpatialPositions,
	getDeicticDemonstratives,
	isStaticExistenceVerb,
	buildSpatialPhrase,
	buildDeicticPhrase,
	validateSpatialConcord,
	applySpatialConcord
};

if (typeof window !== 'undefined') {
	Object.assign(window, spatialExports);
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = spatialExports;
}
