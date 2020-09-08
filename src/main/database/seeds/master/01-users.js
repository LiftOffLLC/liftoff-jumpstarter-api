const Bcrypt = require('bcrypt');

exports.seed = async knex => {
  const hashedPassword = Bcrypt.hashSync('stringstring', 10);
  await knex.raw('TRUNCATE TABLE "User" RESTART IDENTITY CASCADE;');
  await knex('User').insert([
    {
      name: 'admin',
      userName: 'admin',
      email: 'admin@string.com',
      phoneNumber: '+12233334444',
      hashedPassword,
      role: 'admin',
    },
  ]);
};
