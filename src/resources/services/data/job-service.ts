import {autoinject} from 'aurelia-framework';
import {log} from '../log';
import {Database} from './db';
import {Authentication, Roles} from '../auth';
import {Job, JobDocument} from "../../models/job";

@autoinject()
export class JobService {
    db:PouchDB;

    constructor(private auth:Authentication, private database:Database) {
        this.db = database.db;
    }

    getAll():Promise<Job[]> {
        //db().allDocs({ include_docs: true}).then(r => console.log(r));
        return new Promise((resolve, reject) => {
            this.db.find<JobDocument>({ selector: { type: JobDocument.DOCUMENT_TYPE } })
                .then(items => {
                    items.docs.forEach(item => {
                        var job = new JobDocument(item);
                        if(_.isString(item.startDate)) {
                            job.startDate = moment(item.startDate).toDate();
                        }
                    });
                    resolve(items.docs);
                })
                .catch(reject);
        });

    }

    getOne(id:string):Promise<JobDocument> {
      return new Promise((resolve, reject) => {
        this.db.get(id)
          .then(doc => {
            log.info(doc);
            var job = new JobDocument(doc);
            if(_.isString(doc.startDate)) {
              job.startDate = moment(doc.startDate).toDate();
            }
            resolve(job);
          })
          .catch(reject);
      });
    }

    save(job:Job):Promise<PouchUpdateResponse> {
        return new Promise((resolve, reject) => {
            if (!job._id) {
                this.database.nextJobNumber()
                    .then(number => {
                        job._id = `job:${number}`;
                        job.number = number;

                        if (this.auth.isInRole(Roles.Foreman)) {
                            job.foreman = this.auth.userInfo().name;
                        }

                        return this.db.put(job)
                            .then(resolve)
                            .catch(reject);
                    });
            } else {
                return this.db.put(job)
                    .then(resolve)
                    .catch(reject);
            }
        });
    }

    destroy():Promise<any> {
        return this.database.destroy();
    }
}