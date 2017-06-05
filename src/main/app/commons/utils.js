import _ from 'lodash';

export default {
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
      for (const o of Object.keys(obj)) {
        await traverseDeep(obj[o], fn);
      }
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
    const range = (max - min) + 1;
    return Math.floor((Math.random() * (range)) + min);
  }
};
