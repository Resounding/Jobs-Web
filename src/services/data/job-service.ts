import {Promise} from 'es6-promise';
import {autoinject} from 'aurelia-framework';
import {ReferenceService} from './reference-service';
import {db} from './db';
import {Job} from "../../models/job";


@autoinject()
export class JobService {
    items:Job[];

    constructor(private referenceService:ReferenceService) {
    }

    getAll():Promise<Job[]> {
        return new Promise((resolve, reject) => {
            db().allDocs({include_docs: true}, function (err, doc) {
                if (err) return reject(err);

                var jobs = doc.rows
                    .filter(row => row.doc.type === 'job')
                    .map(row => row.doc);

                return resolve(jobs);
            });
        });
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