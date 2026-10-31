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

// ============================================================================
// 1. Markdown + Inline HTML Renderer (with Tiered Lists Support)
// ============================================================================

function formatInlineMarkdown(text) {
	if (!text) return '';
	// Strip any unsafe <script> tags while keeping legitimate inline HTML intact
	let out = String(text).replace(/<\s*\/?\s*script[^>]*>/gi, '');

	// Protect inline code spans first
	const codeTokens = [];
	out = out.replace(/`([^`]+)`/g, (_, code) => {
		const idx = codeTokens.length;
		const escaped = code
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		codeTokens.push(`<code>${escaped}</code>`);
		return `\u0000CODE_${idx}\u0000`;
	});

	// Links: [label](url)
	out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
	// Bold: **text** or __text__
	out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>');
	// Strikethrough: ~~text~~
	out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>');
	// Italic: *text* or _text_
	out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
	out = out.replace(/(^|[^_])_([^_\n]+)_(?!_)/g, '$1<em>$2</em>');

	// Restore inline code spans
	out = out.replace(/\u0000CODE_(\d+)\u0000/g, (_, idx) => codeTokens[Number(idx)] || '');
	return out;
}

/**
 * Renders Markdown string to HTML, supporting tiered (nested) unordered/ordered
 * lists, headings, blockquotes, fenced code blocks, and inline HTML.
 */
function renderMarkdownWithHtml(markdownStr) {
	if (!markdownStr || !String(markdownStr).trim()) return '';
	const lines = String(markdownStr).replace(/\r\n/g, '\n').split('\n');
	const htmlParts = [];
	const listStack = []; // Array<{ type: 'ul' | 'ol', indent: number }>
	let inCodeBlock = false;
	let codeBuffer = [];

	const closeListsToIndent = (targetIndent) => {
		while (listStack.length > 0 && listStack[listStack.length - 1].indent > targetIndent) {
			const popped = listStack.pop();
			htmlParts.push(`</li></${popped.type}>`);
		}
	};

	const closeAllLists = () => {
		while (listStack.length > 0) {
			const popped = listStack.pop();
			htmlParts.push(`</li></${popped.type}>`);
		}
	};

	for (let i = 0; i < lines.length; i++) {
		const rawLine = lines[i];

		// Fenced code blocks
		if (rawLine.trim().startsWith('```')) {
			closeAllLists();
			if (!inCodeBlock) {
				inCodeBlock = true;
				codeBuffer = [];
			} else {
				inCodeBlock = false;
				const escaped = codeBuffer.join('\n')
					.replace(/&/g, '&amp;')
					.replace(/</g, '&lt;')
					.replace(/>/g, '&gt;');
				htmlParts.push(`<pre><code>${escaped}</code></pre>`);
			}
			continue;
		}
		if (inCodeBlock) {
			codeBuffer.push(rawLine);
			continue;
		}

		// Check for list item (unordered: -, *, + | ordered: 1., 2., a.)
		const listMatch = rawLine.match(/^([ \t]*)(?:([-*+])|(\d+|[a-zA-Z])[.)])\s+(.*)$/);
		if (listMatch) {
			const indentRaw = listMatch[1].replace(/\t/g, '  ');
			const indent = indentRaw.length;
			const listType = listMatch[2] ? 'ul' : 'ol';
			const itemContent = formatInlineMarkdown(listMatch[4]);

			if (listStack.length === 0) {
				listStack.push({ type: listType, indent });
				htmlParts.push(`<${listType}><li>${itemContent}`);
			} else {
				const top = listStack[listStack.length - 1];
				if (indent > top.indent) {
					listStack.push({ type: listType, indent });
					htmlParts.push(`<${listType}><li>${itemContent}`);
				} else if (indent === top.indent) {
					if (top.type !== listType) {
						listStack.pop();
						htmlParts.push(`</li></${top.type}>`);
						listStack.push({ type: listType, indent });
						htmlParts.push(`<${listType}><li>${itemContent}`);
					} else {
						htmlParts.push(`</li><li>${itemContent}`);
					}
				} else {
					closeListsToIndent(indent);
					const currentTop = listStack[listStack.length - 1];
					if (!currentTop) {
						listStack.push({ type: listType, indent });
						htmlParts.push(`<${listType}><li>${itemContent}`);
					} else if (currentTop.type !== listType) {
						listStack.pop();
						htmlParts.push(`</li></${currentTop.type}>`);
						listStack.push({ type: listType, indent });
						htmlParts.push(`<${listType}><li>${itemContent}`);
					} else {
						htmlParts.push(`</li><li>${itemContent}`);
					}
				}
			}
			continue;
		}

		// Non-list line closes any open lists
		closeAllLists();

		const trimmed = rawLine.trim();
		if (!trimmed) continue;

		// Headings (# .. ######)
		const headingMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
		if (headingMatch) {
			const level = headingMatch[1].length;
			htmlParts.push(`<h${level}>${formatInlineMarkdown(headingMatch[2])}</h${level}>`);
			continue;
		}

		// Horizontal rule
		if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
			htmlParts.push('<hr>');
			continue;
		}

		// Blockquote
		if (trimmed.startsWith('>')) {
			const quoteText = trimmed.replace(/^>\s?/, '');
			htmlParts.push(`<blockquote>${formatInlineMarkdown(quoteText)}</blockquote>`);
			continue;
		}

		htmlParts.push(`<p>${formatInlineMarkdown(rawLine)}</p>`);
	}

	closeAllLists();
	if (inCodeBlock && codeBuffer.length > 0) {
		const escaped = codeBuffer.join('\n')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;');
		htmlParts.push(`<pre><code>${escaped}</code></pre>`);
	}

	return htmlParts.join('\n');
}

// ============================================================================
// 2. Minimalist Videogame HUD Formatter
// ============================================================================

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
	let s = scoreOrObj;
	let l = ltr;
	let lc = lastCorrect;
	let ls = lastSeen;
	let now = nowSeconds;
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

// ============================================================================
// 3. Unified AST Sentence Generator & Dual English Translation Adapter
// ============================================================================

const _unitGeneratorEngine = (() => {
	if (typeof require === 'function') {
		try {
			return require('../korean/generation/unit_sentence_generator.js');
		} catch (_) {}
	}
	if (typeof window !== 'undefined') {
		const batchFn = window.generateUnitSentencesAST || window.generateSentencesForUnit;
		const singleFn = window.generateSingleUnitSentenceAST || window.generateSentenceForUnit;
		if (typeof batchFn === 'function') {
			return {
				generateSentenceForUnit: singleFn,
				generateSentencesForUnit: batchFn,
				generateUnitSentencesAST: batchFn
			};
		}
	}
	return null;
})();

/**
 * Generates `count` (default 3) grammatical, semantically concordant Korean sentences
 * for `unitId` using the unified SentenceAST & Dual English Translation engine.
 *
 * Each returned item contains:
 *   - `ko`: Surface Korean sentence
 *   - `enLiteral`: Direct Korean-word-order English translation with role tags ([topic], [obj], etc.)
 *   - `enNatural`: Idiomatic SVO English translation
 *   - `en`: Alias for `enLiteral` (backward-compatible string property)
 *   - `pronunciation`: Standard Korean Pronunciation (표준 발음법)
 *   - `eojeols`: Array of eojeols with morpheme `segments` (`{ textKo, textEn, unitId, kind }`)
 *   - `unitsUsed`: Ordered array of Language Unit metadata objects used in the sentence
 *   - `unitIds`: Ordered array of Language Unit IDs used in the sentence
 *
 * Also attaches `.ok`, `.insufficientSet`, `.missingRoles`, and `.message` onto the
 * returned array when `options.onlyFromSet` is used.
 */
function generateSentencesForUnit(unitId, count = 3, optionsOrRawUnits = null, dataSchema = null) {
	let options = {};
	if (
		optionsOrRawUnits &&
		typeof optionsOrRawUnits === 'object' &&
		!Array.isArray(optionsOrRawUnits)
	) {
		options = { ...optionsOrRawUnits };
	}

	const engineBatchFn = _unitGeneratorEngine && (
		_unitGeneratorEngine.generateUnitSentencesAST || _unitGeneratorEngine.generateSentencesForUnit
	);
	if (typeof engineBatchFn === 'function' && engineBatchFn !== generateSentencesForUnit) {
		const res = engineBatchFn(unitId, count, options);
		const list = (res && Array.isArray(res.sentences) ? res.sentences : []).map(s => ({
			ko: s.ko || '',
			enLiteral: s.enLiteral || '',
			enNatural: s.enNatural || '',
			en: s.enLiteral || s.enNatural || '',
			pronunciation: s.pronunciation || s.ko || '',
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

// ============================================================================
// 4. Streamlined Unit Selector & Details View Controller
// ============================================================================

class UnitSelectorView {
	constructor(options = {}) {
		this.engine = options.engine;
		this.onStateChange = options.onStateChange || (() => {});

		this.expandedSources = new Set();
		this.selectedUnitId = null;
		this.isEditingDetails = false;
		this.generatedSentences = [];
		this.lastGenerationError = null;
		this.lastGenerationMode = 'all';
		this.searchQuery = '';

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
		if (this.expandedSources.has(sourceName)) {
			this.expandedSources.delete(sourceName);
		} else {
			this.expandedSources.add(sourceName);
		}
		this.renderSourcesList();
		return this.expandedSources.has(sourceName);
	}

	toggleSourceExpand(sourceName) {
		return this.toggleSourceExpanded(sourceName);
	}

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

	getSentencesForSelectedUnit() {
		if (this.selectedUnitId === null) return [];
		if ((!this.generatedSentences || this.generatedSentences.length === 0) && !this.lastGenerationError) {
			this.regenerateSentences(this.selectedUnitId);
		}
		return this.generatedSentences;
	}

	regenerateSentences(unitId = this.selectedUnitId, options = {}) {
		const targetId = unitId !== undefined && unitId !== null ? unitId : this.selectedUnitId;
		if (targetId === null || targetId === undefined) {
			this.generatedSentences = [];
			this.lastGenerationError = null;
			return [];
		}

		const onlyFromSet = Boolean(options && options.onlyFromSet);
		this.lastGenerationMode = onlyFromSet ? 'onlyFromSet' : 'all';

		if (onlyFromSet) {
			const allowedUnitIds = (options && options.allowedUnitIds)
				? (options.allowedUnitIds instanceof Set ? options.allowedUnitIds : new Set(options.allowedUnitIds))
				: this.getActiveSetUnitIds();

			const next = generateSentencesForUnit(targetId, 3, {
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
			next = generateSentencesForUnit(targetId, 3, { seedOffset: Math.floor(Math.random() * 997) + attempt * 13 });
			if (JSON.stringify(next) !== prevJson) break;
		}
		this.generatedSentences = next;
		return this.generatedSentences;
	}

	regenerateSentencesOnlyFromSet(unitId = this.selectedUnitId, allowedUnitIds = null) {
		return this.regenerateSentences(unitId, { onlyFromSet: true, allowedUnitIds });
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
		sentTitleGroup.innerHTML = `
			<span class="details-field-label">Generated Example Sentences (3)</span>
			<span class="pill-legend" title="Click any Korean or English word/particle pill below to toggle its inclusion in your Practice Set">
				<span class="pill-legend-item"><span class="pill-dot is-in-set"></span> In Set</span>
				<span class="pill-legend-item"><span class="pill-dot not-in-set"></span> Not in Set</span>
			</span>
		`;
		sentHeader.appendChild(sentTitleGroup);

		const sentActions = document.createElement('div');
		sentActions.className = 'details-sentences-actions';

		const regenBtn = document.createElement('button');
		regenBtn.type = 'button';
		regenBtn.id = 'btn-regenerate-sentences';
		regenBtn.className = `btn ${this.lastGenerationMode === 'all' ? 'btn-secondary' : 'btn-ghost'}`;
		regenBtn.textContent = '↻ Regenerate';
		regenBtn.title = 'Generate 3 new example sentences using all curriculum language units';
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
		onlySetBtn.title = 'Regenerate 3 sentences using ONLY language units currently included in your Practice Set (InSet = true)';
		onlySetBtn.addEventListener('click', () => {
			this.regenerateSentencesOnlyFromSet(unitId);
			this.renderDetailsPane();
		});
		sentActions.appendChild(onlySetBtn);

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
		UnitSelectorView
	};
}
})();
