# Liftoff Jumpstart Server Kit v1.0
Aimed to provide Jumpstart Server for building REST APIs.

## Packages Used
|Package|Purpose|Desc| 
| :--- | :--- | :--- |
|Node.js|Node Env|use 6.9.1; and use nvm for node version management| 
|Babel|Babelify code|-| 
|Hapi.js|Server logic|-| 
|Objection.js/Knex|ORM Framework|-|
|newrelic|Monitoring|-|
|Node Mailer|Mail Delivery|-|
|Nes|Socket Notification|-|
|kue|Worker/Job Management|-|
|Redis|Caching; Worker Jobs Management (for kue)|-|
|Lodash|commons utility|-|
|Postgres|default database connector|-|
|Eslint|Check Eslint Issues|-|
|PM2|Process management utility to start/stop server|-|

## Project Setup

Clone -> Change Configurations. replace XXX
use yarn for predictability.

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

## Writing APIs
	### Permissions

	### Authorization

	### Models
	1. Entity Filtering
	2. Stats generation
	3. isActive + timestamps in all models
	4. 

	### Fail-Fast
		- Wrong Config for email/database will fail

	### Gotchas
		1. polymorphic association
		2. paging for inner associations.

## Adding Permissions

## Worker Threads

## Socket Notifications
	Simple Use-case - Use Nes.
	Complicated - Use custom implementation

## Re-usable coding 
	create modules

## Pending Items
	[ ] Generic model, crud api generator
	[ ] extract mails into modules.
	[ ] rsync to identify the change-sets
	[ ] i18n support
	[ ] elaborate on caching for performance
	[ ] rate-limit feature
	[ ] standardize error codes

## Contribute back
	[ ] create an issue, pull request, review and merge.
	[ ] increment version
	[ ] Teams to provide their product name so that we can inform about any updates.

