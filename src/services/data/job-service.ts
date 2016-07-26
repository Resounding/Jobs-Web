import {autoinject} from 'aurelia-framework';
import * as _ from 'underscore';
import {Promise} from 'es6-promise';
import {db, nextJobNumber, destroy} from './db';
import {Authentication, Roles} from '../auth/auth';
import {Job, JobDocument} from "../../models/job";

@autoinject()
export class JobService {

    constructor(private auth:Authentication) { }

    getAll():Promise<Job[]> {
        //db().allDocs({ include_docs: true}).then(r => console.log(r));
        return new Promise((resolve, reject) => {
            db().find<Job>({ selector: { type: JobDocument.DOCUMENT_TYPE } })
                .then(items => {
                    var jobs = items.docs.map(item => {
                        var job = new JobDocument(item);
                        if(_.isString(item.startDate)) {
                            job.startDate = moment(item.startDate).toDate();
                        }
                    })
                    resolve(items.docs);
                })
                .catch(reject);
        });

    }

    save(job:Job):Promise<PouchUpdateResponse> {
            if (!job._id) {
            return nextJobNumber()
                .then(number => {
                    job._id = `job:${number}`;
                    job.number = number;

                    if(this.auth.isInRole(Roles.Foreman)) {
                        job.foreman = this.auth.userInfo().name;
                    }

                    return saveJob(job);
                });
            } else {
                return saveJob(job);
            }
    }

    static destroy():Promise<any> {
        return destroy();
    }
}

function saveJob(job:Job):Promise<PouchUpdateResponse> {
    return db().put(job);
}