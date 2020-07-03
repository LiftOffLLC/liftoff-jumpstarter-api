const Joi = require('@hapi/joi');
const PasswordValidator = require('password-validator');

const schema = new PasswordValidator();
schema
  .is()
  .min(2) // Minimum length 2
  .is()
  .max(100) // Maximum length 100
  // .has()
  // .uppercase() // Must have uppercase letters
  // .has()
  // .lowercase() // Must have lowercase letters
  // .has()
  // .digits() // Must have digits
  .has()
  .not()
  .spaces(); // Should not have spaces

const passwordJoiValidator = Joi.extend({
  type: 'password',
  base: Joi.string(),
  messages: {
    'password.invalid': 'Invalid Password',
  },
  rules: {
    isValid: {
      validate(value, helpers) {
        const isPasswordValid = schema.validate(value);
        if (!isPasswordValid) {
          return helpers.error('password.invalid');
        }
        return value;
      },
    },
  },
});

module.exports = passwordJoiValidator;
