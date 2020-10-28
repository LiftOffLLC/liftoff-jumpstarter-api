# LiftOff Jumpstarter REST API Server Kit v2.1.1

Aimed to provide Jumpstarter Server Kit for building REST APIs.

## When pulling changes while collaborating using git,

- If the `yarn.lock` was changed, run `yarn`
- If `.example.env` was changed, run `yarn env`
- If `DB_RECREATE` is `true`; after running `yarn dev`, set it to `false` to prevent migration on every dev run

**NOTE**: Not following any one of the above steps will make the environment inconsistent for further development

## Packages Used

| Package           | Purpose                                         |
| :---------------- | :---------------------------------------------- |
| Node.js           | Node Environment                                |
| Hapi.js           | Server logic                                    |
| Objection.js/Knex | ORM Framework                                   |
| newrelic          | Monitoring                                      |
| Node Mailer       | Mail Delivery                                   |
| Nes               | Socket Notification                             |
| Bull              | Worker/Job Management                           |
| Redis             | Caching; Worker Jobs Management (for Bull)      |
| Lodash            | commons utility                                 |
| Postgres          | default database connector                      |
| Eslint            | Check Eslint Issues                             |
| Prettier          | Code Formatting                                 |
| PM2               | Process management utility to start/stop server |
| Jest              | Testing Framework                               |

## Project Setup

1. Download the latest zip file or clone the repo with depth=1 using below command -  
   `git clone --depth=1 git@github.com:LiftOffLLC/liftoff-jumpstarter-api.git`
2. Install nvm for node version management and install node v12
3. Install PostgreSQL and create databases `jumpstarter` and `jumpstarter_test`
4. Install Redis
5. Modify the config details  
   5.1 Copy `.example.env` as `.env.development`, `.env.test`, etc files in project folder and modify the relevant properties for the project  
    5.1.1. Database Config  
    5.1.2. Redis Config (Login auth tokens are stored)  
    5.1.3. JWT Tokens (Secret Key), etc.  
   5.2. Fix `config/default.js`  
   5.3. Fix `plugins/hapi-swagger.js` for swagger documentation  
   5.4. Fix `plugins/status-monitor.js` for monitoring
6. Run `yarn` to install all the dependencies.
7. Migrate and seed the database using `NODE_ENV=development yarn migrate`
8. Run `yarn dev` to start the server in `dev` environment

## Pulling changes from Jumpstarter repository into your project's repository

This will merge Jumpstarter into your project, thereby merging the features added into Jumpstarter after you cloned from Jumpstarter. It will also enable you to pull changes from Jumpstarter in the future.  
**NOTE**: You will probably run into a lot of merge conflicts and breaking changes including but not limited to- renamed/moved/deleted files, renamed/deleted variables, updated database schema, etc. Manually select the changes you want to keep and discard the remaining changes. Preferably keep as many new changes as you can because the future changes will be based on these changes. Use this functionality carefully!

#### A) Pulling changes for the first time

1. Set Jumpstarter as a remote in your project  
   `git remote add jumpstarter https://github.com/LiftOffLLC/liftoff-jumpstarter-api.git`
2. Configure push URL as some invalid URL to prevent pushing to Jumpstarter repository by mistake  
   `git config remote.jumpstarter.pushurl invalid-url`
3. Pull latest changes from Jumpstarter master into your repository's current branch  
   `git pull --allow-unrelated-histories jumpstarter master`

#### B) Pulling changes next time onwards

`git pull jumpstarter master`

## Pushing changes from your project's repository into Jumpstarter repository

Don't. Make those changes in Jumpstarter instead.

## Project Practices

#### Environment files

`yarn env:create` -- to create `bin/env.sh`  
`yarn env` -- to run `bin/env.sh`
**Note**: Update `bin/env.sh` as per your requirements

#### Code Formatting and Linting

`yarn format` -- to format the code  
`yarn lint:nofix` -- to Check lint issues  
`yarn lint` -- to fix possible lint issues  
`yarn inspect` -- to Detect copied code

#### Testing

`yarn test:nme` -- to run test cases with verbose logs without migrate without force exit  
`yarn test:ne` -- to run test cases with verbose logs with migrate without force exit  
`yarn test:nm` -- to run test cases with verbose logs without migrate with force exit  
`yarn test` -- to run test cases with verbose logs with migrate with force exit  
`yarn test:silent` -- to run test cases without verbose logs

**Note**: `test` environment uses a separate database `jumpstarter_test` and does not affect `dev` environment

#### Database Related Scripts

`yarn knex migrate:rollback` -- to rollback database migration  
`yarn knex migrate:latest` -- to apply database migration  
`yarn knex seed:run` -- to run the seed data  
`yarn migrate` -- to run all of the above in the same order

**Note**: To migrate an environment other than development, pass `NODE_ENV` to the process  
e.g. `NODE_ENV=test yarn migrate`

#### Running Dev Server

`yarn dev` -- to run the development server; also watches the files using nodemon; also runs worker.  
`yarn worker` -- to run the worker thread

#### Running Prod Server

`yarn` to install all the dependencies  
`yarn start` will stop all the running processes and start the server; No need of Procfile if running only the server.

## Folder Convention

Source Code is located at `src/main` and test code in `src/test`

```
/app
	/bootstrap --> contains bootstrap logic; *DO NOT TOUCH*
	/commons --> common logic; better to create re-usable components and move to /modules director
	/controllers --> controller per file
	/methods --> server methods; to decorate server.
	/models --> database model
	/plugins --> HAPI plugins
	/policies --> policies
	/schedulers --> schedulers files; comes handy when deploying on heroku scheduler.
	/workers --> worker files; dot notation is used to bucket the worker
/config --> configuration file;
/database
  /migrations --> migrations files
  /seeds/master --> seed data; can be extended per env; but needs to be changed in config file
/modules --> common reusable modules
/public --> all the files needed for public view
```

## Understanding APIs

1. Each API is written in separate file in /controllers folder.
2. While bootstrapping the server
   - routes are built by scanning all the files in /controllers folder
   - methods are dynamically decorated for server/request and are picked from /methods folder.
   - plugins are added to Hapi server, which give additional functionality like logging, listing all apis, monitoring server status, auth, etc.
   - policies are applied to each api. basically, used to control the data flow right from request to post-response. more details can be found at MrHorse project. The use cases are checking the permission, controlling the response, forcing https, etc.

#### Sample Read API

```js
const options = {
  auth: Constants.AUTH.ADMIN_ONLY,
  description: 'Config Details - Access - admin',
  tags: ['api'],
  validate: {
    params: Joi.object({
      userId: Joi.number().integer().positive().description('User Id'),
    }),
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201]),
    },
    policies: [isAuthorized('params.userId')],
  },
  handler: async (request, h) => Config.toJS(),
};

// eslint-disable-next-line no-unused-vars
const handler = server => {
  const details = {
    method: ['GET'],
    path: '/api/appinfo/{userId}',
    config: options,
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler,
};
```

Details:

```js
{
  enabled: true,
  operation: handler
}
```

Each API must return these two fields - enabled (if true, will be exposed) and operation handler. operation handler must return the following details

- **method** - can be an array of HTTP Methods.
- **path** - api path.
- **config** - discussed below.

```js
  auth: Constants.AUTH.ADMIN_ONLY,
```

By default, the framework has 3 roles - guest, user and admin. Each controller needs to be auth configured as per the access level.  
Available options are: `ALL, ADMIN_ONLY, ADMIN_OR_USER and ADMIN_OR_USER_OR_GUEST`. Avoid using `ALL` Access level, use `ADMIN_OR_USER_OR_GUEST` instead.

```js
	description: 'Config Details - Access - admin',
	tags: ['api'],
```

description and tags are used foe swagger doc generation.  
**NOTE**: tags must have `api` for this router to be listed under swagger.

```js
  validate: {
    params: Joi.object({
      userId: Joi.number().integer().positive().description('User Id')
    })
  },
```

Validating the payload, param or query. Uses Joi library for validation.
**NOTE** validation payloads must be wrapped inside a Joi object post Joi v16

The following options can be used inside the validate block, to strip unknown fields. **NOTE:** Avoid Using it.

```js
options: {
      allowUnknown: true,
      stripUnknown: true
    },
```

Plugins add values to hapi framework. In this sample, we build the responses for swagger using hapi-swagger plugin.

```js
	plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201])
    },
    policies: [
      isAuthorized('params.userId')
    ]
  },
```

Policies can be used to in handling the pre- and post- operations.
Modifying the request, response, validating roles, etc. Hapi provides various lifecycle methods, which can be used for controlling the flow. More details can be found at Mr.Horse project page.

```js
handler: async (request, h) => Config.toJS();
```

**NOTE** reply callback has been removed post hapi v17. return the response directly from the handler.

### Models

Each model has to subclassed from BaseModel. Refer Objection.js/Knex for usage. Each model to have three fields `createdAt`, `updatedAt` and `isActive`. `isActive` is for tracking deleted flags.

#### Hooks

`$beforeInsert`, `$beforeUpdate`, `$afterGet`, `$validateHook` are the methods wired. These methods can be used to override default logic, like triggering events at model level.

#### Utility Methods

`buildCriteriaWithObject` and `buildCriteria` are used to build query criteria object.

`entityFilteringScope` is for defining the fields that can be displayed/hidden for a given role. The policy `entityFilter` does the filtering on postHandler event.

```js
static entityFilteringScope() {
    return {
      admin: ['hashedPassword'], // fields hidden from admin
      user: ['phoneToken', 'isPhoneVerified'], // fields hidden from user role.
      guest: ['resetPasswordToken', 'resetPasswordSentAt','socialLogins'] // fields hidden from user role.
      // guest: 'all' -- Optionally this array be also be 'all' to hide all the fields from this model.
    };
  }
```

#### Validation Rules

Uses Joi Framework to define the rules. Refer User model for sample implementation.  
As a practice, define all the validation rules in models, instead of controller for better re-use.

#### CRUD Methods

Checkout Read API in /commons folder for usage. The following are the methods exposed from base -  
`createOrUpdate(model, fetchById = true, trx)`,  
`count(filters = {})`,  
`findOne(filters = {}, options = {})`,  
`findAll(filters = {}, options = {})`,  
`deleteAll(filters = {}, hardDeleteFlag = true, trx)`

### Gotchas

1. Polymorphic association
2. Paging for inner associations

## Fail-Fast Approach

- Wrong Config for email/database will fail

## Adding Permissions

## Worker Threads

## Nodemailer

The mailer implementation in `src/main/app/commons/mailer.js` is purposely left blank. Update this file as per your email service provider's sdk

## Socket Notifications

- Simple Use-case - Use Nes.
- Complicated - Use custom implementation

## Re-usable coding

create modules

## Code Formatting and Linting

- Use prettier and delete any other plugins which may conflict with the rules.
- Refer to the eslintrc and prettierrc for lint and formatting rules.
- Uses husky and lint-staged in combination to lint staged files before committing. Fix lint errors before committing. **NOTE** Do not force commit

## Pending Items

1. Generalize social.js to pull send standardized output.
2. Document Preparation Guide for Jumpstarter  
   a. create .env file and modify accordingly.  
   b. versioning header/ plugins/hapi-swagger.js  
   c. status monitoring tool / plugins.status-monitor.js
3. Generalize error codes and better error schema for response.  
   a. i18n - internalization support (low)  
   b. format error code.  
   c. externalize error messages use error_codes.  
    message_utility('user.not.found', {id: userId}, opts="lang-en")
4. Database Issues (caveats)  
   a. cannot use nested property for filter.  
   b. pagination/ordering doesn't work for inner associations.  
   c. polymorphic associations issue.  
   d. caching responses.
5. Chat server Jumpstarter kit
6. Microservices support  
   a. create microservices for pdf generation; image upload; image transformation.
7. Need elaboration on how to cache responses.
8. Rate-limit for critical apis. like login/signup.
9.  Docker image and deployment steps for aws.
10. Strict header versioning check for vendor-specific headers.
11. Generic CRUD for all models. Scaffolding.
12. APIs to support unique constraints in path /userIdOruserName/update
13. Update dependencies and yarn lock file regularly.
14. Pass server context in all hapi plugins.
15. Extract error Handler plugin to plugins folder (depends on 14).

## Contribute back

[ ] Create an issue, submit PR for review and once reviewed, will be merged into the master branch.  
[ ] Increment version  
[ ] Teams to provide their product name so that they can inform about updates.
