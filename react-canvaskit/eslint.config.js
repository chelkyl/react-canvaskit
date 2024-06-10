import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config({
  files: ['**/*.ts'],
  languageOptions: {
    parserOptions: {
      project: true,
      tsconfigRootDir: import.meta.dirname,
      ecmaVersion: 'latest',
      sourceType: 'module',
      ecmaFeatures: {
        jsx: false,
      },
    },
  },
  extends: [eslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked, eslintConfigPrettier],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'warn',
  },
})
