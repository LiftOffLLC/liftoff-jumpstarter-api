const Bcrypt = require('bcrypt');

exports.seed = knex => {
  const hashedPassword = Bcrypt.hashSync('admin123456', 10);

  const records = [
    {
      name: 'admin',
      userName: 'admin',
      email: 'admin@dummy.com',
      roleId: 1,
      hashedPassword,
    },
  ];

  return Promise.all([knex('users').del(), knex('users').insert(records)]);
};
