/* eslint-disable no-undef */
const app = require('../../main');
const general = require('./general');
const userRead = require('./user/user.read');
const userDelete = require('./user/user.delete');
const userCreate = require('./user/user.create');
const userUpdate = require('./user/user.update');
const userLogin = require('./user/user.login');
const userMe = require('./user/user.me');
const userPassword = require('./user/user.password');
const userLogout = require('./user/user.logout');
const { server } = app;

jest.setTimeout(60000);

beforeAll(async () => {
  await app.init();
});

describe('API Endpoint Tests', () => {
  const shared = {
    adminEmail: 'admin@string.com',
    adminPassword: 'stringstring',
    userEmail: 'str@ing.com',
    userPassword: 'stringstring',
  };

  describe('User', () => {
    describe('Read', userRead(server, shared));

    describe('Register', userCreate(server, shared));

    describe('Login', userLogin(server, shared));

    describe('Me', userMe(server, shared));

    describe('Update', userUpdate(server, shared));

    describe('Logout', userLogout(server, shared));

    describe('Password', userPassword(server, shared));

    describe('Delete', userDelete(server, shared));
  });

  describe('General', general(server, shared));
});
