// const { readdirSync, existsSync } = require("fs")

module.exports = {
  extends: ['./.eslintrc.js'],

  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parserOptions: {
        // see: https://github.com/typescript-eslint/typescript-eslint/issues/2094
        project: './tsconfig.json',
      },
      rules: {
        // Using `import type` helps faster tools for compiling TypeScript (e.g. babel) correctly ignore type imports
        '@typescript-eslint/consistent-type-imports': [
          'error',
          {prefer: 'type-imports', disallowTypeAnnotations: false},
        ],

        // Being explicit about accessibility of methods/properties makes it clearer what is public/private in classes
        '@typescript-eslint/explicit-member-accessibility': [
          'error',
          {
            accessibility: 'explicit',
            overrides: {
              accessors: 'explicit',
              constructors: 'off',
              methods: 'explicit',
              properties: 'explicit',
              parameterProperties: 'explicit',
            },
          },
        ],

        // This prevents errors where types that don't have a sensible `toString` get passed in template literals
        '@typescript-eslint/no-base-to-string': [
          'error',
          {ignoredTypeNames: ['Error', 'RegExp']},
        ],

        // Code like "delete container[name.toUpperCase()];" is hard to reason about, and normally means you should
        // replace an object with a Map or Set
        '@typescript-eslint/no-dynamic-delete': ['error'],

        // Promises must be handled appropriately or explicitly marked as ignored with the `void` operator
        '@typescript-eslint/no-floating-promises': [
          'error',
          {
            ignoreVoid: true,
            ignoreIIFE: false,
          },
        ],

        '@typescript-eslint/no-misused-promises': [
          'error',
          {
            // Promises are always truthy
            checksConditionals: true,
            // Places that expect a function that returns `void` will not wait for or check for errors in functions that return `Promise`
            checksVoidReturn: true,
          },
        ],

        // Type assertions (i.e. the `!` not null assertion or `as X`) are always unsafe
        // leaving unnecessary ones in the code base makes it riskier to refactor later
        // N.B. this rule is prone to false positives, but they can usually be resolved by either:
        //   1. Using `import assertExists from "ts-assert-exists"` if the value is nullable and we were casting it to a non-nullable
        //   2. Using the correct generics/annotating return types/annotating variable types if we were declaring the initial type for a value
        '@typescript-eslint/no-unnecessary-type-assertion': ['error'],

        // '@typescript-eslint/no-non-null-assertion': ['error'],

        // '@typescript-eslint/no-unnecessary-condition': ['error'],

        // This rule would block `any` as a return type for a function. Enabling it would require a lot of work though
        // '@typescript-eslint/no-unsafe-return': ['error'],

        // `arr.includes(x)` is much easier to read than `arr.indexOf(x) !== -1`
        '@typescript-eslint/prefer-includes': ['error'],

        // Make private class properties readonly when possible
        '@typescript-eslint/prefer-readonly': ['error'],

        // Good: [1, 2, 3].reduce<number[]>((arr, num) => arr.concat(num * 2), []);
        // Bad: [1, 2, 3].reduce((arr, num) => arr.concat(num * 2), [] as number[]);
        // The type cast is unsafe, and while it may be fine for now, creates refactoring hazards in the future
        '@typescript-eslint/prefer-reduce-type-parameter': ['error'],

        // These new methods are much more readable than other approaches
        '@typescript-eslint/prefer-string-starts-ends-with': ['error'],

        // Refactoring is much safer if you **always** await promises, even when they are returned from a function
        'no-return-await': 0,
        '@typescript-eslint/return-await': ['error', 'always'],
      },
    },
    {
      files: ['.build/**'],
      rules: {
        'react-hooks/rules-of-hooks': 0,
      },
    },
  ],
};
