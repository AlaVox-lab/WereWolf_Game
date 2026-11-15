import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

// Rào chắn phụ thuộc giữa các tầng — ARCHITECTURE.md mục 2.4 và 4.2. Hỏng lint là hỏng CI.
const loiMienRaNgoai =
  'domain/ không được nhập gì ngoài chính nó (ARCHITECTURE.md mục 2.4). Thời gian và ngẫu nhiên đi qua cổng DongHo, NguonNgauNhien.';
const loiWebNhapServer =
  'apps/web chỉ được nhập @moonvillage/shared — luật chơi nằm ở máy chủ (ARCHITECTURE.md mục 2.1).';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      'apps/server/src/infrastructure/repository/prisma/generated/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: { globals: { ...globals.node } },
    rules: {
      // Tham số bắt đầu bằng _ là tham số lớp con cần nhưng bản mặc định không dùng.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@moonvillage/server', '@moonvillage/server/*'], message: loiWebNhapServer },
            {
              regex: '(^|/)apps/server(/|$)|(^|/)\\.\\./\\.\\./server(/|$)',
              message: loiWebNhapServer,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['apps/server/src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            // Mọi gói bên ngoài, kể cả node:* và @moonvillage/shared — chỉ cho đường dẫn tương đối.
            { regex: '^(?!\\.)', message: loiMienRaNgoai },
            // Đường dẫn tương đối thoát ra khỏi domain/.
            {
              regex: '(^|/)(application|infrastructure|interface)(/|$)|^(\\.\\./)+main(\\.js)?$',
              message: loiMienRaNgoai,
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        { name: 'Date', message: loiMienRaNgoai },
        { name: 'setTimeout', message: loiMienRaNgoai },
        { name: 'setInterval', message: loiMienRaNgoai },
        { name: 'process', message: loiMienRaNgoai },
      ],
      'no-restricted-properties': [
        'error',
        { object: 'Math', property: 'random', message: loiMienRaNgoai },
      ],
    },
  },
);
