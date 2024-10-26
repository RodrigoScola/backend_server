import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import stylisticJs from '@stylistic/eslint-plugin-js';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
	baseDirectory: __dirname,
	recommendedConfig: js.configs.recommended,
	allConfig: js.configs.all,
});

export default [
	{
		ignores: ['dist/**/*'],
	},
	...compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended'),
	{
		plugins: {
			'@typescript-eslint': typescriptEslint,
			'@stylistic/ts': stylisticTs,
			'@stylistic/js': stylisticJs,
		},

		languageOptions: {
			globals: {
				...globals.node,
			},

			parser: tsParser,
			ecmaVersion: 'latest',
			sourceType: 'module',
		},

		rules: {
			'no-await-in-loop': 'error',
			'max-depth': ['warn', 3],
			'no-nested-ternary': 'error',
			'no-useless-constructor': 'error',
			'@typescript-eslint/no-namespace': 'off',
			'no-inner-declarations': 'off',
			'no-else-return': 'error',
			eqeqeq: 'error',
			'require-await': 'error',
			'no-throw-literal': 'error',
			'no-var': 'warn',
			'no-async-promise-executor': 'error',
			'no-class-assign': 'error',
			'no-cond-assign': 'error',
			'no-multiple-empty-lines': [
				'warn',
				{
					max: 1,
					maxBOF: 1,
				},
			],
			'no-fallthrough': 'error',
			'no-unsafe-negation': 'error',
			'valid-typeof': 'error',
			'no-unused-private-class-members': 'error',
			'no-lonely-if': 'error',
			'no-negated-condition': 'error',
			'require-atomic-updates': [
				'error',
				{
					allowProperties: true,
				},
			],
			'no-unsafe-optional-chaining': 'error',
			'max-classes-per-file': ['error', 3],
			'no-useless-catch': 'error',
			'no-useless-return': 'error',
			'prefer-promise-reject-errors': 'error',
			'@stylistic/js/computed-property-spacing': ['error', 'never'],
			'@stylistic/js/no-confusing-arrow': 'error',
			'no-case-declarations': 'error',
			'default-case-last': 'error',
			'no-sequences': 'error',
			'padding-line-between-statements': [
				'error',
				{
					blankLine: 'always',
					prev: ['case', 'default'],
					next: '*',
				},
			],
			yoda: 'error',
			'prefer-const': 'error',
			'max-statements-per-line': [
				'error',
				{
					max: 2,
				},
			],
		},
	},
];

