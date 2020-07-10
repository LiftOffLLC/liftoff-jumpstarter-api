/* eslint-disable no-undef */
const app = require('../../../main');
const { Server } = app;

jest.setTimeout(60000);

beforeAll(async () => {
  await app.init();
  await new Promise(resolve => setTimeout(resolve, 10000));
});

afterAll(async () => {
  await app.stop();
});

test('GET / responds with 404', async () => {
  const res = await Server.inject({
    method: 'get',
    url: '/',
  });
  expect(res.statusCode).toBe(404);
});

test('GET /api/ping responds with 200', async () => {
  const res = await Server.inject({
    method: 'get',
    url: '/api/ping',
  });
  expect(res.statusCode).toBe(200);
});
