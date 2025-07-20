import { FlatCompat } from '@eslint/eslintrc'
import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import eslintPluginPrettier from 'eslint-plugin-prettier'
import globals from 'globals'
import { dirname } from 'path'
import tseslint from 'typescript-eslint'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const compat = new FlatCompat({
  baseDirectory: __dirname,
})

export default tseslint.config([
  eslint.configs.recommended,
  tseslint.configs.recommended,
  eslintConfigPrettier,
  ...compat.extends('next/core-web-vitals'),
  ...compat.extends('next/typescript'),
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    extends: [],
    plugins: {
      prettier: eslintPluginPrettier,
    },
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        project: 'tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-unused-vars': 'off',
      'react-hooks/rules-of-hooks': 'off',
      'react-hooks/exhaustive-deps': 'off',
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    languageOptions: { globals: globals.node },
  },
])
