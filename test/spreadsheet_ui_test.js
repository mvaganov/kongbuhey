#!/usr/bin/env node
/**
 * ============================================================================
 * test/spreadsheet_ui_test.js - Automated Test Suite for Spreadsheet UI & DB
 * ============================================================================
 *
 * Validates:
 *   1. Clean webapp/ directory structure (index.html, index.css, db.js, spreadsheet.js, app.js)
 *   2. All 13 default columns from data.js & 6 initial additional columns
 *   3. Visual distinction & compact hover-tooltip legend ("Default", "Additional")
 *   4. Custom columns: creatable, editable, deletable
 *   5. Default columns: editable, NOT deletable
 *   6. Row reordering, column header sort toggle, and overlapping multi-column sorting
 *   7. Column resizing (including "# Order" column), hiding, reordering, and resets
 *   8. Virtual scrolling optimization & unified horizontal scroll alignment
 *   9. View settings & cell data persistence across simulated webpage refresh
 *  10. Flashcard queue sorting & evaluation using the 6 flashcard columns
 */

const fs = require('fs');
const path = require('path');

const { KR_EN_languageUnits, DATA_SCHEMA } = require('../data.js');
const { DEFAULT_COLUMNS_SPEC, INITIAL_ADDITIONAL_COLUMNS, KongbuheyDB } = require('../webapp/db.js');
const { SpreadsheetEngine } = require('../webapp/spreadsheet.js');
const {
	renderMarkdownWithHtml,
	formatPithyTime,
	formatHudTelemetry,
	generateSentencesForUnit,
	UnitSelectorView
} = require('../webapp/selector.js');
const { sortPracticeSetUnits, evaluateFlashcardAttempt } = require('../webapp/app.js');

let passed = 0;
let failed = 0;

function assert(condition, message) {
	if (condition) {
		passed++;
		console.log(`  [PASS] ${message}`);
	} else {
		failed++;
		console.error(`  [FAIL] ${message}`);
	}
}

async function runSuite() {
	console.log(`======================================================`);
	console.log(`       SPREADSHEET UI & DATABASE TEST SUITE           `);
	console.log(`======================================================`);

	// -------------------------------------------------------------------------
	// 1. Dedicated webapp/ Folder & Local File System Compatibility
	// -------------------------------------------------------------------------
	console.log(`\n--- 1. Dedicated webapp/ Folder & Modular File Structure ---`);
	const rootDir = path.resolve(__dirname, '..');
	const webappDir = path.join(rootDir, 'webapp');
	const indexHtmlPath = path.join(webappDir, 'index.html');
	const indexCssPath = path.join(webappDir, 'index.css');
	const dbJsPath = path.join(webappDir, 'db.js');
	const sheetJsPath = path.join(webappDir, 'spreadsheet.js');
	const selectorJsPath = path.join(webappDir, 'selector.js');
	const appJsPath = path.join(webappDir, 'app.js');

	assert(fs.existsSync(indexHtmlPath) && fs.statSync(indexHtmlPath).size > 500, 'webapp/index.html exists and is populated');
	assert(fs.existsSync(indexCssPath) && fs.statSync(indexCssPath).size > 500, 'webapp/index.css exists as separate CSS file');
	assert(fs.existsSync(dbJsPath) && fs.statSync(dbJsPath).size > 500, 'webapp/db.js exists as separate JS module');
	assert(fs.existsSync(sheetJsPath) && fs.statSync(sheetJsPath).size > 500, 'webapp/spreadsheet.js exists as separate JS module');
	assert(fs.existsSync(selectorJsPath) && fs.statSync(selectorJsPath).size > 500, 'webapp/selector.js exists as separate JS module');
	assert(fs.existsSync(appJsPath) && fs.statSync(appJsPath).size > 500, 'webapp/app.js exists as separate JS module');
	assert(
		!fs.existsSync(path.join(rootDir, 'index.html')) &&
		!fs.existsSync(path.join(rootDir, 'spreadsheet.js')),
		'Project root is not polluted by loose webapp files'
	);

	const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
	assert(!htmlContent.includes('type="module"'), 'webapp/index.html avoids ES module scripts that fail under file:// CORS');
	assert(htmlContent.includes('<link rel="stylesheet" href="index.css">'), 'webapp/index.html links separate index.css');
	assert(
		htmlContent.includes('<script src="../data.js"></script>') &&
		htmlContent.includes('<script src="db.js"></script>') &&
		htmlContent.includes('<script src="spreadsheet.js"></script>') &&
		htmlContent.includes('<script src="app.js"></script>'),
		'webapp/index.html loads ../data.js, db.js, spreadsheet.js, and app.js via local-filesystem-compatible script tags'
	);

	// Verify concise legend text ("Default", "Additional") with hover tooltips
	assert(
		htmlContent.includes('title="Default Columns (data.js · Editable, Non-Deletable)"') &&
		htmlContent.includes('<span>Default</span>') &&
		htmlContent.includes('title="Additional Columns (Browser DB · Creatable, Editable, Deletable)"') &&
		htmlContent.includes('<span>Additional</span>'),
		'Toolbar color legend uses concise "Default" and "Additional" labels with full details in hover tooltips'
	);

	const cssContent = fs.readFileSync(indexCssPath, 'utf8');
	assert(
		cssContent.includes('.col-origin-default') &&
		cssContent.includes('.col-origin-custom') &&
		cssContent.includes('.cell-origin-default') &&
		cssContent.includes('.cell-origin-custom'),
		'webapp/index.css defines distinct color styles for default data.js columns vs additional custom columns'
	);
	assert(
		!cssContent.includes('will-change: transform') &&
		cssContent.includes('.sheet-header-track {\n\tposition: sticky;\n\ttop: 0;'),
		'webapp/index.css uses unified sticky header inside scroll viewport without sticky-breaking transform on rows layer'
	);

	// -------------------------------------------------------------------------
	// 2. Default Columns (13 from data.js) & 6 Initial Additional Columns
	// -------------------------------------------------------------------------
	console.log(`\n--- 2. Default & Initial Additional Columns Schema ---`);
	const expectedDefaultCols = [
		'Id', 'Korean', 'English', 'PartofSpeech', 'SemanticTags',
		'Disambiguation', 'Conjugation', 'Source', 'PriorityScore',
		'FormalityLevel', 'HonorificRules', 'SemanticData', 'SyntaxFrame'
	];
	assert(DEFAULT_COLUMNS_SPEC.length === 13, 'DEFAULT_COLUMNS_SPEC has all 13 default columns from data.js');
	assert(
		expectedDefaultCols.every((key, idx) => DEFAULT_COLUMNS_SPEC[idx].key === key && DEFAULT_COLUMNS_SPEC[idx].isDefault === true),
		'All 13 default columns match DATA_SCHEMA order and are marked isDefault=true'
	);

	const db = new KongbuheyDB();
	const engine = new SpreadsheetEngine({ db, rawUnits: KR_EN_languageUnits, dataSchema: DATA_SCHEMA });
	await engine.init();

	const customCols = await db.getCustomColumns();
	const customColKeys = customCols.map(c => c.key);
	const expectedInitialCustom = [
		'InSet',
		'RecognitionScore',
		'LongTermRecognition',
		'TimeStampLastCorrect',
		'TimeStampLastSeen',
		'notes'
	];
	assert(
		expectedInitialCustom.every(k => customColKeys.includes(k)),
		'All 6 initial additional columns (InSet, RecognitionScore, LongTermRecognition, TimeStampLastCorrect, TimeStampLastSeen, notes) are created immediately'
	);

	const ltrCol = engine.columnMap.get('LongTermRecognition');
	assert(
		ltrCol &&
		ltrCol.type === 'enum' &&
		JSON.stringify(ltrCol.enumOptions) === JSON.stringify(['unknown', 'recognized', 'definitionKnown', 'knownByDefinition']),
		'LongTermRecognition has enum{unknown, recognized, definitionKnown, knownByDefinition}'
	);
	assert(engine.columnMap.get('InSet').type === 'boolean', 'InSet has type boolean');
	assert(engine.columnMap.get('RecognitionScore').type === 'int', 'RecognitionScore has type int');
	assert(engine.columnMap.get('TimeStampLastCorrect').type === 'unixTime', 'TimeStampLastCorrect has type unixTime');
	assert(engine.columnMap.get('TimeStampLastSeen').type === 'unixTime', 'TimeStampLastSeen has type unixTime');
	assert(engine.columnMap.get('notes').type === 'string', 'notes has type string');

	// -------------------------------------------------------------------------
	// 3. Virtualization Optimization (Only Visible Rows Rendered)
	// -------------------------------------------------------------------------
	console.log(`\n--- 3. Virtual Scrolling Optimization ---`);
	assert(engine.filteredRowIds.length === KR_EN_languageUnits.length && KR_EN_languageUnits.length > 2000, `Dataset has ${KR_EN_languageUnits.length} rows (>2,000)`);
	const rangeTop = engine.computeVirtualRange(0, 600);
	assert(
		rangeTop.visibleCount > 0 && rangeTop.visibleCount < 40,
		`Virtual scroll at top renders only ${rangeTop.visibleCount} rows instead of all ${KR_EN_languageUnits.length} rows`
	);
	const rangeMid = engine.computeVirtualRange(38000, 600);
	assert(
		rangeMid.startIndex > 900 && rangeMid.endIndex < 1100 && rangeMid.visibleCount < 40,
		`Virtual scroll at middle offset (38,000px) renders window [${rangeMid.startIndex}..${rangeMid.endIndex}] (${rangeMid.visibleCount} rows)`
	);

	// -------------------------------------------------------------------------
	// 4. Column CRUD & Default Column Protection
	// -------------------------------------------------------------------------
	console.log(`\n--- 4. Column CRUD & Default Column Protection ---`);
	const newCol = await engine.addCustomColumn({
		key: 'UserMnemonic',
		type: 'string',
		defaultValue: 'none',
		description: 'Custom mnemonic hint'
	});
	assert(newCol.key === 'UserMnemonic' && engine.columnMap.has('UserMnemonic'), 'User can create a new additional column');
	assert(engine.getCellValue(0, 'UserMnemonic') === 'none', 'New column returns its default value for unmodified rows');

	await engine.setCellValue(0, 'UserMnemonic', 'US person -> 미국 사람');
	assert(engine.getCellValue(0, 'UserMnemonic') === 'US person -> 미국 사람', 'User can edit cell values in custom column');

	await engine.editCustomColumn('UserMnemonic', {
		key: 'MnemonicHint',
		defaultValue: 'empty'
	});
	assert(!engine.columnMap.has('UserMnemonic') && engine.columnMap.has('MnemonicHint'), 'User can rename/edit custom column definition');
	assert(engine.getCellValue(0, 'MnemonicHint') === 'US person -> 미국 사람', 'Renaming custom column preserves existing cell data');

	await engine.removeCustomColumn('MnemonicHint');
	assert(!engine.columnMap.has('MnemonicHint'), 'User can delete custom column');

	let defaultDeleteBlocked = false;
	try {
		await engine.removeCustomColumn('Korean');
	} catch (_) {
		defaultDeleteBlocked = true;
	}
	assert(defaultDeleteBlocked && engine.columnMap.has('Korean'), 'Default column from data.js cannot be deleted');

	// Verify the 6 default additional columns are permanent (cannot be deleted)
	let allPermanentBlocked = true;
	for (const permKey of expectedInitialCustom) {
		const spec = engine.columnMap.get(permKey);
		if (!spec || !spec.isPermanent || spec.deletable !== false) {
			allPermanentBlocked = false;
		}
		let blocked = false;
		try {
			await engine.removeCustomColumn(permKey);
		} catch (_) {
			blocked = true;
		}
		if (!blocked || !engine.columnMap.has(permKey)) {
			allPermanentBlocked = false;
		}
	}
	assert(
		allPermanentBlocked,
		'All 6 default additional columns (InSet, RecognitionScore, LongTermRecognition, TimeStampLastCorrect, TimeStampLastSeen, notes) are permanent and cannot be deleted'
	);

	const originalEnglish0 = engine.getCellValue(0, 'English');
	await engine.setCellValue(0, 'English', 'American person (edited)');
	assert(engine.getCellValue(0, 'English') === 'American person (edited)', 'Default column from data.js is editable');
	await engine.setCellValue(0, 'English', originalEnglish0);

	// -------------------------------------------------------------------------
	// 5. Row Sorting, Overlapping Multi-Column Sorting & Manual Row Reordering
	// -------------------------------------------------------------------------
	console.log(`\n--- 5. Row Sorting, Overlapping Sorts & Manual Row Reordering ---`);
	await engine.toggleSortByColumn('Id');
	assert(engine.sortState.columnKey === 'Id' && engine.sortState.direction === 'asc', 'First click on column sort button sorts ascending');
	assert(engine.rowOrder[0] === 0 && engine.rowOrder[1] === 1, 'Ascending Id sort places 0 first');

	await engine.toggleSortByColumn('Id');
	assert(engine.sortState.columnKey === 'Id' && engine.sortState.direction === 'desc', 'Second click on column sort button toggles to descending');
	assert(engine.rowOrder[0] === KR_EN_languageUnits.length - 1, 'Descending Id sort places highest Id first');

	// Test overlapping multi-column sort: Sort by English (ASC), then sort by Source (ASC)
	await engine.resetSortingAndRowOrder();
	await engine.sortByColumn('English', 'asc');
	await engine.sortByColumn('Source', 'asc');

	assert(
		engine.sortStack.length === 2 &&
		engine.sortStack[0].columnKey === 'Source' &&
		engine.sortStack[1].columnKey === 'English',
		'Sorting by English then Source builds an overlapping sortStack [Source, English]'
	);

	// Verify that within the first Source group (e.g. SUOBI00), all units are sorted alphabetically by English
	const firstSource = engine.getCellValue(engine.rowOrder[0], 'Source');
	const groupUnits = engine.rowOrder.filter(id => engine.getCellValue(id, 'Source') === firstSource);
	let englishOrderedInGroup = true;
	for (let i = 1; i < groupUnits.length; i++) {
		const prevEn = String(engine.getCellValue(groupUnits[i - 1], 'English')).toLowerCase();
		const currEn = String(engine.getCellValue(groupUnits[i], 'English')).toLowerCase();
		if (prevEn.localeCompare(currEn, 'ko') > 0) {
			englishOrderedInGroup = false;
			break;
		}
	}
	assert(
		groupUnits.length > 5 && englishOrderedInGroup,
		`Within primary Source group "${firstSource}" (${groupUnits.length} units), rows remain alphabetically sorted by English`
	);

	// Reset sort and test manual row reorder
	await engine.resetSortingAndRowOrder();
	assert(engine.sortState.columnKey === null && engine.sortStack.length === 0 && engine.rowOrder[0] === 0, 'Reset sorting clears sortStack and restores canonical row order 0..N-1');

	await engine.reorderRowByUnitId(5, 0, false);
	assert(engine.rowOrder[0] === 5 && engine.rowOrder[1] === 0, 'Manual row reorder moves unit 5 before unit 0');

	await engine.moveRowToIndex(5, 5);
	assert(engine.rowOrder[0] === 0 && engine.rowOrder[5] === 5, 'moveRowToIndex restores unit 5 back to index 5');

	// -------------------------------------------------------------------------
	// 6. Column Resizing (including # Order), Hiding, Reordering & Resets
	// -------------------------------------------------------------------------
	console.log(`\n--- 6. Column Resizing (including # Order), Hiding, Reordering & Resets ---`);
	await engine.setColumnWidth('Korean', 260);
	assert(engine.columnWidths['Korean'] === 260, 'Data column width can be resized to 260px');

	await engine.setColumnWidth('__rowOrder__', 115);
	assert(engine.rowHandleWidth === 115, '# Order column width is resizable via setColumnWidth("__rowOrder__", 115)');

	await engine.setColumnVisibility('SyntaxFrame', false);
	await engine.setColumnVisibility('SemanticData', false);
	assert(
		engine.columnVisibility['SyntaxFrame'] === false &&
		!engine.getVisibleColumns().some(c => c.key === 'SyntaxFrame'),
		'Hidden columns are excluded from visible columns list'
	);

	await engine.reorderColumn('InSet', 'Korean', false);
	const inSetIdx = engine.columnOrder.indexOf('InSet');
	const koreanIdx = engine.columnOrder.indexOf('Korean');
	assert(inSetIdx === koreanIdx - 1, 'Column reordering moves InSet directly before Korean');

	await engine.resetAllColumnVisibility();
	assert(
		engine.columnVisibility['SyntaxFrame'] === true &&
		engine.columnVisibility['SemanticData'] === true,
		'resetAllColumnVisibility restores all hidden columns to visible'
	);

	// -------------------------------------------------------------------------
	// 7. Persistence Across Simulated Webpage Refresh
	// -------------------------------------------------------------------------
	console.log(`\n--- 7. Persistence Across Webpage Refresh ---`);
	await engine.setCellValue(10, 'InSet', true);
	await engine.setCellValue(10, 'RecognitionScore', 7);
	await engine.setCellValue(10, 'LongTermRecognition', 'definitionKnown');
	await engine.setCellValue(10, 'TimeStampLastCorrect', 1730000000);
	await engine.setCellValue(10, 'TimeStampLastSeen', 1730000500);
	await engine.setCellValue(10, 'notes', 'Brazil country vocab');
	await engine.setColumnVisibility('HonorificRules', false);
	await engine.reorderRowByUnitId(10, 0, false);

	const reloadedEngine = new SpreadsheetEngine({ db, rawUnits: KR_EN_languageUnits, dataSchema: DATA_SCHEMA });
	await reloadedEngine.init();

	assert(reloadedEngine.columnWidths['Korean'] === 260, 'Reloaded spreadsheet preserves resized column width');
	assert(reloadedEngine.rowHandleWidth === 115, 'Reloaded spreadsheet preserves resized # Order column width');
	assert(reloadedEngine.columnVisibility['HonorificRules'] === false, 'Reloaded spreadsheet preserves hidden column state');
	assert(reloadedEngine.columnOrder.indexOf('InSet') === reloadedEngine.columnOrder.indexOf('Korean') - 1, 'Reloaded spreadsheet preserves custom column order');
	assert(reloadedEngine.rowOrder[0] === 10, 'Reloaded spreadsheet preserves custom row order');
	assert(reloadedEngine.getCellValue(10, 'InSet') === true, 'Reloaded spreadsheet preserves InSet boolean value');
	assert(reloadedEngine.getCellValue(10, 'RecognitionScore') === 7, 'Reloaded spreadsheet preserves RecognitionScore int value');
	assert(reloadedEngine.getCellValue(10, 'LongTermRecognition') === 'definitionKnown', 'Reloaded spreadsheet preserves LongTermRecognition enum value');
	assert(reloadedEngine.getCellValue(10, 'TimeStampLastCorrect') === 1730000000, 'Reloaded spreadsheet preserves TimeStampLastCorrect unixTime value');
	assert(reloadedEngine.getCellValue(10, 'TimeStampLastSeen') === 1730000500, 'Reloaded spreadsheet preserves TimeStampLastSeen unixTime value');
	assert(reloadedEngine.getCellValue(10, 'notes') === 'Brazil country vocab', 'Reloaded spreadsheet preserves notes string value');

	// -------------------------------------------------------------------------
	// 8. Flashcard Practice Set Sorting & Evaluation Integration
	// -------------------------------------------------------------------------
	console.log(`\n--- 8. Flashcard Queue Sorting & Evaluation ---`);
	await reloadedEngine.setCellValue(11, 'InSet', true);
	await reloadedEngine.setCellValue(11, 'LongTermRecognition', 'unknown');
	await reloadedEngine.setCellValue(11, 'RecognitionScore', 0);

	const queue = sortPracticeSetUnits([10, 11], reloadedEngine);
	assert(queue[0] === 11 && queue[1] === 10, 'Flashcard queue prioritizes unknown/low-score unit (11) ahead of definitionKnown unit (10)');

	const evalRes = await evaluateFlashcardAttempt(reloadedEngine, 11, 'recognized');
	assert(
		evalRes.RecognitionScore === 1 &&
		evalRes.LongTermRecognition === 'recognized' &&
		evalRes.TimeStampLastSeen > 0 &&
		evalRes.TimeStampLastCorrect > 0,
		'evaluateFlashcardAttempt updates RecognitionScore, LongTermRecognition, TimeStampLastSeen, and TimeStampLastCorrect'
	);

	// -------------------------------------------------------------------------
	// 9. Streamlined Unit Selector (Sources, Tri-State Checkboxes, Expansion)
	// -------------------------------------------------------------------------
	console.log(`\n--- 9. Streamlined Unit Selector (Sources & Tri-State Checkboxes) ---`);
	assert(
		cssContent.includes('.source-section {\n\tflex-shrink: 0;'),
		'webapp/index.css sets flex-shrink: 0 on .source-section so 90+ source sections do not collapse into 0px bars inside flex scroll container'
	);

	// Verify that even BEFORE engine.init() completes, getSourceGroups() resolves all 90 Sources (never flashing "Uncategorized")
	const uninitEngine = new SpreadsheetEngine({ db: new KongbuheyDB(), rawUnits: KR_EN_languageUnits, dataSchema: DATA_SCHEMA });
	const uninitSelector = new UnitSelectorView({ engine: uninitEngine });
	const preInitGroups = uninitSelector.getSourceGroups();
	assert(
		preInitGroups.length === 90 && preInitGroups[0].source !== 'Uncategorized',
		'getSourceGroups() resolves all 90 curriculum sources synchronously before DB init finishes (no "Uncategorized" flash)'
	);

	const selectorDb = new KongbuheyDB();
	const selectorEngine = new SpreadsheetEngine({ db: selectorDb, rawUnits: KR_EN_languageUnits, dataSchema: DATA_SCHEMA });
	await selectorEngine.init();
	const selectorView = new UnitSelectorView({ engine: selectorEngine });

	const initialGroups = selectorView.getSourceGroups();
	assert(initialGroups.length > 0 && initialGroups[0].totalCount > 0, `getSourceGroups groups language units by Source (${initialGroups.length} sources found)`);

	const testSource = initialGroups[0].source;
	const testSourceUnitIds = initialGroups[0].unitIds;
	assert(
		initialGroups[0].state === 'none' && initialGroups[0].icon === '' && initialGroups[0].includedCount === 0,
		`Initial source "${testSource}" has state="none" and empty checkbox icon ""`
	);

	// Clicking source checkbox when none are included -> includes all units in source
	const toggleAllRes = await selectorView.toggleSourceInclusion(testSource);
	const groupAfterAll = selectorView.getSourceGroups().find(g => g.source === testSource);
	assert(
		toggleAllRes.targetInclude === true &&
		groupAfterAll.state === 'all' &&
		groupAfterAll.icon === '✓' &&
		groupAfterAll.includedCount === groupAfterAll.totalCount,
		`Clicking source checkbox toggles all ${groupAfterAll.totalCount} units in "${testSource}" to included (state="all", icon="✓")`
	);

	// Unchecking one individual language unit inside the source -> partial state ('~')
	await selectorView.toggleUnitInclusion(testSourceUnitIds[0]);
	const groupAfterPartial = selectorView.getSourceGroups().find(g => g.source === testSource);
	assert(
		groupAfterPartial.state === 'partial' &&
		groupAfterPartial.icon === '~' &&
		groupAfterPartial.includedCount === groupAfterPartial.totalCount - 1,
		`Excluding 1 unit in "${testSource}" sets source checkbox to partial state (state="partial", icon="~")`
	);

	// Clicking source checkbox when partial -> includes all units in source
	await selectorView.toggleSourceInclusion(testSource);
	const groupAfterReAll = selectorView.getSourceGroups().find(g => g.source === testSource);
	assert(
		groupAfterReAll.state === 'all' && groupAfterReAll.icon === '✓',
		`Clicking partial ("~") source checkbox includes all units in "${testSource}" (state="all", icon="✓")`
	);

	// Clicking source checkbox when all are included -> excludes all units in source
	await selectorView.toggleSourceInclusion(testSource);
	const groupAfterNone = selectorView.getSourceGroups().find(g => g.source === testSource);
	assert(
		groupAfterNone.state === 'none' && groupAfterNone.icon === '' && groupAfterNone.includedCount === 0,
		`Clicking checked ("✓") source checkbox excludes all units in "${testSource}" (state="none", icon="")`
	);

	// Expanding and collapsing a source section
	assert(selectorView.expandedSources.has(testSource) === false, 'Source starts collapsed');
	selectorView.toggleSourceExpand(testSource);
	assert(selectorView.expandedSources.has(testSource) === true, 'toggleSourceExpand expands source to list individual language units');
	selectorView.toggleSourceExpand(testSource);
	assert(selectorView.expandedSources.has(testSource) === false, 'toggleSourceExpand collapses expanded source');

	// -------------------------------------------------------------------------
	// 10. Language Unit Details View (Markdown + HTML, 3 Sentences, Edit, HUD)
	// -------------------------------------------------------------------------
	console.log(`\n--- 10. Language Unit Details View (Markdown, Sentences, Edit, HUD) ---`);
	selectorView.selectUnit(0);
	assert(selectorView.selectedUnitId === 0 && selectorView.isEditingDetails === false, 'Clicking language unit selects it for Language Unit Details view');

	// Markdown parser with tiered lists and inline HTML
	const sampleMarkdown = [
		'# Usage Note',
		'- Tier 1 bullet with **bold** and <mark class="hl">inline HTML</mark>',
		'  - Tier 2 nested bullet with *italics*',
		'    - Tier 3 deeply nested bullet',
		'- Second top-level bullet'
	].join('\n');
	const renderedHtml = renderMarkdownWithHtml(sampleMarkdown);
	assert(
		renderedHtml.includes('<h1>Usage Note</h1>') &&
		renderedHtml.includes('<strong>bold</strong>') &&
		renderedHtml.includes('<mark class="hl">inline HTML</mark>') &&
		(renderedHtml.match(/<ul>/g) || []).length >= 3,
		'renderMarkdownWithHtml renders tiered/nested Markdown lists and preserves inline HTML'
	);

	// 3 generated sentences/phrases + regeneration
	const initialSentences = selectorView.getSentencesForSelectedUnit();
	const unit0Ko = selectorEngine.getCellValue(0, 'Korean');
	assert(
		Array.isArray(initialSentences) &&
		initialSentences.length === 3 &&
		initialSentences.every(s => typeof s.ko === 'string' && s.ko.length > 0 && typeof s.en === 'string' && s.en.length > 0),
		`Language Unit Details generates 3 contextual Korean/English sentences for "${unit0Ko}"`
	);

	const regeneratedSentences = selectorView.regenerateSentences(0);
	assert(
		Array.isArray(regeneratedSentences) &&
		regeneratedSentences.length === 3 &&
		JSON.stringify(regeneratedSentences) !== JSON.stringify(initialSentences),
		'Regenerate button generates 3 new sentences/phrases for the language unit'
	);

	// In-place Edit mode for core details (Korean, Conjugation, English, pure-text Markdown Notes)
	selectorView.setEditMode(true);
	assert(selectorView.isEditingDetails === true, 'Pressing Edit button enables in-place editing mode');

	await selectorView.saveEditedDetails(0, {
		Korean: '미국 사람 (수정)',
		Conjugation: '미국 사람입니다 / 미국 사람이었어요',
		English: 'American person (updated)',
		notes: '- First note\n  - Nested note with <b>HTML</b>'
	});
	assert(
		selectorView.isEditingDetails === false &&
		selectorEngine.getCellValue(0, 'Korean') === '미국 사람 (수정)' &&
		selectorEngine.getCellValue(0, 'Conjugation') === '미국 사람입니다 / 미국 사람이었어요' &&
		selectorEngine.getCellValue(0, 'English') === 'American person (updated)' &&
		selectorEngine.getCellValue(0, 'notes') === '- First note\n  - Nested note with <b>HTML</b>',
		'Saving in-place Details edit updates Korean, Conjugation, English, and raw Markdown notes'
	);

	// Minimalist videogame HUD & clicking TimeStampLastSeen to update to current time
	const nowSec = Math.floor(Date.now() / 1000);
	const hudBefore = formatHudTelemetry({
		RecognitionScore: 12,
		LongTermRecognition: 'definitionKnown',
		TimeStampLastCorrect: nowSec - 3600,
		TimeStampLastSeen: 0
	}, nowSec);
	assert(
		hudBefore.scoreText === '+12' &&
		hudBefore.ltrBadge.code === 'DEF' &&
		hudBefore.lastCorrectText === '1h' &&
		hudBefore.lastSeenText === '--',
		'formatHudTelemetry produces compact single-line videogame HUD representations for score, LTR, lastCorrect, and lastSeen'
	);

	const updatedUnix = await selectorView.touchUnitLastSeen(0);
	const storedSeen = Number(selectorEngine.getCellValue(0, 'TimeStampLastSeen'));
	assert(
		updatedUnix > 0 && Math.abs(storedSeen - nowSec) <= 5,
		'Clicking TimeStampLastSeen representation in HUD updates it to the current Unix timestamp'
	);

	console.log(`\n======================================================`);
	console.log(`TOTAL TESTS: ${passed + failed}`);
	console.log(`PASSED:      ${passed}`);
	console.log(`FAILED:      ${failed}`);
	console.log(`======================================================`);

	if (failed > 0) {
		process.exit(1);
	}
}

runSuite().catch(err => {
	console.error(err);
	process.exit(1);
});
