
# Liftoff Jumpstart Server Kit v1.0
Aimed to provide jumpstart kit for building REST APIs.

## Packages Used
|Package|Purpose|
| :--- | :--- |
|Node.js|Node Env; use 6.9.1; and use nvm for node version management| 
|Babel|Babelify code|
|Hapi.js|Server logic|
|Objection.js/Knex|ORM Framework|
|newrelic|Monitoring|
|Node Mailer|Mail Delivery|
|Nes|Socket Notification|
|kue|Worker/Job Management|
|Redis|Caching; Worker Jobs Management (for kue)|
|Lodash|commons utility|
|Postgres|default database connector|
|Eslint|Check Eslint Issues|
|PM2|Process management utility to start/stop server|

## Project Setup
1. Download the latest zip file or clone the repo with depth=1
2. Modify the config details  
2.1. newrelic key  
2.2. database details  
2.3. redis details  
2.4. mail configurations, etc.   
3. After adding your project dependencies, use `yarn install` to lock dependencies.  

## Project Practices
#### Code Formating and Linting
`$:> npm run format`  -- to format the code  
`$:> npm run lint`  -- to Check lint issues  
`$:> npm run inspect`  -- to Detect copied code  
`$:> npm run test`  -- to run test cases  
#### Database Related Scripts  
`$:> npm run db:migrate`  -- to apply database migration  
`$:> npm run db:rollback`  -- to rollback database migration  
`$:> npm run db:seed`  -- to run the seed data  
#### Running Dev Server  
`$:> npm run dev`  -- to run the development server; also watches   the files using nodemon; also runs worker.  
`$:> npm run worker`  -- to run the worker thread  
#### Running Prod Server on Heroku.  
`$:> yarn install` to lock all the dependencies  
`$:> npm start` will stop all the running processes and start the server; No need of Procfile if running only the server.  

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
	/schedulers --> schedulers files; comes handy when deploying on heroku scheduler.
	/views --> mail and pdf templates
		/mail-templates
		/pdf-templates
	/workers --> worker files; dot notation is used to bucket the worker
/config --> configuration file; 
/migrations --> migrations files
/modules --> common reusable modules
/public --> all the files needed for public view
/seeds/master --> seed data; can be extended per env; but needs to be changed in config file
```



## Understanding APIs  
1. Each API is written in separate file in /controllers folder.
2. During bootstraping the server  
	* routes are build by scanning all the files in /controllers folder
	* methods are dynamically decorated for server/request and are picked from /methods folder.
	* plugins are added to Hapi server, which give additional functionality like logging, listing all apis, monitoring server status, auth, etc.  
	* policies are applied to each api. basically, used to control the data flow right from request to post-response. more details can be found at MrHorse project. The use cases are checking the permission, controlling the response, forcing https, etc.  

#### Sample Read API  
```node
const options = {
  auth: Constants.AUTH.ADMIN_ONLY,
  description: 'Config Details - Access - ADMIN',
  tags: ['api'],
  validate: {
    params: {
      userId: Joi.number().integer().positive().description('User Id')
    }
  },
  plugins: {
    'hapi-swagger': {
      responses: _.omit(Constants.API_STATUS_CODES, [201])
    },
    policies: [
      isAuthorized('params.userId')
    ]
  },
  handler: async(request, reply) => reply(Config.toJS())
};

// eslint-disable-next-line no-unused-vars
const handler = (server) => {
  const details = {
    method: ['GET'],
    path: '/api/appinfo/{userId}',
    config: options
  };
  return details;
};

module.exports = {
  enabled: true,
  operation: handler
};
```

Details:  

```node
{
  enabled: true,
  operation: handler
}
```  

Each API must return these two fields - enabled (if true, will be exposed) and operation handler. operation handler must return the following details  

* **method** - can be an array of HTTP Methods.  
* **path** - api path.  
* **config** - discussed below.   


```node
  auth: Constants.AUTH.ADMIN_ONLY,
```  
By default, the framework has 3 roles - guest, user and admin. Each controller needs to be auth configured as per the access level.     
Available options are: ```ALL, ADMIN_ONLY, ADMIN_OR_USER and ADMIN_OR_USER_OR_GUEST```. Avoid using ```ALL``` Access level, use ```ADMIN_OR_USER_OR_GUEST``` instead.     


```node
	description: 'Config Details - Access - ADMIN',
	tags: ['api'],
```
description and tags are used foe swagger doc generation.  
**NOTE**: tags must have ```api``` for this router to be listed under swagger.

```node
  validate: {
    params: {
      userId: Joi.number().integer().positive().description('User Id')
    }
  },
```
Validating the payload, param or query. Uses Joi library for validation.  

The following options can be used inside the validate block, to strip unknown fields. **NOTE:** Avoid Using it.  

```node
options: {
      allowUnknown: true,
      stripUnknown: true
    },
```  

Plugins add values to hapi framework. In this sample, we build the responses for swagger using hapi-swagger plugin.      

```node
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
 

```node
	handler: async(request, reply) => reply(Config.toJS())
```
Business logic, which returns the response. use ```reply``` for sending the response.  

### Models  
Each model has to subclassed from BaseModel. Refer Objection.js/Knex for usage. Each model to have three fields `createdAt`, `updatedAt` and `isActive`. `isActive` is for tracking deleted flags.  

#### Hooks
`$beforeInsert`, `$beforeUpdate`, `$afterGet`, `$validateHook` are the methods wired. These methods can be used to override default logic, like triggering events at model level.

#### Utility Methods
`buildCriteriaWithObject` and `buildCriteria` are used to build query criteria object.  

`entityFilteringScope` is for defining the fields that can be displayed/hidden for a given role. The policy `entityFilter` does the filtering on postHandler event.   

```node
static entityFilteringScope() {
    return {
      admin: ['encryptedPassword', 'passwordSalt'], // fields hidden from admin
      user: ['phoneToken', 'isPhoneVerified'
      ], // fields hidden from user role.
      guest: ['resetPasswordToken', 'resetPasswordSentAt',
        'socialLogins'
      ] // fields hidden from user role. 
      // guest: 'all' -- Optionally this array be also be 'all' to hide all the fields from this model.
    };
  }
```  

#### Validation Rules
Uses Joi Framework to define the rules. Refer User model for sample implementation.  
As a practice, define all the validation rules in models, instead of controller for better re-use.  

#### CRUD Methods
Checkout Read API in /commons folder for usage. The following are the methods exposed from base -   
`createOrUpdate(model, fetchById = true)`,   
`count(filters = {})`,   
`findOne(filters = {}, options = {})`,  
`findAll(filters = {}, options = {})`,   
`deleteAll(filters = {}, hardDeleteFlag = true)`  

### Gotchas
1. polymorphic association  
2. paging for inner associations  

## Fail-Fast Approach
- Wrong Config for email/database will fail  
		
## Adding Permissions

## Worker Threads

## Socket Notifications
* Simple Use-case - Use Nes.
* Complicated - Use custom implementation

## Re-usable coding 
create modules

## Pending Items
- [ ] Generic model, crud api generator
- [ ] extract mails into modules.
- [ ] rsync to identify the change-sets
- [ ] i18n support
- [ ] elaborate on caching for performance
- [ ] rate-limit feature - https://developer.github.com/v3/#rate-limiting
- [ ] standardize error codes
- [ ] Docker Image
- [ ] dotenv for easy deployment

## Contribute back
[ ] create an issue, submit PR for review and once reviewed, will be merged into the master branch.
[ ] increment version  
[ ] Teams to provide their product name so that they can inform about updates.

