/* eslint-disable hapi/no-arrowception, no-undef, no-unused-vars, no-await-in-loop, no-restricted-syntax */
const querystring = require('querystring');
module.exports = (server, shared) => () => {
  const emails = ['str1@ing.com', 'str2@ing.com', 'str3@ing.com'];
  const userIds = [];

  describe('Logging in', () => {
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
  });

  describe('Registering users for deletion', () => {
    test('Before registration, delete existing users with these emails', async () => {
      const query = {
        fields: 'id',
        filters: querystring.stringify({
          'email.in': emails.join(','),
          'isActive.in': [true, false].join(','),
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
      const delUserIds = result.items.map(user => user.id);
      for (const userId of delUserIds) {
        const userQuery = {
          userId,
          hardDeleteFlag: true,
        };
        const userResponse = await server.inject({
          method: 'delete',
          url: `/api/users?${querystring.stringify(userQuery)}`,
          headers: {
            Authorization: shared.adminToken,
          },
        });
        expect([200, 404]).toContain(userResponse.statusCode);
      }
    });

    test('Registering users', async () => {
      for (const email of emails) {
        const payload = {
          name: 'string',
          password: 'stringstring',
          email,
          phoneNumber: '2233334444',
        };
        const response = await server.inject({
          method: 'post',
          url: '/api/users',
          payload,
        });
        expect(response.statusCode).toBe(201);
        const user = response.result;
        expect(user).toHaveProperty('id');
        userIds.push(user.id);
      }
    });
  });

  describe('Logging in again', () => {
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
    });
  });

  describe('Invalid Cases', () => {
    test('DELETE /api/users without auth should respond with 401', async () => {
      const query = {
        userId: userIds[0],
      };
      const response = await server.inject({
        method: 'delete',
        url: `/api/users?${querystring.stringify(query)}`,
      });
      expect(response.statusCode).toBe(401);
    });

    test('DELETE /api/users with user auth should respond with 403', async () => {
      const query = {
        userId: userIds[0],
      };
      const response = await server.inject({
        method: 'delete',
        url: `/api/users?${querystring.stringify(query)}`,
        headers: {
          Authorization: shared.userToken,
        },
      });
      expect(response.statusCode).toBe(403);
    });

    test('DELETE /api/users with admin auth without userId should respond with 400', async () => {
      const response = await server.inject({
        method: 'delete',
        url: `/api/users`,
        headers: {
          Authorization: shared.adminToken,
        },
      });
      expect(response.statusCode).toBe(400);
    });

    test('DELETE /api/users with admin auth with invalid userId should respond with 404', async () => {
      const query = {
        userId: 9999999,
      };
      const response = await server.inject({
        method: 'delete',
        url: `/api/users?${querystring.stringify(query)}`,
        headers: {
          Authorization: shared.adminToken,
        },
      });
      expect(response.statusCode).toBe(404);
    });

    test('DELETE /api/users with admin auth with admin userId should respond with 403', async () => {
      const query = {
        userId: shared.adminId,
      };
      const response = await server.inject({
        method: 'delete',
        url: `/api/users?${querystring.stringify(query)}`,
        headers: {
          Authorization: shared.adminToken,
        },
      });
      expect(response.statusCode).toBe(403);
    });
  });

  describe('Valid Deletions', () => {
    describe('Without hardDeleteFlag', () => {
      test('DELETE /api/users with admin auth without hardDeleteFlag should respond with success', async () => {
        const query = {
          userId: userIds[0],
        };
        const response = await server.inject({
          method: 'delete',
          url: `/api/users?${querystring.stringify(query)}`,
          headers: {
            Authorization: shared.adminToken,
          },
        });
        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual({
          success: true,
        });
      });

      test('GET /api/users with soft-deleted userId should respond with inActive user', async () => {
        const query = {
          fields: ['id', 'isActive'].join(','),
          filters: querystring.stringify({
            id: userIds[0],
            'isActive.in': [true, false].join(','),
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
        expect(result.items[0].isActive).toBe(false);
      });
    });

    describe('With hardDeleteFlag = false', () => {
      test('DELETE /api/users with admin auth with hardDeleteFlag = false should respond with success', async () => {
        const query = {
          userId: userIds[1],
          hardDeleteFlag: false,
        };
        const response = await server.inject({
          method: 'delete',
          url: `/api/users?${querystring.stringify(query)}`,
          headers: {
            Authorization: shared.adminToken,
          },
        });
        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual({
          success: true,
        });
      });

      test('GET /api/users with soft-deleted userId should respond with inActive user', async () => {
        const query = {
          fields: ['id', 'isActive'].join(','),
          filters: querystring.stringify({
            id: userIds[1],
            'isActive.in': [true, false].join(','),
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
        expect(result.items[0].isActive).toBe(false);
      });
    });

    describe('With hardDeleteFlag = true', () => {
      test('DELETE /api/users with admin auth with hardDeleteFlag = true should respond with success', async () => {
        const query = {
          userId: userIds[2],
          hardDeleteFlag: true,
        };
        const response = await server.inject({
          method: 'delete',
          url: `/api/users?${querystring.stringify(query)}`,
          headers: {
            Authorization: shared.adminToken,
          },
        });
        expect(response.statusCode).toBe(200);
        expect(response.result).toEqual({
          success: true,
        });
      });

      test('GET /api/users with hard-deleted userId should respond with no user', async () => {
        const query = {
          fields: ['id', 'isActive'].join(','),
          filters: querystring.stringify({
            id: userIds[2],
            'isActive.in': [true, false].join(','),
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
        expect(result.count).toBe(0);
      });
    });
  });
};
