/* eslint-disable hapi/no-arrowception, no-undef, no-unused-vars */
const moment = require('moment-timezone');
module.exports = (server, shared) => () => {
  describe('Payload Validation', () => {
    test('PUT /api/users without auth should respond with 401', async () => {
      const response = await server.inject({
        method: 'put',
        url: '/api/users',
      });
      expect(response.statusCode).toBe(401);
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
    test('POST /api/users/login with user should respond with user and token', async () => {
      const payload = {
        email: shared.userEmail,
        password: shared.userPassword,
      };
      const response = await server.inject({
        method: 'post',
        url: '/api/users/login',
        payload,
      });
      expect(response.statusCode).toBe(200);
      const user = response.result;
      expect(user).toHaveProperty('sessionToken');
      shared.userToken = user.sessionToken;
    });
    test('PUT /api/users with user auth without payload should respond with 400', async () => {
      const response = await server.inject({
        method: 'put',
        url: '/api/users',
        headers: {
          Authorization: shared.userToken,
        },
      });
      expect(response.statusCode).toBe(400);
    });
    test('PUT /api/users with user auth with empty payload should respond with user', async () => {
      const response = await server.inject({
        method: 'put',
        url: '/api/users',
        headers: {
          Authorization: shared.userToken,
        },
        payload: {},
      });
      expect(response.statusCode).toBe(200);
      const user = response.result;
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('userName');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('phoneNumber');
      expect(user).not.toHaveProperty('sessionToken');
      expect(user).toHaveProperty('updatedAt');
      const dateDiff = moment().diff(moment(user.updatedAt), 'seconds');
      expect(dateDiff).toBeLessThanOrEqual(100);
    });
  });
};
