const _ = require('lodash');
const requireDirs = require('require-directory');
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
    const jobs = requireDirs(module, '../workers');
    const enabledJobs = _.filter(jobs, ['enabled', true]);
    this.jobs = enabledJobs;
    Logger.info(`${this.jobs.length} job(s) registered`);
  }

  /**
   * Register job handler.
   */
  registerHandlers() {
    // eslint-disable-next-line prefer-const
    let registeredJobs = {};
    _.each(this.jobs, _job => {
      let job = _.split(_job.name, '.', 1);
      job = _.first(job);
      /**
       * register only non registered jobs.
       */
      if (!_.has(registeredJobs, job)) {
        this.queue.process(job, this.dispatchJobToHandler.bind(this));
        registeredJobs[job] = true;
      }
    });
  }

  /**
   * Register various queue event listeners.
   */
  registerEventListeners() {
    this.queue.on('completed', (job, result) => {
      Logger.info(`Job Completed = ${job.name}`, result);
    });

    this.queue.on('failed', (job, error) => {
      Logger.error(`Job Failed = ${job.name} with ${error}`);
    });

    this.queue.on('waiting', jobId => {
      Logger.info(`Job Waiting = ${jobId}`);
    });

    this.queue.on('active', job => {
      Logger.info(`Job Active = ${job.name}`);
    });

    this.queue.on('stalled', job => {
      Logger.info(`Job Stalled = ${job.name}`);
    });
  }

  /**
   * Dispatch job to actual handler.
   * @param {*} job
   * @param {*} done
   */
  dispatchJobToHandler(job, done) {
    let worker = null;

    _.each(this.jobs, availableJob => {
      if (availableJob.name === job.data._name) {
        worker = availableJob;
      }
    });

    return worker.handler(job, done);
  }

  /**
   * To reduce redis instance consumption, job is scheduled to run by parent name
   * parent name will be splitted from worker name
   * eg: worker name : 'email.sendCampaignMessage' , job will be email
   * worker name should be chosen wisely by considering the concurrency issues.
   */
  async addJob(name, data = {}, jobOptions = {}) {
    Logger.info(`Registering Job ${name}`);
    Logger.info(data);

    if (!this.jobs || !_.some(this.jobs, _.zipObject(['name'], [name]))) {
      throw new Error(`Unknown job '${name}', Verify job enabled or not`);
    }

    if (Config.get('env') === 'test') {
      Logger.info(`Test environment:: Not Adding Job ${name} to Queue`);
      return {};
    }

    const currentJob = _.find(this.jobs, ['name', name]);
    data._name = name; // eslint-disable-line no-underscore-dangle,no-param-reassign
    let jobName = _.split(name, '.', 1);
    jobName = _.first(jobName);

    /**
     * Job Configurations.
     */
    let options = currentJob.options || {};
    options = { ...options, ...jobOptions };
    options.removeOnComplete = true;
    return await this.queue.add(jobName, data, options);
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

  /**
   * Stop the worker by shutting down the queue gracefully.
   * Required for exiting after tests
   */
  async stop() {
    await this.queue.close();
    Logger.info('Worker Stopped');
  }
}

module.exports = new Worker();
