(function() {
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../../data/constants.js') : (typeof window !== 'undefined' ? window : {});
const { HANGUL_CONSTANTS: HC } = (typeof require !== 'undefined') ? require('../../data/hangul_constants.js') : window;
const SLOT_SHORTENED_CARDINALS = new Set(HC.SLOT_NATIVE_CARDINALS_SHORTENED_BEFORE_COUNTER);
const { getVerifiedOriginals } = (typeof require !== 'undefined') ? require('./verified_originals.js') : window;

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
		dataModule = require('../../data/data.js');
	} catch (_) {
		dataModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	dataModule = typeof window !== 'undefined' ? window : {};
}

let verifiedDataModule;
if (typeof require !== 'undefined') {
	try {
		verifiedDataModule = require('../../data/verified_sentences.js');
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
	parseSemanticData: _rawParseSemanticData,
	getStem,
	decomposeHangul,
	setFinal,
	hasBatchim,
	aliasTarget
} = (typeof require !== 'undefined' ? require('../core/primitives.js') : window);

/** A merged duplicate (alias) unit stands for its canonical unit. */
function resolveAliasUnit(unit, units) {
	const to = aliasTarget ? aliasTarget(unit) : null;
	return (to !== null && units && units[to]) ? units[to] : unit;
}

function parseSemanticData(unit) {
	if (!unit) return {};
	if (typeof _rawParseSemanticData === 'function') return _rawParseSemanticData(unit);
	const raw = unit[DATA_SCHEMA.SemanticData];
	if (!raw) return {};
	if (typeof raw === 'object') return raw;
	try { return JSON.parse(raw); } catch (_) { return {}; }
}

function _hasTag(unit, ...tags) {
	if (!unit || tags.length === 0) return false;
	if (typeof hasTag === 'function') return hasTag(unit, ...tags);
	const unitTags = unit[DATA_SCHEMA.SemanticTags];
	if (unitTags instanceof Set) return tags.some(t => t && unitTags.has(t));
	if (Array.isArray(unitTags)) return tags.some(t => t && unitTags.includes(t));
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
const canAdverbPrecede = (adverbialModule && adverbialModule.canAdverbPrecede) || (typeof window !== 'undefined' ? window.canAdverbPrecede : null);

const VERIFIED_TEMPLATE_SCHEMA = (verifiedDataModule && verifiedDataModule.VERIFIED_TEMPLATE_SCHEMA) || {
	Id: 0,
	Title: 1,
	Source: 2,
	OriginalKo: 3,
	Punctuation: 4,
	Slots: 5,
	Rules: 6,
	0: 'Id',
	1: 'Title',
	2: 'Source',
	3: 'OriginalKo',
	4: 'Punctuation',
	5: 'Slots',
	6: 'Rules'
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

// Template field 6 (optional): semantic rules the tag filter cannot express. Each rule is an object:
//   { slot, kind: 'anyTags', tags: [...] }   candidate needs at least one of the tags (OR; slot tags are AND)
//   { slot, kind: 'noTags',  tags: [...] }   candidate has none of the tags
//   { slot, kind: 'deny',    ids:  [...] }   explicit exclusions found while loosening
//   { slot, kind: 'sd', key, values: [...] } SemanticData[key] must be one of values
//   { kind: 'gap', slot?, text }             a documented missing mechanism (no effect on generation)
// tools/vs_tune.js edits these; unknown kinds are ignored here and reported by the tool.
const TEMPLATE_RULES_INDEX = (VERIFIED_TEMPLATE_SCHEMA && typeof VERIFIED_TEMPLATE_SCHEMA.Rules === 'number') ? VERIFIED_TEMPLATE_SCHEMA.Rules : 6;
// allow {ids}: these units join the slot even without its tags (an explicit list next to the tag filter).
// Tags that only exempt a word from a validator check. They describe one word, not a class, so they never
// become a slot's default filter (else adding object_elidable to 만나다 would shrink every 만나다 slot to
// the three tagged verbs). Add a tag here when a validator reads it but slots should not filter by it.
const VALIDATOR_ONLY_TAGS = new Set(['object_elidable', 'motion_activity']);
/** A slot's default tag filter: the original unit's tags minus validator-only tags. */
function defaultSlotTags(unit) {
	const raw = unit && unit[DATA_SCHEMA.SemanticTags];
	const all = raw instanceof Set ? Array.from(raw) : (Array.isArray(raw) ? [...raw] : []);
	return all.filter(t => t && !VALIDATOR_ONLY_TAGS.has(t));
}
// only {ids}: the slot's pool is exactly these units plus its own word (tags and other filters ignored;
// deny still applies). For slots whose good set no tag expresses, e.g. a verb slot fixed by its object.
const SLOT_RULE_KINDS = new Set(['anyTags', 'noTags', 'deny', 'sd', 'allow', 'only']);

function slotRulesAllow(u, slot) {
	const rules = slot && slot.rules;
	if (!Array.isArray(rules) || rules.length === 0) return true;
	for (const r of rules) {
		if (!r || !SLOT_RULE_KINDS.has(r.kind)) continue;
		if (r.kind === 'anyTags' && Array.isArray(r.tags) && r.tags.length > 0 && !r.tags.some(t => _hasTag(u, t))) return false;
		if (r.kind === 'noTags' && Array.isArray(r.tags) && r.tags.some(t => _hasTag(u, t))) return false;
		if (r.kind === 'deny' && Array.isArray(r.ids) && r.ids.includes(u[DATA_SCHEMA.Id])) return false;
		if (r.kind === 'sd' && r.key && Array.isArray(r.values)) {
			const v = parseSemanticData(u)[r.key];
			if (!r.values.includes(v)) return false;
		}
	}
	return true;
}

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
	// Textbook-derived text lives in gitignored local/verified_originals.js (absent on a fresh clone).
	const localText = getVerifiedOriginals()[id] || null;
	const title = (localText && localText.title) || raw[VERIFIED_TEMPLATE_SCHEMA.Title];
	const source = raw[VERIFIED_TEMPLATE_SCHEMA.Source];
	const originalKo = (localText && localText.ko) || raw[VERIFIED_TEMPLATE_SCHEMA.OriginalKo];
	const punctuation = raw[VERIFIED_TEMPLATE_SCHEMA.Punctuation] || '';
	const rawSlots = raw[VERIFIED_TEMPLATE_SCHEMA.Slots] || [];
	// Optional template-level semantic rules (see slotRulesAllow); most rows omit this field.
	const rawRules = raw[TEMPLATE_RULES_INDEX];
	const rules = Array.isArray(rawRules) ? rawRules.filter(r => r && typeof r === 'object') : [];

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
			tags = defaultSlotTags(unit);
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
			rules: rules.filter(r => r.slot === idx),
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
		rules,
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
				const uSet = new Set(defaultSlotTags(u));
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

	const row = [
		tpl.id || '',
		tpl.title || '',
		tpl.source || '',
		tpl.originalKo || '',
		tpl.punctuation || '',
		slots
	];
	if (Array.isArray(tpl.rules) && tpl.rules.length > 0) row.push(tpl.rules);
	return row;
}

let cachedHydratedStatic = null;
let templateEdits = 0;   // bumped on every template edit; the availability cache (further down) drops its entries when it changes
// Work counters: deterministic for a given seed, code and data, so tools/bench_generation.js can assert on them (timings are noise).
const workStats = { snapshotBuilds: 0, difficultyComputes: 0, slotContextBuilds: 0, slotListComputes: 0, matchComputes: 0, baselineChecks: 0, templateAttempts: 0, astFallbackCalls: 0 };
function getWorkStats() { return { ...workStats }; }

function resetHardcodedVerifiedCache() {
	cachedHydratedStatic = null;
	templateEdits++;
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
			delete require.cache[require.resolve('../../data/verified_sentences.js')];
			verifiedDataModule = require('../../data/verified_sentences.js');
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
	if (stem.endsWith('르') && stem.length >= 2 && !HC.VERIFIED_GET_EFFECTIVE_CONJ_RULE_KO_NONE_OF.includes(ko) && rawRule !== 'reo_irregular') {
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
function isLockedSlot(slot) {
	return Boolean(slot && slot.inflection && (slot.inflection.stemForm === K.FIXED_GRAMMAR || slot.inflection.stemForm === "exact"));
}

function sanitizeParticleMorph(rawMorph) {
	if (!rawMorph || typeof rawMorph !== 'string') return "";
	let s = rawMorph.replace(/\s*\((?:location|direction|time|choice|emphasis|means|status)\)/gi, '').trim();
	// Collapse adjacent duplicate tokens generated by homonymous grammar entries
	s = s.replace(/^(에)+$/, '에');
	s = s.replace(/^(\(으\)로|이나\/나|\(이\)나|이\/나)\1+$/, '$1');
	s = s.replace(/(\(으\)로)\s*\1+/g, '$1');
	s = s.replace(/([가-힣()/]+)\s*\1/g, '$1');
	return s;
}

function normalizeNominalParticleMorph(grammarList) {
	if (!grammarList || grammarList.length === 0) return "";
	const parts = [];
	const pushUnique = (val) => {
		if (val && parts[parts.length - 1] !== val) {
			parts.push(val);
		}
	};
	for (const g of grammarList) {
		const id = g.unit ? g.unit[DATA_SCHEMA.Id] : g.unitId;
		const t = sanitizeParticleMorph(g.text || "");
		if (!t) continue;
		if (id === 550 || t === "들") {
			pushUnique("들");
		} else if (id === 36 || HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_17.includes(t)) {
			pushUnique("은/는");
		} else if (id === 96 || HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_16.includes(t)) {
			pushUnique("이/가");
		} else if (id === 173 || HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_15.includes(t)) {
			pushUnique("을/를");
		} else if (id === 1624 || HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_14.includes(t)) {
			pushUnique("와/과");
		} else if (id === 260 || HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_13.includes(t)) {
			pushUnique("이랑/랑");
		} else if (id === 475 || id === 1240 || id === 1241 || id === 1242 || HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_12.includes(t)) {
			pushUnique("(으)로");
		} else if (id === 476 || id === 1333 || id === 1334 || HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_11.includes(t)) {
			pushUnique("이나/나");
		} else if (id === 1397 || HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_10.includes(t)) {
			pushUnique("이라서/라서");
		} else if (id === 1398 || HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_9.includes(t)) {
			pushUnique("이라도/라도");
		} else if (HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_8.includes(t)) {
			pushUnique("와/과의");
		} else if (HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_7.includes(t)) {
			pushUnique("와/과는");
		} else if (HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_6.includes(t)) {
			pushUnique("와/과도");
		} else if (HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_5.includes(t)) {
			pushUnique("(으)로는");
		} else if (HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_4.includes(t)) {
			pushUnique("(으)로도");
		} else if (HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_3.includes(t)) {
			pushUnique("(으)로만");
		} else if (HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF_2.includes(t)) {
			pushUnique("이랑/랑은");
		} else if (HC.VERIFIED_NORMALIZE_NOMINAL_PARTICLE_MORPH_T_ONE_OF.includes(t)) {
			pushUnique("이랑/랑도");
		} else {
			pushUnique(t);
		}
	}
	return parts.join("");
}

function deduceCopulaMorph(cleanSurface, origKo) {
	const tail = (origKo && cleanSurface.startsWith(origKo))
		? cleanSurface.slice(origKo.length)
		: cleanSurface;
	if (tail === "입니다") return "입니다";
	if (HC.VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_10.includes(tail)) return "이/예요";
	if (HC.VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_9.includes(tail)) return "이야/야";
	if (HC.VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_8.includes(tail)) return "이었/였어요";
	if (HC.VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_7.includes(tail)) return "이었/였습니다";
	if (HC.VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_6.includes(tail)) return "이었/였으면";
	if (HC.VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_5.includes(tail)) return "이었/였는데";
	if (HC.VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_4.includes(tail)) return "이어/여서";
	if (tail === "이고") return "이고";
	if (tail === "인데") return "인데";
	if (tail === "인데요") return "인데요";
	if (tail === "인") return "인";
	if (tail === "일까요") return "일까요";
	if (HC.VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_3.includes(tail)) return "(이)니까";
	if (HC.VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF_2.includes(tail)) return "(이)냐고";
	if (HC.VERIFIED_DEDUCE_COPULA_MORPH_TAIL_ONE_OF.includes(tail)) return "(이)다";
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
		return { prefix, stemForm: K.PAST, suffix: surf.slice(pastStem.length) };
	}

	if (aoStem && aoStem !== rawStem && surf.startsWith(aoStem)) {
		return { prefix, stemForm: "ao", suffix: surf.slice(aoStem.length) };
	}

	const candidateConjSuffixes = HC.VERIFIED_DEDUCE_VERB_INFLECTION_CANDIDATE_CONJ_SUFFIXES;
	for (const cand of candidateConjSuffixes) {
		if (applyCustomVerbMorph(conjStem, cand) === surf) {
			return { prefix, stemForm: "conj", suffix: cand };
		}
	}

	const firstSpaceIdx = surf.indexOf(' ');
	const firstWord = firstSpaceIdx === -1 ? surf : surf.slice(0, firstSpaceIdx);
	const restWords = firstSpaceIdx === -1 ? "" : surf.slice(firstSpaceIdx);

	const morphPrefixes = HC.VERIFIED_DEDUCE_VERB_INFLECTION_MORPH_PREFIXES;
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
	if (stemForm === K.PAST) {
		if (HC.VERIFIED_REALIZE_VERB_INFLECTION_SUFFIX_ONE_OF.includes(suffix)) {
			body = pastStem + "어요";
		} else {
			body = pastStem + suffix;
		}
	} else if (stemForm === "ao") {
		body = aoStem + suffix;
	} else if (stemForm === "conj") {
		if ((HC.VERIFIED_REALIZE_VERB_INFLECTION_KO_ENDSWITH_ONE_OF.some(_w => ko.endsWith(_w))) && /^으\/ㄴ(?:$|데|지|가|\s)/.test(suffix)) {
			body = rawStem + "는" + suffix.slice(3);
		} else {
			body = applyCustomVerbMorph(conjStem, suffix);
		}
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
		} else if (token.category === K.NUMERIC_PHRASE && token.lexical.counter) {
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
			inflection: { prefix: "", stemForm: K.FIXED_GRAMMAR, suffix: cleanSurface }
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
	let inflection = { prefix: "", stemForm: K.NOMINAL, suffix: "" };

	if (pos === K.ACTION_VERB || pos === K.DESCRIPTIVE_VERB) {
		inflection = deduceVerbInflection(lexUnit, cleanSurface, grammarItems);
		morphTemplate = (inflection.prefix ? inflection.prefix : "") + (inflection.suffix || "");
	} else if (token.category && token.category.startsWith(K.NOUN_COPULA)) {
		morphTemplate = deduceCopulaMorph(cleanSurface, origKo);
		inflection = { prefix: "", stemForm: K.COPULA, suffix: morphTemplate };
	} else if (token.category === K.NUMERIC_PHRASE) {
		morphTemplate = normalizeNominalParticleMorph(grammarItems);
		inflection = { prefix: numberPrefix, stemForm: K.NUMERIC, suffix: morphTemplate };
	} else {
		morphTemplate = normalizeNominalParticleMorph(grammarItems);
		inflection = { prefix: compoundPrefixKo, stemForm: K.NOMINAL, suffix: morphTemplate };
	}

	return {
		index: slotIndex,
		originalSurface: cleanSurface,
		trailingPunct: trailingPunct === "," ? "," : "",
		category: token.category || K.EXACT_LEXICAL,
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

function buildSlotMatchContext(slot, units) {
	const requiredTags = Array.isArray(slot.tags) ? slot.tags.filter(Boolean) : [];
	const origUnit = typeof slot.originalUnitId === 'number' ? units[slot.originalUnitId] : null;
	const slotMorph = sanitizeParticleMorph(slot.morphTemplate || (slot.inflection && slot.inflection.suffix) || "");
	const slotHasParticle = Boolean((slot.grammar && slot.grammar.length > 0) || slotMorph);
	const slotGramTexts = (slot.grammar || []).map(g => sanitizeParticleMorph(g.text || ""));
	const origHasCountry = origUnit && _hasTag(origUnit, K.COUNTRY);
	return {
		requiredPos: slot.pos,
		requiredTags,
		origUnit,
		slotMorph,
		slotHasParticle,
		slotGramTexts,
		origHasCountry,
		origIsProperCountry: origHasCountry && _hasTag(origUnit, K.PROPER_NOUN),
		origIsPossessive: origUnit && (_hasTag(origUnit, "possessive") || Boolean(parseSemanticData(origUnit).en && parseSemanticData(origUnit).en.possOnly))
	};
}

function isUnitEligibleForSlot(u, slot, ctx, options = {}) {
	if (!u || !slot) return false;
	if (u[DATA_SCHEMA.PartofSpeech] !== ctx.requiredPos) return false;
	const uId = u[DATA_SCHEMA.Id];
	const isOrigUnit = uId === slot.originalUnitId;
	const isAllowed = Array.isArray(slot.rules) && slot.rules.some(r => r && r.kind === 'allow' && Array.isArray(r.ids) && r.ids.includes(uId));
	const onlyRule = Array.isArray(slot.rules) ? slot.rules.find(r => r && r.kind === 'only' && Array.isArray(r.ids)) : null;
	if (onlyRule) {
		if (!isOrigUnit && !onlyRule.ids.includes(uId)) return false;
		return slotRulesAllow(u, { rules: slot.rules.filter(r => r && r.kind === 'deny') });
	}

	// The template's own word is attested in this slot: tag filters and tag rules never drop it (a tuned slot
	// can narrow to a set that excludes it). Only an explicit deny rule removes it. Same for allow-listed units.
	if (isOrigUnit || isAllowed) {
		if (!slotRulesAllow(u, { rules: ((slot && slot.rules) || []).filter(r => r && r.kind === 'deny') })) return false;
	} else {
		for (let tIdx = 0; tIdx < ctx.requiredTags.length; tIdx++) {
			if (!_hasTag(u, ctx.requiredTags[tIdx])) {
				return false;
			}
		}
		if (!slotRulesAllow(u, slot)) return false;

		if (!ctx.requiredTags.includes(K.POSITION) && _hasTag(u, K.POSITION)) {
			return false;
		}
		if (!ctx.requiredTags.includes(K.MEASUREWORD) && !ctx.requiredTags.includes(K.COUNTER) && _hasTag(u, K.MEASUREWORD, K.COUNTER)) {
			return false;
		}
	}

	if (!isOrigUnit) {
		const uKo = u[DATA_SCHEMA.Korean] || "";
		const uSd = parseSemanticData(u);

		if (_hasTag(u, "colloquial") && uSd.polarity === -1) return false;
		if (uKo.startsWith("-") || (_hasTag(u, K.BOUND_NOUN) && uKo.includes("-"))) return false;
		const isNumericSlot = slot.category === K.NUMERIC || slot.category === K.NUMERIC_PHRASE || Boolean(slot.inflection && slot.inflection.stemForm === K.NUMERIC);
		if (uId === 1369) return false; // Bound noun 말 ('end') cannot substitute freely for time/generic slots
		if ((uId === 1180 || uId === 1631) && !isOrigUnit) return false; // Post-nominal relational nouns 후/전 cannot replace bare time words (e.g. 이때 -> *후)
		if (!isNumericSlot && uKo === HC.SLOT_COUNTER_ONLY_IN_NUMERIC_SLOT_MONTHS) return false;
		if (u[DATA_SCHEMA.PartofSpeech] === K.NUMBER && _hasTag(u, "attributive") && (ctx.slotHasParticle || ctx.slotMorph !== "")) return false;
		if ((slot.category === "noun_plural" || (slot.grammar || []).some(g => g.unitId === 550)) && u[DATA_SCHEMA.PartofSpeech] !== K.NOUN) return false;
		if (u[DATA_SCHEMA.PartofSpeech] === K.NUMBER && ctx.origUnit && ctx.origUnit[DATA_SCHEMA.PartofSpeech] === K.NUMBER) {
			if (HC.SLOT_ZERO_WORDS_REPLACE_ONLY_ZERO.includes(uKo) && !HC.SLOT_ZERO_WORDS_REPLACE_ONLY_ZERO.includes(ctx.origUnit[DATA_SCHEMA.Korean] || "")) return false;
			if (!_hasTag(ctx.origUnit, K.SINO_NUMBER)) {
				if (_hasTag(u, K.SINO_NUMBER)) return false;
				if (!ctx.slotHasParticle && SLOT_SHORTENED_CARDINALS.has(uKo)) return false;
			}
		}
		if (ctx.origUnit && _hasTag(ctx.origUnit, K.FOOD) && _hasTag(u, K.PLACE, K.FACILITY, "institution")) return false;
		const isBenefactiveSlot = (slot.grammar || []).some(g => g.unitId === 322 || g.unitId === 1383) || Boolean(slot.inflection && (slot.inflection.suffix || "").includes(HC.SLOT_BENEFACTIVE_SUFFIX_MARKER));
		if (isBenefactiveSlot && (uKo.endsWith(HC.SLOT_BENEFACTIVE_EXCLUDED_MAIN_VERB_GIVE) || uKo === HC.SLOT_BENEFACTIVE_EXCLUDED_MAIN_VERB_GIVE_HONORIFIC)) return false;

		if ((ctx.requiredPos === K.ACTION_VERB || ctx.requiredPos === K.DESCRIPTIVE_VERB) && uKo.includes(" ")) {
			const origHasSpace = Boolean(ctx.origUnit && (ctx.origUnit[DATA_SCHEMA.Korean] || "").includes(" "));
			if (!origHasSpace) return false;
		}

		if (isNumericSlot && ctx.origUnit) {
			const origCounterKo = ctx.origUnit[DATA_SCHEMA.Korean] || "";
			if ((origCounterKo === HC.SLOT_CLOCK_HOUR_COUNTER) !== (uKo === HC.SLOT_CLOCK_HOUR_COUNTER)) return false;
		}

		const hasPresAdn645 = Array.isArray(slot.grammar) && slot.grammar.some(g => g.id === 645 || HC.SLOT_PRESENT_ADNOMINAL_ENDING_TEXTS.includes(g.text));
		if (hasPresAdn645 && u[DATA_SCHEMA.PartofSpeech] === K.DESCRIPTIVE_VERB && !HC.SLOT_PRESENT_ADNOMINAL_DV_SUFFIXES.some(x => uKo.endsWith(x))) {
			return false;
		}

		const isPossOnly = _hasTag(u, "possessive") || Boolean(uSd.en && uSd.en.possOnly);
		if (isPossOnly && (ctx.slotHasParticle || !ctx.origIsPossessive)) return false;

		if (uId === 66 && (slot.category !== "pronoun_phrase" || ctx.slotMorph !== "이/가")) return false;
		if (uId === 355 && ctx.slotMorph !== "을/를") return false;

		const isStrictPrenoun = _hasTag(u, "prenoun") || u[DATA_SCHEMA.PartofSpeech] === K.DETERMINER || (_hasTag(u, "determiner") && !HC.VERIFIED_IS_UNIT_ELIGIBLE_FOR_SLOT_UKO_NONE_OF.includes(uKo));
		if (isStrictPrenoun && ctx.slotHasParticle) return false;

		if ((_hasTag(u, "no_time_particle") || uSd.no_time_particle) && (ctx.slotMorph.includes("에") || ctx.slotGramTexts.some(t => /^에/.test(t)))) {
			return false;
		}

		if (uId === 1631 && (slot.originalUnitId === 1605 || (ctx.origUnit && ctx.origUnit[DATA_SCHEMA.Korean] === "때"))) return false;
		if (uId === 1639 && !ctx.requiredTags.includes(K.HONORIFIC)) return false;
		if (_hasTag(u, "honorific_noun") && !ctx.requiredTags.includes(K.HONORIFIC)) return false;

		if (ctx.origHasCountry) {
			const candIsProper = _hasTag(u, K.PROPER_NOUN);
			if (ctx.origIsProperCountry && !candIsProper) return false;
			if (!ctx.origIsProperCountry && candIsProper) return false;
		}

		// Adnominal slots whose original verb has strict selectional filters cannot accept unconstrained generic '하다' or incompatible domain verbs
		if ((slot.category === K.ADNOMINAL_MODIFIER || (slot.inflection && slot.inflection.stemForm === "adnominal")) && ctx.origUnit) {
			const origSd = parseSemanticData(ctx.origUnit);
			const origRestricted = Boolean(origSd && (origSd.collocation_filter || (origSd.req && origSd.req !== K.OBJECT && origSd.req !== "any")));
			if (origRestricted && uKo === "하다") return false;
		}
	}

	if (ctx.requiredPos === K.POS_ADVERB) {
		const isNpi = _hasTag(u, "npi") || (state.ALL_NPI_WORDS && state.ALL_NPI_WORDS.has(u[DATA_SCHEMA.Korean]));
		const IMPERATIVE_SLOT_GRAMMAR_IDS = new Set([416, 1644, 1182, 1736]);
		const isImperativeSlot = (slot.grammar || []).some(g => IMPERATIVE_SLOT_GRAMMAR_IDS.has(g.unitId));
		if (isImperativeSlot && (isNpi || HC.VERIFIED_IS_UNIT_ELIGIBLE_FOR_SLOT_U_DATA_SCHEMA_KOREAN_ONE_OF.includes(u[DATA_SCHEMA.Korean]))) {
			return false;
		}
		if (isNpi) {
			const slotTpl = slot.morphTemplate || "";
			const isNegativeSlot = HC.VERIFIED_IS_UNIT_ELIGIBLE_FOR_SLOT_SLOTTPL_INCLUDES_ONE_OF.some(_w => slotTpl.includes(_w));
			if (!isNegativeSlot && !options.isNegativeClause) {
				return false;
			}
		}
	}

	return true;
}

/**
 * Finds all candidate Language Units from data.js that satisfy a slot's
 * Part of Speech and Semantic Tag filter requirements.
 */
function getSlotCandidates(slot, options = {}) {
	const units = getUnitsArray();
	if (!slot || !units || units.length === 0) {
		return { candidates: [], count: 0, isSingleChoice: false, isZeroChoice: true, singleChoiceUnit: null };
	}

	if (isLockedSlot(slot)) {
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

	// Eligibility depends only on the slot, the unit data and options.isNegativeClause, so the full list is cached per slot object;
	// the per-call set filter runs on that (short) list. The cold scan only visits units of the slot's part of speech.
	const base = slotEligibleUnits(slot, units, Boolean(options.isNegativeClause));
	const onlyFromSet = Boolean(options.onlyFromSet);
	const allowedUnitIds = options.allowedUnitIds instanceof Set ? options.allowedUnitIds : null;
	const targetUnitId = typeof options.targetUnitId === 'number' ? options.targetUnitId : null;

	const ex = options.excludeUnitIds instanceof Set && options.excludeUnitIds.size ? options.excludeUnitIds : null;   // switched off by the player
	const candidates = (onlyFromSet && allowedUnitIds)
		? base.filter(u => { const uId = u[DATA_SCHEMA.Id]; return uId === targetUnitId || (allowedUnitIds.has(uId) && !(ex && ex.has(uId))); })
		: (ex ? base.filter(u => u[DATA_SCHEMA.Id] === targetUnitId || !ex.has(u[DATA_SCHEMA.Id])) : base.slice());

	return {
		candidates,
		count: candidates.length,
		isSingleChoice: candidates.length === 1,
		isZeroChoice: candidates.length === 0,
		singleChoiceUnit: candidates.length === 1 ? candidates[0] : null
	};
}

// units array -> Map(part of speech -> units of that POS, in data order). isUnitEligibleForSlot rejects any other POS first thing.
const _posIndex = new WeakMap();
function unitsByPos(units) {
	let m = _posIndex.get(units);
	if (!m) {
		m = new Map();
		for (const u of units) {
			if (!u) continue;
			const pos = u[DATA_SCHEMA.PartofSpeech];
			if (!m.has(pos)) m.set(pos, []);
			m.get(pos).push(u);
		}
		_posIndex.set(units, m);
	}
	return m;
}

// slot object -> { units, ctx, lists: [positive, negative] }: match context and eligible units, computed once per slot.
const _slotMemo = new WeakMap();
function slotMemo(slot, units) {
	let m = _slotMemo.get(slot);
	if (!m || m.units !== units) { workStats.slotContextBuilds++; m = { units, ctx: buildSlotMatchContext(slot, units), lists: [null, null] }; _slotMemo.set(slot, m); }
	return m;
}
function cachedSlotContext(slot, units) { return slotMemo(slot, units).ctx; }
function slotEligibleUnits(slot, units, negative) {
	const m = slotMemo(slot, units), k = negative ? 1 : 0;
	if (!m.lists[k]) {
		workStats.slotListComputes++;
		const opts = negative ? { isNegativeClause: true } : {};
		m.lists[k] = (unitsByPos(units).get(m.ctx.requiredPos) || []).filter(u => isUnitEligibleForSlot(u, slot, m.ctx, opts));
	}
	return m.lists[k];
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
			singleChoiceUnit: pool.singleChoiceUnit ? {
				id: pool.singleChoiceUnit[DATA_SCHEMA.Id],
				ko: pool.singleChoiceUnit[DATA_SCHEMA.Korean],
				en: pool.singleChoiceUnit[DATA_SCHEMA.English]
			} : null,
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

function getGrammarLiteralSuffix(grammarItems, activeUnit = null, surfaceKo = "", realizeOptions = {}) {
	if (!grammarItems || grammarItems.length === 0) return "";
	const units = getUnitsArray();
	const activeId = activeUnit ? activeUnit[DATA_SCHEMA.Id] : null;
	const activeLit = activeUnit ? getUnitLiteralStem(activeUnit) : "";
	const isQuestionClause = Boolean(realizeOptions.isQuestion || String(surfaceKo || "").trim().endsWith("?"));
	const hasUntil1826 = grammarItems.some(item => item.unitId === 1826);
	const cleanSurfBase = String(surfaceKo || "").replace(/[.?!~]+$/, '');
	const tags = [];
	const pushTag = (tok) => {
		if (!tok) return;
		if (tags[tags.length - 1] === tok) return;
		if (activeLit && activeLit.endsWith(tok)) return;
		tags.push(tok);
	};
	for (const g of grammarItems) {
		const gUnit = typeof g.unitId === 'number' ? units[g.unitId] : null;
		if (activeId !== null && g.unitId === activeId) continue;
		if (gUnit && gUnit[DATA_SCHEMA.Id] === 710 && surfaceKo) {
			if (surfaceKo.includes("후")) {
				pushTag("-after");
				continue;
			}
			if (surfaceKo.includes("전")) {
				pushTag("-before");
				continue;
			}
		}
		if (g.pos === "Particle" && gUnit) {
			const pTag = getParticleLiteralTag(null, gUnit);
			if (pTag) {
				pushTag(pTag);
				continue;
			}
		}
		if (gUnit) {
			const gId = gUnit[DATA_SCHEMA.Id];
			const cleanSurf = cleanSurfBase;
			if (gId === 855 && hasUntil1826) {
				continue;
			}
			if (gId === 416 && isQuestionClause) {
				pushTag("-(hon)");
				continue;
			}
			if (gId === 459 && !cleanSurf.endsWith("서") && (grammarItems.length > 1 || /(?:어|아|해|려|쳐|져)$/.test(cleanSurf))) {
				continue;
			}
			if (gId === 1211 && !HC.VERIFIED_GET_GRAMMAR_LITERAL_SUFFIX_CLEANSURF_INCLUDES_NONE_OF.some(_w => cleanSurf.includes(_w))) {
				pushTag("-whether");
				continue;
			}
			if (gId === 1021 && ((activeUnit && (activeUnit[DATA_SCHEMA.Korean] === "이다" || activeUnit[DATA_SCHEMA.PartofSpeech] === K.DESCRIPTIVE_VERB)) || /(?:일까요|일까|건가요)$/.test(cleanSurf))) {
				pushTag("-do-you-think?");
				continue;
			}
			if (gId === 932 && cleanSurf.endsWith("건가요") && !grammarItems.some(item => item.unitId === 56)) {
				pushTag("-be?");
				continue;
			}
			if (gId === 53 && cleanSurf.endsWith("거니까") && !grammarItems.some(item => item.unitId === 56)) {
				pushTag("-be-since/because");
				continue;
			}
			if (gId === 1855) {
				pushTag("-[formal]");
				continue;
			}
			const sd = parseSemanticData(gUnit);
			if (sd && sd.en && (sd.en.lit !== undefined || sd.en.role !== undefined)) {
				const rawLit = sd.en.lit !== undefined ? sd.en.lit : sd.en.role;
				const r = rawLit ? String(rawLit).replace(/^-+/, '') : '';
				if (r && (!activeLit || activeLit !== r)) {
					pushTag(`-${r}`);
				}
				continue;
			}
		}
		const shortEn = String(g.en || g.text || '')
			.replace(/\([^)]*\)/g, '')
			.split(/[;,/]/)[0]
			.trim()
			.replace(/\s+/g, '-');
		if (shortEn) pushTag(`-[${shortEn}]`);
	}
	return tags.join('');
}

/**
 * Inflects a chosen Language Unit into a Verified Sentence slot, returning
 * surface Korean, eojeols with morpheme segments, and literal/natural English tokens.
 */
function realizeSlot(slot, chosenUnit, realizeOptions = {}) {
	const units = getUnitsArray();
	const activeUnit = chosenUnit || (typeof slot.originalUnitId === 'number' ? units[slot.originalUnitId] : null);
	const isOrig = Boolean(activeUnit && activeUnit[DATA_SCHEMA.Id] === slot.originalUnitId);

	const inf = slot.inflection || { prefix: "", stemForm: K.NOMINAL, suffix: slot.morphTemplate || "" };
	let surfaceKo = "";

	if (isLockedSlot(slot)) {
		surfaceKo = slot.originalSurface || (activeUnit ? activeUnit[DATA_SCHEMA.Korean] : "");
	} else if (activeUnit) {
		const ko = activeUnit[DATA_SCHEMA.Korean];
		if (slot.pos === K.ACTION_VERB || slot.pos === K.DESCRIPTIVE_VERB) {
			surfaceKo = realizeVerbInflection(activeUnit, inf, isOrig, slot.originalSurface);
		} else if (inf.stemForm === K.COPULA) {
			surfaceKo = isOrig && slot.originalSurface
				? slot.originalSurface
				: realizeCopulaMorph(ko, sanitizeParticleMorph(inf.suffix || slot.morphTemplate));
		} else if (inf.stemForm === K.NUMERIC) {
			if (isOrig && slot.originalSurface) {
				surfaceKo = slot.originalSurface;
			} else {
				const numPre = activeUnit[DATA_SCHEMA.PartofSpeech] === K.NUMBER ? "" : (inf.prefix || "1");
				const cleanSuffix = sanitizeParticleMorph(inf.suffix || "");
				const rawNominal = numPre + ko + cleanSuffix;
				surfaceKo = resolvePureMorphology(rawNominal, state);
			}
		} else {
			if (isOrig && slot.originalSurface) {
				surfaceKo = slot.originalSurface;
			} else {
				// Pronoun clitic allomorphy (저/제, 나/내, 너/네, 누구/누가)
				const mTemp = sanitizeParticleMorph(inf.suffix || slot.morphTemplate || "");
				const gTexts = (slot.grammar || []).map(g => sanitizeParticleMorph(g.text || "")).join(" ");
				const isTopic = mTemp.includes("은/는") || HC.VERIFIED_REALIZE_SLOT_GTEXTS_INCLUDES_ONE_OF_3.some(_w => gTexts.includes(_w));
				const isSubject = mTemp.includes("이/가") || HC.VERIFIED_REALIZE_SLOT_GTEXTS_INCLUDES_ONE_OF_2.some(_w => gTexts.includes(_w));
				const isObject = mTemp.includes("을/를") || HC.VERIFIED_REALIZE_SLOT_GTEXTS_INCLUDES_ONE_OF.some(_w => gTexts.includes(_w));

				if ((HC.VERIFIED_REALIZE_SLOT_KO_ONE_OF_9.includes(ko)) && isTopic) {
					surfaceKo = "저는";
				} else if ((HC.VERIFIED_REALIZE_SLOT_KO_ONE_OF_8.includes(ko)) && isSubject) {
					surfaceKo = "제가";
				} else if ((HC.VERIFIED_REALIZE_SLOT_KO_ONE_OF_7.includes(ko)) && isObject) {
					surfaceKo = "저를";
				} else if ((HC.VERIFIED_REALIZE_SLOT_KO_ONE_OF_6.includes(ko)) && isTopic) {
					surfaceKo = "나는";
				} else if ((HC.VERIFIED_REALIZE_SLOT_KO_ONE_OF_5.includes(ko)) && isSubject) {
					surfaceKo = "내가";
				} else if ((HC.VERIFIED_REALIZE_SLOT_KO_ONE_OF_4.includes(ko)) && isObject) {
					surfaceKo = "나를";
				} else if ((HC.VERIFIED_REALIZE_SLOT_KO_ONE_OF_3.includes(ko)) && isTopic) {
					surfaceKo = "너는";
				} else if ((HC.VERIFIED_REALIZE_SLOT_KO_ONE_OF_2.includes(ko)) && isSubject) {
					surfaceKo = "네가";
				} else if ((HC.VERIFIED_REALIZE_SLOT_KO_ONE_OF.includes(ko)) && isObject) {
					surfaceKo = "너를";
				} else if (ko === "누구" && isSubject) {
					surfaceKo = "누가";
				} else if (ko === "누가" && isSubject) {
					surfaceKo = "누가";
				} else {
					const rawNominal = ko + mTemp;
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

	const gLitSuffix = getGrammarLiteralSuffix(slot.grammar, activeUnit, surfaceKo, { isQuestion: realizeOptions.punctuation === "?" });
	let litStem = "";
	if (activeUnit) {
		litStem = getUnitLiteralStem(activeUnit);
		if (activeUnit[DATA_SCHEMA.Id] === 1403) {
			litStem = "after";
		} else if (activeUnit[DATA_SCHEMA.Id] === 915 && (realizeOptions.templateId === "vs_317" || realizeOptions.templateId === "vs_294")) {
			litStem = "make(call)";
		} else if (activeUnit[DATA_SCHEMA.Id] === 954 && realizeOptions.templateId === "vs_81") {
			litStem = "dip";
		} else if (activeUnit[DATA_SCHEMA.Id] === 710) {
			if (surfaceKo.includes("후")) litStem = "after";
			else if (surfaceKo.includes("전")) litStem = "before";
		}
		if (inf.stemForm !== K.NUMERIC && !/^\d/.test(activeUnit[DATA_SCHEMA.Korean] || "")) {
			const numUnitMatch = surfaceKo.match(/^(\d[\d,.-]*)\s*(분|시간|일|개월|달|주|년)(?=\s|[가-힣]|$)/);
			const UNIT_EN_MAP = { "분": "minute", "시간": "hour", "일": "day", "개월": "month", "달": "month", "주": "week", "년": "year" };
			const numManMatch = surfaceKo.match(/^(\d[\d,.]*)\s*만(?:\s*(?:원|$))?/);
			const numSimpleMatch = surfaceKo.match(/^(\d[\d,.-]*%?)/);
			if (numUnitMatch && activeUnit[DATA_SCHEMA.Korean] !== numUnitMatch[2] && !litStem.includes(UNIT_EN_MAP[numUnitMatch[2]])) {
				litStem = `${numUnitMatch[1]}-${UNIT_EN_MAP[numUnitMatch[2]]}-${litStem}`;
			} else if (numManMatch && activeUnit[DATA_SCHEMA.Korean] === "원" && !litStem.includes(numManMatch[1])) {
				const fullNum = Number(numManMatch[1].replace(/,/g, "")) * 10000;
				if (!Number.isNaN(fullNum)) litStem = `${fullNum.toLocaleString("en-US")}-${litStem}`;
			} else if (numSimpleMatch && !litStem.startsWith(numSimpleMatch[1])) {
				litStem = `${numSimpleMatch[1]}-${litStem}`;
			}
		}
	} else {
		const hasGram = Boolean(gLitSuffix);
		const FIXED_SURFACE_LITERAL = {
			"초대": "invitation",
			"초대를": hasGram ? "invitation" : "invitation-[obj]",
			"연세": "Yonsei",
			"연세대학교": "Yonsei-University",
			"반": "class",
			"반에서": hasGram ? "class" : "class-at",
			"2반": "Class-2",
			"알": "pill",
			"번호": "number",
			"번호를": hasGram ? "number" : "number-[obj]",
			"발표": "presentation",
			"발표가": hasGram ? "presentation" : "presentation-[subj]",
			"20-30대": "20s-30s",
			"20-30대와": hasGram ? "20s-30s" : "20s-30s-with/and",
			"20-30대는": hasGram ? "20s-30s" : "20s-30s-[topic]",
			"70대": "70s",
			"제목": "title",
			"찬": "cold",
			"날씨": K.WEATHER,
			"언제나": "always",
			"만에": "after",
			"한국 친구도 별로 없고 모르는 것도": "I have few Korean friends and things I don't know too, and"
		};
		litStem = FIXED_SURFACE_LITERAL[surfaceKo] || surfaceKo;
	}
	const COMPOUND_PREFIX_EN = HC.VERIFIED_REALIZE_SLOT_COMPOUND_PREFIX_EN;
	const prefixLit = inf.prefix
		? ((inf.stemForm === K.NUMERIC && activeUnit && activeUnit[DATA_SCHEMA.PartofSpeech] === K.NUMBER)
			? ""
			: (inf.stemForm === K.NUMERIC ? inf.prefix : (COMPOUND_PREFIX_EN[inf.prefix] || "")))
		: "";
	const surfaceEnLit = `${prefixLit && !litStem.startsWith(prefixLit + "-") ? prefixLit + "-" : ""}${litStem}${gLitSuffix}`;
	const natPhrase = activeUnit ? getUnitNaturalPhrase(activeUnit) : "";

	if (words.length <= 1) {
		const w = words[0] || surfaceKo;
		let segs;
		if (inf.stemForm === K.FIXED_GRAMMAR) {
			segs = [makeSegment(w, activeUnit || primaryGrammarUnit, K.GRAMMAR, K.GRAMMAR)];
		} else if (slot.pos === K.ACTION_VERB || slot.pos === K.DESCRIPTIVE_VERB) {
			segs = splitSingleVerbWordSegments(w, activeUnit, primaryGrammarUnit, K.PREDICATE);
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
			role: (slot.pos === K.ACTION_VERB || slot.pos === K.DESCRIPTIVE_VERB) ? K.PREDICATE : "constituent",
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
					segs = splitSingleVerbWordSegments(words[wIdx], activeUnit, grammarUnits[0] || primaryGrammarUnit, K.PREDICATE);
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
				role: (slot.pos === K.ACTION_VERB || slot.pos === K.DESCRIPTIVE_VERB) ? K.PREDICATE : "constituent",
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

/**
 * Picks a slot filler. Optional steering (both leave every candidate possible):
 *   options.preferUnitIds (Set of unit ids): when any candidate is in it, only those are considered.
 *   options.slotBias ({ reject(unit) -> bool, retries = 2 }): a pick that `reject` flags is redrawn up to `retries` times.
 */
function pickCandidateFromPool(candidates, options = {}, slotIndex = 0) {
	const first = pickCandidateOnce(candidates, options, slotIndex, 0);
	const bias = options && options.slotBias;
	if (!first || !bias || typeof bias.reject !== 'function') return first;
	let chosen = first;
	const retries = typeof bias.retries === 'number' ? bias.retries : 2;
	for (let a = 1; a <= retries && bias.reject(chosen); a++) chosen = pickCandidateOnce(candidates, options, slotIndex, a) || chosen;
	return chosen;
}

function pickCandidateOnce(candidates, options = {}, slotIndex = 0, attempt = 0) {
	if (!candidates || candidates.length === 0) return null;
	if (candidates.length === 1) return candidates[0];

	let pool = candidates;
	if (options.preferUnitIds instanceof Set) {
		const preferred = candidates.filter(u => options.preferUnitIds.has(u[DATA_SCHEMA.Id]));
		if (preferred.length > 0) pool = preferred;
	}
	// A redraw (slotBias retry, attempt > 0) ignores the difficulty tier: in a small unlocked set the easiest tier is often a single
	// unit, and redrawing inside it returned the same word on every visit of a card (밑에 ... 있습니다; found by tools/fc2_sim.js).
	const tier = attempt > 0 ? null : (options.difficultyTier || options.tier);

	if (tier === 'easiest') {
		// Tier 1: Easiest vocabulary (lowest PriorityScore available)
		let minScore = 999;
		for (let i = 0; i < candidates.length; i++) {
			const sc = candidates[i][DATA_SCHEMA.PriorityScore] || 3;
			if (sc < minScore) minScore = sc;
		}
		const easyGroup = candidates.filter(u => (u[DATA_SCHEMA.PriorityScore] || 3) <= minScore + 1);   // within one level: one word was too few
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
		const base = (Number(options.seedOffset) || 0) + (Number(options.variationIndex) || 0) * 7 + slotIndex * 13 + attempt * 31;
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
	const speechAct = isQuestion ? K.INTERROGATIVE : K.DECLARATIVE;

	const lastSlot = slotChoices[slotChoices.length - 1];
	let overallPoliteness = K.POLITE;
	let overallTense = K.PRESENT;
	let overallPolarity = K.AFFIRMATIVE;

	if (lastSlot) {
		const surf = lastSlot.surfaceKo || "";
		if (HC.VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_SURF_INCLUDES_ONE_OF_2.some(_w => surf.includes(_w))) {
			overallPoliteness = K.FORMAL_HIGH;
		} else if (surf.endsWith("다") && !HC.VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_SURF_ENDSWITH_NONE_OF.some(_w => surf.endsWith(_w))) {
			overallPoliteness = K.PLAIN;
		}
		if (/(?:았|었|였)(?:다|습니다|어요|네요)/.test(surf)) {
			overallTense = K.PAST;
		} else if (/(?:ㄹ|을)\s*거/.test(surf) || /(?:겠)(?:다|습니다|어요)/.test(surf)) {
			overallTense = K.FUTURE;
		}
	}

	for (const sc of slotChoices) {
		const surf = sc.surfaceKo || "";
		if (HC.VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_SURF_ONE_OF.includes(surf) || HC.VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_SURF_INCLUDES_ONE_OF.some(_w => surf.includes(_w))) {
			overallPolarity = K.NEGATIVE;
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
				return gPos === "Adverbial Suffix" || HC.VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_GTEXT_ONE_OF_2.includes(gText);
			});

		const isAdnominal = !isAdverbial && (category === K.ADNOMINAL_MODIFIER ||
			(templateSlot.inflection && templateSlot.inflection.stemForm === "adnominal" && category !== K.AUXILIARY_CONSTRUCTION) ||
			grammarList.some(g => {
				const gPos = Array.isArray(g) ? g[2] : g.pos;
				return gPos === "Adnominal Ending";
			}));

		const isVerb = (pos === K.ACTION_VERB || pos === K.DESCRIPTIVE_VERB) && !isAdnominal && !isAdverbial;
		const isCopula = category.includes(K.COPULA) ||
			grammarList.some(g => {
				const gId = Array.isArray(g) ? g[0] : g.unitId;
				const gPos = Array.isArray(g) ? g[2] : g.pos;
				const gText = Array.isArray(g) ? g[1] : g.text;
				return gId === 56 || gPos === "Copula" || HC.VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_GTEXT_ONE_OF.includes(gText);
			});

		if (isVerb) {
			currentPredicate = {
				role: K.PREDICATE,
				predType: pos === K.DESCRIPTIVE_VERB ? K.DESCRIPTIVE : K.ACTION,
				verbUnit: unit,
				endingUnit: grammarList.length > 0 ? grammarList[grammarList.length - 1].unit : null,
				isVariedSlot: sc.isVariedSlot,
				surfaceKo: surf,
				tense: /(?:았|었|였)/.test(surf) ? K.PAST : overallTense,
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
				role: K.PREDICATE,
				predType: K.COPULA,
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
				role: K.ADNOMINAL_MODIFIER,
				category: K.ADNOMINAL_MODIFIER,
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
			const isTopicParticle = mTemp.includes("은/는") || category.includes(K.TOPIC) ||
				grammarList.some(g => g.unitId === 36 || (g.pos === "Particle" && (HC.VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_G_TEXT_ONE_OF_5.includes(g.text))));
			const isSubjectParticle = mTemp.includes("이/가") || category.includes(K.SUBJECT) ||
				grammarList.some(g => g.unitId === 96 || (g.pos === "Particle" && (HC.VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_G_TEXT_ONE_OF_4.includes(g.text))));
			const isObjectParticle = mTemp.includes("을/를") || category.includes(K.OBJECT) ||
				grammarList.some(g => g.unitId === 173 || (g.pos === "Particle" && (HC.VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_G_TEXT_ONE_OF_3.includes(g.text))));
			const isLocDyn = mTemp.includes("에서") || grammarList.some(g => g.unitId === 199 || (g.pos === "Particle" && g.text === "에서"));
			const isLocStat = (mTemp === "에" || grammarList.some(g => g.unitId === 132 || (g.pos === "Particle" && g.text === "에"))) && !isLocDyn;
			const isDir = mTemp.includes("로") || grammarList.some(g => g.unitId === 1241 || (g.pos === "Particle" && (HC.VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_G_TEXT_ONE_OF_2.includes(g.text))));
			const isRecip = grammarList.some(g => g.pos === "Particle" && (HC.VERIFIED_RECOMPOSE_AST_FROM_VERIFIED_SENTENCE_G_TEXT_ONE_OF.includes(g.text)));

			if (isTopicParticle) {
				role = K.TOPIC;
				particleType = K.TOPIC;
			} else if (isSubjectParticle) {
				role = K.SUBJECT;
				particleType = K.SUBJECT;
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
				role = K.DIRECTION;
				particleType = K.DIRECTION;
			} else if (isRecip) {
				role = K.RECIPIENT;
				particleType = K.RECIPIENT;
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
			predicate: currentPredicate || { role: K.PREDICATE, predType: "unspecified", surfaceKo: "" }
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

		// 제 cannot attach particles (*제에게, *제도, *제는, *제를 -> 저에게/저도/저는/저를)
		if (ko === "제" && (sc.isVariedSlot ? surf !== "제" : /^제(?:는|은|를|을|에게|한테|도|부터|만|까지|와|과|랑)/.test(surf))) {
			errors.push({
				code: "ILLEGAL_PRONOUN_PARTICLE_CONCORD",
				message: `Possessive pronoun '제' cannot attach particle ('${surf}'). Must be '저'.`
			});
		}
		// 내 cannot attach 는 (*내는 -> 나는) or 를 (*내를 -> 나를) or dative/focus particles
		if (ko === "내" && _hasTag(u, "pronoun_1st", "possessive") && (/^내(?:는|은|를|을|에게|한테|도|부터|만|까지)/.test(surf))) {
			errors.push({
				code: "ILLEGAL_PRONOUN_PARTICLE_CONCORD",
				message: `Possessive pronoun '내' cannot attach particle ('${surf}'). Must be '나'.`
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
		// no_time_particle temporal nouns (내일, 오늘, 어제) cannot attach -에 (*내일에는 -> 내일은)
		if ((_hasTag(u, "no_time_particle") || parseSemanticData(u).no_time_particle) && /(?:에|에는|에서)$/.test(surf)) {
			errors.push({
				code: "ILLEGAL_TEMPORAL_PARTICLE_CONCORD",
				message: `Deictic time word '${ko}' cannot attach '-에' ('${surf}').`
			});
		}
		// 있다/없다 stems cannot take -(으)ㄴ present adnominal (*있은, *없은, *맛있은 -> 있는, 없는, 맛있는)
		if ((HC.VERIFIED_VALIDATE_VERIFIED_SENTENCE_KO_ENDSWITH_ONE_OF.some(_w => ko.endsWith(_w))) && /[있없]은(?:데|가|지)?$/.test(surf)) {
			errors.push({
				code: "ILLEGAL_ADNOMINAL_CONJUGATION",
				message: `Stem '${ko}' must take '-는' instead of '-(으)ㄴ' ('${surf}').`
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
			const topicCount = constituents.filter(c => c.particleType === K.TOPIC || c.role === K.TOPIC).length;
			if (topicCount > 1 && ast.clauses.length === 1) {
				errors.push({
					code: "REDUNDANT_TOPIC_MARKERS",
					message: `Single clause contains ${topicCount} topic markers, causing semantic ambiguity in: "${realized.ko}"`
				});
			}

			// B. Verb-Object Collocation Check (direct 을/를 objects AND focus-marked objects like 고기는/채소만/약이라도/빵부터)
			const objCandidates = constituents.filter(c => c.role === K.OBJECT || c.particleType === K.OBJECT);
			if (objCandidates.length === 0) {
				const focusObj = constituents.find(c => {
					const u = c.nounUnit || c.unit;
					const s = c.surfaceKo || "";
					if (!u) return false;
					if (_hasTag(u, K.PERSON, K.TIME, K.PLACE, "pronoun_1st", "pronoun_2nd", "pronoun_3rd", "temporal", K.BOUND_NOUN)) return false;
					return /(?:은|는|만|도|이라도|라도|까지|부터)$/.test(s);
				});
				if (focusObj) objCandidates.push(focusObj);
			}
			for (const objCon of objCandidates) {
				const objIndex = constituents.indexOf(objCon);
				const governingAdnominal = constituents.find((c, idx) =>
					idx > objIndex &&
					(c.role === K.ADNOMINAL_MODIFIER || c.category === K.ADNOMINAL_MODIFIER || (c.inflection && c.inflection.stemForm === "adnominal")) &&
					c.unit && (c.unit[DATA_SCHEMA.PartofSpeech] === K.ACTION_VERB || _hasTag(c.unit, "transitive", K.TRANSITIVE_GENERAL))
				);
				const effectiveActionVerb = governingAdnominal
					? governingAdnominal.unit
					: ((verbUnit && pred.predType === K.ACTION) ? verbUnit : null);
				if (effectiveActionVerb && typeof getNounCandidatesForVerb === 'function') {
					const targetVerb = effectiveActionVerb;
					const objUnit = objCon.nounUnit || objCon.unit;
					if (objUnit && (objCon.isVariedSlot || (!governingAdnominal && pred.isVariedSlot) || (governingAdnominal && governingAdnominal.isVariedSlot))) {
						const vKo = targetVerb ? (targetVerb[DATA_SCHEMA.Korean] || "") : "";
						const targetSemData = parseSemanticData(targetVerb);
						const isIntransTarget = _hasTag(targetVerb, K.INTRANSITIVE, K.INTRANSITIVE_GENERAL, K.INTRANSITIVE_MOTION, K.INTRANSITIVE_PLACE, "intransitive_state", "intransitive_food", "intransitive_person") ||
							(targetSemData && targetSemData.type === K.INTRANSITIVE);
						const isPersonDativeOnly = _hasTag(targetVerb, "dative_humble", K.DATIVE_PERSON) ||
							(targetSemData && targetSemData.req === K.PERSON && !_hasTag(objUnit, K.PERSON, K.FAMILY));
						// An intransitive verb with a collocation_filter takes exactly the objects the filter names
						// (여행을 가다, 영어를 잘하다); the filter check below decides.
						const intransWithObjectFilter = isIntransTarget && Boolean(targetSemData && targetSemData.collocation_filter);
						if ((isIntransTarget && !intransWithObjectFilter) || isPersonDativeOnly) {
							errors.push({
								code: "VERB_OBJECT_COLLOCATION_MISMATCH",
								message: `Intransitive or person-only verb '${vKo}' cannot take object '${objUnit[DATA_SCHEMA.Korean] || ""}' in: "${realized.ko}"`
							});
							continue;
						}
						const isButeoSlot = /(?:부터)$/.test(objCon.surfaceKo || "");
						const BUTEO_INCOMPATIBLE_VERBS = HC.VERIFIED_VALIDATE_VERIFIED_SENTENCE_BUTEO_INCOMPATIBLE_VERBS;
						const isButeoIncompatibleVerb = _hasTag(targetVerb, K.LOCATIVE_STATIC, "involuntary", "placement_transitive") || BUTEO_INCOMPATIBLE_VERBS.has(vKo);
						if (isButeoSlot && isButeoIncompatibleVerb) {
							errors.push({
								code: "VERB_OBJECT_COLLOCATION_MISMATCH",
								message: `Sequential '-부터' object cannot pair with '${vKo}' without goal/volition in: "${realized.ko}"`
							});
							continue;
						}
						const STRICT_COLLOCATION_VERBS = HC.VERIFIED_VALIDATE_VERIFIED_SENTENCE_STRICT_COLLOCATION_VERBS;
						const targetTags = targetVerb[DATA_SCHEMA.SemanticTags];
						const hasTransitiveSubtag = targetTags && Array.from(targetTags).some(t => t.startsWith("transitive_") && t !== K.TRANSITIVE_GENERAL);
						const hasCollocationRestrictions = STRICT_COLLOCATION_VERBS.has(vKo) ||
							hasTransitiveSubtag ||
							Boolean(targetSemData && targetSemData.collocation_filter) ||
							Boolean(targetSemData && targetSemData.req && targetSemData.req !== K.OBJECT && targetSemData.req !== "any");
						if (targetVerb && hasCollocationRestrictions) {
							const validCands = getNounCandidatesForVerb(targetVerb);
							if (Array.isArray(validCands) && validCands.length > 0 && !validCands.some(n => n[DATA_SCHEMA.Id] === objUnit[DATA_SCHEMA.Id])) {
								const objKo = objUnit[DATA_SCHEMA.Korean] || "";
								const hasGoverningAdnominal = constituents.some(c =>
									(c.role === K.ADNOMINAL_MODIFIER || c.category === K.ADNOMINAL_MODIFIER || (c.inflection && c.inflection.stemForm === "adnominal"))
								);
								const NON_GENERIC_GEOT_VERBS = HC.VERIFIED_VALIDATE_VERIFIED_SENTENCE_NON_GENERIC_GEOT_VERBS;
								if (objKo === "것" && hasGoverningAdnominal && !NON_GENERIC_GEOT_VERBS.has(vKo)) {
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
			}

			// B2. Elliptical Strict-Collocation Verb Check (e.g., prior clause "돈을 ... *씻을 수 있습니다", or objectless *앞에서 사귑시다)
			if (verbUnit && pred.predType === K.ACTION && pred.isVariedSlot && objCandidates.length === 0) {
				// object_elidable (data tag): the person object is routinely dropped (빨리 만나고 싶어요, 우리 사귀어요).
				if (_hasTag(verbUnit, "transitive_person") && !_hasTag(verbUnit, "object_elidable") && !constituents.some(c => c.role === "companion" || c.role === K.RECIPIENT)) {
					errors.push({
						code: "MISSING_TRANSITIVE_PERSON_OBJECT",
						message: `Verb '${verbKo}' requires an animate object or companion in: "${realized.ko}"`
					});
				} else if (typeof getNounCandidatesForVerb === 'function') {
					const targetSemData = parseSemanticData(verbUnit);
					if (targetSemData && targetSemData.collocation_filter) {
						const priorClauseObjects = [];
						for (const cl of ast.clauses) {
							if (cl === clause) continue;
							for (const con of (cl.constituents || [])) {
								if (con.role !== K.OBJECT && con.particleType !== K.OBJECT) continue;
								const nu = con.nounUnit || con.unit;
								if (nu && (nu[DATA_SCHEMA.PartofSpeech] === K.NOUN || nu[DATA_SCHEMA.PartofSpeech] === K.PRONOUN)) {
									priorClauseObjects.push(nu);
								}
							}
						}
						if (priorClauseObjects.length > 0) {
							const validCands = getNounCandidatesForVerb(verbUnit);
							if (Array.isArray(validCands) && validCands.length > 0 && !priorClauseObjects.some(n => validCands.some(c => c[DATA_SCHEMA.Id] === n[DATA_SCHEMA.Id]))) {
								errors.push({
									code: "ELLIPTICAL_OBJECT_COLLOCATION_MISMATCH",
									message: `Strict verb '${verbKo}' does not collocate with elided sentence object in: "${realized.ko}"`
								});
							}
						}
					}
				}
			}

			// B3. Classifier-Verb Collocation Check (e.g., *열세 벌밖에 안 배웠어요)
			if (verbUnit && pred.predType === K.ACTION && pred.isVariedSlot) {
				const CLOTHING_COUNT_VERBS = HC.VERIFIED_VALIDATE_VERIFIED_SENTENCE_CLOTHING_COUNT_VERBS;
				const VEHICLE_COUNT_VERBS = HC.VERIFIED_VALIDATE_VERIFIED_SENTENCE_VEHICLE_COUNT_VERBS;
				for (const con of constituents) {
					const cu = con.nounUnit || con.unit;
					if (!cu) continue;
					const cuKo = cu[DATA_SCHEMA.Korean] || "";
					if ((cu[DATA_SCHEMA.Id] === 568 || cuKo === "벌") && !CLOTHING_COUNT_VERBS.has(verbKo)) {
						errors.push({
							code: "CLASSIFIER_VERB_COLLOCATION_MISMATCH",
							message: `Verb '${verbKo}' does not collocate with clothing classifier '벌' in: "${realized.ko}"`
						});
					} else if ((cu[DATA_SCHEMA.Id] === 1714 || cuKo === "대") && !VEHICLE_COUNT_VERBS.has(verbKo)) {
						errors.push({
							code: "CLASSIFIER_VERB_COLLOCATION_MISMATCH",
							message: `Verb '${verbKo}' does not collocate with vehicle/device classifier '대' in: "${realized.ko}"`
						});
					}
				}
			}

			// C-Weather. Weather noun cannot pair with motion verb '가다' (*비가 가다)
			const weatherSubjCon = constituents.find(c => c.role === K.SUBJECT || c.role === K.TOPIC);
			if (weatherSubjCon && verbUnit && (weatherSubjCon.isVariedSlot || pred.isVariedSlot) && verbKo === "가다") {
				const subjUnitW = weatherSubjCon.nounUnit || weatherSubjCon.unit;
				const subjKoW = subjUnitW ? (subjUnitW[DATA_SCHEMA.Korean] || "") : "";
				const WEATHER_PHENOMENON_NOUNS = HC.VERIFIED_VALIDATE_VERIFIED_SENTENCE_WEATHER_PHENOMENON_NOUNS;
				if (subjUnitW && (_hasTag(subjUnitW, K.WEATHER, "meteorological_metric") || WEATHER_PHENOMENON_NOUNS.has(subjKoW))) {
					errors.push({
						code: "WEATHER_VERB_MISMATCH",
						message: `Weather noun '${subjKoW}' cannot pair with motion verb '가다' in: "${realized.ko}"`
					});
				}
			}

			// C. Descriptive Verb Subject Collocation Check
			const subjCons = constituents.filter(c => c.role === K.SUBJECT || c.role === K.TOPIC);
			const subjCon = subjCons.length > 0 ? subjCons[subjCons.length - 1] : null;
			if (subjCon && verbUnit && (pred.predType === K.DESCRIPTIVE || verbUnit[DATA_SCHEMA.PartofSpeech] === K.DESCRIPTIVE_VERB) && typeof getSubjectCandidatesForDescriptiveVerb === 'function') {
				const subjUnit = subjCon.nounUnit || subjCon.unit;
				if (subjUnit && (subjCon.isVariedSlot || pred.isVariedSlot)) {
					const vKo = verbUnit[DATA_SCHEMA.Korean] || "";
					const STRICT_DESCRIPTIVE_VERBS = HC.VERIFIED_VALIDATE_VERIFIED_SENTENCE_STRICT_DESCRIPTIVE_VERBS;
					const isHumanSubj = _hasTag(subjUnit, K.PERSON, K.FAMILY, "pronoun_1st", "pronoun_2nd", "pronoun_3rd");
					const isWeatherOrTaste = _hasTag(verbUnit, K.WEATHER, "taste", "descriptive_weather", "descriptive_taste", "sensory_weather_taste");

					if (isHumanSubj && isWeatherOrTaste) {
						const subjKo = subjUnit[DATA_SCHEMA.Korean] || "";
						errors.push({
							code: "DESCRIPTIVE_VERB_SUBJECT_COLLOCATION_MISMATCH",
							message: `Weather/taste adjective '${vKo}' cannot take human subject '${subjKo}' in: "${realized.ko}"`
						});
					} else if (STRICT_DESCRIPTIVE_VERBS.has(vKo) || _hasTag(verbUnit, "taste", "spatial_dimension", K.DESCRIPTIVE_PERSON) || Boolean(parseSemanticData(verbUnit).collocation_filter)) {
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

			// C2. Adnominal Modifier -> Head Noun Collocation Check (e.g. *건강한 볼펜, *먹던 커피, *만지던 커피)
			for (let i = 0; i < constituents.length; i++) {
				const cCurrent = constituents[i];
				const cNext = i + 1 < constituents.length ? constituents[i + 1] : null;
				if (cCurrent && (cCurrent.role === K.ADNOMINAL_MODIFIER || cCurrent.category === K.ADNOMINAL_MODIFIER) && cCurrent.unit) {
					const modVerb = cCurrent.unit;
					const modKo = modVerb[DATA_SCHEMA.Korean] || "";
					const modPos = modVerb[DATA_SCHEMA.PartofSpeech];
					const headNoun = cNext
						? (cNext.nounUnit || cNext.unit)
						: ((pred.predType === K.COPULA && (pred.copulaNounUnit || pred.nounUnit)) ? (pred.copulaNounUnit || pred.nounUnit) : null);
					const headKo = headNoun ? (headNoun[DATA_SCHEMA.Korean] || "") : "";
					if (!headNoun) continue;

					if (_hasTag(headNoun, K.POSITION) && _hasTag(modVerb, "transitive", K.TRANSITIVE_GENERAL)) {
						errors.push({
							code: "INVALID_ADNOMINAL_POSITION_MODIFICATION",
							message: `Transitive verb '${modKo}' cannot adnominally modify relational position noun '${headKo}' in: "${realized.ko}"`
						});
						continue;
					}

					if (cCurrent.isVariedSlot || (cNext && cNext.isVariedSlot) || (!cNext && pred.isVariedSlot)) {
						if (modPos === K.DESCRIPTIVE_VERB && _hasTag(modVerb, "color", "taste", K.WEATHER, "temperature", "descriptive_weather", "descriptive_taste", "descriptive_appearance") && _hasTag(headNoun, K.ABSTRACT, K.CONCEPT, K.ACADEMIC, K.ACTIVITY, "method")) {
							errors.push({
								code: "ADNOMINAL_DESCRIPTIVE_COLLOCATION_MISMATCH",
								message: `Sensory/appearance modifier '${modKo}' cannot modify abstract/method noun '${headKo}' in: "${realized.ko}"`
							});
							continue;
						}
						const GENERIC_REL_HEADS = HC.VERIFIED_VALIDATE_VERIFIED_SENTENCE_GENERIC_REL_HEADS;
						const isGenericRelHead = _hasTag(headNoun, K.BOUND_NOUN, K.TIME) || GENERIC_REL_HEADS.has(headKo);
						if (!isGenericRelHead) {
							if (modPos === K.DESCRIPTIVE_VERB && typeof getSubjectCandidatesForDescriptiveVerb === 'function') {
								const modSd = parseSemanticData(modVerb);
								if (modSd.collocation_filter || _hasTag(modVerb, K.DESCRIPTIVE_PERSON, "taste", "spatial_dimension", K.WEATHER, "descriptive_weather", "descriptive_taste", "descriptive_food")) {
									const validSubjs = getSubjectCandidatesForDescriptiveVerb(modVerb);
									if (Array.isArray(validSubjs) && validSubjs.length > 0 && !validSubjs.some(n => n[DATA_SCHEMA.Id] === headNoun[DATA_SCHEMA.Id])) {
										errors.push({
											code: "ADNOMINAL_DESCRIPTIVE_COLLOCATION_MISMATCH",
											message: `Descriptive modifier '${modKo}' does not collocate with noun '${headKo}' in: "${realized.ko}"`
										});
									}
								}
							} else if (modPos === K.ACTION_VERB && typeof getNounCandidatesForVerb === 'function') {
								const hasLocalOvertObj = constituents.slice(0, i).some(c => c.role === K.OBJECT || c.particleType === K.OBJECT);
								const isConcretePlaceHead = _hasTag(headNoun, K.PLACE, K.FACILITY);
								if (!hasLocalOvertObj && !isConcretePlaceHead) {
									const modSd = parseSemanticData(modVerb);
									const modTags = modVerb[DATA_SCHEMA.SemanticTags];
									const hasModTransSubtag = modTags && Array.from(modTags).some(t => t.startsWith("transitive_") && t !== K.TRANSITIVE_GENERAL);
									const isRestrictedMod = Boolean(modSd.collocation_filter || (modSd.req && modSd.req !== K.OBJECT && modSd.req !== "any")) || hasModTransSubtag;
									if (isRestrictedMod) {
										const validObjs = getNounCandidatesForVerb(modVerb);
										if (Array.isArray(validObjs) && validObjs.length > 0 && !validObjs.some(n => n[DATA_SCHEMA.Id] === headNoun[DATA_SCHEMA.Id])) {
											errors.push({
												code: "ADNOMINAL_ACTION_COLLOCATION_MISMATCH",
												message: `Action modifier '${modKo}' does not collocate with head noun '${headKo}' in: "${realized.ko}"`
											});
										}
									} else if (_hasTag(headNoun, K.DRINK, K.FOOD, K.CLOTHING, K.WEARABLE) && !isConcretePlaceHead) {
										// Unconstrained generic verbs (하다, 정리하다, 만지다, 운전하다) cannot substitute into drink/food/clothing modifiers
										errors.push({
											code: "ADNOMINAL_ACTION_COLLOCATION_MISMATCH",
											message: `Generic modifier '${modKo}' cannot modify domain-specific noun '${headKo}' in: "${realized.ko}"`
										});
									}
								}
							}
						}
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
					const spatRes = validateSpatialConcord(verbUnit, locUnit, K.LOCATION);
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
			const pastDetCon = constituents.find(c => (c.unit && c.unit[DATA_SCHEMA.Korean] === "지난") || (c.determinerUnit && c.determinerUnit[DATA_SCHEMA.Korean] === "지난"));
			if (pastDetCon && (pred.speechAct === K.PROPOSITIVE || pred.speechAct === K.IMPERATIVE || (pred.tense || ast.tense) === K.FUTURE)) {
				errors.push({
					code: "TEMPORAL_CONCORD_MISMATCH",
					message: `Past modifier '지난' clashes with future/hortative clause in: "${realized.ko}"`
				});
			}

			// F. Adverb Concord Check
			if (verbUnit) {
				const advCons = constituents.filter(c => c.role === K.ADVERB);
				const isNegClause = (pred.polarity || ast.polarity) === K.NEGATIVE;
				const clauseTense = pred.tense || ast.tense;
				for (const advCon of advCons) {
					const advUnit = advCon.unit || advCon.nounUnit;
					if (!advUnit) continue;
					const advKo = advUnit[DATA_SCHEMA.Korean] || "";
					const advSd = parseSemanticData(advUnit);
					if (advCon.isVariedSlot && clauseTense && clauseTense !== K.PAST && (advSd.tense === K.PAST || _hasTag(advUnit, "temporal_past", K.PAST))) {
						errors.push({
							code: "ADVERB_CONCORD_MISMATCH",
							message: `Past-time adverb '${advKo}' requires past-tense clause (got '${clauseTense}') in: "${realized.ko}"`
						});
						continue;
					}
					if ((advCon.isVariedSlot || pred.isVariedSlot) && typeof canAdverbPrecede === 'function' && !canAdverbPrecede(advUnit, verbUnit, { isNegative: isNegClause, tense: clauseTense })) {
						errors.push({
							code: "ADVERB_CONCORD_MISMATCH",
							message: `Adverb '${advKo}' cannot modify '${verbKo}' in: "${realized.ko}"`
						});
					}
				}
			}
			if (typeof validateAdverbConcord === 'function') {
				const strAdvRes = validateAdverbConcord(realized.ko);
				if (strAdvRes && !strAdvRes.valid && Array.isArray(strAdvRes.errors)) {
					for (const msg of strAdvRes.errors) {
						errors.push({ code: "ADVERB_CONCORD_MISMATCH", message: msg });
					}
				}
			}

			// G. Honorific Predicate Concord Check
			const LEXICAL_HONORIFIC_PREDICATES = HC.VERIFIED_VALIDATE_VERIFIED_SENTENCE_LEXICAL_HONORIFIC_PREDICATES;
			const isLexicalHonVerb = Boolean(verbUnit && (LEXICAL_HONORIFIC_PREDICATES.has(verbKo) || _hasTag(verbUnit, "honorificVerb")));
			const subjConHon = constituents.find(c => c.role === K.SUBJECT || c.role === K.TOPIC);
			const subjUnitHon = subjConHon ? (subjConHon.nounUnit || subjConHon.unit) : null;
			const isElderSubj = subjUnitHon ? (
				(morphologyModule && typeof morphologyModule.isElderNoun === 'function' && morphologyModule.isElderNoun(subjUnitHon))
				|| _hasTag(subjUnitHon, K.ELDER_NOUN, K.HONORIFIC)
			) : false;
			if (verbUnit) {
				const hasHonInfixPred = pred.isVariedSlot && (isLexicalHonVerb || _hasTag(verbUnit, K.HONORIFIC));
				const isPlainClause = pred.politeness === "plain" || ast.politeness === "plain" || /(?:다|는다|ㄴ다)[.!?]?$/.test((pred.surfaceKo || "").trim());
				if (isLexicalHonVerb && subjUnitHon && (!isElderSubj || _hasTag(subjUnitHon, "body", "body_part", "bodyPart", "pronoun_1st"))) {
					errors.push({
						code: "HONORIFIC_CONCORD_MISMATCH",
						message: `Honorific predicate '${verbKo}' requires an elder person subject (got '${subjUnitHon[DATA_SCHEMA.Korean]}') in: "${realized.ko}"`
					});
				}
				if (hasHonInfixPred && isPlainClause && !isElderSubj) {
					errors.push({
						code: "HONORIFIC_PLAIN_STYLE_MISMATCH",
						message: `Honorific predicate '${verbKo}' cannot be used in plain '-다' style without an elder subject in: "${realized.ko}"`
					});
				}
			}
			if (isElderSubj && subjConHon && subjConHon.isVariedSlot && !isLexicalHonVerb) {
				const predSurf = pred.surfaceKo || "";
				const nextAdn = constituents.find((c, cIdx) => c && c.role === K.ADNOMINAL_MODIFIER && constituents.indexOf(subjConHon) < cIdx);
				const nextAdnSurf = nextAdn ? (nextAdn.surfaceKo || "") : "";
				const hasHonInfix = /시|세|셨|실|신/.test(predSurf) || (nextAdn && /시|세|셨|실|신/.test(nextAdnSurf));
				if (!hasHonInfix) {
					errors.push({
						code: "HONORIFIC_CONCORD_MISMATCH",
						message: `Honorific/elder subject '${subjUnitHon[DATA_SCHEMA.Korean]}' lacks honorific predicate/modifier '-(으)시-' in: "${realized.ko}"`
					});
				}
			}

			// H. Copula 물건이다 semantic compatibility check (rejects 돈/신문/잡지/음악/사람/장소/추상/증명서/티켓)
			const copulaNounCheckH = pred.predType === K.COPULA ? (pred.copulaNounUnit || pred.nounUnit) : null;
			if (copulaNounCheckH && copulaNounCheckH[DATA_SCHEMA.Korean] === "물건") {
				const subjConObj = constituents.find(c => c.role === K.SUBJECT || c.role === K.TOPIC);
				const subjObjUnit = subjConObj ? (subjConObj.nounUnit || subjConObj.unit) : null;
				if (subjObjUnit && (_hasTag(subjObjUnit, "currency_resource", "reading", "visual_media", "audio", "document", "credential", "ticket", K.PERSON, K.PLACE, K.TIME, K.ABSTRACT, K.CONCEPT, K.ACADEMIC) || subjObjUnit[DATA_SCHEMA.Korean] === "명함")) {
					errors.push({
						code: "COPULA_SEMANTIC_MISMATCH",
						message: `Noun '${subjObjUnit[DATA_SCHEMA.Korean]}' is not a physical household/utility item ('물건') in: "${realized.ko}"`
					});
				}
			}
		}
	}

	// I. Cross-clause Duplication checks (e.g., vs_20: "한국에서 ... 한국에", vs_209: "오전에는 ... 오전에는", vs_370: "치마 ... 치마로")
	const seenCountryIds = new Map();
	const seenTimeTopicIds = new Map();
	const seenGarmentIds = new Map();
	for (const clause of ast.clauses) {
		const cPred = clause.predicate;
		const isSwapPred = Boolean(cPred && cPred.verbUnit && _hasTag(cPred.verbUnit, "swap_verb"));
		for (const c of (clause.constituents || [])) {
			const cUnit = c.nounUnit || c.unit;
			if (!cUnit) continue;
			const cid = cUnit[DATA_SCHEMA.Id];
			if (_hasTag(cUnit, K.COUNTRY) && _hasTag(cUnit, K.PROPER_NOUN)) {
				const prev = seenCountryIds.get(cid);
				if (prev) {
					if (prev.isVariedSlot || c.isVariedSlot) {
						errors.push({
							code: "SAME_COUNTRY_DUPLICATION",
							message: `Duplicate country '${cUnit[DATA_SCHEMA.Korean]}' across clauses in: "${realized.ko}"`
						});
					}
				} else {
					seenCountryIds.set(cid, c);
				}
			}
			if (_hasTag(cUnit, K.TIME) && /(?:에는|은|는)$/.test(c.surfaceKo || "")) {
				const prevT = seenTimeTopicIds.get(cid);
				if (prevT && (prevT.isVariedSlot || c.isVariedSlot)) {
					errors.push({
						code: "SAME_TIME_DUPLICATION",
						message: `Duplicate time-topic '${cUnit[DATA_SCHEMA.Korean]}' across clauses in: "${realized.ko}"`
					});
				} else {
					seenTimeTopicIds.set(cid, c);
				}
			}
			if (_hasTag(cUnit, K.CLOTHING, K.VEHICLE || K.VEHICLE)) {
				const prevG = seenGarmentIds.get(cid);
				if (prevG && isSwapPred && (prevG.isVariedSlot || c.isVariedSlot)) {
					errors.push({
						code: "SAME_ITEM_SWAP_DUPLICATION",
						message: `Cannot switch '${cUnit[DATA_SCHEMA.Korean]}' to itself in: "${realized.ko}"`
					});
				} else {
					seenGarmentIds.set(cid, c);
				}
			}
		}
	}

	// J. Capability / Assent & Bidirectional Antonym Polarity Check
	if (Array.isArray(slotChoices)) {
		const units = getUnitsArray();
		const POSITIVE_CAPABILITY_GRAMMAR = new Set([522, 1736, 416, 816, 417, 1309]);
		const ANTONYM_PAIRS = HC.VERIFIED_VALIDATE_VERIFIED_SENTENCE_ANTONYM_PAIRS;
		for (const sc of slotChoices) {
			if (!sc || !sc.isVariedSlot || !sc.chosenUnit || typeof sc.originalUnitId !== 'number') continue;
			const origUnit = units[sc.originalUnitId];
			if (!origUnit) continue;
			const origKo = origUnit[DATA_SCHEMA.Korean] || "";
			const chosenKo = sc.chosenKo || (sc.chosenUnit[DATA_SCHEMA.Korean] || "");
			if (ANTONYM_PAIRS.get(origKo) === chosenKo) {
				errors.push({
					code: "SLOT_POLARITY_INVERSION_MISMATCH",
					message: `Antonym '${chosenKo}' cannot substitute for '${origKo}' without inverting clause coherence: "${realized.ko}"`
				});
				continue;
			}
			if (sc.pos !== K.ACTION_VERB && sc.pos !== K.DESCRIPTIVE_VERB) continue;
			const origSd = parseSemanticData(origUnit);
			const chosenSd = parseSemanticData(sc.chosenUnit);
			const origPol = origSd ? origSd.polarity : null;
			const chosenPol = chosenSd ? chosenSd.polarity : null;
			if ((chosenPol === -1 || chosenPol === K.NEGATIVE) && origPol !== -1 && origPol !== K.NEGATIVE) {
				const hasPositiveFrame = (sc.grammar || []).some(g => POSITIVE_CAPABILITY_GRAMMAR.has(g.unitId))
					|| (sc.slotIndex === 0 && origKo === "좋다");
				if (hasPositiveFrame) {
					errors.push({
						code: "SLOT_POLARITY_INVERSION_MISMATCH",
						message: `Negative/involuntary predicate '${chosenKo}' cannot replace positive/neutral '${origKo}' in capability/assent frame: "${realized.ko}"`
					});
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

// ---- Baseline waiver: the verified original sentence is attested Korean. An error the validator also raises
// for the unvaried original is a validator false alarm, so it never counts against a variation: only errors
// about what the variation changed can reject it. Signature = code + message with the sentence text removed
// (messages name the words involved, so an error about a newly chosen word never matches the baseline).
const _baselineErrorCache = new Map();
function _errorSignature(err, sentences) {
	let msg = String((err && err.message) || '');
	for (const sent of sentences) if (sent) msg = msg.split(sent).join('#');
	return `${err && err.code}|${msg}`;
}
function baselineErrorSignatures(template) {
	const key = `${template.id}\u0000${template.originalKo || ''}\u0000${template.slots.length}`;
	if (_baselineErrorCache.has(key)) return _baselineErrorCache.get(key);
	_baselineErrorCache.set(key, new Set());
	// The validator only checks varied slots, so the baseline is each variable slot "varied" to its own word.
	// (Baseline errors are a set per template: an error the original raises in one slot is waived in all.)
	const sigs = new Set();
	template.slots.forEach((slot, i) => {
		if (isLockedSlot(slot) || typeof slot.originalUnitId !== 'number') return;
		const res = generateSentenceFromTemplate(template, {
			varyMode: 'selected', unlockedSlots: [i], targetSlotIndex: i, targetUnitId: slot.originalUnitId, _baselineCheck: true
		});
		if (res && res.baseline && res.validation && !res.validation.valid) {
			for (const e of res.validation.errors) sigs.add(_errorSignature(e, [res.ko, res.koBare]));
		}
	});
	_baselineErrorCache.set(key, sigs);
	return sigs;
}
function waiveBaselineErrors(template, valResult, sentences) {
	const base = baselineErrorSignatures(template);
	if (!base.size) return;
	const kept = [];
	const waived = [];
	for (const e of valResult.errors) (base.has(_errorSignature(e, sentences)) ? waived : kept).push(e);
	if (!waived.length) return;
	valResult.errors = kept;
	valResult.waived = waived;
	valResult.valid = kept.length === 0;
}

/**
 * Generates a complete Korean sentence from a Verified Sentence template.
 */
function generateSentenceFromTemplate(templateOrId, options = {}) {
	if (options._baselineCheck) workStats.baselineChecks++; else workStats.templateAttempts++;   // baseline checks fill a per-template cache
	const template = (typeof templateOrId === 'string')
		? (getVerifiedSnapshot().byId.get(templateOrId) || null)
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
			const nonFixedIndex = template.slots.findIndex(s => !isLockedSlot(s));
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
					// In the slot's pool = eligible (covers allow rules and the original word); the tag test is kept for
					// callers that pass pool-narrowing options (onlyFromSet) that the target must bypass.
					const satisfiesSlotTags = slotPool.candidates.some(c => c[DATA_SCHEMA.Id] === targetUnitId)
						|| (reqTags.every(t => _hasTag(tUnit, t)) && slotRulesAllow(tUnit, slot)) || slot.originalUnitId === targetUnitId;
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

			const realizedSlot = realizeSlot(slot, chosenUnit, { punctuation: template.punctuation, templateId: template.id });
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
		if (options._baselineCheck) return { baseline: true, ko: koWithPunct, koBare, validation: valResult };
		if (!valResult.valid) waiveBaselineErrors(template, valResult, [koWithPunct, koBare]);

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
	templateEdits++;   // every template mutation ends here: cached availability is stale
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
// Difficulty depends only on the template and the unit data: memoized per template object (shared snapshot objects are stable).
const _difficultyMemo = new WeakMap();
function computeTemplateDifficulty(tpl) {
	if (!tpl) return { difficultyScore: 2.5, mandatoryElements: [], mandatoryElementsCount: 0 };
	const units = getUnitsArray(), hit = _difficultyMemo.get(tpl);
	if (hit && hit.units === units) return hit.value;
	workStats.difficultyComputes++;
	const value = computeTemplateDifficultyUncached(tpl);
	_difficultyMemo.set(tpl, { units, value });
	return value;
}

function computeTemplateDifficultyUncached(tpl) {
	const units = getUnitsArray();
	const mandatoryScores = [];
	const mandatoryElements = [];

	(tpl.slots || []).forEach((slot, sIdx) => {
		if (slot.inflection && slot.inflection.stemForm === K.FIXED_GRAMMAR) {
			const u = typeof slot.originalUnitId === 'number' ? units[slot.originalUnitId] : null;
			if (u) {
				const sc = u[DATA_SCHEMA.PriorityScore] || 1;
				mandatoryScores.push(sc);
				mandatoryElements.push({ type: K.FIXED_GRAMMAR, slotIndex: sIdx, unitId: u[DATA_SCHEMA.Id], ko: u[DATA_SCHEMA.Korean], score: sc });
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
	const all = getVerifiedTemplatesShared();
	if (_prioritizedTemplates && _prioritizedTemplates.of === all) return _prioritizedTemplates.list;
	const scored = all.map(tpl => ({
		template: tpl,
		...computeTemplateDifficulty(tpl)
	}));
	scored.sort((a, b) => a.difficultyScore - b.difficultyScore || a.id.localeCompare(b.id));
	_prioritizedTemplates = { of: all, list: scored };
	return scored;
}

function ensureRuntimeInitialized() {
	if (_runtimeInitialized) return;
	_runtimeInitialized = true;
	_loadStateFromLocalStorage();
	// The POS decks and the difficulty ranking are built on demand (getPosDecks / getPrioritizedVerifiedSentences, webapp decks view):
	// ranking every template up front cost ~250 ms before the first card.
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
	templateEdits++;
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
/**
 * Shared, READ-ONLY view of every template (hardcoded with overrides applied, then custom), rebuilt only when a template is edited
 * (templateEdits) or the hardcoded data is reloaded. Unedited hardcoded templates are the hydrated objects themselves, so the snapshot
 * costs nothing per call and its objects are stable keys for the per-template / per-slot caches below. Never mutate what it returns.
 */
let _snapshot = null;
function getVerifiedSnapshot() {
	ensureRuntimeInitialized();
	const hard = getHardcodedVerifiedArray();
	if (_snapshot && _snapshot.ver === templateEdits && _snapshot.hard === hard) return _snapshot;
	workStats.snapshotBuilds++;
	const list = [
		...hard.map(t => (_hardcodedOverrides.has(t.id) ? applyOverridesToHardcoded(t) : t)),
		..._customTemplates.map(t => ({ ...deepCloneTemplate(t), isHardcoded: false }))
	];
	const byId = new Map();
	for (const t of list) if (t && !byId.has(t.id)) byId.set(t.id, t);   // custom ids never collide with hardcoded ones; first wins like find()
	_snapshot = { ver: templateEdits, hard, list, byId };
	return _snapshot;
}

/** Read-only array of every template, shared between calls (see getVerifiedSnapshot). For editing, use getAllVerifiedSentences(). */
function getVerifiedTemplatesShared() {
	return getVerifiedSnapshot().list;
}

/** Every template as fresh, editable copies (editor and tool API). Hot paths use getVerifiedTemplatesShared() instead. */
function getAllVerifiedSentences() {
	return getVerifiedSnapshot().list.map(t => ({ ...deepCloneTemplate(t), isHardcoded: Boolean(t.isHardcoded) }));
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
	} else if (slot.inflection && slot.inflection.stemForm === K.FIXED_GRAMMAR) {
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
// Matches depend only on the unit and the templates: cached per unit until a template is edited (a new snapshot) or the unit data reloads.
let _matchCache = { of: null, units: null, byUnit: new Map() };
function findMatchingTemplatesForUnit(unitOrId) {
	const units = getUnitsArray();
	const targetUnit = resolveAliasUnit(Array.isArray(unitOrId)
		? unitOrId
		: (typeof unitOrId === 'number' ? units[unitOrId] : null), units);
	if (!targetUnit) return [];
	const allTemplates = getVerifiedTemplatesShared();
	if (_matchCache.of !== allTemplates || _matchCache.units !== units) _matchCache = { of: allTemplates, units, byUnit: new Map() };
	const key = targetUnit[DATA_SCHEMA.Id];
	let hit = _matchCache.byUnit.get(key);
	if (!hit) { workStats.matchComputes++; hit = matchTemplatesForUnit(targetUnit, units, allTemplates); _matchCache.byUnit.set(key, hit); }
	return hit.slice();   // callers may reorder the array; the match objects themselves are read-only
}

function matchTemplatesForUnit(targetUnit, units, allTemplates) {
	const targetId = targetUnit[DATA_SCHEMA.Id];
	const targetPos = targetUnit[DATA_SCHEMA.PartofSpeech];

	const exactMatches = [];
	const tagMatches = [];

	for (const tpl of allTemplates) {
		if (!tpl || !Array.isArray(tpl.slots)) continue;

		if (targetPos === K.POS_GRAMMAR) {
			// Check if any slot uses this Grammar unit ID (including duplicate causal -아/어서 ID 52 <-> 459)
			for (let sIdx = 0; sIdx < tpl.slots.length; sIdx++) {
				const slot = tpl.slots[sIdx];
				const usesGrammar = (slot.grammar || []).some(g =>
					g.unitId === targetId
				) || slot.originalUnitId === targetId;
				if (usesGrammar) {
					exactMatches.push({ template: tpl, slotIndex: sIdx, matchType: "grammar_exact" });
					break;
				}
			}
			continue;
		}

		// Lexical unit: check slots with matching POS and unified eligibility constraints
		for (let sIdx = 0; sIdx < tpl.slots.length; sIdx++) {
			const slot = tpl.slots[sIdx];
			if (slot.pos !== targetPos) continue;
			if (isLockedSlot(slot)) {
				if (slot.originalUnitId === targetId && slot.inflection && (slot.inflection.stemForm === "exact" || slot.inflection.stemForm === K.FIXED_GRAMMAR)) {
					exactMatches.push({ template: tpl, slotIndex: sIdx, matchType: "lexical_exact_locked" });
				}
				continue;
			}

			const slotCtx = cachedSlotContext(slot, units);
			if (!isUnitEligibleForSlot(targetUnit, slot, slotCtx)) continue;

			if (slot.originalUnitId === targetId) {
				exactMatches.push({ template: tpl, slotIndex: sIdx, matchType: "lexical_original" });
			} else {
				tagMatches.push({ template: tpl, slotIndex: sIdx, matchType: "lexical_tags" });
			}
		}
	}

	return [...exactMatches, ...tagMatches];
}

/** Canonical unit id for any id (a merged alias stands for its target). */
function canonicalUnitId(id) {
	const units = getUnitsArray();
	const u = typeof id === 'number' ? units[id] : null;
	return u ? resolveAliasUnit(u, units)[DATA_SCHEMA.Id] : id;
}

// ---------------------------------------------------------------------------------------------------------------------------------
// Availability cache: which verified templates the unlocked units can build.
// A word slot is available when ANY unlocked unit fits it (not only the textbook word). A fixed slot (locked grammar form) needs its own
// unit. Computed once per template, then kept: unlocking a unit can only turn locked slots available, so only the new unit is checked
// against them. A read always catches up exactly; availabilityStep() does the same work in small time slices so an unlock costs no spike.
// ---------------------------------------------------------------------------------------------------------------------------------
// Entries are keyed by template id and dropped whenever a template is edited (templateEdits).
const avail = { owned: new Set(), log: [], entries: new Map(), cursor: 0, editVer: 0, stats: { slotComputes: 0, unitChecks: 0, resets: 0 } };
const nowMs = () => ((typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now());

function slotContext(e, i, units) {
	return cachedSlotContext(e.slotRefs[i], units);
}

/**
 * Tell the cache which units are unlocked (array or Set). New units are logged (cheap); a removed unit resets the cache.
 * Returns true when anything changed, so a caller can start the background sweep.
 */
function syncOwnedUnits(ids) {
	const next = ids instanceof Set ? ids : new Set(ids || []);
	for (const id of avail.owned) {
		if (!next.has(id)) {
			avail.owned = new Set(next); avail.log = []; avail.entries.clear(); avail.cursor = 0; avail.stats.resets++;
			return true;
		}
	}
	let added = 0;
	for (const id of next) if (!avail.owned.has(id)) { avail.owned.add(id); avail.log.push(id); added++; }
	if (added) avail.cursor = 0;
	return added > 0;
}

function computeSlotAvail(e, i, units) {
	const slot = e.slotRefs[i];
	avail.stats.slotComputes++;
	if (typeof slot.originalUnitId !== 'number') return { ok: true, fixed: null };
	if (isLockedSlot(slot)) { const id = canonicalUnitId(slot.originalUnitId); return { ok: avail.owned.has(id), fixed: id }; }
	// Same answer as testing every unlocked unit against the slot, via the slot's cached eligible-unit list (no eligibility calls).
	for (const u of slotEligibleUnits(slot, units, false)) if (avail.owned.has(u[DATA_SCHEMA.Id])) return { ok: true, fixed: null };
	return { ok: false, fixed: null };
}

/** Up-to-date availability of every slot of a template (computed on first use, otherwise caught up with units unlocked since). */
function availabilityEntry(tpl) {
	const units = getUnitsArray();
	if (avail.editVer !== templateEdits) { avail.entries.clear(); avail.editVer = templateEdits; avail.cursor = 0; }
	let e = avail.entries.get(tpl.id);
	if (e && e.slotRefs.length !== tpl.slots.length) e = null;
	if (!e) {
		e = { slotRefs: tpl.slots, slots: [], seen: avail.log.length };
		for (let i = 0; i < tpl.slots.length; i++) e.slots.push(computeSlotAvail(e, i, units));
		avail.entries.set(tpl.id, e);
		return e;
	}
	if (e.seen < avail.log.length) {
		e.slots.forEach((st, i) => {
			if (st.ok) return;
			if (st.fixed !== null) { st.ok = avail.owned.has(st.fixed); return; }
			const slot = e.slotRefs[i], ctx = slotContext(e, i, units);
			for (let k = e.seen; k < avail.log.length && !st.ok; k++) {
				const u = units[avail.log[k]];
				avail.stats.unitChecks++;
				if (u && isUnitEligibleForSlot(u, slot, ctx)) st.ok = true;
			}
		});
		e.seen = avail.log.length;
	}
	return e;
}

/**
 * Background sweep: brings every template's cache entry up to date, stopping after ~budgetMs. Call repeatedly (e.g. from setTimeout)
 * until it returns false. A sweep restarts from the front whenever a unit is unlocked.
 */
function availabilityStep(budgetMs = 6) {
	const all = getVerifiedTemplatesShared(), t0 = nowMs();
	if (avail.sweepOf !== all) { avail.sweepOf = all; avail.cursor = 0; }
	while (avail.cursor < all.length) {
		const tpl = all[avail.cursor++];
		if (tpl && Array.isArray(tpl.slots)) availabilityEntry(tpl);
		if (nowMs() - t0 >= budgetMs) break;   // checked per template: a cold template (first slot scans) can take a few ms
	}
	return avail.cursor < all.length;
}

function getAvailabilityStats() {
	let lockedSlots = 0;
	for (const e of avail.entries.values()) for (const st of e.slots) if (!st.ok && st.fixed === null) lockedSlots++;
	return { ...avail.stats, entries: avail.entries.size, lockedSlots, owned: avail.owned.size, pendingUnits: avail.log.length };
}

/**
 * What a template still needs for the card's unit: [{ unitId, slotIndex }]. Empty = fully buildable with the unlocked units.
 * Every grammar unit must be unlocked; a word slot (other than the target's) needs ANY fitting unlocked unit, and the entry
 * names the textbook word of the slot that has none (slotIndex null = a grammar unit).
 */
function templateMissing(tpl, targetUnitId, targetSlotIndex) {
	const e = availabilityEntry(tpl), self = canonicalUnitId(targetUnitId), missing = [], grammarSeen = new Set();
	tpl.slots.forEach((slot, i) => {
		for (const g of (slot.grammar || [])) {
			if (typeof g.unitId !== 'number') continue;
			const c = canonicalUnitId(g.unitId);
			if (c !== self && !avail.owned.has(c) && !grammarSeen.has(c)) { grammarSeen.add(c); missing.push({ unitId: c, slotIndex: null }); }
		}
		if (i !== targetSlotIndex && !e.slots[i].ok) missing.push({ unitId: canonicalUnitId(slot.originalUnitId), slotIndex: i });
	});
	return missing;
}

/** Word slots whose textbook word is not unlocked but another unlocked unit fits: the generator varies these instead of using the textbook word. */
function slotsToRelax(tpl, targetSlotIndex) {
	const e = availabilityEntry(tpl), out = [];
	tpl.slots.forEach((slot, i) => {
		if (i === targetSlotIndex || typeof slot.originalUnitId !== 'number' || e.slots[i].fixed !== null || !e.slots[i].ok) return;
		if (!avail.owned.has(canonicalUnitId(slot.originalUnitId))) out.push(i);
	});
	return out;
}

/**
 * Every verified template that can teach `unitId`, one row each, with what it still needs. ownedIds (array or Set) = unlocked units.
 * row: { templateId, title, ko, source, slotIndex, matchType, slots: [{ index, unitId, role: 'target'|'word' }],
 *        missing: [{ unitId, slotIndex|null, pool }] }   pool = how many units could fill it (1 = this exact unit)
 */
function listVerifiedFitsForUnit(unitId, ownedIds = []) {
	syncOwnedUnits(ownedIds);
	const rows = [], seen = new Set();
	for (const m of findMatchingTemplatesForUnit(unitId)) {
		const tpl = m.template;
		if (seen.has(tpl.id)) continue;
		seen.add(tpl.id);
		const chips = [];
		tpl.slots.forEach((slot, i) => {
			if (typeof slot.originalUnitId !== 'number') return;
			chips.push({ index: i, unitId: i === m.slotIndex ? unitId : canonicalUnitId(slot.originalUnitId), role: i === m.slotIndex ? 'target' : 'word' });
		});
		const missing = templateMissing(tpl, unitId, m.slotIndex).map(x => ({
			...x, pool: x.slotIndex === null || isLockedSlot(tpl.slots[x.slotIndex]) ? 1 : Math.max(1, getSlotCandidates(tpl.slots[x.slotIndex], { targetUnitId: unitId }).count)
		}));
		rows.push({ templateId: tpl.id, title: tpl.title || tpl.id, ko: tpl.originalKo || '', source: tpl.source || '', slotIndex: m.slotIndex, matchType: m.matchType, slots: chips, missing });
	}
	return rows;
}

/**
 * Order matches by the "time to use it" queue: one match per template, templates fully buildable from the allowed units first
 * (only when the caller restricts to a set), then front of the queue first. Templates the queue has never seen count as front.
 */
function orderMatchesByQueue(matches, options) {
	const rank = new Map();
	options.queueOrder.forEach((id, i) => rank.set(id, i));
	const restricted = Boolean(options.onlyFromSet && options.allowedUnitIds instanceof Set);
	const best = new Map();   // template id -> first/best match (exact word matches beat tag matches)
	matches.forEach((m, i) => {
		const cur = best.get(m.template.id);
		if (!cur || (cur.m.matchType === 'lexical_tags' && m.matchType !== 'lexical_tags')) best.set(m.template.id, { m, i: cur ? cur.i : i });
	});
	const rows = [...best.values()].map(({ m, i }) => ({
		m, i, group: restricted && templateMissing(m.template, options.targetUnitId, m.slotIndex).length ? 1 : 0,
		r: rank.has(m.template.id) ? rank.get(m.template.id) : -1
	}));
	rows.sort((a, b) => a.group - b.group || a.r - b.r || a.i - b.i);
	return rows.map(x => x.m);
}

/**
 * Generates a single sentence for `unitOrId`, prioritizing Verified Sentence
 * structures and falling back to the random AST generator if no template matches.
 */
function generateVerifiedSentenceForUnit(unitOrId, options = {}) {
	const units = getUnitsArray();
	const targetUnit = resolveAliasUnit(Array.isArray(unitOrId)
		? unitOrId
		: (typeof unitOrId === 'number' ? units[unitOrId] : null), units);

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
			en: fallback.en || fallback.enLiteral || "",
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
	const targetUnit = resolveAliasUnit(Array.isArray(unitOrId)
		? unitOrId
		: (typeof unitOrId === 'number' ? units[unitOrId] : null), units);

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
	// Shorter templates first (fewer slots = easier to read in a quick quiz), then grammar difficulty, then id.
	scoredMatches.sort((a, b) => a.template.slots.length - b.template.slots.length || a.diff.difficultyScore - b.diff.difficultyScore || a.template.id.localeCompare(b.template.id));

	// "Time to use it" queue (fc2): the front of the queue is generated first, so every template gets its turn.
	const restricted = Boolean(options.onlyFromSet && options.allowedUnitIds instanceof Set);
	if (restricted) syncOwnedUnits(options.allowedUnitIds);
	const relaxFor = item => (restricted ? slotsToRelax(item.template, item.slotIndex) : []);
	const queueMode = Array.isArray(options.queueOrder);
	if (queueMode) {
		const ordered = orderMatchesByQueue(scoredMatches, { ...options, targetUnitId: targetId });
		scoredMatches.length = 0;
		scoredMatches.push(...ordered);
	}

	const sentences = [];
	const seenKo = new Set();
	const seedOff = typeof options.seedOffset === 'number' ? options.seedOffset : 0;

	if (scoredMatches.length > 0) {
		// Pass 1: Try distinct matching templates with tiered difficulty progression
		for (let attempt = 0; attempt < scoredMatches.length && sentences.length < numSentences; attempt++) {
			const targetIdx = sentences.length;
			const tier = getTierForIndex(targetIdx, numSentences);

			let matchItem;
			if (queueMode) {
				matchItem = scoredMatches[attempt];
			} else if (tier === 'easiest') {
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
				unlockedSlots: [matchItem.slotIndex, ...relaxFor(matchItem)],
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
					if (isLockedSlot(sl)) continue;
					const pool = getSlotCandidates(sl, options);
					if (pool.count > 1) {
						variableSlots.push(sIdx);
					}
				}

				if (variableSlots.length === 0) continue;

				const chosenSlotToVary = variableSlots[v % variableSlots.length];
				const unlocked = [matchItem.slotIndex, chosenSlotToVary, ...relaxFor(matchItem)];

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
			workStats.astFallbackCalls++;
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
					en: fallback.en || fallback.enLiteral || "",
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
	buildSlotMatchContext,
	isUnitEligibleForSlot,
	slotRulesAllow,
	SLOT_RULE_KINDS,
	VALIDATOR_ONLY_TAGS,
	defaultSlotTags,
	analyzeTemplateStructure,
	realizeSlot,
	generateSentenceFromTemplate,
	generateSentencesFromTemplate,
	getAllVerifiedSentences,
	getVerifiedTemplatesShared,
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
	syncOwnedUnits,
	availabilityStep,
	getAvailabilityStats,
	getWorkStats,
	listVerifiedFitsForUnit,
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
