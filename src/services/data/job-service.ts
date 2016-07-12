import {Promise} from 'es6-promise';
import {autoinject} from 'aurelia-framework';
import {ReferenceService} from './reference-service';
import {db} from './db';
import {Job, Constants} from "../../models/job";

@autoinject()
export class JobService {
    items:Job[];

    constructor(private referenceService:ReferenceService) {
    }

    getAll():Promise<Job[]> {
        return db().find({ selector: { type: Constants.JOB_DOCUMENT } });
    }

    save(job:Job):Promise<Job> {
        return new Promise((resolve, reject) => {
            if (job.id) {

            } else {
                db().post(job, function (err, result) {
                    if (err) return reject(err);

                    return resolve(result);
                })
            }
        });
    }
}