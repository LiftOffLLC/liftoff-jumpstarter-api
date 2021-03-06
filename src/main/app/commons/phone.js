const PhoneLib = require('google-libphonenumber');
const _ = require('lodash');
const Logger = require('./logger');
const Config = require('../../config');

/**
 * Get E164 Phone number.
 * This method validates the phone number and sends e164 format, else sends null.
 */
exports.e164PhoneNumber = phoneNumber => {
  Logger.info('e164PhoneNumber: entry : phone : ', phoneNumber);

  if (_.isEmpty(phoneNumber)) {
    return null;
  }

  let phone = _.clone(phoneNumber);

  if (phone && phone.match(/[0-9]/i) && phone.length === 10) {
    phone = `${Config.get('countryCode')}${phone}`;
  }

  try {
    const phoneUtil = PhoneLib.PhoneNumberUtil.getInstance();
    const PNF = PhoneLib.PhoneNumberFormat;
    const PNT = PhoneLib.PhoneNumberType;

    const ph = phoneUtil.parse(phone, Config.get('country'));
    const type = phoneUtil.getNumberType(ph);

    if (
      ph &&
      phoneUtil.isValidNumber(ph) &&
      _.includes([PNT.MOBILE, PNT.FIXED_LINE_OR_MOBILE, PNT.FIXED_LINE], type)
    ) {
      const tmpPh = phoneUtil.format(ph, PNF.E164);
      Logger.info('e164PhoneNumber: exit:: success');
      return tmpPh;
    }
  } catch (err) {
    Logger.error(`e164PhoneNumber: phone : ${phoneNumber}, error :: `, err);
  }
  Logger.info('e164PhoneNumber: exit : phone : ', phoneNumber);
  return null;
};
