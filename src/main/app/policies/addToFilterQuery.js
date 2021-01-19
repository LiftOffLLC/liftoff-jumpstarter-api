const Logger = require('../commons/logger');
const addFilters = require('../commons/addFilters');

const defaultCondition = () => true;

module.exports = function addToFilterQuery(
  keysAndValuePaths,
  whenCondition = defaultCondition,
) {
  const addFiltersPolicy = async (request, h) => {
    const cond = await whenCondition(request);
    Logger.info(`${__filename} entry :: (cond) :: `, cond);
    if (cond === false) {
      Logger.info(`${__filename} exit :: skipping condition`);
      return h.continue;
    }

    await addFilters(request, keysAndValuePaths);
    return h.continue;
  };

  addFiltersPolicy.applyPoint = 'onPreHandler';
  return addFiltersPolicy;
};
