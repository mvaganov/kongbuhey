'use strict';
const js = require('@eslint/js');
const globals = require('globals');

// Kongbuhey runs in two places: Node (CLIs, tests) and plain <script> tags in the browser (no bundler).
// Most modules under korean/ are UMD-style and run in both, so they get both sets of globals.
// A random comparator (.sort(() => rand() - 0.5)) is inconsistent, so its order depends on the engine's sort: seeded games differed
// between Node 22 and 26 (2026-11-26). A real comparator takes two arguments; shuffle with G.shuffle (fc2/game.js) instead.
const NO_RANDOM_SORT = {
	selector: "CallExpression[callee.property.name='sort'][arguments.0.params.length=0]",
	message: 'Comparator with no arguments (random shuffle by sort): its order depends on the Node version. Use a Fisher-Yates shuffle (G.shuffle in fc2/game.js).'
};

module.exports = [
	{
		ignores: [
			'node_modules/**',
			// Big generated/data files: validated by test.js stages 1-3, not worth linting.
			'data/data.js', 'data/homonyms.js', 'data/verified_sentences.js',
			// Local-only, never committed
			'local/**', 'flagged/**', 'scratch/**'
		]
	},
	js.configs.recommended,
	{
		files: ['**/*.js'],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'commonjs',
			globals: { ...globals.node, ...globals.browser }
		},
		linterOptions: { reportUnusedDisableDirectives: 'warn' },
		rules: {
			'no-undef': 'error',
			'no-useless-escape': 'warn',
			'no-unused-vars': ['warn', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }],
			'no-empty': ['error', { allowEmptyCatch: true }],
			// Big-file smell: warns, never fails the build.
			'max-lines': ['warn', { max: 1500, skipBlankLines: true, skipComments: true }],
			'no-restricted-syntax': ['error', NO_RANDOM_SORT]
		}
	},
	{
		// Classes/data defined by other <script> tags; they are plain globals in the browser (no bundler).
		files: ['webapp/**/*.js', 'shared/**/*.js', 'flashcards/**/*.js'],
		languageOptions: {
			globals: {
				KongbuheyDB: 'readonly', SpreadsheetEngine: 'readonly', UnitSelectorView: 'readonly',
				TextImporterView: 'readonly', VerifiedSentencesView: 'readonly', DecksView: 'readonly',
				KR_EN_languageUnits: 'readonly', DATA_SCHEMA: 'readonly',
				DEFAULT_COLUMNS_SPEC: 'readonly', coerceColumnValue: 'readonly'
			}
		}
	},
	{
		files: ['shared/markdown.js'],
		rules: { 'no-control-regex': 'off' } // intentional control-character sanitizer
	},
	{
		// Modules that must stay browser-safe (they are loaded by <script> tags in webapp/index.html).
		files: ['korean/analyzer/**/*.js', 'korean/core/**/*.js', 'data/verb_suffix_rules.js', 'data/pronunciation_rules.js', 'data/verb_argument_specs.js', 'data/hangul_constants.js'],
		rules: {
			'no-console': ['error', { allow: ['warn', 'error'] }],
			'no-restricted-syntax': [   // repeats NO_RANDOM_SORT: a later block's rule replaces the earlier one for these files
				'error',
				NO_RANDOM_SORT,
				{
					selector: "CallExpression[callee.name='require'][arguments.0.value=/^(fs|path|child_process|os)$/]",
					message: 'Node-only module in a browser-safe file. Keep fs/path/child_process out of korean/analyzer and korean/core.'
				},
				{
					selector: "MemberExpression[object.name='process'][property.name='env']",
					message: 'process.env is Node-only; this file must run in the browser.'
				}
			]
		}
	}
];
