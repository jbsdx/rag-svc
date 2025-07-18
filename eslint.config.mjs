import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';

import { defineConfig } from 'eslint/config';

export default defineConfig([
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['src/**/*'],
    rules: {
      semi: 'error',
      'prefer-const': 'error',
      'quotes': [2, 'single', { 'avoidEscape': true }]
    }
  }
]);
