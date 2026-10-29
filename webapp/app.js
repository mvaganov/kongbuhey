/**
 * ============================================================================
 * webapp/app.js - Kongbuhey Single-Page Application Controller
 * ============================================================================
 *
 * Coordinates:
 *   1. SPA View Switching (Spreadsheet View <-> Practice Set / Flashcard View)
 *      without reloading data.js.
 *   2. Toolbar Filters, Search, and Bulk Practice Set (InSet) Actions.
 *   3. Custom Column Creation, Editing, and Deletion Modals.
 *   4. Column Visibility, Reordering, and View Reset Controls.
 *   5. Flashcard Queue Sorting & Evaluation using the 6 flashcard columns:
 *      InSet, RecognitionScore, LongTermRecognition, TimeStampLastCorrect,
 *      TimeStampLastSeen, notes.
 */

const LONG_TERM_ORDER = {
	unknown: 0,
	recognized: 1,
	definitionKnown: 2,
	knownByDefinition: 3
};

/**
 * Sorts a list of language unit IDs for Flashcard mode based on:
 *   1. LongTermRecognition tier (unknown -> recognized -> definitionKnown -> knownByDefinition)
 *   2. RecognitionScore ascending (lower score needs practice first)
 *   3. TimeStampLastCorrect ascending (oldest correct first)
 *   4. TimeStampLastSeen ascending (least recently seen first)
 *   5. PriorityScore ascending (1 = core vocabulary first)
 */
function sortPracticeSetUnits(unitIds, engine) {
	return [...unitIds].sort((idA, idB) => {
		const ltrA = String(engine.getCellValue(idA, 'LongTermRecognition') || 'unknown');
		const ltrB = String(engine.getCellValue(idB, 'LongTermRecognition') || 'unknown');
		const tierA = LONG_TERM_ORDER[ltrA] ?? 0;
		const tierB = LONG_TERM_ORDER[ltrB] ?? 0;
		if (tierA !== tierB) return tierA - tierB;

		const scoreA = Number(engine.getCellValue(idA, 'RecognitionScore')) || 0;
		const scoreB = Number(engine.getCellValue(idB, 'RecognitionScore')) || 0;
		if (scoreA !== scoreB) return scoreA - scoreB;

		const corrA = Number(engine.getCellValue(idA, 'TimeStampLastCorrect')) || 0;
		const corrB = Number(engine.getCellValue(idB, 'TimeStampLastCorrect')) || 0;
		if (corrA !== corrB) return corrA - corrB;

		const seenA = Number(engine.getCellValue(idA, 'TimeStampLastSeen')) || 0;
		const seenB = Number(engine.getCellValue(idB, 'TimeStampLastSeen')) || 0;
		if (seenA !== seenB) return seenA - seenB;

		const prioA = Number(engine.getCellValue(idA, 'PriorityScore')) || 3;
		const prioB = Number(engine.getCellValue(idB, 'PriorityScore')) || 3;
		if (prioA !== prioB) return prioA - prioB;

		return idA - idB;
	});
}

/**
 * Evaluates a user's flashcard response ('again' | 'recognized' | 'definitionKnown' | 'knownByDefinition')
 * and updates RecognitionScore, LongTermRecognition, TimeStampLastSeen, and TimeStampLastCorrect.
 */
async function evaluateFlashcardAttempt(engine, unitId, outcome) {
	const nowUnix = Math.floor(Date.now() / 1000);
	const currentScore = Number(engine.getCellValue(unitId, 'RecognitionScore')) || 0;

	let newScore = currentScore;
	let newLtr = String(engine.getCellValue(unitId, 'LongTermRecognition') || 'unknown');
	let isCorrect = false;

	if (outcome === 'again') {
		newScore = Math.max(0, currentScore - 1);
		newLtr = 'unknown';
	} else if (outcome === 'recognized') {
		newScore = currentScore + 1;
		newLtr = 'recognized';
		isCorrect = true;
	} else if (outcome === 'definitionKnown') {
		newScore = currentScore + 2;
		newLtr = 'definitionKnown';
		isCorrect = true;
	} else if (outcome === 'knownByDefinition') {
		newScore = currentScore + 3;
		newLtr = 'knownByDefinition';
		isCorrect = true;
	}

	await engine.setCellValue(unitId, 'RecognitionScore', newScore);
	await engine.setCellValue(unitId, 'LongTermRecognition', newLtr);
	await engine.setCellValue(unitId, 'TimeStampLastSeen', nowUnix);
	if (isCorrect) {
		await engine.setCellValue(unitId, 'TimeStampLastCorrect', nowUnix);
	}

	return {
		unitId,
		RecognitionScore: newScore,
		LongTermRecognition: newLtr,
		TimeStampLastSeen: nowUnix,
		TimeStampLastCorrect: isCorrect ? nowUnix : (Number(engine.getCellValue(unitId, 'TimeStampLastCorrect')) || 0)
	};
}

class KongbuheyApp {
	constructor() {
		this.db = new KongbuheyDB();
		this.engine = new SpreadsheetEngine({
			db: this.db,
			onStateChange: (evt) => this.handleEngineEvent(evt)
		});
		this.activeView = 'spreadsheet';
		this.flashcardRevealed = false;
	}

	async start() {
		this._populateFilterDropdowns();
		this._bindNavigationEvents();
		this._bindToolbarEvents();
		this._bindModalEvents();

		const mountEl = document.getElementById('spreadsheet-container');
		if (mountEl) {
			this.engine.mount(mountEl);
		}

		this._setDbStatus('Loading DB...', true);
		await this.engine.init();
		this._setDbStatus('DB Synced', false);
		this.updateStatsBar();
	}

	_setDbStatus(label, isSaving = false) {
		const dot = document.getElementById('db-status-dot');
		const txt = document.getElementById('db-status-text');
		if (txt) txt.textContent = label;
		if (dot) {
			dot.classList.toggle('status-saving', isSaving);
			dot.classList.toggle('status-online', !isSaving);
		}
	}

	handleEngineEvent(evt) {
		if (!evt) return;
		if (evt.type === 'async-batch') {
			this._setDbStatus(`Loading (${evt.loaded})...`, true);
			this.updateStatsBar();
			return;
		}
		if (evt.type === 'ready') {
			this._setDbStatus('DB Synced', false);
			this.updateStatsBar();
			return;
		}
		if (evt.type === 'request-edit-column') {
			this.openColumnModal(evt.column);
			return;
		}
		if (evt.type === 'request-delete-column') {
			this.handleDeleteColumnRequest(evt.column);
			return;
		}
		if (evt.type === 'request-move-row') {
			this.openMoveRowModal(evt.unitId, evt.currentIndex);
			return;
		}

		this._setDbStatus('DB Synced', false);
		this.updateStatsBar();
		if (this.activeView === 'practice') {
			this.renderPracticeView();
		}
	}

	_populateFilterDropdowns() {
		const posSelect = document.getElementById('filter-pos');
		const srcSelect = document.getElementById('filter-source');
		if (!posSelect || !srcSelect || typeof KR_EN_languageUnits === 'undefined') return;

		const posSet = new Set();
		const srcSet = new Set();
		for (let i = 0; i < KR_EN_languageUnits.length; i++) {
			const u = KR_EN_languageUnits[i];
			if (u[DATA_SCHEMA.PartofSpeech]) posSet.add(u[DATA_SCHEMA.PartofSpeech]);
			if (u[DATA_SCHEMA.Source]) srcSet.add(u[DATA_SCHEMA.Source]);
		}

		Array.from(posSet).sort().forEach(pos => {
			const opt = document.createElement('option');
			opt.value = pos;
			opt.textContent = pos;
			posSelect.appendChild(opt);
		});

		Array.from(srcSet).sort().forEach(src => {
			const opt = document.createElement('option');
			opt.value = src;
			opt.textContent = src;
			srcSelect.appendChild(opt);
		});
	}

	updateStatsBar() {
		const totalUnits = this.engine.rawUnits.length;
		let inSetCount = 0;
		for (let i = 0; i < totalUnits; i++) {
			if (this.engine.getCellValue(i, 'InSet')) {
				inSetCount++;
			}
		}

		const visibleCols = this.engine.getVisibleColumns().length;
		const totalCols = this.engine.getAllOrderedColumns().length;

		const elTotal = document.getElementById('stat-total-units');
		const elInSet = document.getElementById('stat-inset-units');
		const elBadge = document.getElementById('nav-inset-badge');
		const elFiltered = document.getElementById('stat-filtered-count');
		const elVisCols = document.getElementById('stat-visible-cols');
		const elTotCols = document.getElementById('stat-total-cols');

		if (elTotal) elTotal.textContent = totalUnits.toLocaleString();
		if (elInSet) elInSet.textContent = inSetCount.toLocaleString();
		if (elBadge) elBadge.textContent = inSetCount.toLocaleString();
		if (elFiltered) elFiltered.textContent = this.engine.filteredRowIds.length.toLocaleString();
		if (elVisCols) elVisCols.textContent = String(visibleCols);
		if (elTotCols) elTotCols.textContent = String(totalCols);
	}

	_bindNavigationEvents() {
		const tabs = document.querySelectorAll('.spa-tab');
		tabs.forEach(tab => {
			tab.addEventListener('click', () => {
				const targetView = tab.dataset.view;
				this.switchView(targetView);
			});
		});

		const backBtn = document.getElementById('btn-practice-back-to-sheet');
		if (backBtn) {
			backBtn.addEventListener('click', () => this.switchView('spreadsheet'));
		}
	}

	switchView(viewName) {
		this.activeView = viewName;
		document.querySelectorAll('.spa-tab').forEach(t => {
			const isMatch = t.dataset.view === viewName;
			t.classList.toggle('active', isMatch);
			t.setAttribute('aria-selected', isMatch ? 'true' : 'false');
		});

		const sheetView = document.getElementById('view-spreadsheet');
		const practiceView = document.getElementById('view-practice');
		if (sheetView) sheetView.classList.toggle('active', viewName === 'spreadsheet');
		if (practiceView) practiceView.classList.toggle('active', viewName === 'practice');

		if (viewName === 'spreadsheet') {
			this.engine.renderHeader();
			this.engine.renderViewport();
		} else if (viewName === 'practice') {
			this.flashcardRevealed = false;
			this.renderPracticeView();
		}
	}

	_bindToolbarEvents() {
		const searchInput = document.getElementById('filter-search');
		const posSelect = document.getElementById('filter-pos');
		const srcSelect = document.getElementById('filter-source');
		const inSetSelect = document.getElementById('filter-inset');
		const clearBtn = document.getElementById('btn-clear-filters');

		if (searchInput) {
			searchInput.addEventListener('input', () => {
				this.engine.setFilters({ searchQuery: searchInput.value });
			});
		}
		if (posSelect) {
			posSelect.addEventListener('change', () => {
				this.engine.setFilters({ posFilter: posSelect.value });
			});
		}
		if (srcSelect) {
			srcSelect.addEventListener('change', () => {
				this.engine.setFilters({ sourceFilter: srcSelect.value });
			});
		}
		if (inSetSelect) {
			inSetSelect.addEventListener('change', () => {
				this.engine.setFilters({ inSetFilter: inSetSelect.value });
			});
		}
		if (clearBtn) {
			clearBtn.addEventListener('click', () => {
				if (searchInput) searchInput.value = '';
				if (posSelect) posSelect.value = '';
				if (srcSelect) srcSelect.value = '';
				if (inSetSelect) inSetSelect.value = 'all';
				this.engine.setFilters({
					searchQuery: '',
					posFilter: '',
					sourceFilter: '',
					inSetFilter: 'all'
				});
			});
		}

		const btnSelectFiltered = document.getElementById('btn-select-filtered');
		const btnUnselectFiltered = document.getElementById('btn-unselect-filtered');

		if (btnSelectFiltered) {
			btnSelectFiltered.addEventListener('click', async () => {
				this._setDbStatus('Saving...', true);
				await this.engine.setBulkColumnValue([...this.engine.filteredRowIds], 'InSet', true);
			});
		}
		if (btnUnselectFiltered) {
			btnUnselectFiltered.addEventListener('click', async () => {
				this._setDbStatus('Saving...', true);
				await this.engine.setBulkColumnValue([...this.engine.filteredRowIds], 'InSet', false);
			});
		}

		const btnAddCol = document.getElementById('btn-add-column');
		const btnManageCols = document.getElementById('btn-manage-columns');
		const btnResetVis = document.getElementById('btn-reset-visibility');
		const btnResetSort = document.getElementById('btn-reset-sort');
		const btnResetAll = document.getElementById('btn-reset-all-view');

		if (btnAddCol) {
			btnAddCol.addEventListener('click', () => this.openColumnModal(null));
		}
		if (btnManageCols) {
			btnManageCols.addEventListener('click', () => this.openColumnsManagerModal());
		}
		if (btnResetVis) {
			btnResetVis.addEventListener('click', async () => {
				await this.engine.resetAllColumnVisibility();
			});
		}
		if (btnResetSort) {
			btnResetSort.addEventListener('click', async () => {
				await this.engine.resetSortingAndRowOrder();
			});
		}
		if (btnResetAll) {
			btnResetAll.addEventListener('click', async () => {
				await this.engine.resetAllViewSettings();
			});
		}
	}

	_bindModalEvents() {
		const colModal = document.getElementById('modal-column-form');
		const colForm = document.getElementById('form-custom-column');
		const typeSelect = document.getElementById('col-input-type');
		const enumField = document.getElementById('field-enum-options');

		if (typeSelect && enumField) {
			typeSelect.addEventListener('change', () => {
				enumField.classList.toggle('hidden', typeSelect.value !== 'enum');
			});
		}

		const closeColModal = () => {
			if (colModal) colModal.classList.add('hidden');
		};
		document.getElementById('btn-close-col-modal')?.addEventListener('click', closeColModal);
		document.getElementById('btn-cancel-col-modal')?.addEventListener('click', closeColModal);

		if (colForm) {
			colForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				const errBox = document.getElementById('col-form-error');
				if (errBox) errBox.classList.add('hidden');

				const originalKey = document.getElementById('col-original-key').value;
				const key = document.getElementById('col-input-key').value.trim();
				const type = document.getElementById('col-input-type').value;
				const enumRaw = document.getElementById('col-input-enum').value;
				const defaultVal = document.getElementById('col-input-default').value;
				const desc = document.getElementById('col-input-desc').value.trim();

				try {
					if (originalKey) {
						await this.engine.editCustomColumn(originalKey, {
							key,
							label: key,
							type,
							enumOptions: enumRaw,
							defaultValue: defaultVal,
							description: desc
						});
					} else {
						await this.engine.addCustomColumn({
							key,
							label: key,
							type,
							enumOptions: enumRaw,
							defaultValue: defaultVal,
							description: desc
						});
					}
					closeColModal();
					if (!document.getElementById('modal-columns-manager')?.classList.contains('hidden')) {
						this.renderColumnsManagerList();
					}
				} catch (err) {
					if (errBox) {
						errBox.textContent = err.message || 'Failed to save column';
						errBox.classList.remove('hidden');
					}
				}
			});
		}

		const mgrModal = document.getElementById('modal-columns-manager');
		const closeMgrModal = () => {
			if (mgrModal) mgrModal.classList.add('hidden');
		};
		document.getElementById('btn-close-mgr-modal')?.addEventListener('click', closeMgrModal);
		document.getElementById('btn-done-mgr-modal')?.addEventListener('click', closeMgrModal);
		document.getElementById('btn-mgr-show-all')?.addEventListener('click', async () => {
			await this.engine.resetAllColumnVisibility();
			this.renderColumnsManagerList();
		});
		document.getElementById('btn-mgr-restore-initial')?.addEventListener('click', async () => {
			await this.db.restoreInitialColumns();
			this.engine.customColumns = await this.db.getCustomColumns();
			this.engine._rebuildColumnMap();
			for (const c of this.engine.customColumns) {
				if (!this.engine.columnOrder.includes(c.key)) {
					this.engine.columnOrder.push(c.key);
				}
				if (this.engine.columnVisibility[c.key] === undefined) {
					this.engine.columnVisibility[c.key] = true;
				}
				if (!this.engine.columnWidths[c.key]) {
					this.engine.columnWidths[c.key] = c.defaultWidth || 150;
				}
			}
			await this.engine.persistViewSettings();
			this.engine.renderHeader();
			this.engine.renderViewport();
			this.renderColumnsManagerList();
		});
		document.getElementById('btn-mgr-new-col')?.addEventListener('click', () => {
			this.openColumnModal(null);
		});

		const rowModal = document.getElementById('modal-move-row');
		const rowForm = document.getElementById('form-move-row');
		const closeRowModal = () => {
			if (rowModal) rowModal.classList.add('hidden');
		};
		document.getElementById('btn-close-row-modal')?.addEventListener('click', closeRowModal);
		document.getElementById('btn-move-row-top')?.addEventListener('click', async () => {
			const unitId = parseInt(document.getElementById('move-row-unit-id').value, 10);
			if (!Number.isNaN(unitId)) {
				await this.engine.moveRowToIndex(unitId, 0);
				closeRowModal();
			}
		});
		document.getElementById('btn-move-row-bottom')?.addEventListener('click', async () => {
			const unitId = parseInt(document.getElementById('move-row-unit-id').value, 10);
			if (!Number.isNaN(unitId)) {
				await this.engine.moveRowToIndex(unitId, this.engine.rowOrder.length - 1);
				closeRowModal();
			}
		});
		if (rowForm) {
			rowForm.addEventListener('submit', async (e) => {
				e.preventDefault();
				const unitId = parseInt(document.getElementById('move-row-unit-id').value, 10);
				const pos1Based = parseInt(document.getElementById('move-row-target-pos').value, 10);
				if (!Number.isNaN(unitId) && !Number.isNaN(pos1Based)) {
					await this.engine.moveRowToIndex(unitId, pos1Based - 1);
					closeRowModal();
				}
			});
		}
	}

	openColumnModal(existingCol = null) {
		const modal = document.getElementById('modal-column-form');
		const title = document.getElementById('modal-col-title');
		const origInput = document.getElementById('col-original-key');
		const keyInput = document.getElementById('col-input-key');
		const typeSelect = document.getElementById('col-input-type');
		const enumField = document.getElementById('field-enum-options');
		const enumInput = document.getElementById('col-input-enum');
		const defInput = document.getElementById('col-input-default');
		const descInput = document.getElementById('col-input-desc');
		const errBox = document.getElementById('col-form-error');

		if (errBox) errBox.classList.add('hidden');

		if (existingCol) {
			title.textContent = `Edit Additional Column: ${existingCol.label}`;
			origInput.value = existingCol.key;
			keyInput.value = existingCol.key;
			typeSelect.value = existingCol.type || 'string';
			enumInput.value = Array.isArray(existingCol.enumOptions) ? existingCol.enumOptions.join(', ') : '';
			defInput.value = existingCol.defaultValue !== undefined ? String(existingCol.defaultValue) : '';
			descInput.value = existingCol.description || '';
		} else {
			title.textContent = 'Create New Additional Column';
			origInput.value = '';
			keyInput.value = '';
			typeSelect.value = 'string';
			enumInput.value = '';
			defInput.value = '';
			descInput.value = '';
		}

		enumField.classList.toggle('hidden', typeSelect.value !== 'enum');
		modal.classList.remove('hidden');
		setTimeout(() => keyInput.focus(), 0);
	}

	async handleDeleteColumnRequest(col) {
		if (!col || col.isDefault) return;
		await this.engine.removeCustomColumn(col.key);
		if (!document.getElementById('modal-columns-manager')?.classList.contains('hidden')) {
			this.renderColumnsManagerList();
		}
	}

	openColumnsManagerModal() {
		const modal = document.getElementById('modal-columns-manager');
		this.renderColumnsManagerList();
		if (modal) modal.classList.remove('hidden');
	}

	renderColumnsManagerList() {
		const listEl = document.getElementById('columns-manager-list');
		if (!listEl) return;
		listEl.innerHTML = '';

		const orderedCols = this.engine.getAllOrderedColumns();
		orderedCols.forEach((col, index) => {
			const row = document.createElement('div');
			row.className = `mgr-col-row ${col.isDefault ? 'mgr-origin-default' : 'mgr-origin-custom'}`;

			const left = document.createElement('div');
			left.className = 'mgr-col-left';

			const cb = document.createElement('input');
			cb.type = 'checkbox';
			cb.className = 'cell-checkbox';
			cb.checked = this.engine.columnVisibility[col.key] !== false;
			cb.addEventListener('change', async () => {
				await this.engine.setColumnVisibility(col.key, cb.checked);
				this.updateStatsBar();
			});
			left.appendChild(cb);

			const badge = document.createElement('span');
			badge.className = `col-origin-badge ${col.isDefault ? 'badge-default' : 'badge-custom'}`;
			badge.textContent = col.isDefault ? 'DATA.JS' : `USER · ${col.type}`;
			left.appendChild(badge);

			const nameSpan = document.createElement('strong');
			nameSpan.textContent = col.label;
			left.appendChild(nameSpan);

			const right = document.createElement('div');
			right.className = 'mgr-col-right';

			const upBtn = document.createElement('button');
			upBtn.type = 'button';
			upBtn.className = 'btn btn-secondary';
			upBtn.textContent = '▲';
			upBtn.title = 'Move column earlier';
			upBtn.disabled = index === 0;
			upBtn.addEventListener('click', async () => {
				if (index > 0) {
					await this.engine.reorderColumn(col.key, orderedCols[index - 1].key, false);
					this.renderColumnsManagerList();
				}
			});
			right.appendChild(upBtn);

			const downBtn = document.createElement('button');
			downBtn.type = 'button';
			downBtn.className = 'btn btn-secondary';
			downBtn.textContent = '▼';
			downBtn.title = 'Move column later';
			downBtn.disabled = index === orderedCols.length - 1;
			downBtn.addEventListener('click', async () => {
				if (index < orderedCols.length - 1) {
					await this.engine.reorderColumn(col.key, orderedCols[index + 1].key, true);
					this.renderColumnsManagerList();
				}
			});
			right.appendChild(downBtn);

			if (!col.isDefault) {
				const editBtn = document.createElement('button');
				editBtn.type = 'button';
				editBtn.className = 'btn btn-secondary';
				editBtn.textContent = 'Edit';
				editBtn.addEventListener('click', () => this.openColumnModal(col));
				right.appendChild(editBtn);

				const delBtn = document.createElement('button');
				delBtn.type = 'button';
				delBtn.className = 'btn btn-danger';
				delBtn.textContent = 'Delete';
				delBtn.addEventListener('click', async () => {
					await this.handleDeleteColumnRequest(col);
				});
				right.appendChild(delBtn);
			} else {
				const lockSpan = document.createElement('span');
				lockSpan.className = 'stat-label';
				lockSpan.style.fontSize = '0.72rem';
				lockSpan.textContent = 'Locked Schema';
				right.appendChild(lockSpan);
			}

			row.appendChild(left);
			row.appendChild(right);
			listEl.appendChild(row);
		});
	}

	openMoveRowModal(unitId, currentIndex) {
		const modal = document.getElementById('modal-move-row');
		const idInput = document.getElementById('move-row-unit-id');
		const posInput = document.getElementById('move-row-target-pos');
		const info = document.getElementById('move-row-info');

		const ko = this.engine.getCellValue(unitId, 'Korean');
		const en = this.engine.getCellValue(unitId, 'English');
		if (idInput) idInput.value = String(unitId);
		if (posInput) {
			posInput.max = String(this.engine.rowOrder.length);
			posInput.value = String(currentIndex + 1);
		}
		if (info) {
			info.textContent = `Moving Unit #${unitId} ("${ko}" — ${en}), currently at row ${currentIndex + 1} of ${this.engine.rowOrder.length}.`;
		}
		if (modal) modal.classList.remove('hidden');
	}

	renderPracticeView() {
		const totalUnits = this.engine.rawUnits.length;
		const inSetIds = [];
		for (let i = 0; i < totalUnits; i++) {
			if (this.engine.getCellValue(i, 'InSet')) {
				inSetIds.push(i);
			}
		}

		const sortedQueue = sortPracticeSetUnits(inSetIds, this.engine);
		const countEl = document.getElementById('practice-queue-count');
		if (countEl) countEl.textContent = String(sortedQueue.length);

		const stageEl = document.getElementById('flashcard-stage');
		if (stageEl) {
			stageEl.innerHTML = '';
			if (sortedQueue.length === 0) {
				stageEl.innerHTML = `
					<div class="flashcard-box">
						<p class="flashcard-en">No language units are currently selected in your Practice Set (<code>InSet = true</code>).</p>
						<p class="flashcard-meta">Check the <strong>InSet</strong> column in the Spreadsheet or click <strong>"✓ Add Filtered to Set"</strong> to populate your flashcard deck.</p>
					</div>
				`;
			} else {
				const topId = sortedQueue[0];
				const ko = this.engine.getCellValue(topId, 'Korean');
				const en = this.engine.getCellValue(topId, 'English');
				const pos = this.engine.getCellValue(topId, 'PartofSpeech');
				const score = this.engine.getCellValue(topId, 'RecognitionScore');
				const ltr = this.engine.getCellValue(topId, 'LongTermRecognition');
				const notes = this.engine.getCellValue(topId, 'notes');

				const box = document.createElement('div');
				box.className = 'flashcard-box';
				box.innerHTML = `
					<div class="flashcard-meta">Next Up in Queue · Unit ID #${topId} (${pos}) · Score: <strong>${score}</strong> · Status: <strong>${ltr}</strong></div>
					<div class="flashcard-ko">${ko}</div>
					<div class="flashcard-en">${this.flashcardRevealed ? en : '•••••••• (Click Reveal or Grade Below)'}</div>
					${notes ? `<div class="flashcard-meta">Notes: ${notes}</div>` : ''}
				`;

				const actions = document.createElement('div');
				actions.className = 'flashcard-actions';

				const revealBtn = document.createElement('button');
				revealBtn.type = 'button';
				revealBtn.className = 'btn btn-secondary';
				revealBtn.textContent = this.flashcardRevealed ? 'Hide Definition' : '👁 Reveal Definition';
				revealBtn.addEventListener('click', () => {
					this.flashcardRevealed = !this.flashcardRevealed;
					this.renderPracticeView();
				});
				actions.appendChild(revealBtn);

				const outcomes = [
					{ key: 'again', label: '✗ Unknown (Reset)', cls: 'btn-danger' },
					{ key: 'recognized', label: '✓ Recognized (+1)', cls: 'btn-secondary' },
					{ key: 'definitionKnown', label: '✓✓ Definition Known (+2)', cls: 'btn-primary' },
					{ key: 'knownByDefinition', label: '★ Known By Definition (+3)', cls: 'btn-emerald' }
				];

				for (const o of outcomes) {
					const b = document.createElement('button');
					b.type = 'button';
					b.className = `btn ${o.cls}`;
					b.textContent = o.label;
					b.addEventListener('click', async () => {
						this.flashcardRevealed = false;
						await evaluateFlashcardAttempt(this.engine, topId, o.key);
						this.renderPracticeView();
					});
					actions.appendChild(b);
				}

				box.appendChild(actions);
				stageEl.appendChild(box);
			}
		}

		const tbody = document.getElementById('practice-queue-tbody');
		if (!tbody) return;
		tbody.innerHTML = '';

		const maxPreview = Math.min(sortedQueue.length, 200);
		for (let i = 0; i < maxPreview; i++) {
			const uid = sortedQueue[i];
			const tr = document.createElement('tr');
			const colLastCorr = this.engine.columnMap.get('TimeStampLastCorrect');
			const colLastSeen = this.engine.columnMap.get('TimeStampLastSeen');

			tr.innerHTML = `
				<td>#${i + 1}</td>
				<td><code>${uid}</code></td>
				<td><strong>${this.engine.getCellValue(uid, 'Korean')}</strong></td>
				<td>${this.engine.getCellValue(uid, 'English')}</td>
				<td>${this.engine.getCellValue(uid, 'PartofSpeech')}</td>
				<td>${this.engine.getCellValue(uid, 'RecognitionScore')}</td>
				<td><code>${this.engine.getCellValue(uid, 'LongTermRecognition')}</code></td>
				<td>${this.engine.formatCellValue(this.engine.getCellValue(uid, 'TimeStampLastCorrect'), colLastCorr)}</td>
				<td>${this.engine.formatCellValue(this.engine.getCellValue(uid, 'TimeStampLastSeen'), colLastSeen)}</td>
				<td>${this.engine.getCellValue(uid, 'notes') || ''}</td>
				<td></td>
			`;

			const removeBtn = document.createElement('button');
			removeBtn.type = 'button';
			removeBtn.className = 'btn btn-ghost';
			removeBtn.textContent = 'Remove from Set';
			removeBtn.addEventListener('click', async () => {
				await this.engine.setCellValue(uid, 'InSet', false);
			});
			tr.lastElementChild.appendChild(removeBtn);
			tbody.appendChild(tr);
		}
	}
}

if (typeof window !== 'undefined') {
	window.sortPracticeSetUnits = sortPracticeSetUnits;
	window.evaluateFlashcardAttempt = evaluateFlashcardAttempt;
	window.KongbuheyApp = KongbuheyApp;

	window.addEventListener('DOMContentLoaded', () => {
		const app = new KongbuheyApp();
		window.kongbuheyApp = app;
		app.start();
	});
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		LONG_TERM_ORDER,
		sortPracticeSetUnits,
		evaluateFlashcardAttempt,
		KongbuheyApp
	};
}

