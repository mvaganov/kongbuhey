/**
 * ============================================================================
 * db.js - Browser Database Storage Layer (IndexedDB + LocalStorage Mirror)
 * ============================================================================
 *
 * Manages persistent storage for the Kongbuhey Web Application:
 *   1. Additional (user-defined & flashcard) column schemas
 *   2. Per-unit additional column values & default column overrides
 *   3. Spreadsheet view settings (columnOrder, columnWidths, columnVisibility,
 *      rowOrder, sortState)
 *
 * Works directly on local file systems (file://) with zero external dependencies.
 */

const KONGBUHEY_DB_NAME = 'KongbuheyAppDB';
const KONGBUHEY_DB_VERSION = 1;
const LS_FALLBACK_PREFIX = 'kongbuhey_db_v1_';

/**
 * The 13 default columns sourced directly from data.js (DATA_SCHEMA).
 * Default columns are editable in the spreadsheet, but NOT deletable.
 */
const DEFAULT_COLUMNS_SPEC = [
	{ key: 'Id', schemaIndex: 0, label: 'Id', type: 'int', isDefault: true, defaultWidth: 74, editable: true },
	{ key: 'Korean', schemaIndex: 1, label: 'Korean', type: 'string', isDefault: true, defaultWidth: 140, editable: true },
	{ key: 'English', schemaIndex: 2, label: 'English', type: 'string', isDefault: true, defaultWidth: 220, editable: true },
	{ key: 'PartofSpeech', schemaIndex: 3, label: 'PartofSpeech', type: 'enum', enumOptions: ['Noun', 'Pronoun', 'Exclamation', 'Descriptive Verb', 'Grammar', 'Action Verb', 'Adverb', 'Number', 'Determiner'], isDefault: true, defaultWidth: 135, editable: true },
	{ key: 'SemanticTags', schemaIndex: 4, label: 'SemanticTags', type: 'tags', isDefault: true, defaultWidth: 210, editable: true },
	{ key: 'Disambiguation', schemaIndex: 5, label: 'Disambiguation', type: 'string', isDefault: true, defaultWidth: 180, editable: true },
	{ key: 'Conjugation', schemaIndex: 6, label: 'Conjugation', type: 'conjugation', isDefault: true, defaultWidth: 150, editable: true },
	{ key: 'Source', schemaIndex: 7, label: 'Source', type: 'string', isDefault: true, defaultWidth: 110, editable: true },
	{ key: 'PriorityScore', schemaIndex: 8, label: 'PriorityScore', type: 'int', isDefault: true, defaultWidth: 115, editable: true },
	{ key: 'FormalityLevel', schemaIndex: 9, label: 'FormalityLevel', type: 'string', isDefault: true, defaultWidth: 130, editable: true },
	{ key: 'HonorificRules', schemaIndex: 10, label: 'HonorificRules', type: 'string', isDefault: true, defaultWidth: 190, editable: true },
	{ key: 'SemanticVector', schemaIndex: 11, label: 'SemanticVector', type: 'json', isDefault: true, defaultWidth: 240, editable: true },
	{ key: 'SyntaxFrame', schemaIndex: 12, label: 'SyntaxFrame', type: 'string', isDefault: true, defaultWidth: 230, editable: true }
];

/**
 * Initial additional columns created immediately for Flashcard mode & practice sets.
 * These are user/additional columns (colored distinctly, creatable, editable, deletable).
 */
const INITIAL_ADDITIONAL_COLUMNS = [
	{
		key: 'InSet',
		label: 'InSet',
		type: 'boolean',
		defaultValue: false,
		isDefault: false,
		defaultWidth: 90,
		description: 'Whether this language unit is selected for the current practice set'
	},
	{
		key: 'RecognitionScore',
		label: 'RecognitionScore',
		type: 'int',
		defaultValue: 0,
		isDefault: false,
		defaultWidth: 145,
		description: 'Numeric score tracking short-term flashcard recognition accuracy'
	},
	{
		key: 'LongTermRecognition',
		label: 'LongTermRecognition',
		type: 'enum',
		enumOptions: ['unknown', 'recognized', 'definitionKnown', 'knownByDefinition'],
		defaultValue: 'unknown',
		isDefault: false,
		defaultWidth: 185,
		description: 'Long-term mastery state evaluated by the flashcard system'
	},
	{
		key: 'TimeStampLastCorrect',
		label: 'TimeStampLastCorrect',
		type: 'unixTime',
		defaultValue: 0,
		isDefault: false,
		defaultWidth: 180,
		description: 'Unix timestamp (seconds) when the user last answered this unit correctly'
	},
	{
		key: 'TimeStampLastSeen',
		label: 'TimeStampLastSeen',
		type: 'unixTime',
		defaultValue: 0,
		isDefault: false,
		defaultWidth: 175,
		description: 'Unix timestamp (seconds) when the user last encountered this unit'
	},
	{
		key: 'notes',
		label: 'notes',
		type: 'string',
		defaultValue: '',
		isDefault: false,
		defaultWidth: 220,
		description: 'Personal study notes or mnemonics for this language unit'
	}
];

/**
 * Coerce a cell value to match its column specification type.
 */
function coerceColumnValue(value, colSpec) {
	if (!colSpec) return value;
	const type = colSpec.type;

	if (type === 'boolean') {
		if (typeof value === 'boolean') return value;
		if (typeof value === 'string') {
			const lower = value.trim().toLowerCase();
			return lower === 'true' || lower === '1' || lower === 'yes';
		}
		return Boolean(value);
	}

	if (type === 'int') {
		if (value === '' || value === null || value === undefined) {
			return typeof colSpec.defaultValue === 'number' ? colSpec.defaultValue : 0;
		}
		const parsed = parseInt(value, 10);
		return Number.isNaN(parsed) ? (typeof colSpec.defaultValue === 'number' ? colSpec.defaultValue : 0) : parsed;
	}

	if (type === 'float' || type === 'number') {
		if (value === '' || value === null || value === undefined) {
			return typeof colSpec.defaultValue === 'number' ? colSpec.defaultValue : 0;
		}
		const parsed = parseFloat(value);
		return Number.isNaN(parsed) ? 0 : parsed;
	}

	if (type === 'unixTime') {
		if (value === '' || value === null || value === undefined) return 0;
		if (typeof value === 'number') return Math.max(0, Math.floor(value));
		const str = String(value).trim();
		if (!str || str === '0' || str.toLowerCase() === 'never') return 0;
		if (/^\d+$/.test(str)) {
			const num = parseInt(str, 10);
			// Convert milliseconds to seconds if user pasted a 13-digit ms timestamp
			return str.length >= 13 ? Math.floor(num / 1000) : num;
		}
		const dateMs = Date.parse(str);
		if (!Number.isNaN(dateMs)) {
			return Math.floor(dateMs / 1000);
		}
		return 0;
	}

	if (type === 'enum') {
		const options = Array.isArray(colSpec.enumOptions) ? colSpec.enumOptions : [];
		const strVal = value === null || value === undefined ? '' : String(value).trim();
		if (options.length > 0 && !options.includes(strVal)) {
			// Case-insensitive match attempt
			const match = options.find(o => o.toLowerCase() === strVal.toLowerCase());
			if (match) return match;
			return colSpec.defaultValue !== undefined ? colSpec.defaultValue : options[0];
		}
		return strVal;
	}

	if (type === 'tags') {
		if (value instanceof Set) return Array.from(value);
		if (Array.isArray(value)) return value.map(v => String(v).trim()).filter(Boolean);
		if (typeof value === 'string') {
			return value.split(',').map(s => s.trim()).filter(Boolean);
		}
		return [];
	}

	if (type === 'conjugation') {
		if (Array.isArray(value)) return value;
		if (typeof value === 'string') {
			const trimmed = value.trim();
			if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
				try {
					const parsed = JSON.parse(trimmed);
					if (Array.isArray(parsed)) return parsed;
				} catch (_) {
					// Keep as string if not valid JSON array
				}
			}
			return trimmed;
		}
		return value ? String(value) : '';
	}

	// Default: string / json
	if (value === null || value === undefined) {
		return colSpec.defaultValue !== undefined ? String(colSpec.defaultValue) : '';
	}
	return String(value);
}

class KongbuheyDB {
	constructor() {
		this.db = null;
		this.useMemoryFallback = false;
		this.memoryStore = {
			custom_columns: new Map(),
			unit_data: new Map(),
			view_settings: new Map()
		};
	}

	/**
	 * Opens the IndexedDB database (or initializes localStorage/memory fallback if unavailable).
	 */
	async open() {
		if (this.db || this.useMemoryFallback) return;

		if (typeof window === 'undefined' || !window.indexedDB) {
			this.useMemoryFallback = true;
			this._loadFallbackFromLocalStorage();
			await this._ensureInitialColumns();
			return;
		}

		try {
			this.db = await new Promise((resolve, reject) => {
				const request = window.indexedDB.open(KONGBUHEY_DB_NAME, KONGBUHEY_DB_VERSION);

				request.onupgradeneeded = (event) => {
					const db = event.target.result;
					if (!db.objectStoreNames.contains('custom_columns')) {
						db.createObjectStore('custom_columns', { keyPath: 'key' });
					}
					if (!db.objectStoreNames.contains('unit_data')) {
						db.createObjectStore('unit_data', { keyPath: 'unitId' });
					}
					if (!db.objectStoreNames.contains('view_settings')) {
						db.createObjectStore('view_settings', { keyPath: 'id' });
					}
				};

				request.onsuccess = (event) => resolve(event.target.result);
				request.onerror = (event) => reject(event.target.error || new Error('IndexedDB open failed'));
			});
		} catch (err) {
			this.useMemoryFallback = true;
			this._loadFallbackFromLocalStorage();
		}

		await this._ensureInitialColumns();
	}

	_loadFallbackFromLocalStorage() {
		if (typeof window === 'undefined' || !window.localStorage) return;
		try {
			const colsRaw = window.localStorage.getItem(LS_FALLBACK_PREFIX + 'custom_columns');
			if (colsRaw) {
				const cols = JSON.parse(colsRaw);
				cols.forEach(c => this.memoryStore.custom_columns.set(c.key, c));
			}
			const unitsRaw = window.localStorage.getItem(LS_FALLBACK_PREFIX + 'unit_data');
			if (unitsRaw) {
				const units = JSON.parse(unitsRaw);
				units.forEach(u => this.memoryStore.unit_data.set(u.unitId, u));
			}
			const viewRaw = window.localStorage.getItem(LS_FALLBACK_PREFIX + 'view_settings');
			if (viewRaw) {
				const views = JSON.parse(viewRaw);
				views.forEach(v => this.memoryStore.view_settings.set(v.id, v));
			}
		} catch (_) {
			// Ignore localStorage parse errors
		}
	}

	_saveFallbackToLocalStorage(storeName) {
		if (typeof window === 'undefined' || !window.localStorage) return;
		try {
			const map = this.memoryStore[storeName];
			if (map) {
				const arr = Array.from(map.values());
				window.localStorage.setItem(LS_FALLBACK_PREFIX + storeName, JSON.stringify(arr));
			}
		} catch (_) {
			// Ignore quota errors
		}
	}

	/**
	 * Ensure the initial 6 additional columns exist on first database initialization.
	 * Uses a metadata record in view_settings ('schema_initialized') so if the user
	 * explicitly deletes one of the initial custom columns later, it stays deleted
	 * unless they reset custom columns.
	 */
	async _ensureInitialColumns() {
		const initMeta = await this._getRecord('view_settings', 'schema_initialized');
		const existingCols = await this.getCustomColumns();

		if (!initMeta && existingCols.length === 0) {
			for (let i = 0; i < INITIAL_ADDITIONAL_COLUMNS.length; i++) {
				const col = { ...INITIAL_ADDITIONAL_COLUMNS[i], order: i, createdAt: Date.now() };
				await this._putRecord('custom_columns', col);
			}
			await this._putRecord('view_settings', {
				id: 'schema_initialized',
				initializedAt: Date.now(),
				version: KONGBUHEY_DB_VERSION
			});
		}
	}

	/**
	 * Reset custom columns back to ensure all 6 initial additional columns exist.
	 */
	async restoreInitialColumns() {
		const existingCols = await this.getCustomColumns();
		const existingKeys = new Set(existingCols.map(c => c.key));
		let nextOrder = existingCols.length;
		for (const initCol of INITIAL_ADDITIONAL_COLUMNS) {
			if (!existingKeys.has(initCol.key)) {
				await this._putRecord('custom_columns', {
					...initCol,
					order: nextOrder++,
					createdAt: Date.now()
				});
			}
		}
		return this.getCustomColumns();
	}

	async _getRecord(storeName, key) {
		if (this.useMemoryFallback) {
			const val = this.memoryStore[storeName].get(key);
			return val ? JSON.parse(JSON.stringify(val)) : null;
		}
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction(storeName, 'readonly');
			const store = tx.objectStore(storeName);
			const req = store.get(key);
			req.onsuccess = () => resolve(req.result || null);
			req.onerror = () => reject(req.error);
		});
	}

	async _getAllRecords(storeName) {
		if (this.useMemoryFallback) {
			return Array.from(this.memoryStore[storeName].values()).map(v => JSON.parse(JSON.stringify(v)));
		}
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction(storeName, 'readonly');
			const store = tx.objectStore(storeName);
			const req = store.getAll();
			req.onsuccess = () => resolve(req.result || []);
			req.onerror = () => reject(req.error);
		});
	}

	async _putRecord(storeName, record) {
		if (this.useMemoryFallback) {
			const keyField = storeName === 'custom_columns' ? 'key' : (storeName === 'unit_data' ? 'unitId' : 'id');
			this.memoryStore[storeName].set(record[keyField], JSON.parse(JSON.stringify(record)));
			this._saveFallbackToLocalStorage(storeName);
			return record;
		}
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction(storeName, 'readwrite');
			const store = tx.objectStore(storeName);
			const req = store.put(record);
			req.onsuccess = () => resolve(record);
			req.onerror = () => reject(req.error);
		});
	}

	async _deleteRecord(storeName, key) {
		if (this.useMemoryFallback) {
			this.memoryStore[storeName].delete(key);
			this._saveFallbackToLocalStorage(storeName);
			return true;
		}
		return new Promise((resolve, reject) => {
			const tx = this.db.transaction(storeName, 'readwrite');
			const store = tx.objectStore(storeName);
			const req = store.delete(key);
			req.onsuccess = () => resolve(true);
			req.onerror = () => reject(req.error);
		});
	}

	// =========================================================================
	// Custom Columns CRUD
	// =========================================================================

	async getCustomColumns() {
		const cols = await this._getAllRecords('custom_columns');
		return cols.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
	}

	async createCustomColumn(colDef) {
		const key = String(colDef.key || colDef.label || '').trim();
		if (!key) {
			throw new Error('Column name cannot be empty.');
		}
		if (DEFAULT_COLUMNS_SPEC.some(c => c.key.toLowerCase() === key.toLowerCase())) {
			throw new Error(`Column "${key}" conflicts with a default data.js column.`);
		}
		const existing = await this._getRecord('custom_columns', key);
		if (existing) {
			throw new Error(`Additional column "${key}" already exists.`);
		}

		const allCols = await this.getCustomColumns();
		const type = colDef.type || 'string';
		const enumOptions = type === 'enum'
			? (Array.isArray(colDef.enumOptions)
				? colDef.enumOptions
				: String(colDef.enumOptions || '').split(',').map(s => s.trim()).filter(Boolean))
			: undefined;

		if (type === 'enum' && (!enumOptions || enumOptions.length === 0)) {
			throw new Error('Enum columns require at least one enum option.');
		}

		const tempSpec = { key, type, enumOptions };
		const defaultValue = coerceColumnValue(colDef.defaultValue, tempSpec);

		const newCol = {
			key,
			label: colDef.label ? String(colDef.label).trim() : key,
			type,
			enumOptions,
			defaultValue,
			isDefault: false,
			defaultWidth: colDef.defaultWidth || 150,
			description: colDef.description || '',
			order: allCols.length,
			createdAt: Date.now()
		};

		await this._putRecord('custom_columns', newCol);
		return newCol;
	}

	async updateCustomColumn(originalKey, updates) {
		const existing = await this._getRecord('custom_columns', originalKey);
		if (!existing) {
			throw new Error(`Custom column "${originalKey}" not found.`);
		}

		const newKey = updates.key ? String(updates.key).trim() : originalKey;
		if (!newKey) {
			throw new Error('Column name cannot be empty.');
		}
		if (DEFAULT_COLUMNS_SPEC.some(c => c.key.toLowerCase() === newKey.toLowerCase())) {
			throw new Error(`Column "${newKey}" conflicts with a default data.js column.`);
		}

		const type = updates.type || existing.type;
		const enumOptions = type === 'enum'
			? (Array.isArray(updates.enumOptions)
				? updates.enumOptions
				: (updates.enumOptions !== undefined
					? String(updates.enumOptions).split(',').map(s => s.trim()).filter(Boolean)
					: existing.enumOptions))
			: undefined;

		if (type === 'enum' && (!enumOptions || enumOptions.length === 0)) {
			throw new Error('Enum columns require at least one enum option.');
		}

		const tempSpec = { key: newKey, type, enumOptions };
		const rawDefault = updates.defaultValue !== undefined ? updates.defaultValue : existing.defaultValue;
		const defaultValue = coerceColumnValue(rawDefault, tempSpec);

		const updatedCol = {
			...existing,
			key: newKey,
			label: updates.label !== undefined ? String(updates.label).trim() : newKey,
			type,
			enumOptions,
			defaultValue,
			description: updates.description !== undefined ? updates.description : existing.description,
			updatedAt: Date.now()
		};

		if (newKey !== originalKey) {
			const conflict = await this._getRecord('custom_columns', newKey);
			if (conflict) {
				throw new Error(`Column "${newKey}" already exists.`);
			}
			await this._deleteRecord('custom_columns', originalKey);
			await this._putRecord('custom_columns', updatedCol);

			// Migrate existing unit values from originalKey to newKey
			const allUnitData = await this._getAllRecords('unit_data');
			for (const record of allUnitData) {
				if (record.custom && Object.prototype.hasOwnProperty.call(record.custom, originalKey)) {
					record.custom[newKey] = coerceColumnValue(record.custom[originalKey], updatedCol);
					delete record.custom[originalKey];
					await this._putRecord('unit_data', record);
				}
			}
		} else {
			await this._putRecord('custom_columns', updatedCol);
		}

		return updatedCol;
	}

	async deleteCustomColumn(key) {
		if (DEFAULT_COLUMNS_SPEC.some(c => c.key === key)) {
			throw new Error(`Default column "${key}" from data.js cannot be deleted.`);
		}
		await this._deleteRecord('custom_columns', key);

		// Clean up stored values for this deleted column across unit_data records
		const allUnitData = await this._getAllRecords('unit_data');
		for (const record of allUnitData) {
			if (record.custom && Object.prototype.hasOwnProperty.call(record.custom, key)) {
				delete record.custom[key];
				await this._putRecord('unit_data', record);
			}
		}
		return true;
	}

	// =========================================================================
	// Unit Additional Data & Default Overrides (Async Batch & Single Cell)
	// =========================================================================

	/**
	 * Asynchronously loads stored unit data in batches and invokes onBatch(records)
	 * so the UI can progressively populate without blocking initial render.
	 */
	async loadAllUnitDataIncremental(onBatch, batchSize = 250) {
		const allRecords = await this._getAllRecords('unit_data');
		if (!onBatch) return allRecords;

		for (let i = 0; i < allRecords.length; i += batchSize) {
			const slice = allRecords.slice(i, i + batchSize);
			onBatch(slice);
			if (i + batchSize < allRecords.length && typeof window !== 'undefined') {
				await new Promise(r => setTimeout(r, 0));
			}
		}
		return allRecords;
	}

	async getUnitRecord(unitId) {
		const existing = await this._getRecord('unit_data', unitId);
		return existing || { unitId, custom: {}, defaultOverrides: {}, updatedAt: 0 };
	}

	async saveUnitCellValue(unitId, colKey, value, isDefaultColumn = false) {
		const record = await this.getUnitRecord(unitId);
		if (!record.custom) record.custom = {};
		if (!record.defaultOverrides) record.defaultOverrides = {};

		if (isDefaultColumn) {
			record.defaultOverrides[colKey] = value;
		} else {
			record.custom[colKey] = value;
		}
		record.updatedAt = Date.now();
		await this._putRecord('unit_data', record);
		return record;
	}

	async saveBulkUnitCellValues(updates) {
		// updates: Array<{ unitId, colKey, value, isDefaultColumn }>
		if (this.useMemoryFallback) {
			for (const u of updates) {
				await this.saveUnitCellValue(u.unitId, u.colKey, u.value, u.isDefaultColumn);
			}
			return true;
		}

		return new Promise((resolve, reject) => {
			const tx = this.db.transaction('unit_data', 'readwrite');
			const store = tx.objectStore('unit_data');

			for (const u of updates) {
				const getReq = store.get(u.unitId);
				getReq.onsuccess = () => {
					const record = getReq.result || { unitId: u.unitId, custom: {}, defaultOverrides: {}, updatedAt: 0 };
					if (!record.custom) record.custom = {};
					if (!record.defaultOverrides) record.defaultOverrides = {};
					if (u.isDefaultColumn) {
						record.defaultOverrides[u.colKey] = u.value;
					} else {
						record.custom[u.colKey] = u.value;
					}
					record.updatedAt = Date.now();
					store.put(record);
				};
			}

			tx.oncomplete = () => resolve(true);
			tx.onerror = () => reject(tx.error);
		});
	}

	// =========================================================================
	// Spreadsheet View Settings Persistence
	// =========================================================================

	async getViewSettings() {
		return this._getRecord('view_settings', 'spreadsheet_view');
	}

	async saveViewSettings(settings) {
		const existing = (await this.getViewSettings()) || { id: 'spreadsheet_view' };
		const merged = {
			...existing,
			...settings,
			id: 'spreadsheet_view',
			updatedAt: Date.now()
		};
		await this._putRecord('view_settings', merged);
		return merged;
	}

	async clearViewSettings() {
		await this._deleteRecord('view_settings', 'spreadsheet_view');
		return true;
	}
}

if (typeof window !== 'undefined') {
	window.DEFAULT_COLUMNS_SPEC = DEFAULT_COLUMNS_SPEC;
	window.INITIAL_ADDITIONAL_COLUMNS = INITIAL_ADDITIONAL_COLUMNS;
	window.coerceColumnValue = coerceColumnValue;
	window.KongbuheyDB = KongbuheyDB;
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = {
		DEFAULT_COLUMNS_SPEC,
		INITIAL_ADDITIONAL_COLUMNS,
		coerceColumnValue,
		KongbuheyDB
	};
}

