/* eslint-disable hapi/no-arrowception, no-undef, no-unused-vars */
module.exports = (server, shared) => () => {
  test('GET /api/users/me without auth should respond with 401', async () => {
    const response = await server.inject({
      method: 'get',
      url: '/api/users/me',
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
  test('GET /api/users/me with auth should respond with user', async () => {
    const response = await server.inject({
      method: 'get',
      url: '/api/users/me',
      headers: {
        Authorization: shared.adminToken,
      },
    });
    expect(response.statusCode).toBe(200);
    const user = response.result;
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('userName');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('phoneNumber');
    expect(user).not.toHaveProperty('sessionToken');
  });
};
