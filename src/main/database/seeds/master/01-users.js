import Bcrypt from 'bcrypt';

exports.seed = (knex, Promise) => {
  const passwordSalt = Bcrypt.genSaltSync(10);
  const encryptedPassword = Bcrypt.hashSync('admin123456', passwordSalt);

  const records = [
    {
      name: 'admin',
      userName: 'admin',
      email: 'admin@dummy.com',
      encryptedPassword,
      passwordSalt,
      isAdmin: true,
    },
  ];

  return Promise.all([knex('users').del(), knex('users').insert(records)]);
};
