const Url = require('url');
const _ = require('lodash');

module.exports = url => {
  const parsedUrl = Url.parse(url);
  const { hostname: host, port } = parsedUrl;
  const database = _.last(_.split(_.get(parsedUrl, 'pathname'), '/'));
  const [user, password] = _.split(_.get(parsedUrl, 'auth'), ':');

  return _.pickBy({ host, port, user, password, database });
};
