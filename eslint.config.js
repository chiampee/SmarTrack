import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactPlugin from "eslint-plugin-react";
import reactHooks from 'eslint-plugin-react-hooks';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  // Ignore large/generated or non-source directories to speed up linting
  { ignores: [
    'node_modules',
    'dist',
    'dist-extension',
    'extension',
    'coverage',
    'test-results',
    'public',
    'scripts',
    'tests',
    'api',
    'eslint.config.js',
    '*.html',
  ]},
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    extends: [
      js.configs.recommended,
      reactPlugin.configs.flat.recommended,
      ...tseslint.configs.recommended,
    ],
    settings: { react: { version: 'detect' } },
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        projectService: true,
      },
    },
    plugins: { react: reactPlugin, 'react-hooks': reactHooks, '@typescript-eslint': tseslint.plugin },
    rules: {
      // Formatting handled by Prettier separately; do not fail CI on style
      'react/react-in-jsx-scope': 'off',
      'no-empty': 'off',
      // Relax TS strictness for CI baseline
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'prefer-const': 'off',
      'no-useless-escape': 'off',
      'no-case-declarations': 'off',
      'react/no-unescaped-entities': 'off',
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  { files: ["*.config.{js,cjs}", "tailwind.config.js", "postcss.config.cjs", "prettier.config.cjs"], languageOptions: { sourceType: 'commonjs', globals: { module: 'readonly', require: 'readonly' } }, rules: { '@typescript-eslint/no-require-imports': 'off', 'no-undef': 'off' } },
  { files: ['eslint.config.js'], rules: {} },
]);
