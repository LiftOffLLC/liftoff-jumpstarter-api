const Bcrypt = require('bcrypt');

exports.seed = knex => {
  const passwordSalt = Bcrypt.genSaltSync(10);
  const encryptedPassword = Bcrypt.hashSync('admin123456', passwordSalt);

  const records = [
    {
      name: 'admin',
      userName: 'admin',
      email: 'admin@dummy.com',
      roleId: 1,
      encryptedPassword,
      passwordSalt,
    },
  ];

  return Promise.all([knex('users').del(), knex('users').insert(records)]);
};
