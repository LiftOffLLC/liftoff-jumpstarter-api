import _ from 'lodash';
import nodemailer from 'nodemailer';
import Logger from './logger';
import Config from '../../config';
import UserModel from '../models/user';
import getMailTemplate from './mailTemplateHelper';

class Mailer {
  constructor() {
    try {
      const transport = Config.get('mailer').get('transport');
      const transportOptions = Config.get('mailer')
        .get(transport)
        .toJS();
      if (!_.isObject(transportOptions)) {
        throw new Error('No valid mailer transport found');
      }
      // eslint-disable-next-line global-require,import/no-dynamic-require
      require(transportOptions.package);
      transportOptions.transport = transport;
      this.transport = nodemailer.createTransport(transportOptions);
    } catch (err) {
      Logger.error(
        'Either Mail Config is incorrect or dependent package could not be loaded',
      );
      // FAIL FAST IF PACKAGE IS NOT FOUND.
      process.exit(1);
    }
  }

  /**
   * Function to dispatch emails.
   * from: contains address, name and userId:
   *        - address : defaults to support@dummy.com
   *        - name : defaults to Company
   *        - userId : defaults to 1
   * to: contains address, name and userId
   *        - address is required field
   * message: contains subject, body, text and attachment
   *        - subject|body|text : defaults present
   * variables: substitution variables
   * -need `${redirectUrl}?auth=${tokenString}`, user.id);
   */
  async dispatchMail(templateName, from, to, message, variableOpts = {}) {
    try {
      let mailTo = _.cloneDeep(to);
      const variables = _.cloneDeep(variableOpts);
      // Update common variables..here
      variables.webUrl = Config.get('webUrl');
      variables.adminUrl = Config.get('adminUrl');

      if (_.toSafeInteger(to) !== 0) {
        const user = await UserModel.findOne(
          UserModel.buildCriteria('id', _.toSafeInteger(to)),
        );

        mailTo = {
          address: user.email,
          name: user.name,
          userId: user.id,
        };

        variables.user = user;
      }
      Logger.info(' variables:: ', variables);
      const template = await getMailTemplate(templateName, variables);

      Logger.info('resulted subject', template.subject);
      Logger.info('resulted body', template.html);
      Logger.info('resulted text', template.text);
      Logger.info('resulted from', from.address || template.from);
      Logger.info('resulted to', mailTo.address);

      const sesMessage = {
        from: from.address || template.from,
        // cc: from.address || template.cc,
        to:
          Config.get('env') !== 'production'
            ? 'koantekoticinema@gmail.com'
            : mailTo.address, // password is P@33w0rd
        subject: template.subject,
        text: template.text,
        html: template.html,
      };

      // to add attachments.
      // sesMessage.attachments = [{
      //   filename: 'agreement.pdf',
      //   path: variables.evalForm.mouFileLocation
      // }];

      const response = await this.transport.sendMail(sesMessage);

      return response;
    } catch (err) {
      Logger.error('Mailer.dispatchMail :: error :: ', err);
      // throw err;
    }
    return false;
  }
}

export default new Mailer();
