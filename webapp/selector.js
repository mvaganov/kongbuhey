(function() {
/**
 * ============================================================================
 * webapp/selector.js - Streamlined Source/Unit Selector & Unit Details View
 * ============================================================================
 *
 * Implements:
 *   1. Collapsible Source list with tri-state checkboxes:
 *      - Checked ('✓', state="all") when all units in the Source are included
 *      - Empty ('', state="none") when 0 units in the Source are included
 *      - Tilde ('~', state="partial") when some (not all) units are included
 *      - Clicking toggles between including all and excluding all units in Source
 *   2. Expandable individual Language Units list per Source:
 *      - Individual checkbox per unit to include/exclude (InSet)
 *      - Clicking the language unit text opens the Language Unit Details view
 *   3. Language Unit Details view:
 *      - Single-line minimalist videogame HUD for RecognitionScore,
 *        LongTermRecognition, TimeStampLastCorrect, and clickable TimeStampLastSeen
 *      - Korean text, Conjugation/Grammar rules (if available), English definition,
 *        and Notes (rendered as Markdown including tiered lists and inline HTML)
 *      - Edit button to edit Korean, Conjugation, English, and pure-text Markdown Notes
 *        in-place where they appear in the Details view
 *      - 3 dynamically generated sentences/phrases using the language unit with a
 *        Regenerate button
 */

// 1. Markdown + Inline HTML Renderer (with Tiered Lists Support)
function formatInlineMarkdown(text) {
	if (!text) return '';
	let out = String(text).replace(/<\s*\/?\s*script[^>]*>/gi, '');
	const codeTokens = [];
	out = out.replace(/`([^`]+)`/g, (_, code) => {
		const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		return `\u0000CODE_${codeTokens.push(`<code>${escaped}</code>`) - 1}\u0000`;
	});
	out = out
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
		.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
		.replace(/__([^_]+)__/g, '<strong>$1</strong>')
		.replace(/~~([^~]+)~~/g, '<del>$1</del>')
		.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
		.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');
	return out.replace(/\u0000CODE_(\d+)\u0000/g, (_, idx) => codeTokens[Number(idx)] || '');
}

function renderMarkdownWithHtml(markdownStr) {
	if (!markdownStr || !String(markdownStr).trim()) return '';
	const lines = String(markdownStr).replace(/\r\n/g, '\n').split('\n');
	const htmlParts = [], listStack = [];
	let inCodeBlock = false, codeBuffer = [];

	const closeListsTo = (targetIndent) => {
		while (listStack.length > 0 && listStack[listStack.length - 1].indent > targetIndent) {
			htmlParts.push(`</li></${listStack.pop().type}>`);
		}
	};
	const closeAllLists = () => closeListsTo(-1);

	for (let i = 0; i < lines.length; i++) {
		const rawLine = lines[i];
		if (rawLine.trim().startsWith('```')) {
			closeAllLists();
			if (!inCodeBlock) { inCodeBlock = true; codeBuffer = []; }
			else {
				inCodeBlock = false;
				const esc = codeBuffer.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
				htmlParts.push(`<pre><code>${esc}</code></pre>`);
			}
			continue;
		}
		if (inCodeBlock) { codeBuffer.push(rawLine); continue; }

		const listMatch = rawLine.match(/^([ \t]*)(?:([-*+])|(\d+|[a-zA-Z])[.)])\s+(.*)$/);
		if (listMatch) {
			const indent = listMatch[1].replace(/\t/g, '  ').length;
			const listType = listMatch[2] ? 'ul' : 'ol';
			const itemContent = formatInlineMarkdown(listMatch[4]);
			const top = listStack[listStack.length - 1];

			if (!top || indent > top.indent) {
				listStack.push({ type: listType, indent });
				htmlParts.push(`<${listType}><li>${itemContent}`);
			} else if (indent === top.indent) {
				if (top.type !== listType) {
					htmlParts.push(`</li></${listStack.pop().type}>`);
					listStack.push({ type: listType, indent });
					htmlParts.push(`<${listType}><li>${itemContent}`);
				} else {
					htmlParts.push(`</li><li>${itemContent}`);
				}
			} else {
				closeListsTo(indent);
				const curTop = listStack[listStack.length - 1];
				if (!curTop || curTop.indent < indent) {
					listStack.push({ type: listType, indent });
					htmlParts.push(`<${listType}><li>${itemContent}`);
				} else if (curTop.type !== listType) {
					htmlParts.push(`</li></${listStack.pop().type}>`);
					listStack.push({ type: listType, indent });
					htmlParts.push(`<${listType}><li>${itemContent}`);
				} else {
					htmlParts.push(`</li><li>${itemContent}`);
				}
			}
			continue;
		}

		closeAllLists();
		const trimmed = rawLine.trim();
		if (!trimmed) continue;

		const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
		if (headingMatch) {
			htmlParts.push(`<h${headingMatch[1].length}>${formatInlineMarkdown(headingMatch[2])}</h${headingMatch[1].length}>`);
			continue;
		}
		if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) { htmlParts.push('<hr>'); continue; }
		if (trimmed.startsWith('>')) {
			htmlParts.push(`<blockquote>${formatInlineMarkdown(trimmed.replace(/^>\s?/, ''))}</blockquote>`);
			continue;
		}
		htmlParts.push(`<p>${formatInlineMarkdown(rawLine)}</p>`);
	}
	closeAllLists();
	if (inCodeBlock && codeBuffer.length > 0) {
		const esc = codeBuffer.join('\n').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		htmlParts.push(`<pre><code>${esc}</code></pre>`);
	}
	return htmlParts.join('\n');
}

// 2. Minimalist Videogame HUD Formatter
const LTR_HUD_SPECS = {
	unknown: { icon: '🔒', code: 'UNK', label: 'Unknown', tierClass: 'hud-tier-0' },
	recognized: { icon: '🥉', code: 'REC', label: 'Recognized', tierClass: 'hud-tier-1' },
	definitionKnown: { icon: '🥈', code: 'DEF', label: 'Definition Known', tierClass: 'hud-tier-2' },
	knownByDefinition: { icon: '👑', code: 'MAX', label: 'Known By Definition', tierClass: 'hud-tier-3' }
};

function formatPithyTime(unixSeconds, nowSeconds = Math.floor(Date.now() / 1000)) {
	const ts = Number(unixSeconds) || 0;
	if (ts <= 0) return '--';
	const diff = Math.max(0, nowSeconds - ts);
	if (diff < 5) return 'NOW';
	if (diff < 60) return `${diff}s`;
	if (diff < 3600) return `${Math.floor(diff / 60)}m`;
	if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
	if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d`;
	const d = new Date(ts * 1000);
	return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatHudTelemetry(scoreOrObj, ltr, lastCorrect, lastSeen, nowSeconds = Math.floor(Date.now() / 1000)) {
	let s = scoreOrObj, l = ltr, lc = lastCorrect, ls = lastSeen, now = nowSeconds;
	if (scoreOrObj && typeof scoreOrObj === 'object') {
		s = scoreOrObj.RecognitionScore;
		l = scoreOrObj.LongTermRecognition;
		lc = scoreOrObj.TimeStampLastCorrect;
		ls = scoreOrObj.TimeStampLastSeen;
		if (typeof ltr === 'number') now = ltr;
	}
	const numScore = Number(s) || 0;
	const scoreText = numScore > 0 ? `+${numScore}` : String(numScore);
	const ltrSpec = LTR_HUD_SPECS[l] || LTR_HUD_SPECS.unknown;
	const correctText = formatPithyTime(lc, now);
	const seenText = formatPithyTime(ls, now);

	return {
		scoreText,
		scorePill: `⚡ ${scoreText}`,
		ltrPill: `${ltrSpec.icon} ${ltrSpec.code}`,
		ltrSpec,
		ltrBadge: ltrSpec,
		lastCorrectText: correctText,
		correctPill: `🎯 ${correctText}`,
		lastSeenText: seenText,
		seenPill: `👁 ${seenText}`,
		summaryLine: `⚡ ${scoreText} · ${ltrSpec.icon} ${ltrSpec.code} · 🎯 ${correctText} · 👁 ${seenText}`
	};
}

// 3. Unified AST Sentence Generator & Dual English Translation Adapter
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

// 4. Streamlined Unit Selector & Details View Controller
class UnitSelectorView {
	constructor(options = {}) {
		this.engine = options.engine;
		this.db = options.db || this.engine?.db;
		this.onStateChange = options.onStateChange || (() => {});

		this.expandedSources = new Set();
		this.selectedUnitId = null;
		this.isEditingDetails = false;
		this.generatedSentences = [];
		this.lastGenerationError = null;
		this.lastGenerationMode = 'all';
		this.searchQuery = '';
		this.flaggedKo = new Set();

		let initialSentenceCount = 3;
		if (typeof window !== 'undefined' && window.localStorage) {
			try {
				const savedCount = parseInt(window.localStorage.getItem('kongbuhey_selector_sentence_count'), 10);
				if (!isNaN(savedCount) && savedCount >= 1 && savedCount <= 10) {
					initialSentenceCount = savedCount;
				}
			} catch (_) {}
		}
		this.sentenceCount = initialSentenceCount;
		this.isEditingSentenceCount = false;

		this.container = null;
		this.sourcesListEl = null;
		this.detailsPaneEl = null;
	}

	/**
	 * Collects all Language Unit IDs currently marked `InSet = true`.
	 */
	getActiveSetUnitIds() {
		const setIds = new Set();
		const total = this.engine?.rawUnits ? this.engine.rawUnits.length : 0;
		for (let id = 0; id < total; id++) {
			if (this.engine.getCellValue(id, 'InSet')) {
				setIds.add(id);
			}
		}
		return setIds;
	}

	getDefaultSetName() {
		const d = new Date();
		const yyyy = d.getFullYear();
		const mm = String(d.getMonth() + 1).padStart(2, '0');
		const dd = String(d.getDate()).padStart(2, '0');
		const hh = String(d.getHours()).padStart(2, '0');
		const min = String(d.getMinutes()).padStart(2, '0');
		return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
	}

	async saveCurrentSet(customName) {
		const activeIds = Array.from(this.getActiveSetUnitIds());
		if (activeIds.length === 0) {
			if (typeof alert === 'function') {
				alert('Your Practice Set is currently empty. Add some language units to the set before saving.');
			}
			return null;
		}
		const defaultName = this.getDefaultSetName();
		let name = customName;
		if (name === undefined && typeof prompt === 'function') {
			name = prompt('Enter a name for this practice set:', defaultName);
			if (name === null) return null;
		}
		name = String(name || '').trim() || defaultName;
		const db = this.db || this.engine?.db;
		if (db && typeof db.saveNamedSet === 'function') {
			const saved = await db.saveNamedSet(name, activeIds);
			this.onStateChange({ type: 'selector-set-saved', set: saved });
			return saved;
		}
		return null;
	}

	async clearCurrentSet() {
		const activeIds = Array.from(this.getActiveSetUnitIds());
		if (activeIds.length === 0) return 0;
		await this.engine.setBulkColumnValue(activeIds, 'InSet', false);
		this.renderSourcesList();
		if (this.selectedUnitId !== null) {
			this.renderDetailsPane();
		}
		this.onStateChange({ type: 'selector-set-cleared', clearedCount: activeIds.length });
		return activeIds.length;
	}

	async loadSavedSet(savedSet) {
		if (!savedSet || !Array.isArray(savedSet.unitIds)) return false;
		const currentActive = Array.from(this.getActiveSetUnitIds());
		if (currentActive.length > 0) {
			await this.engine.setBulkColumnValue(currentActive, 'InSet', false);
		}
		if (savedSet.unitIds.length > 0) {
			await this.engine.setBulkColumnValue(savedSet.unitIds, 'InSet', true);
		}
		this.renderSourcesList();
		if (this.selectedUnitId !== null) {
			this.renderDetailsPane();
		}
		this.onStateChange({ type: 'selector-set-loaded', set: savedSet });
		return true;
	}

	async openLoadSetDialog() {
		const db = this.db || this.engine?.db;
		if (!db || typeof db.getSavedSets !== 'function') return;
		const sets = await db.getSavedSets();

		document.getElementById('modal-load-set')?.remove();

		const modal = document.createElement('div');
		modal.id = 'modal-load-set';
		modal.className = 'modal-backdrop';
		modal.setAttribute('role', 'dialog');
		modal.setAttribute('aria-modal', 'true');

		const renderContent = (currentSets) => {
			let bodyHtml = '';
			if (!currentSets || currentSets.length === 0) {
				bodyHtml = '<p class="modal-helper-text" style="padding:16px 0;">No saved practice sets found. Create one by clicking "💾 Save Set".</p>';
			} else {
				bodyHtml = `<div class="saved-sets-list">` + currentSets.map(s => {
					const dateStr = s.createdAt ? new Date(s.createdAt).toLocaleString() : '';
					const count = Array.isArray(s.unitIds) ? s.unitIds.length : 0;
					const safeName = String(s.name || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
					return `
						<div class="saved-set-item" data-set-id="${s.id}">
							<div class="saved-set-info">
								<strong class="saved-set-name">${safeName}</strong>
								<span class="saved-set-meta">${count} units · ${dateStr}</span>
							</div>
							<div class="saved-set-actions">
								<button type="button" class="btn btn-primary btn-sm btn-load-saved-set" data-set-id="${s.id}">Load</button>
								<button type="button" class="btn btn-ghost btn-sm btn-delete-saved-set" data-set-id="${s.id}" title="Delete set">✕</button>
							</div>
						</div>
					`;
				}).join('') + `</div>`;
			}

			modal.innerHTML = `
				<div class="modal-card">
					<div class="modal-header">
						<h2>Load Saved Practice Set</h2>
						<button type="button" class="modal-close-btn" id="btn-close-load-set-modal" aria-label="Close">×</button>
					</div>
					<div class="modal-body">
						${bodyHtml}
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" id="btn-cancel-load-set">Close</button>
					</div>
				</div>
			`;

			modal.querySelector('#btn-close-load-set-modal')?.addEventListener('click', () => modal.remove());
			modal.querySelector('#btn-cancel-load-set')?.addEventListener('click', () => modal.remove());

			modal.querySelectorAll('.btn-load-saved-set').forEach(btn => {
				btn.addEventListener('click', async () => {
					const target = currentSets.find(s => s.id === btn.dataset.setId);
					if (target) {
						await this.loadSavedSet(target);
						modal.remove();
					}
				});
			});

			modal.querySelectorAll('.btn-delete-saved-set').forEach(btn => {
				btn.addEventListener('click', async () => {
					await db.deleteNamedSet(btn.dataset.setId);
					const updated = await db.getSavedSets();
					renderContent(updated);
				});
			});
		};

		renderContent(sets);
		document.body.appendChild(modal);
	}

	/**
	 * Groups all language units by their Source in canonical order.
	 * Returns Array<{ source: string, unitIds: number[], includedCount: number, state: 'all' | 'none' | 'partial' }>
	 */
	getSourceGroups() {
		const groupsMap = new Map();
		const q = this.searchQuery.trim().toLowerCase();
		const total = this.engine.rawUnits.length;

		for (let unitId = 0; unitId < total; unitId++) {
			const unit = this.engine.rawUnits[unitId];
			if (!unit) continue;
			const srcIdx = this.engine.dataSchema?.Source ?? 7;
			const src = String(this.engine.getCellValue(unitId, 'Source') || unit[srcIdx] || 'Uncategorized');

			if (q) {
				const ko = String(this.engine.getCellValue(unitId, 'Korean') || '').toLowerCase();
				const en = String(this.engine.getCellValue(unitId, 'English') || '').toLowerCase();
				const srcLower = src.toLowerCase();
				if (!ko.includes(q) && !en.includes(q) && !srcLower.includes(q) && !String(unitId).includes(q)) {
					continue;
				}
			}

			if (!groupsMap.has(src)) {
				groupsMap.set(src, []);
			}
			groupsMap.get(src).push(unitId);
		}

		const result = [];
		for (const [source, unitIds] of groupsMap.entries()) {
			let includedCount = 0;
			for (const id of unitIds) {
				if (this.engine.getCellValue(id, 'InSet')) {
					includedCount++;
				}
			}
			let state = 'none';
			let icon = '';
			if (unitIds.length > 0 && includedCount === unitIds.length) {
				state = 'all';
				icon = '✓';
			} else if (includedCount > 0) {
				state = 'partial';
				icon = '~';
			}
			result.push({
				source,
				unitIds,
				includedCount,
				totalCount: unitIds.length,
				state,
				icon
			});
		}
		return result;
	}

	/**
	 * Toggles inclusion/exclusion of all language units in a Source section.
	 * If currently 'all' -> sets all to false (excluded).
	 * If currently 'none' or 'partial' -> sets all to true (included).
	 */
	async toggleSourceInclusion(sourceName) {
		const groups = this.getSourceGroups();
		const group = groups.find(g => g.source === sourceName);
		if (!group || group.unitIds.length === 0) return null;

		const shouldInclude = group.state !== 'all';
		await this.engine.setBulkColumnValue(group.unitIds, 'InSet', shouldInclude);
		this.renderSourcesList();
		if (this.selectedUnitId !== null) {
			this.renderDetailsPane();
		}
		this.onStateChange({ type: 'selector-source-toggled', source: sourceName, included: shouldInclude });
		return { source: sourceName, targetInclude: shouldInclude, count: group.unitIds.length };
	}

	toggleSourceExpanded(sourceName) {
		if (this.expandedSources.has(sourceName)) this.expandedSources.delete(sourceName);
		else this.expandedSources.add(sourceName);
		this.renderSourcesList();
		return this.expandedSources.has(sourceName);
	}
	toggleSourceExpand(sourceName) { return this.toggleSourceExpanded(sourceName); }

	async toggleUnitInclusion(unitId, checked) {
		const nextVal = checked !== undefined ? Boolean(checked) : !this.engine.getCellValue(unitId, 'InSet');
		await this.engine.setCellValue(unitId, 'InSet', nextVal);
		this.renderSourcesList();
		if (this.selectedUnitId !== null) {
			this.renderDetailsPane();
		}
		this.onStateChange({ type: 'selector-unit-toggled', unitId, included: nextVal });
		return nextVal;
	}

	speakKoreanSentence(text, buttonEl = null) {
		if (!text) return;
		if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
			return;
		}
		try {
			window.speechSynthesis.cancel();
			const cleanText = String(text).replace(/\[.*?\]/g, '').trim();
			const utterance = new SpeechSynthesisUtterance(cleanText);
			utterance.lang = 'ko-KR';
			utterance.rate = 0.9;

			const voices = window.speechSynthesis.getVoices ? window.speechSynthesis.getVoices() : [];
			if (Array.isArray(voices) && voices.length > 0) {
				const koVoice = voices.find(v => v.lang === 'ko-KR' || v.lang.startsWith('ko'));
				if (koVoice) {
					utterance.voice = koVoice;
				}
			}

			if (buttonEl) {
				buttonEl.classList.add('is-speaking');
				const cleanup = () => buttonEl.classList.remove('is-speaking');
				utterance.onend = cleanup;
				utterance.onerror = cleanup;
			}

			window.speechSynthesis.speak(utterance);
		} catch (err) {
			if (buttonEl) buttonEl.classList.remove('is-speaking');
		}
	}

	selectUnitForDetails(unitId) {
		this.selectedUnitId = unitId;
		this.isEditingDetails = false;
		this.lastGenerationError = null;
		this.lastGenerationMode = 'all';
		this.regenerateSentences(unitId);
		this.renderSourcesList();
		this.renderDetailsPane();
	}

	selectUnit(unitId) {
		return this.selectUnitForDetails(unitId);
	}

	// --- Bad-sentence flagging ---------------------------------------------------------------
	async loadFlags() {
		const db = this.db || this.engine?.db;
		try {
			const items = (db && typeof db.getFlaggedSentences === 'function') ? await db.getFlaggedSentences() : [];
			this.flaggedKo = new Set(items.map(f => f.ko));
		} catch (_) {
			this.flaggedKo = new Set();
		}
		return this.flaggedKo.size;
	}

	isSentenceFlagged(ko) {
		return this.flaggedKo.has(String(ko || ''));
	}

	async toggleSentenceFlag(item) {
		const db = this.db || this.engine?.db;
		if (!item || !item.ko || !db || typeof db.flagSentence !== 'function') return false;
		let nowFlagged;
		if (this.flaggedKo.has(item.ko)) {
			await db.unflagSentence(item.ko);
			this.flaggedKo.delete(item.ko);
			nowFlagged = false;
		} else {
			await db.flagSentence(buildFlagEntry(item, this.selectedUnitId, this.lastGenerationMode));
			this.flaggedKo.add(item.ko);
			nowFlagged = true;
		}
		this.onStateChange({ type: 'selector-sentence-flag-toggled', ko: item.ko, flagged: nowFlagged });
		return nowFlagged;
	}

	/** Downloads every flagged sentence as JSON. Drop the file into the project's flagged/ folder. */
	async exportFlaggedSentences() {
		const db = this.db || this.engine?.db;
		const items = (db && typeof db.getFlaggedSentences === 'function') ? await db.getFlaggedSentences() : [];
		const payload = { app: 'kongbuhey', kind: 'flagged-sentences', version: 1, exportedAt: new Date().toISOString(), items };
		if (typeof document !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && URL.createObjectURL) {
			const a = document.createElement('a');
			a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
			a.download = 'flags-' + payload.exportedAt.replace(/[:.]/g, '-').slice(0, 19) + '.json';
			document.body.appendChild(a);
			a.click();
			a.remove();
		}
		return payload;
	}

	async clearFlaggedSentences() {
		const db = this.db || this.engine?.db;
		if (db && typeof db.clearFlaggedSentences === 'function') await db.clearFlaggedSentences();
		this.flaggedKo = new Set();
		this.renderDetailsPane();
		return true;
	}

	getSentencesForSelectedUnit() {
		if (this.selectedUnitId === null) return [];
		if ((!this.generatedSentences || this.generatedSentences.length === 0) && !this.lastGenerationError) {
			this.regenerateSentences(this.selectedUnitId);
		}
		return this.generatedSentences;
	}

	setSentenceCount(count) {
		const parsed = Math.max(1, Math.min(10, parseInt(count, 10) || 3));
		this.sentenceCount = parsed;
		this.isEditingSentenceCount = false;
		if (typeof window !== 'undefined' && window.localStorage) {
			try {
				window.localStorage.setItem('kongbuhey_selector_sentence_count', String(parsed));
			} catch (_) {}
		}
		this.invalidateGeneratedSentences(this.selectedUnitId);
		if (this.container) {
			this.renderDetailsPane();
		}
	}

	regenerateSentences(unitId = this.selectedUnitId, options = {}) {
		const targetId = unitId !== undefined && unitId !== null ? unitId : this.selectedUnitId;
		if (targetId === null || targetId === undefined) {
			this.generatedSentences = [];
			this.lastGenerationError = null;
			return [];
		}

		const reqCount = (typeof options.count === 'number' && options.count > 0) ? options.count : this.sentenceCount;
		const onlyFromSet = Boolean(options && options.onlyFromSet);
		this.lastGenerationMode = onlyFromSet ? 'onlyFromSet' : 'all';

		if (onlyFromSet) {
			const allowedUnitIds = (options && options.allowedUnitIds)
				? (options.allowedUnitIds instanceof Set ? options.allowedUnitIds : new Set(options.allowedUnitIds))
				: this.getActiveSetUnitIds();

			const next = generateSentencesForUnit(targetId, reqCount, {
				onlyFromSet: true,
				allowedUnitIds
			});
			if (next.insufficientSet || next.ok === false || next.length === 0) {
				this.lastGenerationError = next.message || 'Not enough compatible language units in the current Practice Set to generate complete sentences.';
				this.generatedSentences = next;
			} else {
				this.lastGenerationError = null;
				this.generatedSentences = next;
			}
			return this.generatedSentences;
		}

		this.lastGenerationError = null;
		const prevJson = JSON.stringify(this.generatedSentences || []);
		let next = [];
		for (let attempt = 0; attempt < 5; attempt++) {
			next = generateSentencesForUnit(targetId, reqCount, { seedOffset: Math.floor(Math.random() * 997) + attempt * 13 });
			if (JSON.stringify(next) !== prevJson) break;
		}
		this.generatedSentences = next;
		return this.generatedSentences;
	}

	regenerateSentencesOnlyFromSet(unitId = this.selectedUnitId, allowedUnitIds = null) {
		return this.regenerateSentences(unitId, { onlyFromSet: true, allowedUnitIds });
	}

	invalidateGeneratedSentences(unitId = null) {
		if (unitId === null || unitId === undefined || this.selectedUnitId === unitId) {
			this.generatedSentences = [];
			this.lastGenerationError = null;
			if (this.selectedUnitId !== null && this.selectedUnitId !== undefined && this.container) {
				this.regenerateSentences(this.selectedUnitId);
				this.renderDetailsPane();
			}
		}
	}

	setEditMode(isEditing) {
		this.isEditingDetails = Boolean(isEditing);
		this.renderDetailsPane();
	}

	async touchUnitLastSeen(unitId = this.selectedUnitId) {
		if (unitId === null || unitId === undefined) return null;
		const nowUnix = Math.floor(Date.now() / 1000);
		await this.engine.setCellValue(unitId, 'TimeStampLastSeen', nowUnix);
		this.renderDetailsPane();
		this.onStateChange({ type: 'selector-last-seen-updated', unitId, timestamp: nowUnix });
		return nowUnix;
	}

	async saveEditedDetails(unitId, fields = {}) {
		const ko = fields.korean !== undefined ? fields.korean : fields.Korean;
		const conj = fields.conjugation !== undefined ? fields.conjugation : fields.Conjugation;
		const en = fields.english !== undefined ? fields.english : fields.English;
		const notes = fields.notes !== undefined ? fields.notes : fields.Notes;

		if (ko !== undefined) {
			await this.engine.setCellValue(unitId, 'Korean', ko);
		}
		if (conj !== undefined) {
			await this.engine.setCellValue(unitId, 'Conjugation', conj);
		}
		if (en !== undefined) {
			await this.engine.setCellValue(unitId, 'English', en);
		}
		if (notes !== undefined) {
			await this.engine.setCellValue(unitId, 'notes', notes);
		}
		this.isEditingDetails = false;
		this.regenerateSentences(unitId);
		this.renderSourcesList();
		this.renderDetailsPane();
		this.onStateChange({ type: 'selector-details-saved', unitId });
	}

	// =========================================================================
	// Browser DOM Mounting & Rendering
	// =========================================================================

	mount(containerElement) {
		this.container = containerElement;
		this.container.innerHTML = '';

		const layout = document.createElement('div');
		layout.className = 'selector-split-layout';

		// Left Column: Streamlined Source & Unit Tree
		const leftCol = document.createElement('div');
		leftCol.className = 'selector-tree-pane';

		const treeHeader = document.createElement('div');
		treeHeader.className = 'selector-tree-header';
		treeHeader.innerHTML = `
			<div class="selector-search-row">
				<input type="search" id="selector-quick-search" class="selector-search-input" placeholder="Filter sources or units..." autocomplete="off">
				<button type="button" id="btn-selector-expand-all" class="btn btn-secondary" title="Expand all Sources">Expand All</button>
				<button type="button" id="btn-selector-collapse-all" class="btn btn-ghost" title="Collapse all Sources">Collapse</button>
			</div>
			<div class="selector-set-actions-row">
				<button type="button" id="btn-set-save" class="btn btn-emerald btn-sm" title="Save current Practice Set with a custom name">💾 Save Set</button>
				<button type="button" id="btn-set-load" class="btn btn-secondary btn-sm" title="Open dialog to select and reload a saved Practice Set">📂 Load Set</button>
				<button type="button" id="btn-set-clear" class="btn btn-ghost btn-sm" title="Deselect and remove all language units from the current set">🗑️ Deselect All</button>
			</div>
		`;
		leftCol.appendChild(treeHeader);

		this.sourcesListEl = document.createElement('div');
		this.sourcesListEl.className = 'selector-sources-list';
		leftCol.appendChild(this.sourcesListEl);

		// Right Column: Language Unit Details View
		this.detailsPaneEl = document.createElement('div');
		this.detailsPaneEl.className = 'selector-details-pane';

		layout.appendChild(leftCol);
		layout.appendChild(this.detailsPaneEl);
		this.container.appendChild(layout);

		// Bind quick filter & expand/collapse all
		const searchInput = treeHeader.querySelector('#selector-quick-search');
		if (searchInput) {
			searchInput.addEventListener('input', () => {
				this.searchQuery = searchInput.value;
				if (this.searchQuery.trim()) {
					this.getSourceGroups().forEach(g => this.expandedSources.add(g.source));
				}
				this.renderSourcesList();
			});
		}
		treeHeader.querySelector('#btn-selector-expand-all')?.addEventListener('click', () => {
			this.getSourceGroups().forEach(g => this.expandedSources.add(g.source));
			this.renderSourcesList();
		});
		treeHeader.querySelector('#btn-selector-collapse-all')?.addEventListener('click', () => {
			this.expandedSources.clear();
			this.renderSourcesList();
		});

		// Bind set management buttons (Save, Load, Clear)
		treeHeader.querySelector('#btn-set-save')?.addEventListener('click', () => {
			this.saveCurrentSet();
		});
		treeHeader.querySelector('#btn-set-load')?.addEventListener('click', () => {
			this.openLoadSetDialog();
		});
		treeHeader.querySelector('#btn-set-clear')?.addEventListener('click', () => {
			const activeCount = this.getActiveSetUnitIds().size;
			if (activeCount === 0) return;
			const confirmed = typeof confirm !== 'function' || confirm(`Deselect all ${activeCount} language units from the practice set?`);
			if (confirmed) {
				this.clearCurrentSet();
			}
		});

		this.render();
	}

	render() {
		this.renderSourcesList();
		this.renderDetailsPane();
	}

	renderSourcesList() {
		if (!this.sourcesListEl) return;
		this.sourcesListEl.innerHTML = '';

		const groups = this.getSourceGroups();
		if (groups.length === 0) {
			const empty = document.createElement('div');
			empty.className = 'sheet-empty-state';
			empty.textContent = 'No sources or language units match your filter.';
			this.sourcesListEl.appendChild(empty);
			return;
		}

		for (const group of groups) {
			const isExpanded = this.expandedSources.has(group.source);
			const sectionEl = document.createElement('div');
			sectionEl.className = `source-section${isExpanded ? ' is-expanded' : ''}`;
			sectionEl.dataset.source = group.source;

			// Source Header Row
			const headerRow = document.createElement('div');
			headerRow.className = 'source-header-row';

			// Tri-state checkbox ('✓' for all, '~' for partial, '' for none)
			const triBtn = document.createElement('button');
			triBtn.type = 'button';
			triBtn.className = `source-tri-checkbox state-${group.state}`;
			triBtn.dataset.state = group.state;
			triBtn.setAttribute('aria-label', `Toggle all units in ${group.source}`);
			triBtn.title = group.state === 'all'
				? `All ${group.totalCount} units included — Click to exclude all`
				: (group.state === 'partial'
					? `${group.includedCount} of ${group.totalCount} units included (~) — Click to include all`
					: `No units included — Click to include all ${group.totalCount} units`);
			triBtn.textContent = group.state === 'all' ? '✓' : (group.state === 'partial' ? '~' : '');
			triBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.toggleSourceInclusion(group.source);
			});
			headerRow.appendChild(triBtn);

			// Expand/Collapse clickable Source label
			const titleArea = document.createElement('div');
			titleArea.className = 'source-title-area';
			titleArea.addEventListener('click', () => {
				this.toggleSourceExpanded(group.source);
			});

			const chevron = document.createElement('span');
			chevron.className = 'source-chevron';
			chevron.textContent = isExpanded ? '▾' : '▸';
			titleArea.appendChild(chevron);

			const nameSpan = document.createElement('span');
			nameSpan.className = 'source-name-text';
			nameSpan.textContent = group.source;
			titleArea.appendChild(nameSpan);

			const countBadge = document.createElement('span');
			countBadge.className = `source-count-badge state-${group.state}`;
			countBadge.textContent = `${group.includedCount} / ${group.totalCount}`;
			titleArea.appendChild(countBadge);

			headerRow.appendChild(titleArea);
			sectionEl.appendChild(headerRow);

			// Expanded Individual Language Units List
			if (isExpanded) {
				const unitsContainer = document.createElement('div');
				unitsContainer.className = 'source-units-list';

				for (const unitId of group.unitIds) {
					const isIncluded = Boolean(this.engine.getCellValue(unitId, 'InSet'));
					const isSelected = this.selectedUnitId === unitId;
					const ko = this.engine.getCellValue(unitId, 'Korean');
					const en = this.engine.getCellValue(unitId, 'English');
					const pos = this.engine.getCellValue(unitId, 'PartofSpeech');

					const unitRow = document.createElement('div');
					unitRow.className = `selector-unit-row${isIncluded ? ' is-included' : ''}${isSelected ? ' is-active-detail' : ''}`;
					unitRow.dataset.unitId = String(unitId);

					const cb = document.createElement('input');
					cb.type = 'checkbox';
					cb.className = 'unit-row-checkbox';
					cb.checked = isIncluded;
					cb.title = `Include/Exclude "${ko}" in Practice Set`;
					cb.addEventListener('click', (e) => e.stopPropagation());
					cb.addEventListener('change', () => {
						this.toggleUnitInclusion(unitId, cb.checked);
					});
					unitRow.appendChild(cb);

					const textBtn = document.createElement('div');
					textBtn.className = 'unit-row-text';
					textBtn.title = 'Click to view Language Unit Details';
					textBtn.innerHTML = `
						<span class="unit-row-ko">${ko}</span>
						<span class="unit-row-en">${en}</span>
						<span class="unit-row-pos">${pos}</span>
					`;
					textBtn.addEventListener('click', () => {
						this.selectUnitForDetails(unitId);
					});
					unitRow.appendChild(textBtn);

					unitsContainer.appendChild(unitRow);
				}

				sectionEl.appendChild(unitsContainer);
			}

			this.sourcesListEl.appendChild(sectionEl);
		}
	}

	renderDetailsPane() {
		if (!this.detailsPaneEl) return;
		this.detailsPaneEl.innerHTML = '';

		if (this.selectedUnitId === null || !this.engine.rawUnits[this.selectedUnitId]) {
			this.detailsPaneEl.innerHTML = `
				<div class="details-empty-state">
					<div class="details-empty-icon">📖</div>
					<h3>Language Unit Details</h3>
					<p>Expand any <strong>Source</strong> on the left and click on a language unit's text to inspect its details, markdown notes, videogame mastery HUD, and generated example sentences.</p>
				</div>
			`;
			return;
		}

		const unitId = this.selectedUnitId;
		const ko = String(this.engine.getCellValue(unitId, 'Korean') ?? '');
		const en = String(this.engine.getCellValue(unitId, 'English') ?? '');
		const pos = String(this.engine.getCellValue(unitId, 'PartofSpeech') ?? '');
		const src = String(this.engine.getCellValue(unitId, 'Source') ?? '');
		const rawConj = this.engine.getCellValue(unitId, 'Conjugation');
		const conjStr = Array.isArray(rawConj) ? rawConj.join(', ') : String(rawConj ?? '');
		const honorific = String(this.engine.getCellValue(unitId, 'HonorificRules') ?? '');
		const notesRaw = String(this.engine.getCellValue(unitId, 'notes') ?? '');
		const isInSet = Boolean(this.engine.getCellValue(unitId, 'InSet'));

		const score = this.engine.getCellValue(unitId, 'RecognitionScore');
		const ltr = this.engine.getCellValue(unitId, 'LongTermRecognition');
		const lastCorrect = this.engine.getCellValue(unitId, 'TimeStampLastCorrect');
		const lastSeen = this.engine.getCellValue(unitId, 'TimeStampLastSeen');
		const hud = formatHudTelemetry(score, ltr, lastCorrect, lastSeen);

		const card = document.createElement('div');
		card.className = 'unit-details-card';

		// ---------------------------------------------------------------------
		// 1. Minimalist Videogame HUD Bar (Single Line) + Action Bar
		// ---------------------------------------------------------------------
		const topBar = document.createElement('div');
		topBar.className = 'unit-details-topbar';

		const hudBar = document.createElement('div');
		hudBar.className = 'unit-hud-bar';
		hudBar.setAttribute('aria-label', 'Language Unit Mastery HUD');

		const scoreBadge = document.createElement('span');
		scoreBadge.className = 'hud-chip hud-chip-score';
		scoreBadge.title = `RecognitionScore: ${Number(score) || 0}`;
		scoreBadge.textContent = hud.scorePill;
		hudBar.appendChild(scoreBadge);

		const ltrBadge = document.createElement('span');
		ltrBadge.className = `hud-chip hud-chip-ltr ${hud.ltrSpec.tierClass}`;
		ltrBadge.title = `LongTermRecognition: ${hud.ltrSpec.label} (${ltr})`;
		ltrBadge.textContent = hud.ltrPill;
		hudBar.appendChild(ltrBadge);

		const corrBadge = document.createElement('span');
		corrBadge.className = 'hud-chip hud-chip-correct';
		corrBadge.title = `TimeStampLastCorrect: ${this.engine.formatCellValue(lastCorrect, this.engine.columnMap.get('TimeStampLastCorrect'))}`;
		corrBadge.textContent = hud.correctPill;
		hudBar.appendChild(corrBadge);

		const seenBtn = document.createElement('button');
		seenBtn.type = 'button';
		seenBtn.className = 'hud-chip hud-chip-seen hud-seen-btn';
		seenBtn.title = `TimeStampLastSeen: ${this.engine.formatCellValue(lastSeen, this.engine.columnMap.get('TimeStampLastSeen'))}\nClick to update TimeStampLastSeen to current time!`;
		seenBtn.textContent = hud.seenPill;
		seenBtn.addEventListener('click', () => {
			this.touchUnitLastSeen(unitId);
		});
		hudBar.appendChild(seenBtn);

		topBar.appendChild(hudBar);

		const topActions = document.createElement('div');
		topActions.className = 'unit-details-actions';

		const inSetLabel = document.createElement('label');
		inSetLabel.className = 'details-inset-toggle';
		const inSetCb = document.createElement('input');
		inSetCb.type = 'checkbox';
		inSetCb.checked = isInSet;
		inSetCb.addEventListener('change', () => {
			this.toggleUnitInclusion(unitId, inSetCb.checked);
		});
		const inSetTxt = document.createElement('span');
		inSetTxt.textContent = isInSet ? 'In Practice Set' : 'Add to Set';
		inSetLabel.appendChild(inSetCb);
		inSetLabel.appendChild(inSetTxt);
		topActions.appendChild(inSetLabel);

		const editBtn = document.createElement('button');
		editBtn.type = 'button';
		editBtn.id = 'btn-details-edit-toggle';
		editBtn.className = `btn ${this.isEditingDetails ? 'btn-ghost' : 'btn-secondary'}`;
		editBtn.textContent = this.isEditingDetails ? 'Cancel Edit' : '✎ Edit';
		editBtn.addEventListener('click', () => {
			this.isEditingDetails = !this.isEditingDetails;
			this.renderDetailsPane();
		});
		topActions.appendChild(editBtn);

		topBar.appendChild(topActions);
		card.appendChild(topBar);

		// ---------------------------------------------------------------------
		// 2. Core Language Unit Details (View Mode vs In-Place Edit Mode)
		// ---------------------------------------------------------------------
		const coreSection = document.createElement('div');
		coreSection.className = 'unit-core-section';

		if (!this.isEditingDetails) {
			// VIEW MODE
			const metaRow = document.createElement('div');
			metaRow.className = 'details-meta-pills';
			metaRow.innerHTML = `
				<span class="details-pill">ID #${unitId}</span>
				<span class="details-pill">${pos}</span>
				<span class="details-pill">${src}</span>
			`;
			coreSection.appendChild(metaRow);

			const koHeading = document.createElement('h2');
			koHeading.className = 'details-korean-heading';
			koHeading.textContent = ko;
			coreSection.appendChild(koHeading);

			const enHeading = document.createElement('div');
			enHeading.className = 'details-english-definition';
			enHeading.textContent = en;
			coreSection.appendChild(enHeading);

			if (conjStr.trim() || honorific.trim()) {
				const rulesBox = document.createElement('div');
				rulesBox.className = 'details-grammar-box';
				let rulesHtml = '';
				if (conjStr.trim()) {
					rulesHtml += `<div><span class="details-field-label">Conjugation / Grammar Rules:</span> <code>${conjStr}</code></div>`;
				}
				if (honorific.trim()) {
					rulesHtml += `<div><span class="details-field-label">Honorifics:</span> ${honorific}</div>`;
				}
				rulesBox.innerHTML = rulesHtml;
				coreSection.appendChild(rulesBox);
			}

			if (notesRaw.trim()) {
				const notesBox = document.createElement('div');
				notesBox.className = 'details-notes-box';
				const notesLabel = document.createElement('div');
				notesLabel.className = 'details-field-label';
				notesLabel.textContent = 'Notes';
				notesBox.appendChild(notesLabel);

				const mdContainer = document.createElement('div');
				mdContainer.className = 'details-markdown-body';
				mdContainer.innerHTML = renderMarkdownWithHtml(notesRaw);
				notesBox.appendChild(mdContainer);
				coreSection.appendChild(notesBox);
			}
		} else {
			// IN-PLACE EDIT MODE (Roughly where each element appears in the view)
			const form = document.createElement('form');
			form.className = 'details-edit-form';
			form.innerHTML = `
				<div class="details-edit-group">
					<label class="details-field-label" for="edit-detail-korean">Korean Text</label>
					<input type="text" id="edit-detail-korean" class="details-edit-input details-edit-ko" required>
				</div>
				<div class="details-edit-group">
					<label class="details-field-label" for="edit-detail-english">English Definition</label>
					<input type="text" id="edit-detail-english" class="details-edit-input details-edit-en" required>
				</div>
				<div class="details-edit-group">
					<label class="details-field-label" for="edit-detail-conj">Conjugation / Grammar Rules</label>
					<input type="text" id="edit-detail-conj" class="details-edit-input" placeholder="e.g. regular_eo, hada, or [{VP_AVst}으/니까 {Clause}]">
				</div>
				<div class="details-edit-group">
					<label class="details-field-label" for="edit-detail-notes">Notes (Markdown &amp; Inline HTML)</label>
					<textarea id="edit-detail-notes" class="details-edit-textarea" rows="6" placeholder="Write Markdown notes, tiered lists (- item /   - subitem), or inline HTML..."></textarea>
				</div>
				<div class="details-edit-actions">
					<button type="submit" id="btn-save-details" class="btn btn-primary">✓ Save Changes</button>
					<button type="button" id="btn-cancel-details" class="btn btn-ghost">Cancel</button>
				</div>
			`;

			const koInput = form.querySelector('#edit-detail-korean');
			const enInput = form.querySelector('#edit-detail-english');
			const conjInput = form.querySelector('#edit-detail-conj');
			const notesInput = form.querySelector('#edit-detail-notes');

			koInput.value = ko;
			enInput.value = en;
			conjInput.value = Array.isArray(rawConj) ? JSON.stringify(rawConj) : conjStr;
			notesInput.value = notesRaw; // Pure-text version of the markdown!

			form.addEventListener('submit', async (e) => {
				e.preventDefault();
				await this.saveEditedDetails(unitId, {
					korean: koInput.value.trim(),
					english: enInput.value.trim(),
					conjugation: conjInput.value.trim(),
					notes: notesInput.value
				});
			});
			form.querySelector('#btn-cancel-details').addEventListener('click', () => {
				this.isEditingDetails = false;
				this.renderDetailsPane();
			});

			coreSection.appendChild(form);
		}

		card.appendChild(coreSection);

		// ---------------------------------------------------------------------
		// 3. Generated Sentences / Phrases (Dual English + Interactive Pill Buttons)
		// ---------------------------------------------------------------------
		const sentencesSection = document.createElement('div');
		sentencesSection.className = 'details-sentences-section';

		const sentHeader = document.createElement('div');
		sentHeader.className = 'details-sentences-header';

		const sentTitleGroup = document.createElement('div');
		sentTitleGroup.className = 'details-sentences-title-group';

		const legend = document.createElement('span');
		legend.className = 'pill-legend';
		legend.title = 'Click any Korean or English word/particle pill below to toggle its inclusion in your Practice Set';
		legend.innerHTML = `
			<span class="pill-legend-item"><span class="pill-dot is-in-set"></span> In Set</span>
			<span class="pill-legend-item"><span class="pill-dot not-in-set"></span> Not in Set</span>
		`;

		if (this.isEditingSentenceCount) {
			const editorWrap = document.createElement('div');
			editorWrap.className = 'sentence-count-editor-inline';
			editorWrap.innerHTML = `
				<label class="details-field-label" for="input-custom-sentence-count">Sentences (1-10):</label>
				<input type="number" id="input-custom-sentence-count" class="input-sentence-count" min="1" max="10" value="${this.sentenceCount}" />
				<button type="button" class="btn btn-sm btn-primary" id="btn-save-sentence-count">Apply</button>
				<button type="button" class="btn btn-sm btn-ghost" id="btn-cancel-sentence-count">✕</button>
			`;
			const inp = editorWrap.querySelector('#input-custom-sentence-count');
			const saveBtn = editorWrap.querySelector('#btn-save-sentence-count');
			const cancelBtn = editorWrap.querySelector('#btn-cancel-sentence-count');

			const applyVal = () => {
				const val = inp ? inp.value : this.sentenceCount;
				this.setSentenceCount(val);
			};

			saveBtn.addEventListener('click', applyVal);
			cancelBtn.addEventListener('click', () => {
				this.isEditingSentenceCount = false;
				this.renderDetailsPane();
			});
			inp.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') applyVal();
				if (e.key === 'Escape') {
					this.isEditingSentenceCount = false;
					this.renderDetailsPane();
				}
			});
			sentTitleGroup.appendChild(editorWrap);
		} else {
			const countBtn = document.createElement('button');
			countBtn.type = 'button';
			countBtn.className = 'btn-sentence-count-toggle';
			countBtn.id = 'btn-toggle-sentence-count';
			countBtn.title = `Click to customize how many example sentences are generated (currently ${this.sentenceCount})`;
			countBtn.innerHTML = `Generated Example Sentences (${this.sentenceCount}) <span class="count-edit-icon" aria-hidden="true">✏️</span>`;
			countBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.isEditingSentenceCount = true;
				this.renderDetailsPane();
			});
			sentTitleGroup.appendChild(countBtn);
		}
		sentTitleGroup.appendChild(legend);
		sentHeader.appendChild(sentTitleGroup);

		const sentActions = document.createElement('div');
		sentActions.className = 'details-sentences-actions';

		const regenBtn = document.createElement('button');
		regenBtn.type = 'button';
		regenBtn.id = 'btn-regenerate-sentences';
		regenBtn.className = `btn ${this.lastGenerationMode === 'all' ? 'btn-secondary' : 'btn-ghost'}`;
		regenBtn.textContent = '↻ Regenerate';
		regenBtn.title = `Generate ${this.sentenceCount} new example sentences using all curriculum language units`;
		regenBtn.addEventListener('click', () => {
			this.regenerateSentences(unitId, { onlyFromSet: false });
			this.renderDetailsPane();
		});
		sentActions.appendChild(regenBtn);

		const onlySetBtn = document.createElement('button');
		onlySetBtn.type = 'button';
		onlySetBtn.id = 'btn-regenerate-only-from-set';
		onlySetBtn.className = `btn ${this.lastGenerationMode === 'onlyFromSet' ? 'btn-emerald' : 'btn-secondary'}`;
		onlySetBtn.textContent = '🎯 Only From Set';
		onlySetBtn.title = `Regenerate ${this.sentenceCount} sentences using ONLY language units currently included in your Practice Set (InSet = true)`;
		onlySetBtn.addEventListener('click', () => {
			this.regenerateSentencesOnlyFromSet(unitId);
			this.renderDetailsPane();
		});
		sentActions.appendChild(onlySetBtn);

		if (this.flaggedKo.size > 0) {
			const exportBtn = document.createElement('button');
			exportBtn.type = 'button';
			exportBtn.id = 'btn-export-flags';
			exportBtn.className = 'btn btn-ghost';
			exportBtn.textContent = `⬇ Flags (${this.flaggedKo.size})`;
			exportBtn.title = 'Download all flagged sentences as JSON (put the file in the flagged/ folder for triage)';
			exportBtn.addEventListener('click', () => this.exportFlaggedSentences());
			sentActions.appendChild(exportBtn);

			const clearFlagsBtn = document.createElement('button');
			clearFlagsBtn.type = 'button';
			clearFlagsBtn.id = 'btn-clear-flags';
			clearFlagsBtn.className = 'btn btn-ghost';
			clearFlagsBtn.textContent = '🗑';
			clearFlagsBtn.title = 'Clear all flags (export first!)';
			clearFlagsBtn.addEventListener('click', () => {
				if (typeof confirm === 'function' && !confirm('Clear all flagged sentences? Export them first if you have not.')) return;
				this.clearFlaggedSentences();
			});
			sentActions.appendChild(clearFlagsBtn);
		}

		sentHeader.appendChild(sentActions);
		sentencesSection.appendChild(sentHeader);

		if (this.generatedSentences.length === 0 && !this.lastGenerationError) {
			this.regenerateSentences(unitId, { onlyFromSet: false });
		}

		if (this.lastGenerationError) {
			const errBanner = document.createElement('div');
			errBanner.className = 'sentence-set-error';
			errBanner.setAttribute('role', 'alert');
			errBanner.innerHTML = `
				<div class="sentence-set-error-title">⚠️ Insufficient Language Units in Active Practice Set</div>
				<div class="sentence-set-error-msg"></div>
				<div class="sentence-set-error-hint">Tip: Include more Sources on the left, or click the muted word/particle pills in standard generated sentences to add compatible units to your Practice Set.</div>
			`;
			errBanner.querySelector('.sentence-set-error-msg').textContent = this.lastGenerationError;
			sentencesSection.appendChild(errBanner);
		}

		const createPillButton = (seg, isKorean) => {
			const segUnitId = seg.unitId;
			const hasValidUnit = typeof segUnitId === 'number' && Boolean(this.engine.rawUnits[segUnitId]);
			const text = isKorean ? seg.textKo : seg.textEn;
			if (!text) return null;

			if (!hasValidUnit) {
				const span = document.createElement('span');
				span.className = isKorean ? 'lu-pill-static' : 'lu-pill-static-en';
				span.textContent = text;
				return span;
			}

			const segInSet = Boolean(this.engine.getCellValue(segUnitId, 'InSet'));
			const isTarget = segUnitId === unitId;
			const uKo = String(this.engine.getCellValue(segUnitId, 'Korean') || '');
			const uEn = String(this.engine.getCellValue(segUnitId, 'English') || '');
			const uPos = String(this.engine.getCellValue(segUnitId, 'PartofSpeech') || '');

			const btn = document.createElement('button');
			btn.type = 'button';
			btn.className = [
				'lu-pill-btn',
				isKorean ? 'lu-pill-ko' : 'lu-pill-en',
				segInSet ? 'is-in-set' : 'not-in-set',
				isTarget ? 'is-target-unit' : '',
				seg.kind ? `seg-kind-${seg.kind}` : ''
			].filter(Boolean).join(' ');
			btn.dataset.unitId = String(segUnitId);
			btn.dataset.inSet = String(segInSet);
			btn.textContent = text;
			btn.title = `[#${segUnitId}] ${uKo} — "${uEn}" (${uPos})\n${segInSet ? '★ In Practice Set — Click to remove from set' : '○ Not in Set — Click to add to set'}`;
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.toggleUnitInclusion(segUnitId);
			});
			return btn;
		};

		const sentList = document.createElement('ol');
		sentList.className = 'details-sentences-list';

		for (const item of this.generatedSentences) {
			const li = document.createElement('li');
			li.className = 'details-sentence-item';

			// Sentence Origin Indicator (Verified Sentence Structure vs Random AST)
			const originHeader = document.createElement('div');
			originHeader.className = 'sentence-origin-header';

			const originPill = document.createElement('span');
			if (item.isVerifiedStructure) {
				originPill.className = 'sentence-origin-pill origin-verified';
				const tplId = item.verifiedTemplateId || '';
				originPill.title = `Generated from Verified Sentence Structure${tplId ? ' [' + tplId + ']' : ''}${item.verifiedTemplateTitle ? ': ' + item.verifiedTemplateTitle : ''}`;
				originPill.innerHTML = `<span class="origin-icon" aria-hidden="true">📜</span> <span class="origin-label">Verified Structure</span>${tplId ? ` <span class="origin-tag">[${tplId}]</span>` : ''}`;
			} else {
				originPill.className = 'sentence-origin-pill origin-ast';
				originPill.title = 'Generated from Random Abstract Syntax Tree (AST) grammar combinations';
				originPill.innerHTML = `<span class="origin-icon" aria-hidden="true">🎲</span> <span class="origin-label">Random AST</span>`;
			}
			originHeader.appendChild(originPill);

			// Progressive Difficulty Tier Badge
			if (item.difficultyTier) {
				const tierBadge = document.createElement('span');
				tierBadge.className = `sentence-tier-badge tier-${item.difficultyTier}`;
				let tierIcon = '🌱';
				let tierDesc = 'Level 1: Easiest grammar & vocabulary (lowest difficulty)';
				if (item.difficultyTier === 'easy_and_inset') {
					tierIcon = '🌿';
					tierDesc = 'Level 2: Balanced between easy vocabulary and language units in your current Practice Set';
				} else if (item.difficultyTier === 'challenging') {
					tierIcon = '🔥';
					tierDesc = 'Level 3: Full curriculum exploration (broadest vocabulary and higher difficulty challenge)';
				}
				tierBadge.title = tierDesc;
				tierBadge.innerHTML = `<span class="tier-icon" aria-hidden="true">${tierIcon}</span> <span class="tier-label">${item.difficultyLabel || item.difficultyTier}</span>`;
				originHeader.appendChild(tierBadge);
			}

			const isFlagged = this.isSentenceFlagged(item.ko);
			const flagBtn = document.createElement('button');
			flagBtn.type = 'button';
			flagBtn.className = 'sentence-flag-btn' + (isFlagged ? ' is-flagged' : '');
			flagBtn.setAttribute('aria-pressed', String(isFlagged));
			flagBtn.textContent = isFlagged ? '⚑ Flagged' : '⚐ Bad sentence';
			flagBtn.title = isFlagged
				? 'Flagged for review. Click to un-flag.'
				: 'This Korean sentence sounds wrong or unnatural: flag it for review';
			flagBtn.addEventListener('click', async (e) => {
				e.stopPropagation();
				await this.toggleSentenceFlag(item);
				this.renderDetailsPane();
			});
			originHeader.appendChild(flagBtn);

			li.appendChild(originHeader);

			// 1. Interactive Hangul Sentence Row (shares space with generated Korean text)
			const koRow = document.createElement('div');
			koRow.className = 'sentence-item-ko';
			const eojeols = Array.isArray(item.eojeols) ? item.eojeols : [];

			if (eojeols.length > 0) {
				const koPillsWrap = document.createElement('div');
				koPillsWrap.className = 'sentence-pills-flow sentence-pills-ko';

				eojeols.forEach((ej, ejIdx) => {
					const group = document.createElement('span');
					group.className = 'eojeol-pill-group';
					const segs = Array.isArray(ej.segments) && ej.segments.length > 0
						? ej.segments
						: [{ textKo: ej.surfaceKo, textEn: ej.surfaceEnLit, unitId: ej.headUnitId, kind: 'stem' }];

					for (const seg of segs) {
						const el = createPillButton(seg, true);
						if (el) group.appendChild(el);
					}
					if (ejIdx === eojeols.length - 1) {
						const punctMatch = String(item.ko || '').match(/([.?!~]+)$/);
						if (punctMatch && !String(ej.surfaceKo || '').endsWith(punctMatch[1])) {
							const punctSpan = document.createElement('span');
							punctSpan.className = 'sentence-terminal-punct';
							punctSpan.textContent = punctMatch[1];
							group.appendChild(punctSpan);
						}
					}
					koPillsWrap.appendChild(group);
				});
				koRow.appendChild(koPillsWrap);
			} else {
				koRow.textContent = item.ko;
			}
			li.appendChild(koRow);

			// 2. Primary Direct Korean-Word-Order English Translation Row (enLiteral)
			const litRow = document.createElement('div');
			litRow.className = 'sentence-item-en-literal';

			const litBadge = document.createElement('span');
			litBadge.className = 'trans-mode-badge badge-literal';
			litBadge.title = 'Direct translation in Korean SOV word & morpheme order';
			litBadge.textContent = 'KR ORDER';
			litRow.appendChild(litBadge);

			if (eojeols.length > 0) {
				const enPillsWrap = document.createElement('div');
				enPillsWrap.className = 'sentence-pills-flow sentence-pills-en-literal';

				eojeols.forEach((ej, ejIdx) => {
					const group = document.createElement('span');
					group.className = 'eojeol-pill-group eojeol-pill-group-en';
					const segs = Array.isArray(ej.segments) && ej.segments.length > 0
						? ej.segments
						: [{ textKo: ej.surfaceKo, textEn: ej.surfaceEnLit, unitId: ej.headUnitId, kind: 'stem' }];

					for (const seg of segs) {
						const el = createPillButton(seg, false);
						if (el) group.appendChild(el);
					}
					if (ejIdx === eojeols.length - 1) {
						const punctMatch = String(item.enLiteral || item.ko || '').match(/([.?!~]+)$/);
						if (punctMatch) {
							const punctSpan = document.createElement('span');
							punctSpan.className = 'sentence-terminal-punct';
							punctSpan.textContent = punctMatch[1];
							group.appendChild(punctSpan);
						}
					}
					if (group.childNodes.length > 0) {
						enPillsWrap.appendChild(group);
					}
				});
				litRow.appendChild(enPillsWrap);
			} else {
				const litText = document.createElement('span');
				litText.className = 'sentence-literal-text';
				litText.textContent = item.enLiteral || item.en;
				litRow.appendChild(litText);
			}
			li.appendChild(litRow);

			// 3. Secondary Natural SVO English Translation Row (enNatural) + Pronunciation
			const natRow = document.createElement('div');
			natRow.className = 'sentence-item-en sentence-item-en-natural';

			const natBadge = document.createElement('span');
			natBadge.className = 'trans-mode-badge badge-natural';
			natBadge.title = 'Natural idiomatic English translation';
			natBadge.textContent = 'NATURAL EN';
			natRow.appendChild(natBadge);

			const natText = document.createElement('span');
			natText.className = 'sentence-natural-text';
			natText.textContent = item.enNatural || item.en;
			natRow.appendChild(natText);

			const pronText = item.pronunciation || item.ko;
			if (pronText) {
				const pronBtn = document.createElement('button');
				pronBtn.type = 'button';
				pronBtn.className = 'sentence-pronunciation-btn';
				pronBtn.title = `Standard Korean Pronunciation: [${pronText}]\nClick to listen (Speech Synthesis)`;
				pronBtn.setAttribute('aria-label', `Listen to sentence pronunciation: ${pronText}`);
				pronBtn.innerHTML = `<span class="pron-speaker-icon" aria-hidden="true">🔊</span> [${pronText}]`;
				pronBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					this.speakKoreanSentence(item.ko || pronText, pronBtn);
				});
				natRow.appendChild(pronBtn);
			}

			li.appendChild(natRow);
			sentList.appendChild(li);
		}

		sentencesSection.appendChild(sentList);
		card.appendChild(sentencesSection);

		this.detailsPaneEl.appendChild(card);
	}
}

if (typeof window !== 'undefined') {
	window.renderMarkdownWithHtml = renderMarkdownWithHtml;
	window.formatPithyTime = formatPithyTime;
	window.formatHudTelemetry = formatHudTelemetry;
	window.generateSentencesForUnit = generateSentencesForUnit;
	window.UnitSelectorView = UnitSelectorView;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		renderMarkdownWithHtml,
		formatPithyTime,
		formatHudTelemetry,
		generateSentencesForUnit,
		buildFlagEntry,
		UnitSelectorView
	};
}
})();
