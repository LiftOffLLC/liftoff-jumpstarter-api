/* eslint-disable hapi/no-arrowception, no-undef, no-unused-vars */
const querystring = require('querystring');
const uuid = require('uuid');
const moment = require('moment-timezone');
let resetPasswordToken;
const newPassword = 'stringstring2';

module.exports = (server, shared) => () => {
  describe('Forgot Password', () => {
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
      const dateDiff = moment().diff(
        moment(user.resetPasswordSentAt),
        'seconds',
      );
      expect(dateDiff).toBeLessThanOrEqual(100);
      resetPasswordToken = user.resetPasswordToken;
    });
  });

  describe('Reset Password', () => {
    const validUuid = '00000000-0000-0000-0000-000000000000';

    describe('Payload Validation', () => {
      test('POST /users/reset-password without payload should respond with 400', async () => {
        const response = await server.inject({
          method: 'post',
          url: '/api/users/reset-password',
        });
        expect(response.statusCode).toBe(400);
      });

      test('POST /users/reset-password with unknown param should respond with 400', async () => {
        const payload = {
          email: shared.userEmail,
          password: newPassword,
          resetPasswordToken: validUuid,
          unknown: 'string',
        };
        const response = await server.inject({
          method: 'post',
          url: '/api/users/reset-password',
          payload,
        });
        expect(response.statusCode).toBe(400);
      });

      describe('Email', () => {
        test('POST /users/reset-password without email should respond with 400', async () => {
          const payload = {
            password: newPassword,
            resetPasswordToken: validUuid,
          };
          const response = await server.inject({
            method: 'post',
            url: '/api/users/reset-password',
            payload,
          });
          expect(response.statusCode).toBe(400);
        });

        test('POST /users/reset-password with invalid email should respond with 400', async () => {
          const payload = {
            email: 'string',
            password: newPassword,
            resetPasswordToken: validUuid,
          };
          const response = await server.inject({
            method: 'post',
            url: '/api/users/reset-password',
            payload,
          });
          expect(response.statusCode).toBe(400);
        });
      });

      describe('Password', () => {
        test('POST /users/reset-password without password should respond with 400', async () => {
          const payload = {
            email: shared.userEmail,
            resetPasswordToken: validUuid,
          };
          const response = await server.inject({
            method: 'post',
            url: '/api/users/reset-password',
            payload,
          });
          expect(response.statusCode).toBe(400);
        });

        test('POST /users/reset-password with invalid password should respond with 400', async () => {
          const payload = {
            email: shared.userEmail,
            password: 'string',
            resetPasswordToken: validUuid,
          };
          const response = await server.inject({
            method: 'post',
            url: '/api/users/reset-password',
            payload,
          });
          expect(response.statusCode).toBe(400);
        });
      });

      describe('Reset Password Token', () => {
        test('POST /users/reset-password without resetPasswordToken should respond with 400', async () => {
          const payload = {
            email: shared.userEmail,
            password: newPassword,
          };
          const response = await server.inject({
            method: 'post',
            url: '/api/users/reset-password',
            payload,
          });
          expect(response.statusCode).toBe(400);
        });

        test('POST /users/reset-password with invalid resetPasswordToken should respond with 400', async () => {
          const payload = {
            email: shared.userEmail,
            password: newPassword,
            resetPasswordToken: 'string',
          };
          const response = await server.inject({
            method: 'post',
            url: '/api/users/reset-password',
            payload,
          });
          expect(response.statusCode).toBe(400);
        });
      });
    });

    describe('Constraint Validation', () => {
      test('POST /users/reset-password with nonexistent user should respond with 404', async () => {
        const payload = {
          email: 'non123@existent.com',
          password: newPassword,
          resetPasswordToken: validUuid,
        };
        const response = await server.inject({
          method: 'post',
          url: '/api/users/reset-password',
          payload,
        });
        expect(response.statusCode).toBe(404);
      });

      test('POST /users/reset-password with invalid token should respond with 403', async () => {
        const payload = {
          email: shared.userEmail,
          password: newPassword,
          resetPasswordToken: validUuid,
        };
        const response = await server.inject({
          method: 'post',
          url: '/api/users/reset-password',
          payload,
        });
        expect(response.statusCode).toBe(403);
      });
    });

    describe('Valid Cases', () => {
      test('POST /users/reset-password with valid token and new password should respond with user', async () => {
        const payload = {
          email: shared.userEmail,
          password: newPassword,
          resetPasswordToken,
        };
        const response = await server.inject({
          method: 'post',
          url: '/api/users/reset-password',
          payload,
        });
        expect(response.statusCode).toBe(200);
        const user = response.result;
        expect(user).toHaveProperty('id');
        expect(user).toHaveProperty('name');
        expect(user).toHaveProperty('userName');
        expect(user).toHaveProperty('email');
        expect(user).toHaveProperty('phoneNumber');
        expect(user).toHaveProperty('role');
      });

      test('POST /api/users/login with new password should respond with user and token', async () => {
        const payload = {
          email: shared.userEmail,
          password: newPassword,
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

      test('PUT /api/users with user auth with old and new passwords should respond with user', async () => {
        const response = await server.inject({
          method: 'put',
          url: '/api/users',
          headers: {
            Authorization: shared.userToken,
          },
          payload: {
            oldPassword: newPassword,
            password: shared.userPassword,
          },
        });
        expect(response.statusCode).toBe(200);
      });

      test('POST /api/users/login with original password should respond with user and token', async () => {
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
  });
};
