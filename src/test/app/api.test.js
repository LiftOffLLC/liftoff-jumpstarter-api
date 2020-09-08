/* eslint-disable no-undef */
const app = require('../../main');
const general = require('./general');
const userRead = require('./user/user.read');
const userDelete = require('./user/user.delete');
const userCreate = require('./user/user.create');
const userUpdate = require('./user/user.update');
const userLogin = require('./user/user.login');
const userMe = require('./user/user.me');
const userForgotPassword = require('./user/user.forgot-password');
const userLogout = require('./user/user.logout');
const { server } = app;

jest.setTimeout(30000);

beforeAll(async () => {
  await app.init();
});

afterAll(async () => {
  await app.stop();
});

describe('API Endpoint Tests', () => {
  const shared = {
    adminEmail: 'admin@string.com',
    adminPassword: 'stringstring',
    userEmail: 'str@ing.com',
    userPassword: 'stringstring',
  };

  describe('General', general(server, shared));

  describe('User', () => {
    describe('Read', userRead(server, shared));
    describe('Register', userCreate(server, shared));
    describe('Login', userLogin(server, shared));
    describe('Me', userMe(server, shared));
    describe('Forgot Password', userForgotPassword(server, shared));
    describe('Update', userUpdate(server, shared));
    describe('Logout', userLogout(server, shared));
    describe('Delete', userDelete(server, shared));
  });
});
