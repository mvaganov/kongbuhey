(function() {
// Universal Constants
const { K } = (typeof require !== 'undefined') ? require('../constants.js') : (typeof window !== 'undefined' ? window : {});

/**
 * webapp/decks_view.js
 *
 * Difficulty Decks & Prioritized Templates Inspector (Secret Debug UI).
 *
 * Responsibilities:
 *   1. Displays the pre-sorted Part-of-Speech difficulty decks (deck of cards
 *      per POS ordered by PriorityScore ascending: 1 easiest to 5 hardest).
 *   2. Displays the prioritized Verified Sentence structures sorted by
 *      difficulty score (average score of mandatory/grammar elements).
 *   3. Provides "Log to Console" buttons to dump decks and ranked structures
 *      directly to the browser developer console via console.table / console.log.
 *   4. Repurposes clean card layouts for intuitive debugging and verification.
 *
 * Platform: Node.js & Browser (Vanilla JS, zero external dependencies).
 */

let dataModule;
if (typeof require !== 'undefined') {
	try {
		dataModule = require('../data.js');
	} catch (_) {
		dataModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	dataModule = typeof window !== 'undefined' ? window : {};
}

let verifiedGeneratorModule;
if (typeof require !== 'undefined') {
	try {
		verifiedGeneratorModule = require('../korean/generation/verified_sentence_generator.js');
	} catch (_) {
		verifiedGeneratorModule = typeof window !== 'undefined' ? window : {};
	}
} else {
	verifiedGeneratorModule = typeof window !== 'undefined' ? window : {};
}

class DecksView {
	constructor(options = {}) {
		this.engine = options.engine || null;
		this.onStateChange = options.onStateChange || (() => {});

		this.container = null;
		this.activeTab = 'pos_decks'; // 'pos_decks' | 'verified_templates'
		this.selectedPos = 'All';
		this.selectedScore = 'All'; // 'All' | '1' | '2' | '3' | '4' | '5'
		this.searchQuery = '';
		this.feedbackNotice = null;
	}

	_getGenerator() {
		if (typeof window !== 'undefined' && window.verifiedSentenceGenerator) {
			return window.verifiedSentenceGenerator;
		}
		return verifiedGeneratorModule;
	}

	_getUnitsArray() {
		if (this.engine && Array.isArray(this.engine.rawUnits) && this.engine.rawUnits.length > 0) {
			return this.engine.rawUnits;
		}
		if (dataModule && Array.isArray(dataModule.KR_EN_languageUnits)) {
			return dataModule.KR_EN_languageUnits;
		}
		if (typeof window !== 'undefined' && Array.isArray(window.KR_EN_languageUnits)) {
			return window.KR_EN_languageUnits;
		}
		return [];
	}

	_getSchema() {
		return (dataModule && dataModule.DATA_SCHEMA)
			|| (typeof window !== 'undefined' && window.DATA_SCHEMA)
			|| { Id: 0, Korean: 1, English: 2, PartofSpeech: 3, SemanticTags: 4, PriorityScore: 8 };
	}

	mount(container) {
		this.container = container;
		this.render();
	}

	/**
	 * Dumps all POS difficulty decks directly to the browser console.
	 */
	logDecksToConsole() {
		const gen = this._getGenerator();
		const decks = gen.getPosDecks ? gen.getPosDecks() : {};
		const schema = this._getSchema();

		if (typeof console !== 'undefined') {
			if (typeof console.group === 'function') {
				console.group('🃏 Kongbuhey POS Difficulty Decks (Sorted by PriorityScore 1=Easiest)');
			}
			console.log('Total POS Decks:', Object.keys(decks).length);
			for (const [pos, units] of Object.entries(decks)) {
				const summaryRows = units.map(u => ({
					Id: u[schema.Id],
					Korean: u[schema.Korean],
					English: u[schema.English],
					PriorityScore: u[schema.PriorityScore] || 3,
					Tags: Array.from(u[schema.SemanticTags] || []).join(', ')
				}));
				if (typeof console.groupCollapsed === 'function') {
					console.groupCollapsed(`${pos} Deck (${units.length} units)`);
				}
				if (typeof console.table === 'function') {
					console.table(summaryRows.slice(0, 100));
					if (summaryRows.length > 100) {
						console.log(`... and ${summaryRows.length - 100} more units in ${pos} deck`);
					}
				} else {
					console.log(summaryRows);
				}
				if (typeof console.groupEnd === 'function') {
					console.groupEnd();
				}
			}
			if (typeof console.groupEnd === 'function') {
				console.groupEnd();
			}
		}

		this.feedbackNotice = '✓ Logged all 9 POS Difficulty Decks to Console (Press F12 to inspect).';
		this.render();
	}

	/**
	 * Dumps all Verified Sentence structures ranked by difficulty to the browser console.
	 */
	logTemplatesToConsole() {
		const gen = this._getGenerator();
		const templates = gen.getPrioritizedVerifiedSentences ? gen.getPrioritizedVerifiedSentences() : [];

		if (typeof console !== 'undefined') {
			if (typeof console.group === 'function') {
				console.group('📜 Kongbuhey Verified Sentences (Prioritized by Difficulty)');
			}
			console.log(`Total Verified Sentences: ${templates.length} (Ordered Easiest to Hardest)`);

			const rows = templates.map((t, idx) => ({
				Rank: idx + 1,
				Id: t.id,
				Difficulty: t.difficultyScore,
				Title: t.title,
				MandatoryCount: t.mandatoryElementsCount,
				MandatoryItems: (t.mandatoryElements || []).map(e => `${e.ko} (P${e.score})`).join(', ')
			}));

			if (typeof console.table === 'function') {
				console.table(rows.slice(0, 150));
				if (rows.length > 150) {
					console.log(`... and ${rows.length - 150} more templates`);
				}
			} else {
				console.log(rows);
			}

			if (typeof console.groupEnd === 'function') {
				console.groupEnd();
			}
		}

		this.feedbackNotice = `✓ Logged ${templates.length} Prioritized Templates to Console (Press F12 to inspect).`;
		this.render();
	}

	render() {
		if (!this.container) return;
		const gen = this._getGenerator();
		const decks = gen.getPosDecks ? gen.getPosDecks() : {};
		const schema = this._getSchema();
		const allUnits = this._getUnitsArray();

		const prioritizedTemplates = gen.getPrioritizedVerifiedSentences ? gen.getPrioritizedVerifiedSentences() : [];

		const posNames = Object.keys(decks);
		let activeUnitsList = [];
		if (this.selectedPos === 'All') {
			activeUnitsList = [...allUnits].sort((a, b) => {
				const pa = a[schema.PriorityScore] || 3;
				const pb = b[schema.PriorityScore] || 3;
				if (pa !== pb) return pa - pb;
				return a[schema.Id] - b[schema.Id];
			});
		} else {
			activeUnitsList = decks[this.selectedPos] || [];
		}

		// Apply score and search filters to POS units
		if (this.selectedScore !== 'All') {
			const sc = Number(this.selectedScore);
			activeUnitsList = activeUnitsList.filter(u => (u[schema.PriorityScore] || 3) === sc);
		}
		if (this.searchQuery.trim()) {
			const q = this.searchQuery.trim().toLowerCase();
			activeUnitsList = activeUnitsList.filter(u => {
				const ko = String(u[schema.Korean] || '').toLowerCase();
				const en = String(u[schema.English] || '').toLowerCase();
				const idStr = String(u[schema.Id]);
				return ko.includes(q) || en.includes(q) || idStr === q;
			});
		}

		// Apply search filter to Verified Sentences
		let filteredTemplates = prioritizedTemplates;
		if (this.searchQuery.trim()) {
			const q = this.searchQuery.trim().toLowerCase();
			filteredTemplates = prioritizedTemplates.filter(t => {
				const id = String(t.id || '').toLowerCase();
				const title = String(t.title || '').toLowerCase();
				const ko = String(t.originalKo || '').toLowerCase();
				return id.includes(q) || title.includes(q) || ko.includes(q);
			});
		}

		this.container.innerHTML = `
			<div class="decks-view-layout">
				<!-- Header with Subview Toggle & Console Actions -->
				<div class="decks-header-bar">
					<div class="decks-title-area">
						<h2>🛠️ Difficulty Decks &amp; Prioritized Templates Inspector</h2>
						<p class="decks-subtitle">
							Secret debug inspector for Part-of-Speech difficulty decks (PriorityScore 1=Easiest)
							and Verified Sentence structures ranked by mandatory element difficulty.
						</p>
					</div>
					<div class="decks-header-actions">
						<button type="button" class="btn btn-sm btn-ghost" id="btn-print-decks" title="Dump POS difficulty decks to browser console">
							🖨️ Log Decks to Console
						</button>
						<button type="button" class="btn btn-sm btn-ghost" id="btn-print-templates" title="Dump prioritized verified sentence structures to browser console">
							🖨️ Log Templates to Console
						</button>
					</div>
				</div>

				${this.feedbackNotice ? `
					<div class="decks-feedback-banner">
						<span>${this._escapeHtml(this.feedbackNotice)}</span>
						<button type="button" class="btn-close-notice" id="btn-close-decks-notice">✕</button>
					</div>
				` : ''}

				<!-- Subview Navigation Tabs -->
				<div class="decks-subnav">
					<button type="button" class="btn ${this.activeTab === 'pos_decks' ? 'btn-primary' : 'btn-secondary'}" id="tab-subview-pos">
						🃏 POS Difficulty Decks (${posNames.length} Decks)
					</button>
					<button type="button" class="btn ${this.activeTab === 'verified_templates' ? 'btn-primary' : 'btn-secondary'}" id="tab-subview-templates">
						📜 Prioritized Verified Sentences (${prioritizedTemplates.length} Structures)
					</button>
				</div>

				<!-- Filter & Search Toolbar -->
				<div class="decks-toolbar">
					<div class="decks-search-wrap">
						<input type="text" id="decks-search-input" class="decks-search-input"
							placeholder="${this.activeTab === 'pos_decks' ? 'Search units by Korean, English, or ID...' : 'Search templates by title, Korean, or ID...'}"
							value="${this._escapeHtml(this.searchQuery)}" />
						${this.searchQuery ? '<button type="button" class="btn-clear-search" id="btn-clear-decks-search">✕</button>' : ''}
					</div>

					${this.activeTab === 'pos_decks' ? `
						<div class="decks-pos-pills">
							<button type="button" class="deck-pos-pill ${this.selectedPos === 'All' ? 'active' : ''}" data-pos="All">
								All (${allUnits.length})
							</button>
							${posNames.map(pos => {
								const count = decks[pos] ? decks[pos].length : 0;
								return `
									<button type="button" class="deck-pos-pill ${this.selectedPos === pos ? 'active' : ''}" data-pos="${this._escapeHtml(pos)}">
										${this._escapeHtml(pos)} (${count})
									</button>
								`;
							}).join('')}
						</div>
						<div class="decks-score-pills">
							<span class="score-pills-label">Difficulty:</span>
							${['All', '0.5', '1', '2', '3', '4', '5'].map(sc => `
								<button type="button" class="deck-score-pill ${this.selectedScore === sc ? 'active' : ''}" data-score="${sc}">
									${sc === 'All' ? 'All Scores' : sc === '0.5' ? 'P0.5 (Ultra-Basic)' : `P${sc} ${sc === '1' ? '(Easiest)' : ''}`}
								</button>
							`).join('')}
						</div>
					` : `
						<div class="decks-templates-stats">
							<span>📊 <strong>${filteredTemplates.length}</strong> structures displayed. Rank 1 = lowest mandatory grammar difficulty score.</span>
						</div>
					`}
				</div>

				<!-- Main Content Area -->
				<div class="decks-content-scroll">
					${this.activeTab === 'pos_decks'
						? this._renderPosDecksContent(activeUnitsList, schema)
						: this._renderTemplatesContent(filteredTemplates)
					}
				</div>
			</div>
		`;

		this._bindEvents();
	}

	_renderPosDecksContent(unitsList, schema) {
		if (unitsList.length === 0) {
			return `
				<div class="decks-empty-state">
					No language units match your current POS or search criteria.
				</div>
			`;
		}

		return `
			<div class="deck-cards-grid">
				${unitsList.map((u, idx) => {
					const id = u[schema.Id];
					const ko = u[schema.Korean];
					const en = u[schema.English];
					const pos = u[schema.PartofSpeech];
					const score = u[schema.PriorityScore] || 3;
					const tags = Array.from(u[schema.SemanticTags] || []).slice(0, 4);

					let scoreBadgeClass = 'score-p3';
					let scoreLabel = `P${score}`;
					if (score === 1) {
						scoreBadgeClass = 'score-p1';
						scoreLabel = 'P1 Easiest';
					} else if (score === 2) {
						scoreBadgeClass = 'score-p2';
						scoreLabel = 'P2 Easy';
					} else if (score >= 4) {
						scoreBadgeClass = 'score-p4';
						scoreLabel = `P${score} Hard`;
					}

					return `
						<div class="deck-unit-card" data-unit-id="${id}">
							<div class="deck-card-top">
								<span class="deck-card-rank">#${idx + 1}</span>
								<span class="deck-card-score ${scoreBadgeClass}">${scoreLabel}</span>
								<span class="deck-card-id">ID ${id}</span>
							</div>
							<div class="deck-card-body">
								<div class="deck-card-ko">${this._escapeHtml(ko)}</div>
								<div class="deck-card-en">${this._escapeHtml(en)}</div>
							</div>
							<div class="deck-card-footer">
								<span class="deck-card-pos">${this._escapeHtml(pos)}</span>
								${tags.length > 0 ? `
									<span class="deck-card-tags">${tags.map(t => `<span class="deck-mini-tag">${this._escapeHtml(t)}</span>`).join('')}</span>
								` : ''}
							</div>
						</div>
					`;
				}).join('')}
			</div>
		`;
	}

	_renderTemplatesContent(templates) {
		if (templates.length === 0) {
			return `
				<div class="decks-empty-state">
					No Verified Sentence structures match your search.
				</div>
			`;
		}

		return `
			<div class="deck-templates-list">
				${templates.map((t, idx) => {
					let diffBadgeClass = 'diff-easy';
					if (t.difficultyScore > 2.8) {
						diffBadgeClass = 'diff-hard';
					} else if (t.difficultyScore > 1.8) {
						diffBadgeClass = 'diff-mid';
					}

					const mandatory = t.mandatoryElements || [];

					return `
						<div class="deck-template-card" data-template-id="${t.id}">
							<div class="deck-template-header">
								<div class="template-header-left">
									<span class="template-rank">Rank #${idx + 1}</span>
									<span class="template-diff-badge ${diffBadgeClass}">Difficulty: ${t.difficultyScore.toFixed(2)}</span>
									<strong class="template-id">[${this._escapeHtml(t.id)}]</strong>
								</div>
								<span class="template-elem-count">${t.mandatoryElementsCount} Mandatory Units</span>
							</div>
							<div class="deck-template-title">${this._escapeHtml(t.title)}</div>
							<div class="deck-template-ko">${this._escapeHtml(t.originalKo)}</div>
							${mandatory.length > 0 ? `
								<div class="deck-template-mandatory-row">
									<span class="mandatory-label">Mandatory Slots &amp; Grammar:</span>
									<div class="mandatory-badges">
										${mandatory.map(m => `
											<span class="mandatory-pill" title="${this._escapeHtml(m.type)} (#${m.unitId}) PriorityScore: ${m.score}">
												${this._escapeHtml(m.ko)} <span class="mandatory-score">P${m.score}</span>
											</span>
										`).join('')}
									</div>
								</div>
							` : ''}
						</div>
					`;
				}).join('')}
			</div>
		`;
	}

	_bindEvents() {
		if (!this.container) return;

		// Console dump buttons
		const btnPrintDecks = this.container.querySelector('#btn-print-decks');
		if (btnPrintDecks) {
			btnPrintDecks.addEventListener('click', () => this.logDecksToConsole());
		}
		const btnPrintTemplates = this.container.querySelector('#btn-print-templates');
		if (btnPrintTemplates) {
			btnPrintTemplates.addEventListener('click', () => this.logTemplatesToConsole());
		}

		// Notice close button
		const btnCloseNotice = this.container.querySelector('#btn-close-decks-notice');
		if (btnCloseNotice) {
			btnCloseNotice.addEventListener('click', () => {
				this.feedbackNotice = null;
				this.render();
			});
		}

		// Subview tabs
		const tabPos = this.container.querySelector('#tab-subview-pos');
		if (tabPos) {
			tabPos.addEventListener('click', () => {
				this.activeTab = 'pos_decks';
				this.render();
			});
		}
		const tabTemplates = this.container.querySelector('#tab-subview-templates');
		if (tabTemplates) {
			tabTemplates.addEventListener('click', () => {
				this.activeTab = 'verified_templates';
				this.render();
			});
		}

		// Search input
		const searchInp = this.container.querySelector('#decks-search-input');
		if (searchInp) {
			searchInp.addEventListener('input', (e) => {
				this.searchQuery = e.target.value;
				this.render();
			});
		}
		const btnClear = this.container.querySelector('#btn-clear-decks-search');
		if (btnClear) {
			btnClear.addEventListener('click', () => {
				this.searchQuery = '';
				this.render();
			});
		}

		// POS pills
		this.container.querySelectorAll('.deck-pos-pill').forEach(btn => {
			btn.addEventListener('click', () => {
				this.selectedPos = btn.dataset.pos || 'All';
				this.render();
			});
		});

		// Score pills
		this.container.querySelectorAll('.deck-score-pill').forEach(btn => {
			btn.addEventListener('click', () => {
				this.selectedScore = btn.dataset.score || 'All';
				this.render();
			});
		});
	}

	_escapeHtml(str) {
		return String(str || '')
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;');
	}
}

if (typeof window !== 'undefined') {
	window.DecksView = DecksView;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = { DecksView };
}
})();

