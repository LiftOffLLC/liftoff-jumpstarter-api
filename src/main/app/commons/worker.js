import kue from 'kue';
import _ from 'lodash';
import requireDirs from 'require-dir';
import Logger from 'winston';
import Config from '../../config';

class Worker {
  constructor() {
    const workerConfig = Config.get('worker').toJS();
    this.queue = kue.createQueue(workerConfig);
    this.queue.on('error', err => Logger.info('queue.constructor - JOBWORKER :: ERROR:: ', err));
    this.registerJobs();
  }

  registerJobs() {
    // Read and assign all enabled jobs from ../workers
    Logger.info('Registering jobs');
    const jobs = requireDirs('../workers');
    const enabledJobs = _.filter(jobs, ['enabled', true]);
    this.jobs = enabledJobs;
    Logger.info('%d job(s) registered', this.jobs.length);
  }

  /**
   * To reduce redis instance consumption, job is sheduled to run by parent name
   * parent name will be splited from worker name
   *  eg: woeker name : 'email.sendCampaignMessage' , job will be email
   * worker name should be choosen wisely by considerining the curcurrnecy issues.
   */
  addJob(name, data) {
    Logger.info('Worker Job Create:', name, ', data: ', data);
    if (!this.jobs || !_.some(this.jobs, _.zipObject(['name'], [name]))) {
      throw new Error('Unknown job, Verify job enabled or not');
    }

    const jobName = _.split(name, '.', 1);
    Logger.info('Worker Job, split nae actual=%s, parent=%s', name, jobName);
    data._name = name; // eslint-disable-line no-underscore-dangle,no-param-reassign

    const job = this.queue.create(jobName, data);
    job.priority(data.priority || 'low');
    job.attempts(data.attempts || 5);
    job.removeOnComplete(true);

    job.on('complete', () => Logger.info(`Create job ${name} success`));
    job.on('failed attempt', (err, attempts) => Logger.error(`Create job ${name} failed ${err} ${attempts} times`));
    job.on('failed', err => Logger.error(`Create job ${name} failed ${err}`));

    job.save();
  }

  processJobs() {
    /** Background worker will call this method to run jobs */
    const jobNames = _.map(this.jobs, job => _.split(job.name, '.', 1)[0]);
    Logger.info('Processing jobs', jobNames);
    _.each(jobNames, jobName => this.queue.process(jobName, this.handleJob.bind(this)));
  }

  handleJob(job, done) {
    const data = job.data;
    Logger.info('HandleJob job', data);
    const currentJob = _.filter(this.jobs, ['name', data._name])[0]; // eslint-disable-line no-underscore-dangle
    if (typeof currentJob.handler !== 'function') {
      Logger.error('No Handler found for particular job');
      return done(new Error('Unknown job'));
    }
    return currentJob.handler(job, done);
  }
}

export default new Worker();
