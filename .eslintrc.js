const prettierOptions = require('./.prettierrc');

module.exports = {
  extends: [
    'airbnb',
    'prettier',
    // 'plugin:lodash/recommended',
    'plugin:promise/recommended',
  ],
  plugins: ['prettier', 'jsx-a11y', 'import', 'security', 'promise', 'hapi'],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    'prettier/prettier': ['error', prettierOptions],
    'arrow-body-style': [2, 'as-needed'],
    'no-console': 1,
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-use-before-define': 0,
    'import/imports-first': 0,
    'import/newline-after-import': 0,
    'import/no-dynamic-require': 0,
    'import/no-extraneous-dependencies': 0,
    'import/no-named-as-default': 0,
    'import/no-unresolved': 2,
    'comma-dangle': [2, 'always-multiline'],
    'hapi/hapi-scope-start': 0,
    'hapi/hapi-capitalize-modules': 0,
    'hapi/hapi-for-you': 2,
    'hapi/no-arrowception': 2,
    indent: [
      2,
      2,
      {
        SwitchCase: 1,
      },
    ],
    'no-param-reassign': [
      2,
      {
        props: false,
      },
    ],
    'no-underscore-dangle': 0,
    'no-return-await': 0,
  },
};
