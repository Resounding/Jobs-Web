import {Parent} from 'aurelia-dependency-injection';
import {EventAggregator} from 'aurelia-event-aggregator';
import {autoinject} from 'aurelia-framework';
import * as _ from 'underscore';
import {Job, JobDocument} from '../../models/job';
import {Configuration} from '../config';
import {log} from '../log';
import {Authentication} from '../auth';
import {Notifications} from '../notifications';
import {PouchSyncOptions} from "../../../../custom_typings/pouchdb-find";
import DatabaseConfiguration = PouchDB.Configuration.DatabaseConfiguration;
import { JobPhaseDoc } from '../../models/job-phase';

let localDB: PouchDB.Database = null;
let remoteDB: PouchDB.Database = null;

@autoinject()
export class Database {
  constructor(private auth: Authentication, private config: Configuration, private events: EventAggregator) {
    this.init();
    this.events.subscribe(Authentication.AuthenticatedEvent, this.init.bind(this));
  }

  init(localOps?:DatabaseConfiguration, remoteOps?:DatabaseConfiguration) {
    if (localDB === null) {
      if(localOps) {
        localDB = new PouchDB(this.config.app_database_name, localOps);
      } else {
        localDB = new PouchDB(this.config.app_database_name);
      }
      localDB.getIndexes()
        .then(indexes => {
          const names = _.pluck(indexes.indexes, 'name');
          if(names.indexOf('by_type_name') === -1) {
            localDB.createIndex({              
              index: {
                name: 'by_type_name',
                fields: ['type', 'name']
              }
            }).then(result => {
              log.debug(result);
            }).catch(error => {
              log.error(error);
            });
          }

          if(names.indexOf('by_type_deleted') === -1) {
            localDB.createIndex({              
              index: {
                name: 'by_type_deleted',
                fields: ['type', 'deleted']
              }
            }).then(result => {
              log.debug(result);
            }).catch(error => {
              log.error(error);
            });
          }
        });
    }

    if (this.auth.isAuthenticated()) {
      const userInfo = this.auth.userInfo(),
        headers = {Authorization: userInfo.basicAuth},
        opts = {
          skip_setup: true,
          auth: {username: userInfo.name, password: userInfo.password}
        };
      if(remoteOps) {
        _.extend(opts, remoteOps);
      }
      let remoteDB = new PouchDB(this.config.remote_database_name, opts);
      const sync = localDB.sync(remoteDB, {live: true})
        .on('complete', () => {
          log.debug('Sync complete');
        })
        .on('error', err => {
          log.error('Sync error');
          log.error(err);
          const values = _.values(err);
          // this happens on Samsung TV
          if(values.indexOf('web_sql_went_bad') !== -1) {
            try {
              sync.cancel();
            } catch(e) { }

            localDB = null;
            const options:DatabaseConfiguration = { adapter: 'localstorage' };
            this.init(options);
          // this happens on iOS 10/Safari. Use the API keys...
          } else if(values.indexOf('_reader access is required for this request') !== -1) {
            try {
              sync.cancel();
            } catch (e) { }

            // don't keep trying...
            if(_.isObject(remoteOps)) {
              const err = Error('Could not sync database. Permission denied.');
              Notifications.error(err.message);
              throw err;
            } else {
              localDB = null;
              const options:DatabaseConfiguration = {
                skip_setup: true,
                auth: {username: 'servaryinallyzeaccedicie', password: 'f2062820500e00f931c25f848928023cc1b427cc'}
              };
              this.init(undefined, options);
            }
          }
        })
        .on('change', change => {
          log.info('Sync change');
          log.debug(change);
          if(change.direction === 'pull') {
            if(_.isArray(change.change.docs)){
              change.change.docs.forEach(doc => {
                const job = new JobDocument(doc);

                if(doc.type === JobDocument.DOCUMENT_TYPE || doc.type === JobPhaseDoc.JobPhaseType) {
                  this.events.publish(Database.SyncChangeEvent, job);
                  if(job._rev.substring(0, 2) === '1-') {
                    this.events.publish(Database.DocumentCreatedEvent, job);
                  } else if(job.deleted === true) {
                    this.events.publish(Database.DocumentDeletedEvent, doc._id);
                  } else {
                    this.events.publish(Database.DocumentUpdatedEvent, job);
                  }
                } else if(doc._deleted) {
                  this.events.publish(Database.SyncChangeEvent, job);
                  this.events.publish(Database.DocumentDeletedEvent, doc._id);
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
      (<PouchDB.Database<Job>>localDB).find({
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
  static DocumentCreatedEvent:string = 'DocumentCreatedEvent';
  static DocumentUpdatedEvent:string = 'DocumentUpdatedEvent';
  static DocumentDeletedEvent:string = 'DocumentDeletedEvent';
}
