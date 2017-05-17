# wb4server
Liftoff Jumpstart v1.0 for REST APIs

## Project Setup

Clone -> Change Configurations. replace XXX
use yarn for predictability.


## Convention Used
	models
	plugins
	schedulers
	policies
	views
	workers - dot operator to separate bucket and job.

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

