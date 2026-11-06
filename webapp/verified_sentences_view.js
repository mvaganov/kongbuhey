// Universal Constants
var { K } = (typeof require !== 'undefined') ? require('../constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * webapp/verified_sentences_view.js
 *
 * Browser-Pure UI Visualization & Editor for Verified Sentence Structures.
 *
 * Responsibilities:
 *   1. Lists all Verified Sentences (both hardcoded templates from verified_sentences.js
 *      and custom/runtime entries added via Text Ingestion or duplication).
 *   2. Displays each sentence's grammatical structure: slots, Parts of Speech,
 *      attached Grammar Language Units, and Semantic Tag filters.
 *   3. Clearly highlights when a slot's tag requirements narrow Language Unit
 *      choices down to a SINGLE choice (count === 1).
 *   4. Provides a button to generate (and regenerate) random test sentences
 *      using the selected Verified Sentence structure.
 *   5. Allows editing (adding or removing) semantic tag filters on each slot.
 *   6. Allows editing entry titles, creating new copies (clones) of entries to
 *      modify, and deleting custom entries while protecting hardcoded entries.
 */

class VerifiedSentencesView {
	constructor(options = {}) {
		this.engine = options.engine || null;
		this.onStateChange = options.onStateChange || (() => {});

		this.container = null;
		this.selectedTemplateId = null;
		this.searchQuery = '';
		this.sourceFilter = '';
		this.typeFilter = 'all'; // 'all' | 'hardcoded' | 'custom' | 'singleChoice'
		this.testSentence = null;
		this.testGenerationCount = 0;
		this._cachedAvailableTags = null;
	}

	_getGenerator() {
		if (typeof window !== 'undefined') {
			if (window.verifiedSentenceGenerator) return window.verifiedSentenceGenerator;
			if (typeof window.getAllVerifiedSentences === 'function') return window;
		}
		if (typeof require !== 'undefined') {
			try {
				return require('../korean/generation/verified_sentence_generator.js');
			} catch (_) {}
		}
		return null;
	}

	_getAvailableSemanticTags() {
		if (this._cachedAvailableTags) return this._cachedAvailableTags;
		const tagSet = new Set();
		const units = (this.engine && Array.isArray(this.engine.rawUnits))
			? this.engine.rawUnits
			: (typeof KR_EN_languageUnits !== 'undefined' ? KR_EN_languageUnits : []);
		for (let i = 0; i < units.length; i++) {
			const u = units[i];
			if (u && Array.isArray(u[4])) {
				for (const t of u[4]) {
					if (t) tagSet.add(String(t));
				}
			}
		}
		this._cachedAvailableTags = Array.from(tagSet).sort();
		return this._cachedAvailableTags;
	}

	mount(containerElement) {
		this.container = containerElement;
		const all = this.getAllEntries();
		if (!this.selectedTemplateId && all.length > 0) {
			this.selectedTemplateId = all[0].id;
			this.generateTestSentence(this.selectedTemplateId);
		}
		this.render();
	}

	getAllEntries() {
		const gen = this._getGenerator();
		if (!gen || typeof gen.getAllVerifiedSentences !== 'function') return [];
		return gen.getAllVerifiedSentences();
	}

	getFilteredEntries() {
		const gen = this._getGenerator();
		const all = this.getAllEntries();
		const q = this.searchQuery.trim().toLowerCase();

		return all.filter(tpl => {
			if (this.sourceFilter && tpl.source !== this.sourceFilter) {
				return false;
			}
			if (this.typeFilter === 'hardcoded' && !tpl.isHardcoded) {
				return false;
			}
			if (this.typeFilter === 'custom' && tpl.isHardcoded) {
				return false;
			}
			if (this.typeFilter === 'singleChoice' && gen) {
				const analysis = gen.analyzeTemplateStructure(tpl);
				if (!analysis || analysis.singleChoiceCount === 0) return false;
			}
			if (!q) return true;

			const titleMatch = String(tpl.title || '').toLowerCase().includes(q);
			const koMatch = String(tpl.originalKo || '').toLowerCase().includes(q);
			const srcMatch = String(tpl.source || '').toLowerCase().includes(q);
			const idMatch = String(tpl.id || '').toLowerCase().includes(q);
			if (titleMatch || koMatch || srcMatch || idMatch) return true;

			if (Array.isArray(tpl.slots)) {
				for (const s of tpl.slots) {
					if (String(s.pos || '').toLowerCase().includes(q)) return true;
					if (String(s.originalKo || '').toLowerCase().includes(q)) return true;
					if (Array.isArray(s.tags) && s.tags.some(t => String(t).toLowerCase().includes(q))) return true;
					if (Array.isArray(s.grammar) && s.grammar.some(g =>
						String(g.ko || g.text || '').toLowerCase().includes(q) ||
						String(g.en || '').toLowerCase().includes(q)
					)) {
						return true;
					}
				}
			}
			return false;
		});
	}

	getSelectedEntry() {
		const gen = this._getGenerator();
		if (!gen) return null;
		if (this.selectedTemplateId) {
			const found = gen.getVerifiedSentenceById(this.selectedTemplateId);
			if (found) return found;
		}
		const filtered = this.getFilteredEntries();
		if (filtered.length > 0) {
			this.selectedTemplateId = filtered[0].id;
			return filtered[0];
		}
		return null;
	}

	selectEntry(templateId) {
		this.selectedTemplateId = templateId;
		this.generateTestSentence(templateId);
		this.render();
		return this.getSelectedEntry();
	}

	/**
	 * Generates or regenerates a random test sentence from the specified Verified Sentence structure.
	 */
	generateTestSentence(templateId = this.selectedTemplateId, options = {}) {
		const gen = this._getGenerator();
		if (!gen || !templateId) return null;

		const tpl = gen.getVerifiedSentenceById(templateId);
		if (!tpl) return null;

		const prevKo = this.testSentence && this.testSentence.verifiedTemplateId === templateId
			? this.testSentence.ko
			: null;

		let candidate = null;
		for (let attempt = 0; attempt < 8; attempt++) {
			this.testGenerationCount++;
			const seedOffset = (options.seedOffset !== undefined)
				? Number(options.seedOffset) + attempt * 11
				: Math.floor(Math.random() * 997) + this.testGenerationCount * 17 + attempt * 13;

			candidate = gen.generateSentenceFromTemplate(tpl, {
				...options,
				variationIndex: this.testGenerationCount + attempt,
				seedOffset
			});
			if (candidate && candidate.ok && (!prevKo || candidate.ko !== prevKo)) {
				break;
			}
		}

		this.testSentence = candidate;
		if (this.container) {
			const testStage = this.container.querySelector('#verified-test-sentence-stage');
			if (testStage) {
				testStage.innerHTML = this._renderTestSentenceHtml(tpl, this.testSentence);
				this._bindTestStageEvents();
			}
		}
		this.onStateChange({
			type: 'verified-test-generated',
			templateId,
			sentence: candidate
		});
		return candidate;
	}

	/**
	 * Updates the title of a Verified Sentence entry.
	 */
	updateTitle(templateId, newTitle) {
		const gen = this._getGenerator();
		if (!gen) return null;
		const updated = gen.updateVerifiedSentenceTitle(templateId, newTitle);
		if (updated) {
			this.render();
			this.onStateChange({ type: 'verified-title-updated', templateId, title: updated.title });
		}
		return updated;
	}

	/**
	 * Adds a semantic tag filter to a slot in a Verified Sentence entry.
	 */
	addTagToSlot(templateId, slotIndex, tag) {
		const gen = this._getGenerator();
		if (!gen) return null;
		const cleanTag = String(tag || '').trim();
		if (!cleanTag) return null;
		const updated = gen.addTagToVerifiedSlot(templateId, Number(slotIndex), cleanTag);
		if (updated) {
			this.generateTestSentence(templateId);
			this.render();
			this.onStateChange({ type: 'verified-slot-tag-added', templateId, slotIndex, tag: cleanTag });
		}
		return updated;
	}

	/**
	 * Removes a semantic tag filter from a slot in a Verified Sentence entry.
	 */
	removeTagFromSlot(templateId, slotIndex, tag) {
		const gen = this._getGenerator();
		if (!gen) return null;
		const updated = gen.removeTagFromVerifiedSlot(templateId, Number(slotIndex), tag);
		if (updated) {
			this.generateTestSentence(templateId);
			this.render();
			this.onStateChange({ type: 'verified-slot-tag-removed', templateId, slotIndex, tag });
		}
		return updated;
	}

	/**
	 * Creates a new editable copy (duplicate) of a Verified Sentence entry.
	 */
	duplicateEntry(templateId, customTitle = null) {
		const gen = this._getGenerator();
		if (!gen) return null;
		const cloned = gen.cloneVerifiedSentence(templateId, customTitle);
		if (cloned) {
			this.selectedTemplateId = cloned.id;
			this.generateTestSentence(cloned.id);
			this.render();
			this.onStateChange({ type: 'verified-entry-duplicated', sourceId: templateId, cloned });
		}
		return cloned;
	}

	/**
	 * Deletes a custom Verified Sentence entry (hardcoded entries cannot be deleted).
	 */
	deleteEntry(templateId) {
		const gen = this._getGenerator();
		if (!gen) return { ok: false, reason: 'Generator unavailable' };
		const res = gen.deleteVerifiedSentence(templateId);
		if (res && res.ok) {
			if (this.selectedTemplateId === templateId) {
				const remaining = this.getFilteredEntries();
				this.selectedTemplateId = remaining.length > 0 ? remaining[0].id : null;
				if (this.selectedTemplateId) {
					this.generateTestSentence(this.selectedTemplateId);
				} else {
					this.testSentence = null;
				}
			}
			this.render();
			this.onStateChange({ type: 'verified-entry-deleted', templateId });
		}
		return res;
	}

	/**
	 * Resets overrides on a hardcoded Verified Sentence entry back to its original defaults.
	 */
	resetHardcodedEntry(templateId) {
		const gen = this._getGenerator();
		if (!gen) return false;
		const ok = gen.resetHardcodedVerifiedSentence(templateId);
		if (ok) {
			this.generateTestSentence(templateId);
			this.render();
			this.onStateChange({ type: 'verified-entry-reset', templateId });
		}
		return ok;
	}

	render() {
		if (!this.container) return;
		const gen = this._getGenerator();
		const allEntries = this.getAllEntries();
		const filteredEntries = this.getFilteredEntries();
		const selected = this.getSelectedEntry();

		const sources = Array.from(new Set(allEntries.map(e => e.source).filter(Boolean))).sort();
		const hardcodedCount = allEntries.filter(e => e.isHardcoded).length;
		const customCount = allEntries.filter(e => !e.isHardcoded).length;
		const availableTags = this._getAvailableSemanticTags();

		this.container.innerHTML = `
			<div class="verified-sentences-layout">
				<!-- Left Pane: Searchable & Filterable List of Verified Sentence Templates -->
				<aside class="verified-list-pane">
					<div class="verified-list-header">
						<div class="verified-list-title-row">
							<h2>🏛️ Verified Sentences</h2>
							<span class="badge-count" title="Showing ${filteredEntries.length} of ${allEntries.length} templates">
								${filteredEntries.length} / ${allEntries.length}
							</span>
						</div>
						<p class="verified-list-subtitle">
							Sentence templates discovered from study texts (${hardcodedCount} hardcoded · ${customCount} custom/runtime).
						</p>

						<div class="verified-filter-controls">
							<input type="search" id="verified-search-input" class="verified-search-input"
								placeholder="Search title, Korean, grammar, tags..."
								value="${this._escapeHtml(this.searchQuery)}">
							<div class="verified-filter-row">
								<select id="verified-type-filter" class="verified-filter-select" title="Filter by Entry Type">
									<option value="all" ${this.typeFilter === 'all' ? 'selected' : ''}>All Templates (${allEntries.length})</option>
									<option value="hardcoded" ${this.typeFilter === 'hardcoded' ? 'selected' : ''}>🔒 Hardcoded (${hardcodedCount})</option>
									<option value="custom" ${this.typeFilter === 'custom' ? 'selected' : ''}>✨ Custom / Copies (${customCount})</option>
									<option value="singleChoice" ${this.typeFilter === 'singleChoice' ? 'selected' : ''}>🎯 Has 1-Choice Slot</option>
								</select>
								<select id="verified-source-filter" class="verified-filter-select" title="Filter by Study Text Source">
									<option value="">All Sources (${sources.length})</option>
									${sources.map(src => `
										<option value="${this._escapeHtml(src)}" ${this.sourceFilter === src ? 'selected' : ''}>
											${this._escapeHtml(src)}
										</option>
									`).join('')}
								</select>
							</div>
						</div>
					</div>

					<div id="verified-entries-list" class="verified-entries-list">
						${filteredEntries.length === 0 ? `
							<div class="verified-empty-list">
								No Verified Sentence structures match the current filters.
							</div>
						` : filteredEntries.map(tpl => {
							const isSelected = selected && selected.id === tpl.id;
							const analysis = gen ? gen.analyzeTemplateStructure(tpl) : null;
							const singleCount = analysis ? analysis.singleChoiceCount : 0;
							return `
								<div class="verified-entry-item ${isSelected ? 'active' : ''}" data-template-id="${this._escapeHtml(tpl.id)}">
									<div class="verified-entry-badges">
										<span class="verified-origin-badge ${tpl.isHardcoded ? 'badge-hardcoded' : 'badge-custom'}">
											${tpl.isHardcoded ? '🔒 Hardcoded' : '✨ Custom'}
										</span>
										<span class="verified-source-badge">${this._escapeHtml(tpl.source || K.CUSTOM_PASSAGE)}</span>
										${singleCount > 0 ? `
											<span class="verified-single-pill" title="${singleCount} slot(s) restricted to a single Language Unit choice">
												🎯 ${singleCount} Single-Choice
											</span>
										` : ''}
									</div>
									<div class="verified-entry-title">${this._escapeHtml(tpl.title)}</div>
									<div class="verified-entry-ko">${this._escapeHtml(tpl.originalKo)}</div>
									<div class="verified-entry-meta">
										<span>${tpl.slots ? tpl.slots.length : 0} POS slots</span>
										<span>·</span>
										<span>${tpl.grammarUnitIds ? tpl.grammarUnitIds.length : 0} grammar units</span>
									</div>
								</div>
							`;
						}).join('')}
					</div>
				</aside>

				<!-- Right Pane: Selected Verified Sentence Structure & Interactive Controls -->
				<section class="verified-detail-pane">
					${selected ? this._renderDetailPaneHtml(selected, gen) : `
						<div class="verified-empty-detail">
							<h3>Select a Verified Sentence structure from the left</h3>
							<p>Inspect its grammatical structure, edit slot semantic tag filters, or generate random test sentences.</p>
						</div>
					`}
				</section>

				<!-- Datalist of all curriculum semantic tags for quick tag autocomplete -->
				<datalist id="verified-semantic-tags-datalist">
					${availableTags.map(t => `<option value="${this._escapeHtml(t)}"></option>`).join('')}
				</datalist>
			</div>
		`;

		this._bindEvents();
	}

	_renderDetailPaneHtml(tpl, gen) {
		const analysis = gen ? gen.analyzeTemplateStructure(tpl) : { slotStats: [], singleChoiceCount: 0, zeroChoiceCount: 0, totalCombinations: 1 };
		const units = (this.engine && Array.isArray(this.engine.rawUnits))
			? this.engine.rawUnits
			: (typeof KR_EN_languageUnits !== 'undefined' ? KR_EN_languageUnits : []);

		// Collect unique grammar units used in this template
		const grammarSummaryList = [];
		const seenGrammarIds = new Set();
		for (const slot of (tpl.slots || [])) {
			for (const g of (slot.grammar || [])) {
				const key = typeof g.unitId === 'number' ? `id_${g.unitId}` : `txt_${g.text}`;
				if (seenGrammarIds.has(key)) continue;
				seenGrammarIds.add(key);
				const gUnit = (typeof g.unitId === 'number' && units[g.unitId]) ? units[g.unitId] : null;
				grammarSummaryList.push({
					unitId: g.unitId,
					ko: gUnit ? gUnit[1] : (g.ko || g.text),
					en: gUnit ? gUnit[2] : (g.en || ''),
					pos: g.pos || K.GRAMMAR,
					surfaceText: g.text
				});
			}
		}

		if (!this.testSentence || this.testSentence.verifiedTemplateId !== tpl.id) {
			this.testSentence = gen ? gen.generateSentenceFromTemplate(tpl, { seedOffset: this.testGenerationCount * 13 }) : null;
		}

		return `
			<!-- 1. Entry Header: Title Editor, Origin Status, Copy & Delete Controls -->
			<header class="verified-detail-header-card">
				<div class="verified-header-top-row">
					<div class="verified-header-badges">
						<span class="verified-origin-badge ${tpl.isHardcoded ? 'badge-hardcoded' : 'badge-custom'}">
							${tpl.isHardcoded ? '🔒 Hardcoded Entry (Non-Deletable)' : '✨ Custom / Editable Entry (Deletable)'}
						</span>
						<span class="verified-source-badge">Source: ${this._escapeHtml(tpl.source || K.CUSTOM_PASSAGE)}</span>
						<span class="verified-combo-badge" title="Total distinct sentences that can be synthesized from current slot pools">
							🔢 ${Number(analysis.totalCombinations || 1).toLocaleString()} possible combinations
						</span>
						${analysis.singleChoiceCount > 0 ? `
							<span class="verified-single-pill">
								🎯 ${analysis.singleChoiceCount} Single-Choice Slot${analysis.singleChoiceCount > 1 ? 's' : ''}
							</span>
						` : ''}
					</div>

					<div class="verified-header-actions">
						<button type="button" id="btn-verified-duplicate" class="btn btn-secondary btn-sm"
							title="Create a new editable copy of this Verified Sentence entry">
							📋 Duplicate / New Copy
						</button>
						${tpl.isHardcoded ? `
							<button type="button" id="btn-verified-reset-hardcoded" class="btn btn-ghost btn-sm"
								title="Reset title and slot tag filters back to original study text defaults">
								↺ Reset Defaults
							</button>
							<button type="button" id="btn-verified-delete" class="btn btn-ghost btn-sm btn-disabled-locked" disabled
								title="Hardcoded entries from verified_sentences.js cannot be deleted. Duplicate to create a custom deletable entry.">
								🔒 Hardcoded (Cannot Delete)
							</button>
						` : `
							<button type="button" id="btn-verified-delete" class="btn btn-danger btn-sm"
								title="Delete this custom Verified Sentence entry">
								🗑️ Delete Entry
							</button>
						`}
					</div>
				</div>

				<!-- Editable Entry Title -->
				<div class="verified-title-editor-row">
					<label for="verified-title-input" class="verified-title-label">Entry Title:</label>
					<input type="text" id="verified-title-input" class="verified-title-input"
						value="${this._escapeHtml(tpl.title)}" placeholder="Enter a descriptive title for this sentence structure...">
					<button type="button" id="btn-verified-save-title" class="btn btn-primary btn-sm">
						💾 Save Title
					</button>
				</div>

				<div class="verified-original-sentence-bar">
					<span class="original-label">Original Study Text Sentence:</span>
					<strong class="original-ko-text">${this._escapeHtml(tpl.originalKo)}</strong>
				</div>
			</header>

			<!-- 2. Interactive Test Sentence Generator Card -->
			<section class="verified-test-generator-card">
				<div class="verified-test-header">
					<div>
						<h3>🎲 Test Sentence Generator</h3>
						<p class="verified-card-desc">
							Generate random sentences using this Verified Sentence structure and its current slot tag filters.
						</p>
					</div>
					<button type="button" id="btn-verified-generate-test" class="btn btn-primary"
						title="Generate a new random sentence from this Verified Sentence structure">
						🎲 Generate / Regenerate Test Sentence
					</button>
				</div>
				<div id="verified-test-sentence-stage" class="verified-test-sentence-stage">
					${this._renderTestSentenceHtml(tpl, this.testSentence)}
				</div>
			</section>

			<!-- 3. Grammar Language Units Summary -->
			<section class="verified-grammar-summary-card">
				<h3>🧩 Grammar Language Units Used (${grammarSummaryList.length})</h3>
				${grammarSummaryList.length === 0 ? `
					<p class="empty-list-notice">No explicit grammar particles or endings recorded on this structure.</p>
				` : `
					<div class="verified-grammar-chips-wrap">
						${grammarSummaryList.map(g => `
							<div class="verified-grammar-chip">
								<span class="grammar-chip-id">${typeof g.unitId === 'number' ? `#${g.unitId}` : 'Morph'}</span>
								<strong class="grammar-chip-ko">${this._escapeHtml(g.ko)}</strong>
								<span class="grammar-chip-pos">${this._escapeHtml(g.pos)}</span>
								<span class="grammar-chip-en">${this._escapeHtml(g.en)}</span>
							</div>
						`).join('')}
					</div>
				`}
			</section>

			<!-- 4. Slot-by-Slot Structure & Semantic Tag Filter Editor -->
			<section class="verified-slots-section">
				<div class="verified-slots-header">
					<h3>🔬 Sentence Structure Slots &amp; Semantic Tag Filters (${tpl.slots ? tpl.slots.length : 0} Slots)</h3>
					<p class="verified-card-desc">
						Add or remove semantic tags on any slot to broaden or narrow which Language Units can be chosen.
						Slots narrowed to a single Language Unit choice are highlighted with 🎯.
					</p>
				</div>

				<div class="verified-slots-grid">
					${(tpl.slots || []).map((slot, idx) => {
						const stat = analysis.slotStats[idx] || {
							count: 0,
							isSingleChoice: false,
							isZeroChoice: true,
							singleChoiceUnit: null,
							sampleUnits: []
						};
						return this._renderSlotCardHtml(tpl, slot, idx, stat);
					}).join('')}
				</div>
			</section>
		`;
	}

	_renderTestSentenceHtml(tpl, sentenceObj) {
		if (!sentenceObj || !sentenceObj.ok) {
			return `
				<div class="verified-test-empty">
					Click <strong>🎲 Generate / Regenerate Test Sentence</strong> to synthesize a sentence from this template.
				</div>
			`;
		}

		return `
			<div class="verified-test-output">
				<div class="verified-test-main-row">
					<div class="verified-test-ko-group">
						<span class="verified-test-ko">${this._escapeHtml(sentenceObj.ko)}</span>
						${sentenceObj.pronunciation && sentenceObj.pronunciation !== sentenceObj.ko ? `
							<span class="verified-test-pron">[${this._escapeHtml(sentenceObj.pronunciation)}]</span>
						` : ''}
					</div>
				</div>
				<div class="verified-test-translations">
					<div class="verified-test-en-row">
						<span class="en-type-badge">Literal</span>
						<span class="en-text">${this._escapeHtml(sentenceObj.enLiteral || sentenceObj.en || '')}</span>
					</div>
					<div class="verified-test-en-row">
						<span class="en-type-badge badge-natural">Natural</span>
						<span class="en-text">${this._escapeHtml(sentenceObj.enNatural || '')}</span>
					</div>
				</div>
				${Array.isArray(sentenceObj.slotChoices) && sentenceObj.slotChoices.length > 0 ? `
					<div class="verified-test-slot-breakdown">
						${sentenceObj.slotChoices.map(sc => `
							<div class="test-slot-pill">
								<span class="test-slot-num">#${sc.slotIndex + 1} ${this._escapeHtml(sc.pos)}</span>
								<strong class="test-slot-surface">${this._escapeHtml(sc.surfaceKo)}</strong>
								<span class="test-slot-unit">
									← ${this._escapeHtml(sc.chosenKo)}
									${typeof sc.chosenUnitId === 'number' ? `(#${sc.chosenUnitId})` : ''}
									"${this._escapeHtml(sc.chosenEn)}"
								</span>
							</div>
						`).join('')}
					</div>
				` : ''}
			</div>
		`;
	}

	_renderSlotCardHtml(tpl, slot, idx, stat) {
		const tags = Array.isArray(slot.tags) ? slot.tags : [];
		const grammarList = Array.isArray(slot.grammar) ? slot.grammar : [];
		const isFixedGrammar = slot.inflection && slot.inflection.stemForm === 'fixed_grammar';

		let poolBannerHtml = '';
		if (stat.isSingleChoice) {
			const singleKo = stat.singleChoiceUnit ? stat.singleChoiceUnit.ko : slot.originalKo;
			const singleEn = stat.singleChoiceUnit ? stat.singleChoiceUnit.en : slot.originalEn;
			const singleId = stat.singleChoiceUnit ? stat.singleChoiceUnit.id : slot.originalUnitId;
			poolBannerHtml = `
				<div class="slot-pool-banner slot-pool-single" data-single-choice="true">
					<div class="pool-banner-title">
						🎯 <strong>SINGLE LANGUAGE UNIT CHOICE (1 Option Only)</strong>
					</div>
					<div class="pool-banner-detail">
						Current tag requirements restrict this <strong>${this._escapeHtml(slot.pos)}</strong> slot to a single unit:
						<strong>${this._escapeHtml(singleKo)}</strong> (#${singleId} — "${this._escapeHtml(singleEn)}").
						${!isFixedGrammar && tags.length > 0 ? 'Remove a tag below to allow more vocabulary choices.' : ''}
					</div>
				</div>
			`;
		} else if (stat.isZeroChoice) {
			poolBannerHtml = `
				<div class="slot-pool-banner slot-pool-zero">
					⚠️ <strong>0 Matching Units</strong> for this tag combination (falls back to original unit
					<strong>${this._escapeHtml(slot.originalKo)}</strong> #${slot.originalUnitId}). Remove restrictive tags below.
				</div>
			`;
		} else {
			const samples = (stat.sampleUnits || []).map(u => `${u.ko} (#${u.id})`).join(', ');
			poolBannerHtml = `
				<div class="slot-pool-banner slot-pool-multi">
					<div class="pool-banner-title">
						✓ <strong>${stat.count.toLocaleString()} Matching ${this._escapeHtml(slot.pos)} Units</strong> available in pool
					</div>
					${samples ? `<div class="pool-banner-detail">Examples: ${this._escapeHtml(samples)}${stat.count > 8 ? ', ...' : ''}</div>` : ''}
				</div>
			`;
		}

		return `
			<div class="verified-slot-card ${stat.isSingleChoice ? 'slot-card-single-choice' : ''}" data-slot-index="${idx}">
				<div class="slot-card-header">
					<div class="slot-header-left">
						<span class="slot-index-badge">Slot #${idx + 1}</span>
						<span class="slot-pos-badge">${this._escapeHtml(slot.pos)}</span>
						<strong class="slot-surface-preview">"${this._escapeHtml(slot.originalSurface)}"</strong>
					</div>
					<div class="slot-original-unit-meta">
						Original: <strong>${this._escapeHtml(slot.originalKo)}</strong>
						${typeof slot.originalUnitId === 'number' ? `(#${slot.originalUnitId})` : ''}
						— "${this._escapeHtml(slot.originalEn || '')}"
					</div>
				</div>

				${poolBannerHtml}

				<!-- Attached Grammar / Inflection Info -->
				<div class="slot-grammar-row">
					<span class="slot-section-label">Attached Grammar / Morphology:</span>
					${grammarList.length > 0 ? grammarList.map(g => `
						<span class="slot-grammar-badge">
							<strong>${this._escapeHtml(g.ko || g.text)}</strong>
							<small>[${this._escapeHtml(g.pos || K.GRAMMAR)}${typeof g.unitId === 'number' ? ` #${g.unitId}` : ''}]</small>
							${g.en ? `— ${this._escapeHtml(g.en)}` : ''}
						</span>
					`).join('') : `
						<span class="slot-no-grammar">Bare stem / uninflected (${this._escapeHtml(slot.morphTemplate || 'nominal')})</span>
					`}
				</div>

				<!-- Semantic Tag Filters Editor -->
				<div class="slot-tags-editor">
					<div class="slot-tags-label-row">
						<span class="slot-section-label">Semantic Tag Filters (${tags.length}):</span>
					</div>
					<div class="slot-tags-chips">
						${tags.length === 0 ? `
							<span class="slot-no-tags-notice">No tag filters applied (any ${this._escapeHtml(slot.pos)} allowed)</span>
						` : tags.map(t => `
							<span class="slot-tag-chip" data-slot-index="${idx}" data-tag="${this._escapeHtml(t)}">
								<span class="tag-chip-text">${this._escapeHtml(t)}</span>
								<button type="button" class="btn-remove-slot-tag"
									data-slot-index="${idx}" data-tag="${this._escapeHtml(t)}"
									title="Remove tag filter '${this._escapeHtml(t)}'">×</button>
							</span>
						`).join('')}
					</div>

					${!isFixedGrammar ? `
						<div class="slot-add-tag-row">
							<input type="text" class="slot-add-tag-input" data-slot-index="${idx}"
								list="verified-semantic-tags-datalist"
								placeholder="Add semantic tag filter (e.g. person, food, place)...">
							<button type="button" class="btn btn-secondary btn-sm btn-add-slot-tag" data-slot-index="${idx}">
								+ Add Tag
							</button>
						</div>
					` : ''}
				</div>
			</div>
		`;
	}

	_bindEvents() {
		if (!this.container) return;

		const searchInput = this.container.querySelector('#verified-search-input');
		if (searchInput) {
			searchInput.addEventListener('input', () => {
				this.searchQuery = searchInput.value;
				this.render();
				const nextInput = this.container.querySelector('#verified-search-input');
				if (nextInput) {
					nextInput.focus();
					nextInput.setSelectionRange(nextInput.value.length, nextInput.value.length);
				}
			});
		}

		const typeSelect = this.container.querySelector('#verified-type-filter');
		if (typeSelect) {
			typeSelect.addEventListener('change', () => {
				this.typeFilter = typeSelect.value;
				this.render();
			});
		}

		const srcSelect = this.container.querySelector('#verified-source-filter');
		if (srcSelect) {
			srcSelect.addEventListener('change', () => {
				this.sourceFilter = srcSelect.value;
				this.render();
			});
		}

		// Entry list selection
		this.container.querySelectorAll('.verified-entry-item').forEach(item => {
			item.addEventListener('click', () => {
				const id = item.dataset.templateId;
				if (id) this.selectEntry(id);
			});
		});

		// Save Title button & Enter key
		const titleInput = this.container.querySelector('#verified-title-input');
		const saveTitleBtn = this.container.querySelector('#btn-verified-save-title');
		if (saveTitleBtn && titleInput && this.selectedTemplateId) {
			const commitTitle = () => {
				const newTitle = titleInput.value.trim();
				if (newTitle) {
					this.updateTitle(this.selectedTemplateId, newTitle);
				}
			};
			saveTitleBtn.addEventListener('click', commitTitle);
			titleInput.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					commitTitle();
				}
			});
		}

		// Duplicate / Clone button
		const dupBtn = this.container.querySelector('#btn-verified-duplicate');
		if (dupBtn && this.selectedTemplateId) {
			dupBtn.addEventListener('click', () => {
				this.duplicateEntry(this.selectedTemplateId);
			});
		}

		// Reset Hardcoded Defaults button
		const resetBtn = this.container.querySelector('#btn-verified-reset-hardcoded');
		if (resetBtn && this.selectedTemplateId) {
			resetBtn.addEventListener('click', () => {
				this.resetHardcodedEntry(this.selectedTemplateId);
			});
		}

		// Delete Custom Entry button
		const delBtn = this.container.querySelector('#btn-verified-delete');
		if (delBtn && !delBtn.disabled && this.selectedTemplateId) {
			delBtn.addEventListener('click', () => {
				this.deleteEntry(this.selectedTemplateId);
			});
		}

		// Generate / Regenerate Test Sentence button
		const genBtn = this.container.querySelector('#btn-verified-generate-test');
		if (genBtn && this.selectedTemplateId) {
			genBtn.addEventListener('click', () => {
				this.generateTestSentence(this.selectedTemplateId);
			});
		}

		// Remove Tag from Slot buttons
		this.container.querySelectorAll('.btn-remove-slot-tag').forEach(btn => {
			btn.addEventListener('click', (e) => {
				e.stopPropagation();
				const slotIdx = Number(btn.dataset.slotIndex);
				const tag = btn.dataset.tag;
				if (this.selectedTemplateId && tag) {
					this.removeTagFromSlot(this.selectedTemplateId, slotIdx, tag);
				}
			});
		});

		// Add Tag to Slot buttons & Enter key
		this.container.querySelectorAll('.btn-add-slot-tag').forEach(btn => {
			btn.addEventListener('click', () => {
				const slotIdx = Number(btn.dataset.slotIndex);
				const input = this.container.querySelector(`.slot-add-tag-input[data-slot-index="${slotIdx}"]`);
				if (input && input.value.trim() && this.selectedTemplateId) {
					this.addTagToSlot(this.selectedTemplateId, slotIdx, input.value.trim());
				}
			});
		});

		this.container.querySelectorAll('.slot-add-tag-input').forEach(input => {
			input.addEventListener('keydown', (e) => {
				if (e.key === 'Enter') {
					e.preventDefault();
					const slotIdx = Number(input.dataset.slotIndex);
					if (input.value.trim() && this.selectedTemplateId) {
						this.addTagToSlot(this.selectedTemplateId, slotIdx, input.value.trim());
					}
				}
			});
		});

		this._bindTestStageEvents();
	}

	_bindTestStageEvents() {
		// Reserved for any interactive controls inside the test sentence stage
	}

	_escapeHtml(str) {
		return String(str ?? '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}
}

if (typeof window !== 'undefined') {
	window.VerifiedSentencesView = VerifiedSentencesView;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = { VerifiedSentencesView };
}
