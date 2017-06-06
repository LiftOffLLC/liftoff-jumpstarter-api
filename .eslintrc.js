module.exports = {
  "extends": [
    "eslint",
    "airbnb",
    // "plugin:lodash/recommended",
    "plugin:promise/recommended",
  ],
  "plugins": [
    "react",
    "jsx-a11y",
    "import",
    "security",
    "promise",
    "hapi"
  ],
  "rules": {
    "comma-dangle": ["error", "never"],
    "hapi/hapi-scope-start": 0,
    "hapi/hapi-capitalize-modules": 2,
    "hapi/hapi-for-you": 2,
    "hapi/no-arrowception": 2,
  }
};
