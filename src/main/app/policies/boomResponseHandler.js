import _ from 'lodash';
import Logger from '../commons/logger';

/**
  Policy to handle boom response payload
*/
const boomResponseHandler = async (request, h) => {
  try {
    Logger.info(`${__filename} entry`);
    const { response } = request;
    if (response.isBoom) {
      Logger.info(`${__filename} request.response :: `, request.response);
      if (_.has(response, 'output.payload.validation')) {
        const key = _.head(_.get(response, 'output.payload.validation.keys'));
        if (key) {
          _.set(response, 'output.payload.message', `Invalid ${key}`);
        }
      }
    }

    Logger.info(`${__filename} exit`);
  } catch (err) {
    Logger.error(`${__filename} exit`, err);
  }

  return h.continue;
};

boomResponseHandler.applyPoint = 'onPreResponse';
module.exports = boomResponseHandler;
