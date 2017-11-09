import {autoinject} from 'aurelia-framework';
import * as moment from 'moment';
import * as _ from 'underscore';
import {log} from '../log';
import {Database} from './db';
import {Authentication, Roles} from '../auth';
import {Job, JobDocument} from "../../models/job";

@autoinject()
export class JobService {
  db: PouchDB.Database;

  constructor(private auth: Authentication, private database: Database) {
    this.db = database.db;
  }

  getAll(): Promise<Job[]> {
    //db().allDocs({ include_docs: true}).then(r => console.log(r));
    return new Promise((resolve, reject) => {
      (<PouchDB.Database<Job>>this.db).find({selector: {type: JobDocument.DOCUMENT_TYPE, deleted: { '$ne': true }}})
        .then(items => {
          const jobs = items.docs.map(item => {
            var job = new JobDocument(item);
            if (_.isString(item.startDate)) {
              job.startDate = moment(item.startDate).toDate();
            }
            if(_.isString(item.endDate)){
              job.endDate = moment(item.endDate).toDate();
            }

            return job;
          });

          resolve(jobs);
        })
        .catch(reject);
    });

  }

  getOne(id: string): Promise<JobDocument> {
    return new Promise((resolve, reject) => {
      this.db.get<Job>(id)
        .then(doc => {
          log.info(doc);
          var job = new JobDocument(doc);
          if (_.isString(doc.startDate)) {
            job.startDate = moment(doc.startDate).toDate();
          }
          if (_.isString(doc.endDate)) {
            job.endDate = moment(doc.endDate).toDate();
          }
          resolve(job);
        })
        .catch(reject);
    });
  }

  save(job: Job): Promise<PouchDB.Core.Response> {
    return new Promise((resolve, reject) => {
      if (_.isString(job.startDate) || _.isDate(job.startDate)) {
        job.startDate = moment(job.startDate).format('YYYY-MM-DD');
      }
      if (_.isString(job.endDate) || _.isDate(job.endDate)) {
        job.endDate = moment(job.endDate).format('YYYY-MM-DD');
      }

      if (!job._id) {
        if (this.auth.isInRole(Roles.Foreman)) {
          job.foreman = this.auth.userInfo().name;
        }
        this.db.post(job)
          .then(created => {
            if(created.ok) {
              job._id = created.id;
              job._rev = created.rev;
              
              this.database.nextJobNumber()
                .then(number => {
                  job.number = number;            

                  return this.db.put(job)
                    .then(resolve)
                    .catch(reject);
                });
            } else {
              reject(Error((<any>created).message));
            }
          })
          .catch(reject);        
      } else {
        return this.db.put(job)
          .then(resolve)
          .catch(reject);
      }
    });
  }

  delete(job: Job) {
    job.deleted = true;
    return this.db.put(job)
      .then(result => {
        log.info(result);
      })
      .catch(err => {
        log.info(err);
      });
  }

  destroy(): Promise<any> {
    return this.database.destroy();
  }

  move(id:string, start:Date, end:Date):Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.get<Job>(id)
        .then(job => {
          job.startDate = start;
          job.endDate = end;
          this.db.put(job)
            .then(resolve)
            .catch(reject);
        })
        .catch(reject);
      });
  }
}
