#!/usr/bin/env node
/**
 * ============================================================================
 * test/spreadsheet_ui_test.js - Automated Test Suite for Spreadsheet UI & DB
 * ============================================================================
 *
 * Validates:
 *   1. Local file system architecture (index.html, index.css, db.js, spreadsheet.js, app.js)
 *   2. All 13 default columns from data.js & 6 initial additional columns
 *   3. Visual distinction classes for default vs. additional columns
 *   4. Custom columns: creatable, editable, deletable
 *   5. Default columns: editable, NOT deletable
 *   6. Row reordering & column header ascending/descending sort toggle
 *   7. Column resizing, hiding, reordering, and reset mechanisms
 *   8. Virtual scrolling optimization (only visible rows rendered out of 2,006+)
 *   9. View settings & cell data persistence across simulated webpage refresh
 *  10. Flashcard queue sorting & evaluation using the 6 flashcard columns
 */

const fs = require('fs');
const path = require('path');

const { KR_EN_languageUnits, DATA_SCHEMA } = require('../data.js');
const { DEFAULT_COLUMNS_SPEC, INITIAL_ADDITIONAL_COLUMNS, coerceColumnValue, KongbuheyDB } = require('../db.js');
const { SpreadsheetEngine } = require('../spreadsheet.js');
const { sortPracticeSetUnits, evaluateFlashcardAttempt } = require('../app.js');

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
	// 1. Local File System Compatibility & Separate JS/CSS Architecture
	// -------------------------------------------------------------------------
	console.log(`\n--- 1. Local File System & Modular File Structure ---`);
	const rootDir = path.resolve(__dirname, '..');
	const indexHtmlPath = path.join(rootDir, 'index.html');
	const indexCssPath = path.join(rootDir, 'index.css');
	const dbJsPath = path.join(rootDir, 'db.js');
	const sheetJsPath = path.join(rootDir, 'spreadsheet.js');
	const appJsPath = path.join(rootDir, 'app.js');

	assert(fs.existsSync(indexHtmlPath) && fs.statSync(indexHtmlPath).size > 500, 'index.html exists and is populated');
	assert(fs.existsSync(indexCssPath) && fs.statSync(indexCssPath).size > 500, 'index.css exists as separate CSS file');
	assert(fs.existsSync(dbJsPath) && fs.statSync(dbJsPath).size > 500, 'db.js exists as separate JS module');
	assert(fs.existsSync(sheetJsPath) && fs.statSync(sheetJsPath).size > 500, 'spreadsheet.js exists as separate JS module');
	assert(fs.existsSync(appJsPath) && fs.statSync(appJsPath).size > 500, 'app.js exists as separate JS module');

	const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
	assert(!htmlContent.includes('type="module"'), 'index.html avoids ES module scripts that fail under file:// CORS');
	assert(htmlContent.includes('<link rel="stylesheet" href="index.css">'), 'index.html links separate index.css');
	assert(
		htmlContent.includes('<script src="data.js"></script>') &&
		htmlContent.includes('<script src="db.js"></script>') &&
		htmlContent.includes('<script src="spreadsheet.js"></script>') &&
		htmlContent.includes('<script src="app.js"></script>'),
		'index.html loads data.js, db.js, spreadsheet.js, and app.js via local-filesystem-compatible script tags'
	);

	const cssContent = fs.readFileSync(indexCssPath, 'utf8');
	assert(
		cssContent.includes('.col-origin-default') &&
		cssContent.includes('.col-origin-custom') &&
		cssContent.includes('.cell-origin-default') &&
		cssContent.includes('.cell-origin-custom'),
		'index.css defines distinct color styles for default data.js columns vs additional custom columns'
	);

	// -------------------------------------------------------------------------
	// 2. Default Columns (13 from data.js) & 6 Initial Additional Columns
	// -------------------------------------------------------------------------
	console.log(`\n--- 2. Default & Initial Additional Columns Schema ---`);
	const expectedDefaultCols = [
		'Id', 'Korean', 'English', 'PartofSpeech', 'SemanticTags',
		'Disambiguation', 'Conjugation', 'Source', 'PriorityScore',
		'FormalityLevel', 'HonorificRules', 'SemanticVector', 'SyntaxFrame'
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
	// 4. Custom Columns: Creatable, Editable, Deletable; Default: Editable, Non-Deletable
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

	// Verify default column cannot be deleted
	let defaultDeleteBlocked = false;
	try {
		await engine.removeCustomColumn('Korean');
	} catch (err) {
		defaultDeleteBlocked = true;
	}
	assert(defaultDeleteBlocked && engine.columnMap.has('Korean'), 'Default column from data.js cannot be deleted');

	// Verify default column IS editable
	const originalEnglish0 = engine.getCellValue(0, 'English');
	await engine.setCellValue(0, 'English', 'American person (edited)');
	assert(engine.getCellValue(0, 'English') === 'American person (edited)', 'Default column from data.js is editable');
	// Restore original value in memory & DB
	await engine.setCellValue(0, 'English', originalEnglish0);

	// -------------------------------------------------------------------------
	// 5. Row Sorting (ASC/DESC Toggle) & Manual Row Reordering
	// -------------------------------------------------------------------------
	console.log(`\n--- 5. Row Sorting & Manual Row Reordering ---`);
	await engine.toggleSortByColumn('Id');
	assert(engine.sortState.columnKey === 'Id' && engine.sortState.direction === 'asc', 'First click on column sort button sorts ascending');
	assert(engine.rowOrder[0] === 0 && engine.rowOrder[1] === 1, 'Ascending Id sort places 0 first');

	await engine.toggleSortByColumn('Id');
	assert(engine.sortState.columnKey === 'Id' && engine.sortState.direction === 'desc', 'Second click on column sort button toggles to descending');
	assert(engine.rowOrder[0] === KR_EN_languageUnits.length - 1, 'Descending Id sort places highest Id first');

	// Reset sort and test manual row reorder
	await engine.resetSortingAndRowOrder();
	assert(engine.sortState.columnKey === null && engine.rowOrder[0] === 0, 'Reset sorting restores canonical row order 0..N-1');

	await engine.reorderRowByUnitId(5, 0, false);
	assert(engine.rowOrder[0] === 5 && engine.rowOrder[1] === 0, 'Manual row reorder moves unit 5 before unit 0');

	await engine.moveRowToIndex(5, 5);
	assert(engine.rowOrder[0] === 0 && engine.rowOrder[5] === 5, 'moveRowToIndex restores unit 5 back to index 5');

	// -------------------------------------------------------------------------
	// 6. Column Resizing, Hiding, Reordering, and Visibility Reset
	// -------------------------------------------------------------------------
	console.log(`\n--- 6. Column Resizing, Hiding, Reordering & Resets ---`);
	await engine.setColumnWidth('Korean', 260);
	assert(engine.columnWidths['Korean'] === 260, 'Column width can be resized to 260px');

	await engine.setColumnVisibility('SyntaxFrame', false);
	await engine.setColumnVisibility('SemanticVector', false);
	assert(
		engine.columnVisibility['SyntaxFrame'] === false &&
		!engine.getVisibleColumns().some(c => c.key === 'SyntaxFrame'),
		'Hidden columns are excluded from visible columns list'
	);

	await engine.reorderColumn('InSet', 'Korean', false);
	const inSetIdx = engine.columnOrder.indexOf('InSet');
	const koreanIdx = engine.columnOrder.indexOf('Korean');
	assert(inSetIdx === koreanIdx - 1, 'Column reordering moves InSet directly before Korean');

	// Test Reset Column Visibility
	await engine.resetAllColumnVisibility();
	assert(
		engine.columnVisibility['SyntaxFrame'] === true &&
		engine.columnVisibility['SemanticVector'] === true,
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

	// Instantiate a fresh SpreadsheetEngine sharing the same DB to simulate page reload
	const reloadedEngine = new SpreadsheetEngine({ db, rawUnits: KR_EN_languageUnits, dataSchema: DATA_SCHEMA });
	await reloadedEngine.init();

	assert(reloadedEngine.columnWidths['Korean'] === 260, 'Reloaded spreadsheet preserves resized column width');
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

