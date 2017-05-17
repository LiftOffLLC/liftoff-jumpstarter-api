import _ from 'lodash';
import immutable from 'immutable';
import defaultConfig from './default';

const env = process.env.NODE_ENV || 'development';
const config = _.merge({}, defaultConfig, require(`./${env}`)); // eslint-disable-line import/no-dynamic-require

/* eslint-enable no-process-env */
export default immutable.fromJS(config);
