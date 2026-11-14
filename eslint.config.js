'use strict';
const js = require('@eslint/js');
const globals = require('globals');

// Kongbuhey runs in two places: Node (CLIs, tests) and plain <script> tags in the browser (no bundler).
// Most modules under korean/ are UMD-style and run in both, so they get both sets of globals.
module.exports = [
	{
		ignores: [
			'node_modules/**',
			// Big generated/data files: validated by test.js stages 1-3, not worth linting.
			'data.js', 'homonyms.js', 'verified_sentences.js', 'studytexts.js',
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
			'max-lines': ['warn', { max: 1500, skipBlankLines: true, skipComments: true }]
		}
	},
	{
		// Classes/data defined by other <script> tags; they are plain globals in the browser (no bundler).
		files: ['webapp/**/*.js'],
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
		files: ['webapp/selector.js'],
		rules: { 'no-control-regex': 'off' } // intentional control-character sanitizer
	},
	{
		// Modules that must stay browser-safe (they are loaded by <script> tags in webapp/index.html).
		files: ['korean/analyzer/**/*.js', 'korean/core/**/*.js'],
		rules: {
			'no-console': ['error', { allow: ['warn', 'error'] }],
			'no-restricted-syntax': [
				'error',
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
