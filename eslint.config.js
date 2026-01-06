import js from '@eslint/js';
import vue from 'eslint-plugin-vue';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import vuePrettierConfig from '@vue/eslint-config-prettier';

export default [
  // Игнорируем файлы
  {
    ignores: ['node_modules/**', 'dist/**', 'prisma/generated/**', 'vite.config.js', 'public/**'],
  },

  // Базовые правила для JavaScript
  js.configs.recommended,

  // Правила для Vue файлов (клиентская часть)
  ...vue.configs['flat/recommended'],
  {
    files: ['src/**/*.{js,vue}'],
    plugins: {
      prettier,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    rules: {
      ...prettierConfig.rules,
      ...vuePrettierConfig.rules,
      'prettier/prettier': 'error',
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'no-console': 'off',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Правила для Node.js (серверная часть)
  {
    files: ['server/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'no-console': 'off', // Разрешаем console в серверной части
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },

  // Правила для скриптов
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
      },
    },
    plugins: {
      prettier,
    },
    rules: {
      ...prettierConfig.rules,
      'prettier/prettier': 'error',
      'no-console': 'off',
      'no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
];
