// This base config does not include any rules that require TypeScript info to function
module.exports = {
  extends: [],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'import'],

  env: {
    node: true,
    es6: true,
    browser: true,
  },

  settings: {
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    'import/internal-regex': 'rollingversions',
    react: {version: 'detect'},
  },

  rules: {
    // sort imports so I don't have to think about them
    'import/order': [
      'error',
      {
        alphabetize: {order: 'asc', caseInsensitive: true},
        'newlines-between': 'always',
        groups: [
          'builtin',
          'external',
          'internal',
          ['parent', 'sibling', 'index'],
        ],
      },
    ],

    // prevent ../current-folder
    'import/no-useless-path-segments': ['error'],

    // Require explicit values in enums. This prevents the value changing when keys are added/removed/reordered in enums
    '@typescript-eslint/prefer-enum-initializers': ['error'],

    // For of loops are easier to read when you do not need the index
    '@typescript-eslint/prefer-for-of': ['error'],

    // ts-expect-error works just like ts-ignore except that you are forced to remove it once it is no longer needed
    '@typescript-eslint/prefer-ts-expect-error': ['error'],
  },
};
