/* eslint-disable no-console */
exports.up = knex =>
  Promise.all([
    /**
    Table:  User Roles
    Purpose: Store User's Role data.
    */
    knex.schema
      .createTableIfNotExists('user_roles', table => {
        table.increments('id').primary();
        table.string('name', 255).notNullable().comment('Role Name');
        table
          .string('description', 255)
          .notNullable()
          .comment('Role Description');

        // TimeStamps
        table.boolean('isActive').defaultTo(true).comment('Active?');
        table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      })
      .then(() => {
        console.log('Created Table: user_roles table');
        return true;
      }),

    /**
    Table:  Users
    Purpose: Store User's Profile data.
    */
    knex.schema
      .createTableIfNotExists('users', table => {
        table.increments('id').primary();

        // Name
        table
          .string('userName', 255)
          .index()
          .unique()
          .comment('User name; for permalink.');
        table.string('name', 255).notNullable().comment('Name');
        table.text('bio').comment('Bio');
        table.string('avatarUrl').comment('Avatar Image Url');

        // Email Related
        table
          .string('email', 100)
          .index()
          .notNullable()
          .unique()
          .comment('Email to be in lowercase');
        table
          .string('emailToken', 15)
          .index()
          .comment('Email Verification Token');
        table
          .boolean('isEmailVerified')
          .defaultTo(false)
          .comment('Check if email is verified');

        // Phone Related
        table
          .string('phoneNumber', 15)
          .index()
          .comment('E164 Phone number; mobile number');

        // Password and Salt
        table
          .string('encryptedPassword')
          .notNullable()
          .comment('Encrypted password');
        table.string('passwordSalt').notNullable().comment('Password Salt');

        // Reset Password
        table
          .string('resetPasswordToken')
          .comment(
            'Reset Password Token; is valid till reset_password_sentAt + admin.reset_time',
          );
        table
          .timestamp('resetPasswordSentAt')
          .comment('Reset Password Sent At TimeStamps');

        // Role
        table
          .integer('roleId')
          .notNullable()
          .references('user_roles.id')
          .defaultTo(2)
          .index()
          .comment('User Role Id');

        // TimeStamps
        table.boolean('isActive').defaultTo(true).comment('Active?');
        table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      })
      .then(() => {
        console.log('Created Table: users table');
        return true;
      }),

    knex.schema
      .createTableIfNotExists('social_logins', table => {
        table.increments('id').primary();
        table
          .integer('userId')
          .notNullable()
          .references('users.id')
          .comment('User table id');
        table.string('providerId').notNullable().comment('User table id');
        table
          .string('provider')
          .notNullable()
          .comment('Source type: facebook, google etc');
        table
          .string('refreshToken')
          .notNullable()
          .comment('Source type: facebook, google etc');
        table
          .string('accessToken')
          .notNullable()
          .comment('Source type: facebook, google etc');
        table
          .boolean('isPrimaryLogin')
          .defaultTo(false)
          .comment('Is Signed via?');
        table.text('rawBody').comment('social data of user');

        // TimeStamps
        table.boolean('isActive').defaultTo(true).comment('Active?');
        table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
      })
      .then(() => {
        console.log('Created Table: social_logins table');
        return knex.schema.raw(
          'CREATE UNIQUE INDEX social_logins_cred_idx ON social_logins ("providerId", "provider") WHERE "isActive" = true',
        );
      }),
  ]);

exports.down = knex =>
  Promise.all([
    knex.raw('drop table if exists social_logins cascade'),
    knex.raw('drop table if exists user_roles cascade'),
    knex.raw('drop table if exists users cascade'),
    knex.raw('truncate table knex_migrations_lock RESTART identity'),
    knex.raw('truncate table knex_migrations RESTART identity'),
  ]).then(
    values => {
      console.log('dropped all tables : ', values);
      return true;
    },
    reason => {
      console.log('failed to rollback db : ', reason);
    },
  );
