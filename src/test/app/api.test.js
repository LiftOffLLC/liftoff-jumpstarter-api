/* eslint-disable no-undef */
const app = require('../../main');
const { server } = app;

jest.setTimeout(30000);

beforeAll(async () => {
  await app.init();
});

afterAll(async () => {
  await app.stop();
});

describe('API Endpoint Tests', () => {
  describe('General', () => {
    test('GET / should respond with 404', async () => {
      const response = await server.inject({
        method: 'get',
        url: '/',
      });
      expect(response.statusCode).toBe(404);
    });

    test('GET /api/ping should respond with success', async () => {
      const response = await server.inject({
        method: 'get',
        url: '/api/ping',
      });
      expect(response.statusCode).toBe(200);
      const { result } = response;
      expect(result.success).toBeTruthy();
    });
  });

  describe('User', () => {
    test('GET /api/users should respond with users object ', async () => {
      const response = await server.inject({
        method: 'get',
        url: '/api/users',
      });
      expect(response.statusCode).toBe(200);
      const { result } = response;
      expect(result.count).toBeGreaterThan(0);
      expect(result.items.length).toBeGreaterThan(0);
    });
  });
});
