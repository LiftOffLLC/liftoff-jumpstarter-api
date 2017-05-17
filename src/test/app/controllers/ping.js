/* eslint-disable import/no-extraneous-dependencies */
require('babel-register')();
const Code = require('code'); // assertion library
const Server = require('../../../main');
const Lab = exports.Lab = require('lab').script();

const expect = Code.expect;

Lab.experiment('ping api test', () => {
  Lab.test('returns pong', (done) => {
    const options = {
      method: 'GET',
      url: '/api/ping'
    };

    Server.inject(options, (response) => {
      const result = response.result;

      expect(response.statusCode).to.equal(200);
      expect(result).to.be.instanceof(Object);
      expect(result.result).to.equal('pong');
      done();
    });
  });
});
