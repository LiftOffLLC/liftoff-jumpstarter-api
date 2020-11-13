/* eslint-disable no-console */
const Constants = require('../../app/commons/constants');

exports.up = async knex => {
  /**
  Table:  User
  Purpose: Store User's Data and References
  */
  await knex.schema.createTable('User', table => {
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
      .string('email')
      .index()
      .unique()
      .notNullable()
      .comment('Email to be in lowercase');
    table.string('emailToken', 15).index().comment('Email Verification Token');
    table
      .boolean('isEmailVerified')
      .defaultTo(false)
      .comment('Check if email is verified');

    // Phone Related
    table
      .string('phoneNumber')
      .index()
      .notNullable()
      .comment('E164 Phone number');

    // Password
    table.string('hashedPassword').notNullable().comment('Hashed password');
    table.string('resetPasswordToken').comment('Reset Password Token');
    table
      .timestamp('resetPasswordSentAt')
      .comment('Reset Password Token Sent At TimeStamp');

    // Role
    table
      .enu('role', Constants.USER.ROLE, {
        useNative: true,
        enumName: 'UserRole',
      })
      .notNullable()
      .defaultTo('user')
      .comment('User Role');

    // TimeStamps
    table.boolean('isActive').notNullable().defaultTo(true).comment('Active?');
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
  });
  console.log('Created Table: User');

  /**
Table:  SocialLogin
Purpose: Store User's Social Logins
*/
  await knex.schema
    .createTable('SocialLogin', table => {
      table.increments('id').primary();
      table
        .integer('userId')
        .notNullable()
        .references('User.id')
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
      console.log('Created Table: SocialLogin table');
      return knex.schema.raw(
        'CREATE UNIQUE INDEX "SocialLogin_cred_idx" ON "SocialLogin" ("providerId", "provider") WHERE "isActive" = true',
      );
    });
  console.log('Created Table: SocialLogin');

  /**
 Table:  PromoCode
 */
  await knex.schema.createTable('PromoCode', table => {
    table.increments('id').primary();
    table
      .string('code')
      .index()
      .notNullable()
      .comment('Promo Code in uppercase alphanumeric');
    table
      .boolean('isDiscountPercentage')
      .notNullable()
      .comment('Is Discount Percentage?');
    table.integer('discountValue').notNullable().comment('Discount Value');
    table.string('validityStartDateTime').comment('Validity Start Time');
    table.string('validityEndDateTime').comment('Validity End Time');
    table
      .timestamp('validityStartDateTimeTZ')
      .comment('Validity Start Time with Timezone');
    table
      .timestamp('validityEndDateTimeTZ')
      .comment('Validity End Time with Timezone');
    table
      .boolean('isOneTimePerGuest')
      .notNullable()
      .comment('Is One Time Per Guest?');
    table.varchar('note', 2000).comment('Note');

    // TimeStamps
    table.boolean('isActive').notNullable().defaultTo(true).comment('Active?');
    table.timestamp('createdAt').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updatedAt').notNullable().defaultTo(knex.fn.now());
  });
  console.log('Created Table: PromoCode');
};

exports.down = async knex => {
  try {
    await knex.raw('DROP TABLE IF EXISTS "SocialLogin" CASCADE;');
    await knex.raw('DROP TABLE IF EXISTS "User" CASCADE;');
    await knex.raw('DROP TYPE IF EXISTS "UserRole" CASCADE;');
    await knex.raw('TRUNCATE TABLE "knex_migrations_lock" RESTART IDENTITY;');
    await knex.raw('TRUNCATE TABLE "knex_migrations" RESTART IDENTITY;');
    await knex.raw('DROP TABLE IF EXISTS "PromoCode" CASCADE;');
    console.log('Dropped everything');
  } catch (err) {
    console.log('Failed to rollback: ', err);
  }
};

/*

Execute the following query to drop all the tables, types, etc in the public schema

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

*/
