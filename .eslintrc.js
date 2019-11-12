const prettierOptions = require('./.prettierrc');

module.exports = {
  extends: [
    'eslint',
    'airbnb',
    'prettier',
    // "plugin:lodash/recommended",
    'plugin:promise/recommended',
  ],
  plugins: [
    'prettier',
    'react',
    'jsx-a11y',
    'import',
    'security',
    'promise',
    'hapi',
  ],
  parserOptions: {
    // Only ESLint 6.2.0 and later support ES2020.
    ecmaVersion: 2020,
  },
  rules: {
    'prettier/prettier': ['error', prettierOptions],
    'arrow-body-style': [2, 'as-needed'],
    'no-console': 1,
    'no-use-before-define': 0,
    'import/imports-first': 0,
    'import/newline-after-import': 0,
    'import/no-dynamic-require': 0,
    'import/no-extraneous-dependencies': 0,
    'import/no-named-as-default': 0,
    'import/no-unresolved': 2,
    'comma-dangle': ['error', 'never'],
    'hapi/hapi-scope-start': 0,
    'hapi/hapi-capitalize-modules': 2,
    'hapi/hapi-for-you': 2,
    'hapi/no-arrowception': 2,
  },
};
