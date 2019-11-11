import Joi from "@hapi/joi";
import PhoneUtil from "../phone";

const phoneJoiValidator = Joi.extend({
  type: "phone",
  base: Joi.string().min(10),
  messages: {
    "phone.e164format": "is invalid"
  },
  rules: {
    e164format: {
      validate(value, helpers, state, options) {
        const phoneNumber = PhoneUtil.e164PhoneNumber(value);
        if (!phoneNumber) {
          // Generate an error, state and options need to be passed
          return helpers.error(
            "phone.e164format",
            {
              v: value
            },
            state,
            options
          );
        }
        return phoneNumber;
      }
    }
  }
});

// usage : mobileNumber: phoneJoiValidator.phone().e164format().description('phone number'),
module.exports = phoneJoiValidator;
