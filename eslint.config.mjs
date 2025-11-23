import vue from 'eslint-plugin-vue';
import tseslint from 'typescript-eslint';
import vueParser from 'vue-eslint-parser';

const vueRecommended = vue.configs['flat/recommended'];

export default tseslint.config(
  {
    ignores: ['dist/**/*', 'types/**/*', 'node_modules', 'coverage/**/*', '*.log'],
  },
  ...vueRecommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx,js,jsx,vue}'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: 2022,
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      vue,
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'warn',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'warn',
      'prefer-template': 'warn',
      'no-unused-vars': 'off',
      'no-empty-function': 'off',
      'object-shorthand': ['warn', 'always'],
      'no-duplicate-imports': 'error',
      'arrow-body-style': ['warn', 'as-needed'],
      curly: ['error', 'multi-line'],
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'off',
      'vue/no-mutating-props': 'error',
      'vue/no-deprecated-model-definition': 'off',
      'vue/require-default-prop': 'off',
      'vue/require-explicit-emits': 'warn',
      'vue/no-unused-properties': [
        'warn',
        {
          groups: ['props', 'data', 'computed', 'methods', 'setup'],
        },
      ],
      'vue/component-name-in-template-casing': [
        'warn',
        'kebab-case',
        {
          registeredComponentsOnly: false,
        },
      ],
      'vue/html-self-closing': [
        'warn',
        {
          html: {
            void: 'always',
            normal: 'never',
            component: 'always',
          },
          svg: 'always',
          math: 'always',
        },
      ],
      '@typescript-eslint/consistent-type-imports': ['warn', { fixStyle: 'inline-type-imports' }],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/array-type': ['warn', { default: 'array-simple' }],
      '@typescript-eslint/consistent-indexed-object-style': ['warn', 'record'],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/ban-ts-comment': ['warn', { 'ts-ignore': 'allow-with-description' }],
    },
  },
);
