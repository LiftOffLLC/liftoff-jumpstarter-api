import _ from 'lodash';
import Boom from '@hapi/boom';
import Logger from '../commons/logger';
import RBAC from '../commons/rbac';
import UserModel from '../models/user';
import UserRole from '../models/userRole';

const isAdmin = async params => {
  Logger.info(`${__filename} isAdmin :: entry :: params :: `, params);
  // user must exist, project must exist and user should be the owner of the project.
  const count = await UserModel.count(
    UserModel.buildCriteriaWithObject({
      id: params.userId,
      isAdmin: true,
    }),
  );

  const success = count > 0;
  Logger.info(`${__filename} isAdmin :: exit :: success :: `, success);
  return success;
};

const editor = 'editor';
const buildRules = (ruleName, condition) => {
  const rule = [
    {
      a: editor,
      can: ruleName,
    },
    {
      a: UserRole.USER,
      can: editor,
      when: condition,
    },
    {
      a: UserRole.ADMIN,
      can: editor,
    },
  ];
  return rule;
};

const rbacRules = {
  // Access Rules
  'config.read': buildRules('config.read', isAdmin),
};

export default function checkPermission(permission, keysAndValuePaths = {}) {
  const hasSpecificRole = async (request, h) => {
    const rbac = new RBAC(rbacRules[permission]);

    // merge params with additionalParams
    // If scope is admin, he is trying to impersonate other guy.
    // If additionalParams contain userId and is not equals logged-in user..
    // set the scope as 'user' and userId as additionalParams.userId.
    const additionalParams = {};
    _.each(keysAndValuePaths, (valuePath, key) => {
      additionalParams[key] = _.hasIn(request, valuePath)
        ? _.get(request, valuePath)
        : valuePath;
    });

    const parameters = _.merge(_.cloneDeep(request.params), additionalParams);
    parameters.userId = request.auth.credentials.userId;

    if (
      additionalParams.userId &&
      additionalParams.userId !== request.auth.credentials.userId
    ) {
      Logger.info(
        `${__filename} checkPermission.hasSpecificRole :: impersonated user at play`,
      );
      parameters.userId = additionalParams.userId;
      Logger.info(
        `${__filename} checkPermission.hasSpecificRole :: entry :: parameters :: `,
        parameters,
      );
      const isAllowed = await rbac.check(UserRole.USER, permission, parameters);
      Logger.info(
        `${__filename}
        'checkPermission.hasSpecificRole :: exit :: isAllowed :: `,
        isAllowed,
      );

      if (isAllowed) {
        return h.continue;
      }

      throw Boom.forbidden();
    }

    Logger.info(
      `${__filename} checkPermission.hasSpecificRole :: entry :: parameters :: `,
      parameters,
    );
    const isAllowed = await rbac.check(
      request.auth.credentials.scope,
      permission,
      parameters,
    );
    Logger.info(
      `${__filename} checkPermission.hasSpecificRole :: exit :: isAllowed :: `,
      isAllowed,
    );

    if (isAllowed) {
      return h.continue;
    }

    throw Boom.forbidden();
  };

  hasSpecificRole.applyPoint = 'onPreHandler';
  return hasSpecificRole;
}
