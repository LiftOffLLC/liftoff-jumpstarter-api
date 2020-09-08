/* eslint-disable hapi/no-arrowception, no-undef, no-unused-vars, no-await-in-loop, no-restricted-syntax */
const querystring = require('querystring');
module.exports = (server, shared) => () => {
  describe('Payload Validation', () => {
    test('POST /api/users without payload should respond with 400', async () => {
      const response = await server.inject({
        method: 'post',
        url: '/api/users',
      });
      expect(response.statusCode).toBe(400);
    });
    test('POST /api/users with unknown param in payload should respond with 400', async () => {
      const payload = {
        name: 'string',
        password: 'stringstring',
        email: 'str@ing.com',
        phoneNumber: '2233334444',
        unknown: 'string',
      };
      const response = await server.inject({
        method: 'post',
        url: '/api/users',
        payload,
      });
      expect(response.statusCode).toBe(400);
    });
    describe('Name', () => {
      test('POST /api/users without name should respond with 400', async () => {
        const payload = {
          password: 'stringstring',
          email: 'str@ing.com',
          phoneNumber: '2233334444',
        };
        const response = await server.inject({
          method: 'post',
          url: '/api/users',
          payload,
        });
        expect(response.statusCode).toBe(400);
      });
      test('POST /api/users with invalid name should respond with 400', async () => {
        const payload = {
          name: 's',
          password: 'stringstring',
          email: 'str@ing.com',
          phoneNumber: '2233334444',
        };
        const response = await server.inject({
          method: 'post',
          url: '/api/users',
          payload,
        });
        expect(response.statusCode).toBe(400);
      });
    });
    describe('Password', () => {
      test('POST /api/users without password should respond with 400', async () => {
        const payload = {
          name: 'string',
          email: 'str@ing.com',
          phoneNumber: '2233334444',
        };
        const response = await server.inject({
          method: 'post',
          url: '/api/users',
          payload,
        });
        expect(response.statusCode).toBe(400);
      });
      test('POST /api/users with invalid password should respond with 400', async () => {
        const payload = {
          name: 'string',
          password: 'string',
          email: 'str@ing.com',
          phoneNumber: '2233334444',
        };
        const response = await server.inject({
          method: 'post',
          url: '/api/users',
          payload,
        });
        expect(response.statusCode).toBe(400);
      });
    });
    describe('Email', () => {
      test('POST /api/users without email should respond with 400', async () => {
        const payload = {
          name: 'string',
          password: 'stringstring',
          phoneNumber: '2233334444',
        };
        const response = await server.inject({
          method: 'post',
          url: '/api/users',
          payload,
        });
        expect(response.statusCode).toBe(400);
      });
      test('POST /api/users with invalid email should respond with 400', async () => {
        const payload = {
          name: 'string',
          password: 'stringstring',
          email: 'string',
          phoneNumber: '2233334444',
        };
        const response = await server.inject({
          method: 'post',
          url: '/api/users',
          payload,
        });
        expect(response.statusCode).toBe(400);
      });
    });
    describe('Phone Number', () => {
      test('POST /api/users with invalid phoneNumber should respond with 400', async () => {
        const payload = {
          name: 'string',
          password: 'stringstring',
          email: 'str@ing.com',
          phoneNumber: 'string',
        };
        const response = await server.inject({
          method: 'post',
          url: '/api/users',
          payload,
        });
        expect(response.statusCode).toBe(400);
      });
    });
  });

  describe('Constraint Validation', () => {
    test('POST /api/users with existing email should respond with 403', async () => {
      const payload = {
        name: 'string',
        password: 'stringstring',
        email: shared.adminEmail,
        phoneNumber: '2233334444',
      };
      const response = await server.inject({
        method: 'post',
        url: '/api/users',
        payload,
      });
      expect(response.statusCode).toBe(403);
    });
  });

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

  describe('Valid Registration', () => {
    test('Before registration, delete existing user with this email', async () => {
      const query = {
        fields: 'id',
        filters: querystring.stringify({
          email: 'str@ing.com',
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
      expect([0, 1]).toContain(result.count);
      if (result.count === 1) {
        const userId = result.items[0].id;
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

    test('POST /api/users should respond with user and token', async () => {
      const payload = {
        name: 'string',
        password: 'stringstring',
        email: 'str@ing.com',
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
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('userName');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('phoneNumber');
      expect(user).toHaveProperty('sessionToken');
      shared.userToken = user.sessionToken;
    });
  });
};
