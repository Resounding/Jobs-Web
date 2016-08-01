import {autoinject} from 'aurelia-framework';
import * as _ from 'underscore';
import {Promise} from 'es6-promise';
import {Database} from './db';
import {Authentication, Roles} from '../auth/auth';
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
            this.db.find<Job>({ selector: { type: JobDocument.DOCUMENT_TYPE } })
                .then(items => {
                    var jobs = items.docs.map(item => {
                        var job = new JobDocument(item);
                        if(_.isString(item.startDate)) {
                            job.startDate = moment(item.startDate).toDate();
                        }
                    });
                    resolve(jobs);
                })
                .catch(reject);
        });

    }

    save(job:Job):Promise<PouchUpdateResponse> {
            if (!job._id) {
            this.database.nextJobNumber()
                .then(number => {
                    job._id = `job:${number}`;
                    job.number = number;

                    if(this.auth.isInRole(Roles.Foreman)) {
                        job.foreman = this.auth.userInfo().name;
                    }

                    return this.save(job);
                });
            } else {
                return this.save(job);
            }
    }

    destroy():Promise<any> {
        return this.database.destroy();
    }

    save(job:Job):Promise<PouchUpdateResponse> {
        return this.db.put(job);
    }
}