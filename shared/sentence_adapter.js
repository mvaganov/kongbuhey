/**
 * shared/sentence_adapter.js - one place that turns the generation engines into UI-ready sentence records.
 * Prefers verified templates, falls back to the AST generator. Also builds the bad-sentence flag record.
 * Used by webapp/selector.js and flashcards/. Browser global or CommonJS.
 */
(function() {
const _unitGeneratorEngine = (() => {
	if (typeof require === 'function') {
		try { return require('../korean/generation/unit_sentence_generator.js'); } catch (_) {}
	}
	if (typeof window !== 'undefined') {
		const batchFn = window.generateUnitSentencesAST || window.generateSentencesForUnit;
		const singleFn = window.generateSingleUnitSentenceAST || window.generateSentenceForUnit;
		if (typeof batchFn === 'function') {
			return { generateSentenceForUnit: singleFn, generateSentencesForUnit: batchFn, generateUnitSentencesAST: batchFn };
		}
	}
	return null;
})();

const _verifiedGeneratorEngine = (() => {
	if (typeof require === 'function') {
		try { return require('../korean/generation/verified_sentence_generator.js'); } catch (_) {}
	}
	if (typeof window !== 'undefined') {
		if (window.verifiedSentenceGenerator) return window.verifiedSentenceGenerator;
		if (typeof window.generateVerifiedSentencesForUnit === 'function') return window;
	}
	return null;
})();

function generateSentencesForUnit(unitId, count = 3, optionsOrRawUnits = null, dataSchema = null) {
	const options = (optionsOrRawUnits && typeof optionsOrRawUnits === 'object' && !Array.isArray(optionsOrRawUnits))
		? { ...optionsOrRawUnits } : {};
	const activeVerifiedEngine = (typeof window !== 'undefined' && window.verifiedSentenceGenerator) || _verifiedGeneratorEngine;
	const verifiedBatchFn = (!options.useAstOnly && activeVerifiedEngine) ? activeVerifiedEngine.generateVerifiedSentencesForUnit : null;
	const astBatchFn = _unitGeneratorEngine && (_unitGeneratorEngine.generateUnitSentencesAST || _unitGeneratorEngine.generateSentencesForUnit);
	const engineBatchFn = typeof verifiedBatchFn === 'function' ? verifiedBatchFn : astBatchFn;

	if (typeof engineBatchFn === 'function' && engineBatchFn !== generateSentencesForUnit) {
		const res = engineBatchFn(unitId, count, options);
		const list = (res && Array.isArray(res.sentences) ? res.sentences : []).map(s => ({
			ko: s.ko || '',
			enLiteral: s.enLiteral || '',
			enNatural: s.enNatural || '',
			en: s.enLiteral || s.enNatural || '',
			pronunciation: s.pronunciation || s.ko || '',
			isVerifiedStructure: Boolean(s.isVerifiedStructure),
			verifiedTemplateId: s.verifiedTemplateId || null,
			verifiedTemplateTitle: s.verifiedTemplateTitle || null,
			difficultyTier: s.difficultyTier || null,
			difficultyLabel: s.difficultyLabel || null,
			templateDifficulty: (typeof s.templateDifficulty === 'number') ? s.templateDifficulty : null,
			eojeols: Array.isArray(s.eojeols) ? s.eojeols.map(ej => ({
				surfaceKo: ej.surfaceKo,
				surfaceEnLit: ej.surfaceEnLit || '',
				role: ej.role || '',
				headUnitId: ej.headUnitId ?? null,
				particleUnitId: ej.particleUnitId ?? null,
				endingUnitId: ej.endingUnitId ?? null,
				segments: Array.isArray(ej.segments) ? ej.segments.map(seg => ({
					textKo: seg.textKo || '',
					textEn: seg.textEn || '',
					unitId: typeof seg.unitId === 'number' ? seg.unitId : null,
					kind: seg.kind || 'stem',
					pos: seg.pos || null,
					role: seg.role || null
				})) : []
			})) : [],
			unitsUsed: Array.isArray(s.unitsUsed) ? s.unitsUsed : [],
			unitIds: Array.isArray(s.unitIds) ? s.unitIds : []
		}));

		Object.defineProperties(list, {
			ok: { value: Boolean(res && res.ok), enumerable: false, configurable: true },
			insufficientSet: { value: Boolean(res && res.insufficientSet), enumerable: false, configurable: true },
			missingRoles: { value: (res && res.missingRoles) || [], enumerable: false, configurable: true },
			message: { value: (res && res.message) || null, enumerable: false, configurable: true }
		});
		return list;
	}
	return [];
}

/**
 * Builds the JSON record stored when the user flags a generated sentence as bad.
 * Everything the triage agent needs to reproduce and judge it is captured here:
 * surface forms, the target unit, the template, and every unit used (per-morpheme).
 */
function buildFlagEntry(item, targetUnitId, mode = 'all') {
	const segments = [];
	for (const ej of (item && Array.isArray(item.eojeols)) ? item.eojeols : []) {
		for (const seg of Array.isArray(ej.segments) ? ej.segments : []) {
			segments.push({ ko: seg.textKo || '', unitId: typeof seg.unitId === 'number' ? seg.unitId : null, kind: seg.kind || 'stem' });
		}
	}
	return {
		ko: String((item && item.ko) || ''),
		enLiteral: (item && item.enLiteral) || '',
		enNatural: (item && item.enNatural) || '',
		targetUnitId: (typeof targetUnitId === 'number') ? targetUnitId : null,
		mode,
		origin: item && item.isVerifiedStructure ? 'verified' : 'ast',
		templateId: (item && item.verifiedTemplateId) || null,
		tier: (item && item.difficultyTier) || null,
		unitIds: Array.from(new Set([...(item && item.unitIds) || [], ...(item && item.unitsUsed) || []].filter(n => typeof n === 'number'))),
		segments
	};
}

if (typeof window !== 'undefined') { window.generateSentencesForUnit = generateSentencesForUnit; window.buildFlagEntry = buildFlagEntry; }
if (typeof module !== 'undefined' && module.exports) { module.exports = { generateSentencesForUnit, buildFlagEntry }; }
})();
