/* eslint-disable hapi/no-arrowception, no-undef, no-unused-vars */
const querystring = require('querystring');
module.exports = (server, shared) => () => {
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
    shared.adminId = user.id;
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
    shared.userId = user.id;
  });
  test('DELETE /api/users/logout without auth should respond with 401', async () => {
    const response = await server.inject({
      method: 'delete',
      url: '/api/users/logout',
    });
    expect(response.statusCode).toBe(401);
  });
  test('DELETE /api/users/logout with user auth with userId should respond with 400', async () => {
    const query = {
      userId: shared.userId,
    };
    const response = await server.inject({
      method: 'delete',
      url: `/api/users/logout?${querystring.stringify(query)}`,
      headers: {
        Authorization: shared.userToken,
      },
    });
    expect(response.statusCode).toBe(400);
  });
  test('DELETE /api/users/logout with user auth should logout user', async () => {
    const response = await server.inject({
      method: 'delete',
      url: '/api/users/logout',
      headers: {
        Authorization: shared.userToken,
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.result).toEqual({
      success: true,
    });
  });
  test('DELETE /api/users/logout with admin auth with userId should logout user with that id', async () => {
    {
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
    }
    {
      const query = {
        userId: shared.userId,
      };
      const response = await server.inject({
        method: 'delete',
        url: `/api/users/logout?${querystring.stringify(query)}`,
        headers: {
          Authorization: shared.adminToken,
        },
      });
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual({
        success: true,
      });
    }
  });
  test('DELETE /api/users/logout with admin auth with invalid userId should do nothing', async () => {
    const query = {
      userId: 9999999,
    };
    const response = await server.inject({
      method: 'delete',
      url: `/api/users/logout?${querystring.stringify(query)}`,
      headers: {
        Authorization: shared.adminToken,
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.result).toEqual({
      success: true,
    });
  });
  test('DELETE /api/users/logout with invalid user auth should respond with 401', async () => {
    const response = await server.inject({
      method: 'delete',
      url: '/api/users/logout',
      headers: {
        Authorization: shared.userToken,
      },
    });
    expect(response.statusCode).toBe(401);
    shared.userToken = '';
  });
  test('DELETE /api/users/logout with admin auth should logout admin', async () => {
    const response = await server.inject({
      method: 'delete',
      url: '/api/users/logout',
      headers: {
        Authorization: shared.adminToken,
      },
    });
    expect(response.statusCode).toBe(200);
    expect(response.result).toEqual({
      success: true,
    });
  });
  test('DELETE /api/users/logout with invalid admin auth should respond with 401', async () => {
    const response = await server.inject({
      method: 'delete',
      url: '/api/users/logout',
      headers: {
        Authorization: shared.adminToken,
      },
    });
    expect(response.statusCode).toBe(401);
    shared.adminToken = '';
  });
  test('DELETE /api/users/logout with admin auth with admin userId should logout admin', async () => {
    {
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
    }
    {
      const query = {
        userId: shared.adminId,
      };
      const response = await server.inject({
        method: 'delete',
        url: `/api/users/logout?${querystring.stringify(query)}`,
        headers: {
          Authorization: shared.adminToken,
        },
      });
      expect(response.statusCode).toBe(200);
      expect(response.result).toEqual({
        success: true,
      });
    }
  });
  test('DELETE /api/users/logout with invalid admin auth should respond with 401', async () => {
    const response = await server.inject({
      method: 'delete',
      url: '/api/users/logout',
      headers: {
        Authorization: shared.adminToken,
      },
    });
    expect(response.statusCode).toBe(401);
    shared.adminToken = '';
  });
};
