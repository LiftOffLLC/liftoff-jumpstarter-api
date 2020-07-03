const _ = require('lodash');
const { Model } = require('objection');
// This is an experiment
// This is to workaround a circular dependency issue. DO NOT move to the top
const Worker = require('./worker');

module.exports = {
  /**
   * Traverse deep function
   * eg :
      const input = [{
        a: '1',
        items: [{
          b: '2',
          c: {
            ___VOTES_META: [{
              d: '4'
            }]
          }
        }]
      }];

    WIll print all obj
  */
  traverseDeep: async function traverseDeep(obj, fn) {
    if (_.isObject(obj)) {
      await fn(obj);
      await Promise.all(
        _.each(_.keys(obj), async o => {
          await traverseDeep(obj[o], fn);
        }),
      );
    }
  },

  /**
   * Get a random integer between `min` and `max`.
   *
   * @param {number} min - minimum number
   * @param {number} max - maximum number
   * @return {float} a random floating point number
   */
  getRandom: (min, max) => {
    const range = max - min + 1;
    return Math.floor(Math.random() * range + min);
  },

  // Adds Mail to Queue for later processing.
  addMailToQueue: async (
    templateName,
    from,
    to,
    message,
    variableOpts = {},
  ) => {
    const value = {
      templateName,
      from,
      to,
      message,
      variableOpts,
    };

    await Worker.addJob('emails.dispatch', value);
    return true;
  },

  /**
   * Wrap function in a transaction if none provided.
   * Last args element expected to be trx
   * @param {Function} fn
   * @param {[]} args
   */
  ensureTransaction: async (fn, args) => {
    const trx = args[args.length - 1];
    const boundFn = _.curry(fn)(..._.take(args, args.length - 1));

    if (trx) {
      return boundFn(trx);
    }
    return Model.transaction(async txn => boundFn(txn));
  },

  getTransaction: async () => Model.startTransaction(),
};
