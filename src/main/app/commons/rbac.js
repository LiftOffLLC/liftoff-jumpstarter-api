// NOTE: This Code has been ported from
// https://github.com/ramnique/rbac2/blob/master/index.js
const _ = require('lodash');
const Promise = require('bluebird');

const toTree = (role, rules) => {
  const arr = [];
  _.each(rules, rule => {
    if (rule.a === role) {
      const condition = {
        value: rule.can,
        when: rule.when,
        children: toTree(rule.can, rules),
      };
      arr.push(condition);
    }
  });

  return arr;
};

const findPaths = (root, permission) => {
  const paths = [];

  if (root.value === permission) {
    paths.push([root]);
  } else {
    _.each(root.children, child => {
      const childpaths = findPaths(child, permission);

      _.each(childpaths, childpath => {
        const path = [root];
        path.push(...childpath);
        paths.push(path);
      });
    });
  }

  return paths;
};

const checkPath = async (path, index, params, checkFullPath) => {
  // check if this is leaf node -- reached end
  if (index >= path.length) {
    return true;
  }

  const node = path[index];
  if (!node.when) {
    // no condition to get access to this node, permission granted
    if (!checkFullPath || !node.children) {
      return true;
    }
    return await checkPath(path, index + 1, params, checkFullPath);
  }

  // test condition associated with current node
  const val = await node.when(params);
  if (val) {
    return await checkPath(path, index + 1, params, checkFullPath);
  }
  throw new Error("rule didn't match");
};

module.exports = class RBAC {
  constructor(rules, checkFullPath) {
    this.rules = rules;
    this.checkFullPath = !!checkFullPath;
  }

  async check(role, permission, params = {}) {
    // Create a rbac tree from the current role
    const tree = {
      value: role,
      children: toTree(role, this.rules),
    };

    // Find all paths from root to permission
    const allPaths = findPaths(tree, permission);
    // Sort by shortest first (i.e. no. of nodes)
    const paths = _.sortBy(allPaths, path => path.length);

    // Check each path serially
    return Promise.each(
      paths,
      async path => await checkPath(path, 1, params, this.checkFullPath),
    )
      .then(_vals => true)
      .catch(_err => false);
  }
};
