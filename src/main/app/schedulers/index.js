const _ = require('lodash');
const requireDirs = require('require-dir');
const Queue = require('bull');
const Logger = require('../commons/logger');

class Scheduler {
  /**
   * Initialize the Queue
   * @param Array config
   */
  async initQueue(config) {
    this.queue = new Queue(config.prefix, { redis: config.redis });
    this.loadEnabledJobs();
    await this.registerHandlers();
    this.registerEventListeners();
  }

  /**
   * Parse and register all enabled jobs from `../workers` directory.
   */
  loadEnabledJobs() {
    Logger.info('Loading scheduled jobs');
    const jobs = requireDirs('./jobs');
    const enabledJobs = _.filter(jobs, ['enabled', true]);
    this.jobs = enabledJobs;
    Logger.info(`${this.jobs.length} scheduled job(s) loaded`);
  }

  async registerHandlers() {
    const currentCrons = await this.queue.getRepeatableJobs();
    Logger.info(':::: Cron Jobs Running Currently:::: ', currentCrons);
    Logger.info(`Purging ${currentCrons.length} scheduled tasks`);
    await Promise.all(
      currentCrons.map(job => this.queue.removeRepeatableByKey(job.key)),
    );

    await Promise.all(
      this.jobs.map(_job => {
        const jobName = `scheduler.${_job.name}`;
        this.queue.process(jobName, _job.handler);
        Logger.info(`Registering scheduled Job ${jobName}`);
        /**
         * Job Configurations.
         */
        const options = _job.options || {};
        options.removeOnComplete = true;
        return this.queue.add(jobName, {}, options);
      }),
    );

    Logger.info(
      ':::: Cron Jobs  Post New Additions:::: ',
      await this.queue.getRepeatableJobs(),
    );
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
}

module.exports = new Scheduler();
