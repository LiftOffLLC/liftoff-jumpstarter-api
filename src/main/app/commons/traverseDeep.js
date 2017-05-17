import _ from 'lodash';

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
export default async function traverseDeep(obj, fn) {
  if (_.isObject(obj)) {
    await fn(obj);
    for (const o of Object.keys(obj)) {
      await traverseDeep(obj[o], fn);
    }
  }
}
