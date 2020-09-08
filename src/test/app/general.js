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
  test('GET /api/appinfo without auth should respond with 401', async () => {
    const response = await server.inject({
      method: 'get',
      url: '/api/appinfo',
    });
    expect(response.statusCode).toBe(401);
  });
};
