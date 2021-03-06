import {EventAggregator} from 'aurelia-event-aggregator';
import {autoinject} from 'aurelia-framework';
import * as numeral from 'numeral';
import {JobDocument, Job} from '../../models/job';
import {JobPhaseDoc} from '../../models/job-phase';
import {Quote, QuoteDocument} from '../../models/quote';
import {Configuration} from '../config';
import {log} from '../log';
import {Authentication} from '../auth';
import {Notifications} from '../notifications';
import DatabaseConfiguration = PouchDB.Configuration.DatabaseConfiguration;
import {isObject} from '../../services/utils';

let localDB: PouchDB.Database = null;

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
          const names = indexes.indexes.map(i => i.name);
          if(names.indexOf('by_type_name') === -1) {
            localDB.createIndex({              
              index: {
                name: 'by_type_name',
                fields: ['type', 'name']
              }
            }).then(result => {
              log.debug(JSON.stringify(result));
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
              log.debug(JSON.stringify(result));
            }).catch(error => {
              log.error(error);
            });
          }
        });
    }

    if (this.auth.isAuthenticated()) {
      const userInfo = this.auth.userInfo(),
        opts = {
          skip_setup: true,
          auth: {username: userInfo.name, password: userInfo.password}
        };
      if(isObject(remoteOps)) {
        Object.assign(opts, remoteOps);
      }
      let remoteDB = new PouchDB(this.config.remote_database_name, opts);
      const sync = localDB.sync(remoteDB, {live: true})
        .on('complete', () => {
          log.debug('Sync complete');
        })
        .on('error', err => {
          log.error('Sync error');
          log.error(err);
          const values = Object.keys(err).map(k => err[k]);
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
            if(remoteOps) {
              const err = Error('Could not sync database. Permission denied.');
              Notifications.error(err.message);
              throw err;
            } else {
              localDB = null;
              const options:DatabaseConfiguration = {
                skip_setup: true,
                auth: {username: 'istondellownsoresesenlyi', password: '493e16f154ec3688e0ed5b8013f94a2e17b27398'}
              };
              this.init(undefined, options);
            }
          }
        })
        .on('change', change => {
          log.info('Sync change');
          log.debug(JSON.stringify(change));
          if(change.direction === 'pull') {
            if(Array.isArray(change.change.docs)){
              change.change.docs.forEach(doc => {
                
                if(doc.number && !doc._deleted) {
                (<PouchDB.Database<Job>>localDB).find({selector: {type: JobDocument.DOCUMENT_TYPE, deleted: { '$ne': true }}})
                  .then(async items => {
                    const conflicts = items.docs.filter(d => d.creator === userInfo.name && d._id > doc._id && d.number === doc.number);
                    for(const conflict of conflicts) {
                      conflict.number = await this.nextJobNumber();
                      localDB.post(conflict)
                        .then(() => {
                          this.events.publish(Database.DocumentUpdatedEvent, new JobDocument(conflict));
                        });
                    }
                  });
                }

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
        log.debug(JSON.stringify(info));
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
      localDB.query<any>('filters/jobs-by-number', { reduce: true, group: true})
        .then(rows => {
          const last = rows.rows[rows.rows.length-1],
            key = last.key,
            nextNumber = key + 1,
            //@ts-ignore
            formattedNumber: string = nextNumber < 99999 ? `0000${nextNumber}`.slice(-5) : nextNumber.toString();
          return resolve(formattedNumber);          
        })
        .catch(reject);      
    });
  }

  nextQuoteNumber(): Promise<string> {
    return new Promise((resolve, reject) => {
      (<PouchDB.Database<Quote>>localDB).find({
        selector: {type: QuoteDocument.DOCUMENT_TYPE},
        fields: ['number']
      })
        .then(rows => {
          const nextNumber: number = rows.docs.reduce((memo, quote) => {
              var number = numeral(quote.number).value();
              if (number > memo) memo = number;
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
