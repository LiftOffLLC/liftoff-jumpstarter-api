/* eslint-disable hapi/no-arrowception, no-undef, no-unused-vars */
module.exports = (server, shared) => () => {
  test('GET / should respond with 404', async () => {
    const response = await server.inject({
      method: 'get',
      url: '/',
    });
    expect(response.statusCode).toBe(404);
  });

  test('GET /robots.txt should respond with success', async () => {
    const response = await server.inject({
      method: 'get',
      url: '/robots.txt',
    });
    expect(response.statusCode).toBe(200);
  });

  test('GET /api/ping should respond with success', async () => {
    const response = await server.inject({
      method: 'get',
      url: '/api/ping',
    });
    expect(response.statusCode).toBe(200);
    expect(response.result).toEqual({
      success: true,
    });
  });

  describe('App Info', () => {
    describe('Invalid Cases', () => {
      test('GET /api/appinfo without auth should respond with 401', async () => {
        const response = await server.inject({
          method: 'get',
          url: '/api/appinfo',
        });
        expect(response.statusCode).toBe(401);
      });

      test('GET /api/appinfo with user auth should respond with 403', async () => {
        const response = await server.inject({
          method: 'get',
          url: '/api/appinfo',
          headers: {
            Authorization: shared.userToken,
          },
        });
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Valid Case', () => {
      test('GET /api/appinfo with admin auth should respond with 200', async () => {
        const response = await server.inject({
          method: 'get',
          url: '/api/appinfo',
          headers: {
            Authorization: shared.adminToken,
          },
        });
        expect(response.statusCode).toBe(200);
        const { result } = response;
        expect(result).toHaveProperty('adminUrl');
        expect(result).toHaveProperty('countryCode');
        expect(result).toHaveProperty('server');
        expect(result).toHaveProperty('mailer');
        expect(result).toHaveProperty('auth');
        expect(result).toHaveProperty('model_cache');
        expect(result).toHaveProperty('env');
        expect(result).toHaveProperty('newrelic');
        expect(result).toHaveProperty('passwordReset');
        expect(result).toHaveProperty('country');
        expect(result).toHaveProperty('database');
        expect(result).toHaveProperty('webUrl');
        expect(result).toHaveProperty('mailAddress');
        expect(result).toHaveProperty('worker');
        expect(result).toHaveProperty('sentry');
      });
    });
  });

  describe('Model Cache Purge', () => {
    test('DELETE /api/model-cache/purge without auth should respond with 401', async () => {
      const response = await server.inject({
        method: 'delete',
        url: '/api/model-cache/purge',
      });
      expect(response.statusCode).toBe(401);
    });

    describe('Valid Cases', () => {
      test('DELETE /api/model-cache/purge with user auth should respond with 200', async () => {
        const response = await server.inject({
          method: 'delete',
          url: '/api/model-cache/purge',
          headers: {
            Authorization: shared.userToken,
          },
        });
        expect(response.statusCode).toBe(200);
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
        shared.adminToken = user.sessionToken;
      });

      test('DELETE /api/model-cache/purge with admin auth should respond with 200', async () => {
        const response = await server.inject({
          method: 'delete',
          url: '/api/model-cache/purge',
          headers: {
            Authorization: shared.adminToken,
          },
        });
        expect(response.statusCode).toBe(200);
      });
    });
  });

  describe('Again Login User and Admin', () => {
    test('POST /api/users/login with user should respond with user and token', async () => {
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
      shared.userToken = user.sessionToken;
    });
  });
};
