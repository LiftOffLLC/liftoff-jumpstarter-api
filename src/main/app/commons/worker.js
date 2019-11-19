const _ = require('lodash');
const requireDirs = require('require-dir');
const Queue = require('bull');
const Logger = require('./logger');
const Config = require('../../config');

class Worker {
  constructor() {
    const config = Config.get('worker').toJS();
    /**
     * Initialize the Queue
     */
    this.initQueue(config);

    /**
     * Uncomment the below code to test the test job.
     */
    // this.addJob(
    //   'test',
    //   {
    //     foo: 'bar',
    //     baz: {
    //       'customer name': 'Bull',
    //       baz: 'tk',
    //     },
    //   },
    //   { delay: 1000 * 10 },
    // );
  }

  /**
   * Initialize the Queue
   * @param Array config
   */
  initQueue(config) {
    this.queue = new Queue(config.prefix, { redis: config.redis });
    this.registerEnabledJobs();
    this.registerHandlers();
    this.registerEventListeners();
  }

  /**
   * Parse and register all enabled jobs from `../workers` directory.
   */
  registerEnabledJobs() {
    Logger.info('Registering jobs');
    const jobs = requireDirs('../workers');
    const enabledJobs = _.filter(jobs, ['enabled', true]);
    this.jobs = enabledJobs;
    Logger.info('%d job(s) registered', this.jobs.length);
  }

  /**
   * Register job handler.
   */
  registerHandlers() {
    _.each(this.jobs, job => {
      this.queue.process(job.name, job.handler);
    });
  }

  /**
   * Register various queue event listeners.
   */
  registerEventListeners() {
    this.queue.on('completed', job => {
      Logger.info(`Job Completed = ${job.name}`);
    });

    this.queue.on('failed', (job, error) => {
      Logger.error(`Job Failed = ${job.name} with ${error}`);
    });
  }

  /**
   * To reduce redis instance consumption, job is sheduled to run by parent name
   * parent name will be splited from worker name
   *  eg: woeker name : 'email.sendCampaignMessage' , job will be email
   * worker name should be choosen wisely by considerining the curcurrnecy issues.
   */
  addJob(name, data, jobOptions = {}) {
    Logger.info(`Registering Job ${name}`);
    Logger.info(data);

    if (!this.jobs || !_.some(this.jobs, _.zipObject(['name'], [name]))) {
      throw new Error(`Unknown job '${name}', Verify job enabled or not`);
    }

    const currentJob = _.filter(this.jobs, ['name', name])[0];
    data._name = name; // eslint-disable-line no-underscore-dangle,no-param-reassign

    /**
     * Job Configurations.
     */
    let options = currentJob.options || {};
    options = { ...options, ...jobOptions };
    options.removeOnComplete = true;
    this.queue.add(name, data, options);
  }

  // eslint-disable-next-line class-methods-use-this
  listen() {
    Logger.info('Worker Started, Listening Queues');
  }

  handleJob(job, done) {
    const { data } = job;
    Logger.info('HandleJob job', data);
    const currentJob = _.filter(this.jobs, ['name', data._name])[0]; // eslint-disable-line no-underscore-dangle
    if (typeof currentJob.handler !== 'function') {
      Logger.error('No Handler found for particular job');
      return done(new Error('Unknown job'));
    }
    return currentJob.handler(job, done);
  }
}

module.exports = new Worker();
