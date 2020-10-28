/* eslint-disable hapi/no-arrowception, no-undef, no-unused-vars */
module.exports = (server, shared) => () => {
  test('POST /api/users/login without payload should respond with 400', async () => {
    const response = await server.inject({
      method: 'post',
      url: '/api/users/login',
    });
    expect(response.statusCode).toBe(400);
  });

  test('POST /api/users/login with invalid email should respond with 400', async () => {
    const payload = {
      email: 'string',
      password: 'stringstring',
    };
    const response = await server.inject({
      method: 'post',
      url: '/api/users/login',
      payload,
    });
    expect(response.statusCode).toBe(400);
  });

  test('POST /api/users/login with invalid password should respond with 400', async () => {
    const payload = {
      email: 'str@ing.com',
      password: 'string',
    };
    const response = await server.inject({
      method: 'post',
      url: '/api/users/login',
      payload,
    });
    expect(response.statusCode).toBe(400);
  });

  test('POST /api/users/login with nonexistent user should respond with 404', async () => {
    const payload = {
      email: 'non123@existent.com',
      password: 'stringstring',
    };
    const response = await server.inject({
      method: 'post',
      url: '/api/users/login',
      payload,
    });
    expect(response.statusCode).toBe(404);
  });

  test('POST /api/users/login with incorrect password should respond with 401', async () => {
    const payload = {
      email: shared.adminEmail,
      password: shared.adminPassword.replace(/.$/, 'X'),
    };
    const response = await server.inject({
      method: 'post',
      url: '/api/users/login',
      payload,
    });
    expect(response.statusCode).toBe(401);
  });

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
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('userName');
    expect(user).toHaveProperty('email');
    expect(user).toHaveProperty('phoneNumber');
    expect(user).toHaveProperty('sessionToken');
    shared.adminToken = user.sessionToken;
  });
};
