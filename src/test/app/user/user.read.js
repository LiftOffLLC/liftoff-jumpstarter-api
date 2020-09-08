/* eslint-disable hapi/no-arrowception, no-undef, no-unused-vars */
module.exports = (server, shared) => () => {
  test('GET /api/users should respond with users', async () => {
    const response = await server.inject({
      method: 'get',
      url: '/api/users',
    });
    expect(response.statusCode).toBe(200);
    const { result } = response;
    expect(result.count).toBeGreaterThan(0);
    expect(result.items.length).toBeGreaterThan(0);
    const user = result.items[0];
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('userName');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('phoneNumber');
    expect(user).not.toHaveProperty('sessionToken');
  });
};
