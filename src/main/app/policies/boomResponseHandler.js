import Logger from 'winston';
import _ from 'lodash';

/**
  Policy to handle boom response payload
*/
const boomResponseHandler = async(request, reply, next) => {
  try {
    Logger.info(__filename, 'entry');
    const response = request.response;
    if (response.isBoom) {
      Logger.info(__filename, 'request.response :: ', request.response);
      if (_.has(response, 'output.payload.validation')) {
        const key = _.head(_.get(response, 'output.payload.validation.keys'));
        if (key) {
          _.set(response, 'output.payload.message', `Invalid ${key}`);
        }
      }
    }

    Logger.info(__filename, 'exit');
  } catch (err) {
    Logger.error(__filename, 'exit :: ', err);
  }

  return next(null, true);
};

boomResponseHandler.applyPoint = 'onPreResponse';
module.exports = boomResponseHandler;
