import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactPlugin from "eslint-plugin-react";
import pluginPrettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    extends: [
      js.configs.recommended,
      reactPlugin.configs.flat.recommended,
      // Prettier: enabling via rule only as flat config export missing
    ],
    plugins: { react: reactPlugin, prettier: pluginPrettier },
    rules: { 'prettier/prettier': 'error', 'react/react-in-jsx-scope': 'off' },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    languageOptions: { globals: globals.browser },
  },
  tseslint.configs.recommended,
  reactPlugin.configs.flat.recommended,
  { files: ["*.config.{js,cjs}", "tailwind.config.js", "postcss.config.cjs", "prettier.config.cjs"], languageOptions: { sourceType: 'commonjs', globals: { module: 'readonly', require: 'readonly' } }, rules: { '@typescript-eslint/no-require-imports': 'off', 'no-undef': 'off' } },
  { files: ['eslint.config.js'], rules: { 'prettier/prettier': 'off' } },
  { files: ['**/*.{ts,tsx,js,jsx}'], rules: { 'react/react-in-jsx-scope': 'off', '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
]);
