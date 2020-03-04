/* eslint-disable import/no-extraneous-dependencies */
const Code = require('code'); // assertion library
const Lab = require('lab').script();

const Server = require('../../../main');
exports.Lab = Lab;
const { expect } = Code;

Lab.experiment('ping api test', () => {
  Lab.test('returns pong', done => {
    const options = {
      method: 'GET',
      url: '/api/ping',
    };

    Server.inject(options, response => {
      const { result } = response;

      expect(response.statusCode).to.equal(200);
      expect(result).to.be.instanceof(Object);
      expect(result.result).to.equal('pong');
      done();
    });
  });
});
