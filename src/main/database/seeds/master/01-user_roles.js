exports.seed = knex => {
  const records = [
    {
      id: 1,
      name: 'admin',
      description: 'Admin',
    },
    {
      id: 2,
      name: 'user',
      description: 'User',
    },
  ];

  return Promise.all([
    knex('user_roles').del(),
    knex('user_roles').insert(records),
  ]);
};
