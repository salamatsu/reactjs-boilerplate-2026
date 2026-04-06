// ============================================
// SCAN2WIN — ESLint Configuration
// ============================================

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),

  // Node config files (vite.config.js etc.) — need process, __dirname etc.
  {
    files: ['*.config.{js,ts}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },

  // React source files
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Allow uppercase/underscore vars (React components) and the `motion`
      // namespace from framer-motion (used as motion.div etc. in JSX).
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]|^motion$' }],
    },
  },
])
