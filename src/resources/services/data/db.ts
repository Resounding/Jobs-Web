import {EventAggregator} from 'aurelia-event-aggregator';
import {autoinject} from 'aurelia-framework';
import {Job, JobDocument} from '../../models/job';
import {Configuration} from '../config';
import {log} from '../log';
import {Authentication} from '../auth';

let localDB: PouchDB = null;
let remoteDB: PouchDB = null;

@autoinject()
export class Database {
  constructor(private auth: Authentication, private config: Configuration, private events: EventAggregator) {
    this.init();
    this.events.subscribe(Authentication.AuthenticatedEvent, this.init.bind(this));
  }

  init() {
    if (localDB === null) {
      localDB = new PouchDB(this.config.app_database_name);
    }

    if (this.auth.isAuthenticated()) {
      const userInfo = this.auth.userInfo(),
        headers = {Authorization: userInfo.basicAuth}
      remoteDB = new PouchDB(this.config.remote_database_name, {
        skip_setup: true,
        auth: {username: userInfo.name, password: userInfo.password}
      });
      localDB.sync(remoteDB, {live: true})
        .on('complete', () => {
          log.debug('Sync complete');
        })
        .on('error', err => {
          log.error('Sync error');
          log.error(err);
        })
        .on('change', change => {
          log.info('Sync change');
          log.debug(change);
          if(change.direction === 'pull') {
            if(_.isArray(change.change.docs)){
              change.change.docs.forEach(doc => {
                if(doc.type === JobDocument.DOCUMENT_TYPE) {
                  const job = new JobDocument(doc);
                  this.events.publish(Database.SyncChangeEvent, job);
                }
              })
            }
          }

        }).on('paused', info => {
        log.info('Sync pause');
        log.debug(info);
      }).on('active', info => {
        log.info('Sync active');
        log.debug(info);
      });
    }
  }

  destroy(): Promise<any> {
    return localDB.destroy()
      .then(this.init.bind(this));
  }

  nextJobNumber(): Promise<string> {
    return new Promise((resolve, reject) => {
      localDB.find<Job>({
        selector: {type: JobDocument.DOCUMENT_TYPE},
        fields: ['number']
      })
        .then(rows => {
          log.debug(rows);
          const nextNumber: number = rows.docs.reduce((memo, job) => {
              var number = parseInt(job.number);
              if (!isNaN(number) && number > memo) memo = number;
              return memo;
            }, 0) + 1;

          //http://stackoverflow.com/a/10073761
          const formattedNumber: string = nextNumber < 99999 ? `0000${nextNumber}`.slice(-5) : nextNumber.toString();
          resolve(formattedNumber);
        })
        .catch(reject);
    });
  }

  get db() {
    return localDB;
  }

  static SyncChangeEvent:string = 'SyncChangeEvent';
}