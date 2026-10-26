import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import prettier from 'eslint-config-prettier'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['**/dist']),
  {
    // Plain JS config files (e.g. this one) run in Node.
    files: ['**/*.{js,mjs}'],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.node,
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: {
        projectService: {
          // vite.config.ts is covered by tsconfig.node.json, which the
          // project service does not discover on its own.
          allowDefaultProject: ['apps/web/vite.config.ts'],
          defaultProject: 'apps/web/tsconfig.node.json',
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['apps/web/src/**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
    rules: {
      // React Router loaders throw Response objects so errorElement can read the status.
      '@typescript-eslint/only-throw-error': [
        'error',
        { allow: [{ from: 'lib', name: 'Response' }] },
      ],
    },
  },
  // Must stay last: turns off rules that conflict with Prettier formatting.
  prettier,
])
