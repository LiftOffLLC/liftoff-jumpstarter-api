import Joi from 'joi';
import PhoneUtil from '../phone';

const phoneJoiValidator = Joi.extend({
  base: Joi.string().min(10),
  name: 'phone',
  language: {
    e164format: 'is invalid'
  },
  rules: [{
    name: 'e164format',
    validate(params, value, state, options) {
      const phoneNumber = PhoneUtil.e164PhoneNumber(value);
      if (!phoneNumber) {
        // Generate an error, state and options need to be passed
        return this.createError('phone.e164format', {
          v: value
        }, state, options);
      }
      return phoneNumber;
    }
  }]
});

// usage : mobileNumber: phoneJoiValidator.phone().e164format().description('phone number'),
module.exports = phoneJoiValidator;
