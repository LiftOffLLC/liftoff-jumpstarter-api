/* eslint-disable hapi/no-arrowception, no-undef, no-unused-vars */
const querystring = require('querystring');
const uuid = require('uuid');
const moment = require('moment-timezone');
module.exports = (server, shared) => () => {
  test('GET /api/users/forgot-password without email should respond with 400', async () => {
    const response = await server.inject({
      method: 'get',
      url: '/api/users/forgot-password',
    });
    expect(response.statusCode).toBe(400);
  });
  test('GET /api/users/forgot-password with invalid email should respond with 400', async () => {
    const query = {
      email: 'string',
    };
    const response = await server.inject({
      method: 'get',
      url: `/api/users/forgot-password?${querystring.stringify(query)}`,
    });
    expect(response.statusCode).toBe(400);
  });
  test('GET /api/users/forgot-password with nonexistent user should respond with 404', async () => {
    const query = {
      email: 'non123@existent.com',
    };
    const response = await server.inject({
      method: 'get',
      url: `/api/users/forgot-password?${querystring.stringify(query)}`,
    });
    expect(response.statusCode).toBe(404);
  });
  test('GET /api/users/forgot-password with valid user should respond success', async () => {
    const query = {
      email: shared.userEmail,
    };
    const response = await server.inject({
      method: 'get',
      url: `/api/users/forgot-password?${querystring.stringify(query)}`,
    });
    expect(response.statusCode).toBe(200);
    expect(response.result).toEqual({
      success: true,
    });
  });
  test('POST /api/users/login with admin should respond with user and token', async () => {
    const payload = {
      email: shared.adminEmail,
      password: shared.adminPassword,
    };
    const response = await server.inject({
      method: 'post',
      url: '/api/users/login',
      payload,
    });
    expect(response.statusCode).toBe(200);
    const user = response.result;
    expect(user).toHaveProperty('sessionToken');
    shared.adminToken = user.sessionToken;
  });
  test('GET /api/users with userId should respond with fresh valid reset token', async () => {
    const query = {
      fields: ['resetPasswordToken', 'resetPasswordSentAt'].join(','),
      filters: querystring.stringify({
        email: shared.userEmail,
      }),
    };
    const response = await server.inject({
      method: 'get',
      url: `/api/users?${querystring.stringify(query)}`,
      headers: {
        Authorization: shared.adminToken,
      },
    });
    expect(response.statusCode).toBe(200);
    const { result } = response;
    expect(result.count).toBe(result.items.length);
    expect(result.count).toBe(1);
    const user = result.items[0];
    expect(user).toHaveProperty('resetPasswordToken');
    expect(user).toHaveProperty('resetPasswordSentAt');
    const isUuidValid = uuid.validate(user.resetPasswordToken);
    expect(isUuidValid).toBe(true);
    const dateDiff = moment().diff(moment(user.resetPasswordSentAt), 'seconds');
    expect(dateDiff).toBeLessThanOrEqual(100);
  });
};
