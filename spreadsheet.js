/**
 * ============================================================================
 * spreadsheet.js - Virtualized Language Unit Spreadsheet UI & State Engine
 * ============================================================================
 *
 * Features:
 *   - Displays all 2,006+ language units from data.js with virtual scrolling
 *     (only rows visible in the scroll viewport + small overscan are rendered).
 *   - Distinct visual styling for Default columns (from data.js) vs.
 *     Additional columns (user-created & flashcard columns stored in IndexedDB).
 *   - Default columns: editable in-place, not deletable.
 *   - Additional columns: creatable, editable (schema & cells), and deletable.
 *   - Column operations: resize (drag handle), reorder (drag & drop / buttons),
 *     hide (header button & column manager), reset visibility.
 *   - Row operations: reorder (drag & drop handle / move), sort by clicking
 *     column header sort button (ascending/descending toggle), reset sort/order.
 *   - Asynchronous non-blocking loading from KongbuheyDB with full persistence
 *     of cell data and view settings across page refreshes.
 */

const _dbModule = (typeof DEFAULT_COLUMNS_SPEC === 'undefined' && typeof require === 'function')
	? require('./db.js')
	: {};
const _DEFAULT_COLUMNS_SPEC = typeof DEFAULT_COLUMNS_SPEC !== 'undefined'
	? DEFAULT_COLUMNS_SPEC
	: (_dbModule.DEFAULT_COLUMNS_SPEC || []);
const _coerceColumnValue = typeof coerceColumnValue !== 'undefined'
	? coerceColumnValue
	: (_dbModule.coerceColumnValue || (v => v));

class SpreadsheetEngine {
	constructor(options = {}) {
		this.db = options.db;
		this.rawUnits = options.rawUnits || (typeof KR_EN_languageUnits !== 'undefined' ? KR_EN_languageUnits : []);
		this.dataSchema = options.dataSchema || (typeof DATA_SCHEMA !== 'undefined' ? DATA_SCHEMA : {});
		this.onStateChange = options.onStateChange || (() => {});

		// Virtualization parameters
		this.rowHeight = options.rowHeight || 38;
		this.overscan = options.overscan !== undefined ? options.overscan : 6;
		this.rowHandleWidth = 76;

		// Column definitions: merged Default (data.js) + Custom (DB)
		this.defaultColumns = _DEFAULT_COLUMNS_SPEC.map(c => ({ ...c }));
		this.customColumns = [];
		this.columnMap = new Map();

		// Persistent View Settings
		this.columnOrder = [];
		this.columnWidths = {};
		this.columnVisibility = {};
		this.rowOrder = []; // Master ordered list of unitIds (0..N-1)
		this.sortState = { columnKey: null, direction: null }; // 'asc' | 'desc' | null

		// Search & filter state (non-destructive overlay on rowOrder)
		this.searchQuery = '';
		this.posFilter = '';
		this.sourceFilter = '';
		this.inSetFilter = 'all'; // 'all' | 'inSet' | 'notInSet'
		this.filteredRowIds = [];

		// In-memory cache of unit DB records: Map<unitId, { custom: {}, defaultOverrides: {} }>
		this.unitRecords = new Map();
		this.asyncLoadComplete = false;
		this.loadedUnitCount = 0;

		// Active inline editor state
		this.editingCell = null; // { unitId, colKey }
		this.dragState = null;

		// DOM references (bound when mount() is called in browser)
		this.container = null;
		this.headerTrack = null;
		this.scrollViewport = null;
		this.scrollSpacer = null;
		this.rowsLayer = null;
		this.rafPending = false;
	}

	/**
	 * Initializes the spreadsheet state: sets up default columns, loads custom
	 * columns and view settings from DB, renders immediately, and triggers
	 * asynchronous unit record loading.
	 */
	async init() {
		await this.db.open();
		this.customColumns = await this.db.getCustomColumns();
		this._rebuildColumnMap();

		// Initialize canonical row order [0 .. N-1]
		const totalUnits = this.rawUnits.length;
		const canonicalIds = Array.from({ length: totalUnits }, (_, idx) => idx);

		// Restore persisted view settings if present
		const savedView = await this.db.getViewSettings();
		this._applyViewSettings(savedView, canonicalIds);
		this._recomputeFilteredRows();

		if (this.container) {
			this.renderHeader();
			this.renderViewport();
		}

		// Start asynchronous chunked loading of per-unit DB data without blocking UI
		this.asyncLoadComplete = false;
		await this.db.loadAllUnitDataIncremental((batch) => {
			for (const rec of batch) {
				this.unitRecords.set(rec.unitId, rec);
				this._applyDefaultOverridesToMemoryUnit(rec.unitId, rec.defaultOverrides);
			}
			this.loadedUnitCount = this.unitRecords.size;
			if (this.container) {
				this.scheduleViewportRender();
			}
			this.onStateChange({ type: 'async-batch', loaded: this.loadedUnitCount });
		}, 300);

		this.asyncLoadComplete = true;
		// If a sort on a custom column was persisted or filter depends on custom columns, refresh
		if (this.inSetFilter !== 'all') {
			this._recomputeFilteredRows();
		}
		if (this.container) {
			this.renderViewport();
		}
		this.onStateChange({ type: 'ready' });
	}

	_rebuildColumnMap() {
		this.columnMap.clear();
		for (const col of this.defaultColumns) {
			this.columnMap.set(col.key, col);
		}
		for (const col of this.customColumns) {
			this.columnMap.set(col.key, col);
		}
	}

	_applyViewSettings(savedView, canonicalIds) {
		const allColKeys = [
			...this.defaultColumns.map(c => c.key),
			...this.customColumns.map(c => c.key)
		];

		// 1. Column Order
		if (savedView && Array.isArray(savedView.columnOrder) && savedView.columnOrder.length > 0) {
			const validSaved = savedView.columnOrder.filter(k => this.columnMap.has(k));
			const missing = allColKeys.filter(k => !validSaved.includes(k));
			this.columnOrder = [...validSaved, ...missing];
		} else {
			this.columnOrder = [...allColKeys];
		}

		// 2. Column Widths
		this.columnWidths = {};
		for (const key of allColKeys) {
			const spec = this.columnMap.get(key);
			const savedW = savedView && savedView.columnWidths && savedView.columnWidths[key];
			this.columnWidths[key] = (typeof savedW === 'number' && savedW >= 60)
				? savedW
				: (spec && spec.defaultWidth ? spec.defaultWidth : 140);
		}

		// 3. Column Visibility
		this.columnVisibility = {};
		for (const key of allColKeys) {
			const savedVis = savedView && savedView.columnVisibility && savedView.columnVisibility[key];
			this.columnVisibility[key] = typeof savedVis === 'boolean' ? savedVis : true;
		}

		// 4. Row Order
		if (savedView && Array.isArray(savedView.rowOrder) && savedView.rowOrder.length > 0) {
			const validSet = new Set(canonicalIds);
			const seen = new Set();
			const restored = [];
			for (const id of savedView.rowOrder) {
				if (validSet.has(id) && !seen.has(id)) {
					seen.add(id);
					restored.push(id);
				}
			}
			for (const id of canonicalIds) {
				if (!seen.has(id)) restored.push(id);
			}
			this.rowOrder = restored;
		} else {
			this.rowOrder = [...canonicalIds];
		}

		// 5. Sort State
		if (savedView && savedView.sortState && savedView.sortState.columnKey && this.columnMap.has(savedView.sortState.columnKey)) {
			this.sortState = {
				columnKey: savedView.sortState.columnKey,
				direction: savedView.sortState.direction === 'desc' ? 'desc' : 'asc'
			};
		} else {
			this.sortState = { columnKey: null, direction: null };
		}
	}

	async persistViewSettings() {
		await this.db.saveViewSettings({
			columnOrder: this.columnOrder,
			columnWidths: this.columnWidths,
			columnVisibility: this.columnVisibility,
			rowOrder: this.rowOrder,
			sortState: this.sortState
		});
		this.onStateChange({ type: 'view-settings' });
	}

	// =========================================================================
	// Data Access & Mutation (Default data.js + Custom DB Columns)
	// =========================================================================

	_applyDefaultOverridesToMemoryUnit(unitId, overrides) {
		if (!overrides || typeof overrides !== 'object') return;
		const unit = this.rawUnits[unitId];
		if (!unit) return;
		for (const [colKey, val] of Object.entries(overrides)) {
			const colSpec = this.columnMap.get(colKey);
			if (colSpec && colSpec.isDefault) {
				if (colKey === 'SemanticTags') {
					const arr = Array.isArray(val) ? val : String(val).split(',').map(s => s.trim()).filter(Boolean);
					unit[colSpec.schemaIndex] = new Set(arr);
				} else {
					unit[colSpec.schemaIndex] = val;
				}
			}
		}
	}

	/**
	 * Reads the current value of a cell for (unitId, colKey).
	 */
	getCellValue(unitId, colKey) {
		const colSpec = this.columnMap.get(colKey);
		if (!colSpec) return '';

		if (colSpec.isDefault) {
			const rec = this.unitRecords.get(unitId);
			if (rec && rec.defaultOverrides && Object.prototype.hasOwnProperty.call(rec.defaultOverrides, colKey)) {
				return rec.defaultOverrides[colKey];
			}
			const unit = this.rawUnits[unitId];
			if (!unit) return '';
			const rawVal = unit[colSpec.schemaIndex];
			if (rawVal instanceof Set) {
				return Array.from(rawVal);
			}
			return rawVal;
		} else {
			const rec = this.unitRecords.get(unitId);
			if (rec && rec.custom && Object.prototype.hasOwnProperty.call(rec.custom, colKey)) {
				return rec.custom[colKey];
			}
			return colSpec.defaultValue;
		}
	}

	/**
	 * Formats a cell value as a human-readable string for display or sorting.
	 */
	formatCellValue(value, colSpec) {
		if (!colSpec) return String(value ?? '');
		if (colSpec.type === 'tags') {
			if (value instanceof Set) return Array.from(value).join(', ');
			if (Array.isArray(value)) return value.join(', ');
			return String(value ?? '');
		}
		if (colSpec.type === 'conjugation') {
			if (Array.isArray(value)) return JSON.stringify(value);
			return String(value ?? '');
		}
		if (colSpec.type === 'unixTime') {
			const num = Number(value) || 0;
			if (num <= 0) return 'Never (0)';
			const d = new Date(num * 1000);
			if (Number.isNaN(d.getTime())) return String(num);
			const iso = d.toISOString().replace('T', ' ').substring(0, 16);
			return `${iso} (${num})`;
		}
		if (colSpec.type === 'boolean') {
			return value ? 'true' : 'false';
		}
		if (value === null || value === undefined) return '';
		return String(value);
	}

	/**
	 * Updates a cell value (either Default data.js column or Additional column),
	 * coerces the type, updates in-memory structures, and saves to IndexedDB.
	 */
	async setCellValue(unitId, colKey, rawNewValue) {
		const colSpec = this.columnMap.get(colKey);
		if (!colSpec) return;

		const coerced = _coerceColumnValue(rawNewValue, colSpec);
		let rec = this.unitRecords.get(unitId);
		if (!rec) {
			rec = { unitId, custom: {}, defaultOverrides: {}, updatedAt: Date.now() };
			this.unitRecords.set(unitId, rec);
		}

		if (colSpec.isDefault) {
			if (!rec.defaultOverrides) rec.defaultOverrides = {};
			rec.defaultOverrides[colKey] = coerced;

			// Also keep in-memory KR_EN_languageUnits updated for SPA consistency
			const unit = this.rawUnits[unitId];
			if (unit) {
				if (colKey === 'SemanticTags') {
					unit[colSpec.schemaIndex] = new Set(Array.isArray(coerced) ? coerced : []);
				} else {
					unit[colSpec.schemaIndex] = coerced;
				}
			}
			await this.db.saveUnitCellValue(unitId, colKey, coerced, true);
		} else {
			if (!rec.custom) rec.custom = {};
			rec.custom[colKey] = coerced;
			await this.db.saveUnitCellValue(unitId, colKey, coerced, false);
		}

		if (this.inSetFilter !== 'all' && colKey === 'InSet') {
			this._recomputeFilteredRows();
		}
		if (this.container) {
			this.renderViewport();
		}
		this.onStateChange({ type: 'cell-updated', unitId, colKey, value: coerced });
		return coerced;
	}

	/**
	 * Bulk-updates a column value across multiple unitIds in a single transaction.
	 */
	async setBulkColumnValue(unitIds, colKey, rawValue) {
		const colSpec = this.columnMap.get(colKey);
		if (!colSpec) return;
		const coerced = _coerceColumnValue(rawValue, colSpec);
		const updates = [];

		for (const unitId of unitIds) {
			let rec = this.unitRecords.get(unitId);
			if (!rec) {
				rec = { unitId, custom: {}, defaultOverrides: {}, updatedAt: Date.now() };
				this.unitRecords.set(unitId, rec);
			}
			if (colSpec.isDefault) {
				rec.defaultOverrides[colKey] = coerced;
			} else {
				rec.custom[colKey] = coerced;
			}
			updates.push({ unitId, colKey, value: coerced, isDefaultColumn: colSpec.isDefault });
		}

		await this.db.saveBulkUnitCellValues(updates);
		if (this.inSetFilter !== 'all' && colKey === 'InSet') {
			this._recomputeFilteredRows();
		}
		if (this.container) {
			this.renderViewport();
		}
		this.onStateChange({ type: 'bulk-updated', colKey, count: unitIds.length });
	}

	// =========================================================================
	// Custom Columns Management (Create, Edit, Delete)
	// =========================================================================

	async addCustomColumn(colDef) {
		const created = await this.db.createCustomColumn(colDef);
		this.customColumns = await this.db.getCustomColumns();
		this._rebuildColumnMap();

		if (!this.columnOrder.includes(created.key)) {
			this.columnOrder.push(created.key);
		}
		this.columnWidths[created.key] = created.defaultWidth || 150;
		this.columnVisibility[created.key] = true;

		await this.persistViewSettings();
		if (this.container) {
			this.renderHeader();
			this.renderViewport();
		}
		this.onStateChange({ type: 'column-added', column: created });
		return created;
	}

	async editCustomColumn(originalKey, updates) {
		const colSpec = this.columnMap.get(originalKey);
		if (!colSpec || colSpec.isDefault) {
			throw new Error('Default columns schema cannot be altered.');
		}
		const updated = await this.db.updateCustomColumn(originalKey, updates);
		this.customColumns = await this.db.getCustomColumns();
		this._rebuildColumnMap();

		if (updated.key !== originalKey) {
			const idx = this.columnOrder.indexOf(originalKey);
			if (idx !== -1) this.columnOrder[idx] = updated.key;
			this.columnWidths[updated.key] = this.columnWidths[originalKey] || updated.defaultWidth || 150;
			delete this.columnWidths[originalKey];
			this.columnVisibility[updated.key] = this.columnVisibility[originalKey] !== false;
			delete this.columnVisibility[originalKey];
			if (this.sortState.columnKey === originalKey) {
				this.sortState.columnKey = updated.key;
			}
			// Update in-memory unitRecords cache
			for (const rec of this.unitRecords.values()) {
				if (rec.custom && Object.prototype.hasOwnProperty.call(rec.custom, originalKey)) {
					rec.custom[updated.key] = _coerceColumnValue(rec.custom[originalKey], updated);
					delete rec.custom[originalKey];
				}
			}
		}

		await this.persistViewSettings();
		if (this.container) {
			this.renderHeader();
			this.renderViewport();
		}
		this.onStateChange({ type: 'column-edited', column: updated });
		return updated;
	}

	async removeCustomColumn(key) {
		const colSpec = this.columnMap.get(key);
		if (!colSpec) return false;
		if (colSpec.isDefault) {
			throw new Error(`Column "${key}" is a default data.js column and cannot be deleted.`);
		}

		await this.db.deleteCustomColumn(key);
		this.customColumns = await this.db.getCustomColumns();
		this._rebuildColumnMap();

		this.columnOrder = this.columnOrder.filter(k => k !== key);
		delete this.columnWidths[key];
		delete this.columnVisibility[key];
		if (this.sortState.columnKey === key) {
			this.sortState = { columnKey: null, direction: null };
		}

		for (const rec of this.unitRecords.values()) {
			if (rec.custom) delete rec.custom[key];
		}

		await this.persistViewSettings();
		if (this.container) {
			this.renderHeader();
			this.renderViewport();
		}
		this.onStateChange({ type: 'column-deleted', key });
		return true;
	}

	// =========================================================================
	// Column Visibility, Widths, Reordering & Resets
	// =========================================================================

	getVisibleColumns() {
		return this.columnOrder
			.filter(key => this.columnMap.has(key) && this.columnVisibility[key] !== false)
			.map(key => this.columnMap.get(key));
	}

	getAllOrderedColumns() {
		return this.columnOrder
			.filter(key => this.columnMap.has(key))
			.map(key => this.columnMap.get(key));
	}

	async setColumnVisibility(colKey, isVisible) {
		if (!this.columnMap.has(colKey)) return;
		this.columnVisibility[colKey] = Boolean(isVisible);
		await this.persistViewSettings();
		if (this.container) {
			this.renderHeader();
			this.renderViewport();
		}
	}

	async resetAllColumnVisibility() {
		for (const key of this.columnMap.keys()) {
			this.columnVisibility[key] = true;
		}
		await this.persistViewSettings();
		if (this.container) {
			this.renderHeader();
			this.renderViewport();
		}
	}

	async setColumnWidth(colKey, widthPx) {
		if (!this.columnMap.has(colKey)) return;
		const clamped = Math.max(60, Math.min(800, Math.round(widthPx)));
		this.columnWidths[colKey] = clamped;
		await this.persistViewSettings();
		if (this.container) {
			this.renderHeader();
			this.renderViewport();
		}
	}

	async reorderColumn(sourceKey, targetKey, insertAfter = false) {
		if (sourceKey === targetKey) return;
		const fromIdx = this.columnOrder.indexOf(sourceKey);
		const toIdx = this.columnOrder.indexOf(targetKey);
		if (fromIdx === -1 || toIdx === -1) return;

		this.columnOrder.splice(fromIdx, 1);
		let newTargetIdx = this.columnOrder.indexOf(targetKey);
		if (insertAfter) newTargetIdx += 1;
		this.columnOrder.splice(newTargetIdx, 0, sourceKey);

		await this.persistViewSettings();
		if (this.container) {
			this.renderHeader();
			this.renderViewport();
		}
	}

	// =========================================================================
	// Sorting & Row Reordering
	// =========================================================================

	/**
	 * Toggles ascending/descending sort on a column when its sort button is clicked.
	 */
	async toggleSortByColumn(colKey) {
		if (!this.columnMap.has(colKey)) return;
		let direction = 'asc';
		if (this.sortState.columnKey === colKey) {
			direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
		}
		await this.sortByColumn(colKey, direction);
	}

	async sortByColumn(colKey, direction = 'asc') {
		const colSpec = this.columnMap.get(colKey);
		if (!colSpec) return;

		this.sortState = { columnKey: colKey, direction };
		const mult = direction === 'desc' ? -1 : 1;

		this.rowOrder.sort((idA, idB) => {
			const valA = this.getCellValue(idA, colKey);
			const valB = this.getCellValue(idB, colKey);

			if (colSpec.type === 'int' || colSpec.type === 'float' || colSpec.type === 'number' || colSpec.type === 'unixTime') {
				const numA = Number(valA) || 0;
				const numB = Number(valB) || 0;
				if (numA !== numB) return (numA - numB) * mult;
				return idA - idB;
			}

			if (colSpec.type === 'boolean') {
				const boolA = valA ? 1 : 0;
				const boolB = valB ? 1 : 0;
				if (boolA !== boolB) return (boolA - boolB) * mult;
				return idA - idB;
			}

			if (colSpec.type === 'enum' && Array.isArray(colSpec.enumOptions)) {
				const idxA = colSpec.enumOptions.indexOf(String(valA));
				const idxB = colSpec.enumOptions.indexOf(String(valB));
				if (idxA !== idxB && idxA !== -1 && idxB !== -1) {
					return (idxA - idxB) * mult;
				}
			}

			const strA = this.formatCellValue(valA, colSpec).toLowerCase();
			const strB = this.formatCellValue(valB, colSpec).toLowerCase();
			const cmp = strA.localeCompare(strB, 'ko');
			if (cmp !== 0) return cmp * mult;
			return idA - idB;
		});

		this._recomputeFilteredRows();
		await this.persistViewSettings();
		if (this.container) {
			this.renderHeader();
			this.renderViewport();
		}
	}

	/**
	 * Reorders a row from one position to another in rowOrder.
	 */
	async reorderRowByUnitId(sourceUnitId, targetUnitId, insertAfter = false) {
		if (sourceUnitId === targetUnitId) return;
		const fromIdx = this.rowOrder.indexOf(sourceUnitId);
		const toIdx = this.rowOrder.indexOf(targetUnitId);
		if (fromIdx === -1 || toIdx === -1) return;

		this.rowOrder.splice(fromIdx, 1);
		let newTargetIdx = this.rowOrder.indexOf(targetUnitId);
		if (insertAfter) newTargetIdx += 1;
		this.rowOrder.splice(newTargetIdx, 0, sourceUnitId);

		// Manual row reorder clears active column sort indicator
		this.sortState = { columnKey: null, direction: null };
		this._recomputeFilteredRows();
		await this.persistViewSettings();
		if (this.container) {
			this.renderHeader();
			this.renderViewport();
		}
	}

	/**
	 * Moves a row to a specific 0-based index in rowOrder.
	 */
	async moveRowToIndex(unitId, targetIndex) {
		const fromIdx = this.rowOrder.indexOf(unitId);
		if (fromIdx === -1) return;
		const clamped = Math.max(0, Math.min(this.rowOrder.length - 1, targetIndex));
		if (fromIdx === clamped) return;

		this.rowOrder.splice(fromIdx, 1);
		this.rowOrder.splice(clamped, 0, unitId);
		this.sortState = { columnKey: null, direction: null };
		this._recomputeFilteredRows();
		await this.persistViewSettings();
		if (this.container) {
			this.renderHeader();
			this.renderViewport();
		}
	}

	/**
	 * Resets sorting and restores canonical row order (Id 0..N-1).
	 */
	async resetSortingAndRowOrder() {
		this.sortState = { columnKey: null, direction: null };
		this.rowOrder = Array.from({ length: this.rawUnits.length }, (_, idx) => idx);
		this._recomputeFilteredRows();
		await this.persistViewSettings();
		if (this.container) {
			this.renderHeader();
			this.renderViewport();
		}
	}

	/**
	 * Resets all view settings (column order, widths, visibility, sort, and row order).
	 */
	async resetAllViewSettings() {
		await this.db.clearViewSettings();
		const canonicalIds = Array.from({ length: this.rawUnits.length }, (_, idx) => idx);
		this._applyViewSettings(null, canonicalIds);
		this._recomputeFilteredRows();
		await this.persistViewSettings();
		if (this.container) {
			this.renderHeader();
			this.renderViewport();
		}
	}

	// =========================================================================
	// Filtering & Search (for Practice Set Selection & Debugging)
	// =========================================================================

	setFilters({ searchQuery, posFilter, sourceFilter, inSetFilter }) {
		if (searchQuery !== undefined) this.searchQuery = String(searchQuery).trim().toLowerCase();
		if (posFilter !== undefined) this.posFilter = posFilter;
		if (sourceFilter !== undefined) this.sourceFilter = sourceFilter;
		if (inSetFilter !== undefined) this.inSetFilter = inSetFilter;

		this._recomputeFilteredRows();
		if (this.scrollViewport) {
			this.scrollViewport.scrollTop = 0;
		}
		if (this.container) {
			this.renderViewport();
		}
		this.onStateChange({ type: 'filter-changed', count: this.filteredRowIds.length });
	}

	_recomputeFilteredRows() {
		const q = this.searchQuery;
		const pos = this.posFilter;
		const src = this.sourceFilter;
		const inSetMode = this.inSetFilter;

		if (!q && !pos && !src && inSetMode === 'all') {
			this.filteredRowIds = [...this.rowOrder];
			return;
		}

		this.filteredRowIds = this.rowOrder.filter(unitId => {
			const unit = this.rawUnits[unitId];
			if (!unit) return false;

			if (pos && this.getCellValue(unitId, 'PartofSpeech') !== pos) return false;
			if (src && this.getCellValue(unitId, 'Source') !== src) return false;

			if (inSetMode !== 'all') {
				const isInSet = Boolean(this.getCellValue(unitId, 'InSet'));
				if (inSetMode === 'inSet' && !isInSet) return false;
				if (inSetMode === 'notInSet' && isInSet) return false;
			}

			if (q) {
				const idStr = String(unitId);
				const ko = String(this.getCellValue(unitId, 'Korean') || '').toLowerCase();
				const en = String(this.getCellValue(unitId, 'English') || '').toLowerCase();
				const dis = String(this.getCellValue(unitId, 'Disambiguation') || '').toLowerCase();
				const tags = this.formatCellValue(this.getCellValue(unitId, 'SemanticTags'), this.columnMap.get('SemanticTags')).toLowerCase();
				const notes = String(this.getCellValue(unitId, 'notes') || '').toLowerCase();
				if (
					!idStr.includes(q) &&
					!ko.includes(q) &&
					!en.includes(q) &&
					!dis.includes(q) &&
					!tags.includes(q) &&
					!notes.includes(q)
				) {
					return false;
				}
			}

			return true;
		});
	}

	/**
	 * Computes the visible row range for virtual scrolling.
	 */
	computeVirtualRange(scrollTop, viewportHeight) {
		const totalRows = this.filteredRowIds.length;
		const totalHeight = totalRows * this.rowHeight;
		if (totalRows === 0) {
			return { startIndex: 0, endIndex: 0, offsetY: 0, totalHeight: 0, visibleCount: 0 };
		}

		const rawStart = Math.floor(scrollTop / this.rowHeight);
		const visibleRows = Math.ceil(viewportHeight / this.rowHeight);
		const startIndex = Math.max(0, rawStart - this.overscan);
		const endIndex = Math.min(totalRows, rawStart + visibleRows + this.overscan);
		const offsetY = startIndex * this.rowHeight;

		return {
			startIndex,
			endIndex,
			offsetY,
			totalHeight,
			visibleCount: endIndex - startIndex
		};
	}

	// =========================================================================
	// Browser DOM Mounting & Virtualized Rendering
	// =========================================================================

	mount(containerElement) {
		this.container = containerElement;
		this.container.innerHTML = '';

		// Header Wrapper (scrolls horizontally in sync with viewport)
		const headerViewport = document.createElement('div');
		headerViewport.className = 'sheet-header-viewport';
		this.headerTrack = document.createElement('div');
		this.headerTrack.className = 'sheet-header-track';
		headerViewport.appendChild(this.headerTrack);

		// Body Scroll Viewport
		this.scrollViewport = document.createElement('div');
		this.scrollViewport.className = 'sheet-scroll-viewport';

		this.scrollSpacer = document.createElement('div');
		this.scrollSpacer.className = 'sheet-scroll-spacer';

		this.rowsLayer = document.createElement('div');
		this.rowsLayer.className = 'sheet-rows-layer';
		this.scrollSpacer.appendChild(this.rowsLayer);
		this.scrollViewport.appendChild(this.scrollSpacer);

		this.container.appendChild(headerViewport);
		this.container.appendChild(this.scrollViewport);

		// Sync horizontal scroll & trigger virtualized vertical render
		this.scrollViewport.addEventListener('scroll', () => {
			headerViewport.scrollLeft = this.scrollViewport.scrollLeft;
			this.scheduleViewportRender();
		}, { passive: true });

		if (typeof window !== 'undefined') {
			window.addEventListener('resize', () => this.scheduleViewportRender());
		}

		this.renderHeader();
		this.renderViewport();
	}

	scheduleViewportRender() {
		if (this.rafPending) return;
		this.rafPending = true;
		const schedule = (typeof window !== 'undefined' && window.requestAnimationFrame)
			? window.requestAnimationFrame.bind(window)
			: (fn => setTimeout(fn, 16));
		schedule(() => {
			this.rafPending = false;
			this.renderViewport();
		});
	}

	getTotalGridWidth() {
		const visibleCols = this.getVisibleColumns();
		let total = this.rowHandleWidth;
		for (const col of visibleCols) {
			total += (this.columnWidths[col.key] || col.defaultWidth || 140);
		}
		return total;
	}

	renderHeader() {
		if (!this.headerTrack) return;
		this.headerTrack.innerHTML = '';
		const visibleCols = this.getVisibleColumns();
		const totalWidth = this.getTotalGridWidth();
		this.headerTrack.style.width = `${totalWidth}px`;

		// Fixed left corner header for row order / drag handle
		const cornerCell = document.createElement('div');
		cornerCell.className = 'sheet-header-cell sheet-row-handle-header';
		cornerCell.style.width = `${this.rowHandleWidth}px`;
		cornerCell.title = 'Drag rows by their handle to reorder, or click Reset Order in toolbar';
		cornerCell.innerHTML = `<span class="row-order-label"># Order</span>`;
		this.headerTrack.appendChild(cornerCell);

		for (const col of visibleCols) {
			const width = this.columnWidths[col.key] || col.defaultWidth || 140;
			const cell = document.createElement('div');
			const originClass = col.isDefault ? 'col-origin-default' : 'col-origin-custom';
			const isSorted = this.sortState.columnKey === col.key;
			const sortDir = isSorted ? this.sortState.direction : null;

			cell.className = `sheet-header-cell ${originClass}${isSorted ? ' is-sorted' : ''}`;
			cell.style.width = `${width}px`;
			cell.dataset.colKey = col.key;
			cell.draggable = true;

			// Top bar: Origin badge + Type badge + Action buttons (Edit/Delete/Hide)
			const metaBar = document.createElement('div');
			metaBar.className = 'col-header-meta';

			const badge = document.createElement('span');
			badge.className = `col-origin-badge ${col.isDefault ? 'badge-default' : 'badge-custom'}`;
			badge.textContent = col.isDefault ? 'DATA.JS' : `USER · ${col.type}`;
			metaBar.appendChild(badge);

			const actions = document.createElement('div');
			actions.className = 'col-header-actions';

			// Custom columns can be edited and deleted
			if (!col.isDefault) {
				const editBtn = document.createElement('button');
				editBtn.type = 'button';
				editBtn.className = 'col-icon-btn col-edit-btn';
				editBtn.title = `Edit column "${col.label}"`;
				editBtn.textContent = '✎';
				editBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					this.onStateChange({ type: 'request-edit-column', column: col });
				});
				actions.appendChild(editBtn);

				const delBtn = document.createElement('button');
				delBtn.type = 'button';
				delBtn.className = 'col-icon-btn col-delete-btn';
				delBtn.title = `Delete column "${col.label}"`;
				delBtn.textContent = '🗑';
				delBtn.addEventListener('click', (e) => {
					e.stopPropagation();
					this.onStateChange({ type: 'request-delete-column', column: col });
				});
				actions.appendChild(delBtn);
			}

			// Every column can be hidden
			const hideBtn = document.createElement('button');
			hideBtn.type = 'button';
			hideBtn.className = 'col-icon-btn col-hide-btn';
			hideBtn.title = `Hide column "${col.label}"`;
			hideBtn.textContent = '👁';
			hideBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.setColumnVisibility(col.key, false);
			});
			actions.appendChild(hideBtn);

			metaBar.appendChild(actions);
			cell.appendChild(metaBar);

			// Bottom bar: Column Title + Sort Button
			const mainBar = document.createElement('div');
			mainBar.className = 'col-header-main';

			const titleSpan = document.createElement('span');
			titleSpan.className = 'col-header-title';
			titleSpan.textContent = col.label;
			titleSpan.title = `${col.label} (${col.isDefault ? 'Default data.js column' : 'Additional DB column'}) — Drag header to reorder`;
			mainBar.appendChild(titleSpan);

			const sortBtn = document.createElement('button');
			sortBtn.type = 'button';
			sortBtn.className = `col-sort-btn${isSorted ? ' active' : ''}`;
			sortBtn.title = `Sort by ${col.label} (toggle ascending / descending)`;
			sortBtn.innerHTML = isSorted
				? (sortDir === 'asc' ? '▲ ASC' : '▼ DESC')
				: '⇅';
			sortBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.toggleSortByColumn(col.key);
			});
			mainBar.appendChild(sortBtn);

			cell.appendChild(mainBar);

			// Column Resize Handle
			const resizeHandle = document.createElement('div');
			resizeHandle.className = 'col-resize-handle';
			resizeHandle.title = 'Drag to resize column';
			resizeHandle.addEventListener('mousedown', (e) => {
				e.stopPropagation();
				e.preventDefault();
				this._startColumnResize(e, col.key, width);
			});
			cell.appendChild(resizeHandle);

			// Column Drag-and-Drop Reordering
			cell.addEventListener('dragstart', (e) => {
				this.dragState = { type: 'column', colKey: col.key };
				cell.classList.add('is-dragging');
				if (e.dataTransfer) {
					e.dataTransfer.effectAllowed = 'move';
					e.dataTransfer.setData('text/plain', col.key);
				}
			});
			cell.addEventListener('dragend', () => {
				cell.classList.remove('is-dragging');
				this.dragState = null;
			});
			cell.addEventListener('dragover', (e) => {
				if (!this.dragState || this.dragState.type !== 'column') return;
				e.preventDefault();
				const rect = cell.getBoundingClientRect();
				const isRightHalf = (e.clientX - rect.left) > rect.width / 2;
				cell.classList.toggle('drop-target-left', !isRightHalf);
				cell.classList.toggle('drop-target-right', isRightHalf);
			});
			cell.addEventListener('dragleave', () => {
				cell.classList.remove('drop-target-left', 'drop-target-right');
			});
			cell.addEventListener('drop', (e) => {
				e.preventDefault();
				cell.classList.remove('drop-target-left', 'drop-target-right');
				if (!this.dragState || this.dragState.type !== 'column') return;
				const sourceKey = this.dragState.colKey;
				const rect = cell.getBoundingClientRect();
				const insertAfter = (e.clientX - rect.left) > rect.width / 2;
				this.dragState = null;
				this.reorderColumn(sourceKey, col.key, insertAfter);
			});

			this.headerTrack.appendChild(cell);
		}
	}

	_startColumnResize(startEvent, colKey, initialWidth) {
		const startX = startEvent.clientX;
		let currentWidth = initialWidth;

		const onMouseMove = (moveEvent) => {
			const delta = moveEvent.clientX - startX;
			currentWidth = Math.max(60, Math.min(800, initialWidth + delta));
			this.columnWidths[colKey] = currentWidth;
			this.renderHeader();
			this.renderViewport();
		};

		const onMouseUp = () => {
			window.removeEventListener('mousemove', onMouseMove);
			window.removeEventListener('mouseup', onMouseUp);
			this.setColumnWidth(colKey, currentWidth);
		};

		window.addEventListener('mousemove', onMouseMove);
		window.addEventListener('mouseup', onMouseUp);
	}

	/**
	 * Renders ONLY the rows visible inside the scroll viewport.
	 */
	renderViewport() {
		if (!this.scrollViewport || !this.scrollSpacer || !this.rowsLayer) return;

		const scrollTop = this.scrollViewport.scrollTop;
		const viewportHeight = this.scrollViewport.clientHeight || 600;
		const { startIndex, endIndex, offsetY, totalHeight } = this.computeVirtualRange(scrollTop, viewportHeight);

		const totalWidth = this.getTotalGridWidth();
		this.scrollSpacer.style.height = `${Math.max(totalHeight, 1)}px`;
		this.scrollSpacer.style.width = `${totalWidth}px`;
		this.rowsLayer.style.transform = `translateY(${offsetY}px)`;
		this.rowsLayer.innerHTML = '';

		const visibleCols = this.getVisibleColumns();

		if (this.filteredRowIds.length === 0) {
			const emptyEl = document.createElement('div');
			emptyEl.className = 'sheet-empty-state';
			emptyEl.textContent = 'No language units match the active filter criteria.';
			this.rowsLayer.appendChild(emptyEl);
			return;
		}

		for (let rowIdx = startIndex; rowIdx < endIndex; rowIdx++) {
			const unitId = this.filteredRowIds[rowIdx];
			const rowEl = this._createRowElement(unitId, rowIdx, visibleCols);
			this.rowsLayer.appendChild(rowEl);
		}
	}

	_createRowElement(unitId, visualRowIndex, visibleCols) {
		const rowEl = document.createElement('div');
		const isInSet = Boolean(this.getCellValue(unitId, 'InSet'));
		rowEl.className = `sheet-row${isInSet ? ' row-in-set' : ''}`;
		rowEl.style.height = `${this.rowHeight}px`;
		rowEl.dataset.unitId = String(unitId);
		rowEl.dataset.rowIndex = String(visualRowIndex);

		// 1. Row Reorder Handle Cell
		const handleCell = document.createElement('div');
		handleCell.className = 'sheet-cell sheet-row-handle-cell';
		handleCell.style.width = `${this.rowHandleWidth}px`;
		handleCell.draggable = true;
		handleCell.title = `Row #${visualRowIndex + 1} (Unit ID ${unitId}) — Drag to reorder row, or double-click to jump row to index`;

		const gripIcon = document.createElement('span');
		gripIcon.className = 'row-drag-grip';
		gripIcon.textContent = '⋮⋮';
		handleCell.appendChild(gripIcon);

		const rowNumSpan = document.createElement('span');
		rowNumSpan.className = 'row-index-num';
		rowNumSpan.textContent = String(visualRowIndex + 1);
		handleCell.appendChild(rowNumSpan);

		// Double-click handle to move row to an exact position (helpful for jumping across thousands of rows)
		handleCell.addEventListener('dblclick', (e) => {
			e.stopPropagation();
			this.onStateChange({ type: 'request-move-row', unitId, currentIndex: this.rowOrder.indexOf(unitId) });
		});

		// Row Drag-and-Drop Reordering
		handleCell.addEventListener('dragstart', (e) => {
			this.dragState = { type: 'row', unitId };
			rowEl.classList.add('is-dragging-row');
			if (e.dataTransfer) {
				e.dataTransfer.effectAllowed = 'move';
				e.dataTransfer.setData('text/plain', String(unitId));
			}
		});
		handleCell.addEventListener('dragend', () => {
			rowEl.classList.remove('is-dragging-row');
			this.dragState = null;
		});

		rowEl.addEventListener('dragover', (e) => {
			if (!this.dragState || this.dragState.type !== 'row') return;
			e.preventDefault();
			const rect = rowEl.getBoundingClientRect();
			const isBottomHalf = (e.clientY - rect.top) > rect.height / 2;
			rowEl.classList.toggle('drop-row-above', !isBottomHalf);
			rowEl.classList.toggle('drop-row-below', isBottomHalf);
		});
		rowEl.addEventListener('dragleave', () => {
			rowEl.classList.remove('drop-row-above', 'drop-row-below');
		});
		rowEl.addEventListener('drop', (e) => {
			e.preventDefault();
			rowEl.classList.remove('drop-row-above', 'drop-row-below');
			if (!this.dragState || this.dragState.type !== 'row') return;
			const sourceUnitId = this.dragState.unitId;
			const rect = rowEl.getBoundingClientRect();
			const insertAfter = (e.clientY - rect.top) > rect.height / 2;
			this.dragState = null;
			this.reorderRowByUnitId(sourceUnitId, unitId, insertAfter);
		});

		rowEl.appendChild(handleCell);

		// 2. Data Cells
		for (const col of visibleCols) {
			const cellEl = this._createCellElement(unitId, col);
			rowEl.appendChild(cellEl);
		}

		return rowEl;
	}

	_createCellElement(unitId, col) {
		const width = this.columnWidths[col.key] || col.defaultWidth || 140;
		const cellEl = document.createElement('div');
		const originClass = col.isDefault ? 'cell-origin-default' : 'cell-origin-custom';
		cellEl.className = `sheet-cell ${originClass} cell-type-${col.type}`;
		cellEl.style.width = `${width}px`;
		cellEl.dataset.unitId = String(unitId);
		cellEl.dataset.colKey = col.key;

		// Show temporary async placeholder if DB is still streaming initial batches for custom columns
		if (!col.isDefault && !this.asyncLoadComplete && !this.unitRecords.has(unitId)) {
			cellEl.classList.add('cell-async-loading');
		}

		const isEditing = this.editingCell &&
			this.editingCell.unitId === unitId &&
			this.editingCell.colKey === col.key;

		if (isEditing) {
			this._renderInlineEditor(cellEl, unitId, col);
			return cellEl;
		}

		const val = this.getCellValue(unitId, col.key);

		// Type-specialized interactive renderers
		if (col.type === 'boolean') {
			const label = document.createElement('label');
			label.className = 'cell-checkbox-wrap';
			const cb = document.createElement('input');
			cb.type = 'checkbox';
			cb.className = 'cell-checkbox';
			cb.checked = Boolean(val);
			cb.addEventListener('change', () => {
				this.setCellValue(unitId, col.key, cb.checked);
			});
			const txt = document.createElement('span');
			txt.className = `bool-pill ${val ? 'bool-true' : 'bool-false'}`;
			txt.textContent = val ? 'In Set' : 'No';
			if (col.key !== 'InSet') {
				txt.textContent = val ? 'true' : 'false';
			}
			label.appendChild(cb);
			label.appendChild(txt);
			cellEl.appendChild(label);
			return cellEl;
		}

		if (col.type === 'enum' && !col.isDefault) {
			// Direct dropdown for additional enum columns like LongTermRecognition
			const select = document.createElement('select');
			select.className = `cell-enum-select enum-val-${String(val)}`;
			const opts = Array.isArray(col.enumOptions) ? col.enumOptions : [];
			for (const opt of opts) {
				const optEl = document.createElement('option');
				optEl.value = opt;
				optEl.textContent = opt;
				if (opt === String(val)) optEl.selected = true;
				select.appendChild(optEl);
			}
			select.addEventListener('change', () => {
				this.setCellValue(unitId, col.key, select.value);
			});
			cellEl.appendChild(select);
			return cellEl;
		}

		if (col.type === 'unixTime') {
			const num = Number(val) || 0;
			const span = document.createElement('span');
			span.className = `cell-text unix-time-text${num === 0 ? ' is-zero-time' : ''}`;
			span.textContent = this.formatCellValue(val, col);
			cellEl.appendChild(span);

			const nowBtn = document.createElement('button');
			nowBtn.type = 'button';
			nowBtn.className = 'cell-quick-now-btn';
			nowBtn.title = 'Set to current Unix timestamp (now)';
			nowBtn.textContent = '⏱';
			nowBtn.addEventListener('click', (e) => {
				e.stopPropagation();
				this.setCellValue(unitId, col.key, Math.floor(Date.now() / 1000));
			});
			cellEl.appendChild(nowBtn);
		} else if (col.type === 'tags') {
			const wrap = document.createElement('div');
			wrap.className = 'cell-tags-wrap';
			const tagsArr = val instanceof Set ? Array.from(val) : (Array.isArray(val) ? val : []);
			for (const t of tagsArr) {
				const chip = document.createElement('span');
				chip.className = 'tag-chip';
				chip.textContent = t;
				wrap.appendChild(chip);
			}
			cellEl.appendChild(wrap);
		} else {
			const span = document.createElement('span');
			span.className = 'cell-text';
			if (col.key === 'Korean') span.classList.add('cell-korean-text');
			if (col.key === 'Id') span.classList.add('cell-id-text');
			span.textContent = this.formatCellValue(val, col);
			cellEl.appendChild(span);
		}

		const formattedTitle = this.formatCellValue(val, col);
		cellEl.title = `${col.label}: ${formattedTitle || '(empty)'}\nDouble-click to edit`;

		// Double-click to open inline cell editor
		cellEl.addEventListener('dblclick', (e) => {
			e.stopPropagation();
			this.editingCell = { unitId, colKey: col.key };
			this.renderViewport();
		});

		return cellEl;
	}

	_renderInlineEditor(cellEl, unitId, col) {
		cellEl.classList.add('is-editing');
		const currentVal = this.getCellValue(unitId, col.key);

		const commit = async (newVal) => {
			this.editingCell = null;
			await this.setCellValue(unitId, col.key, newVal);
		};

		const cancel = () => {
			this.editingCell = null;
			this.renderViewport();
		};

		if (col.type === 'enum' && Array.isArray(col.enumOptions)) {
			const select = document.createElement('select');
			select.className = 'cell-inline-input';
			for (const opt of col.enumOptions) {
				const o = document.createElement('option');
				o.value = opt;
				o.textContent = opt;
				if (opt === String(currentVal)) o.selected = true;
				select.appendChild(o);
			}
			select.addEventListener('change', () => commit(select.value));
			select.addEventListener('blur', () => commit(select.value));
			select.addEventListener('keydown', (e) => {
				if (e.key === 'Escape') cancel();
			});
			cellEl.appendChild(select);
			setTimeout(() => select.focus(), 0);
			return;
		}

		const input = document.createElement('input');
		input.className = 'cell-inline-input';
		if (col.type === 'int' || col.type === 'float' || col.type === 'number' || col.type === 'unixTime') {
			input.type = 'number';
			input.step = col.type === 'float' ? 'any' : '1';
			input.value = String(Number(currentVal) || 0);
		} else if (col.type === 'tags') {
			input.type = 'text';
			input.value = (currentVal instanceof Set ? Array.from(currentVal) : (Array.isArray(currentVal) ? currentVal : [])).join(', ');
		} else if (col.type === 'conjugation') {
			input.type = 'text';
			input.value = Array.isArray(currentVal) ? JSON.stringify(currentVal) : String(currentVal ?? '');
		} else {
			input.type = 'text';
			input.value = String(currentVal ?? '');
		}

		let committed = false;
		const finishCommit = () => {
			if (committed) return;
			committed = true;
			commit(input.value);
		};

		input.addEventListener('keydown', (e) => {
			if (e.key === 'Enter') {
				e.preventDefault();
				finishCommit();
			} else if (e.key === 'Escape') {
				e.preventDefault();
				committed = true;
				cancel();
			}
		});
		input.addEventListener('blur', () => finishCommit());

		cellEl.appendChild(input);
		setTimeout(() => {
			input.focus();
			if (typeof input.select === 'function') input.select();
		}, 0);
	}
}

if (typeof window !== 'undefined') {
	window.SpreadsheetEngine = SpreadsheetEngine;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = { SpreadsheetEngine };
}
