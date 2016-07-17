import * as _ from 'underscore';
import {Promise} from 'es6-promise';
import {db, nextJobNumber, destroy} from './db';
import {Job, JobDocument} from "../../models/job";

export class JobService {

    static getAll():Promise<Job[]> {
        //db().allDocs({ include_docs: true}).then(r => console.log(r));
        return new Promise((resolve, reject) => {
            db().find<Job>({ selector: { type: JobDocument.DOCUMENT_TYPE } })
                .then(items => {
                    items.docs.forEach(item => {
                        if(_.isString(item.startDate)) {
                            item.startDate = moment(item.startDate).toDate();
                        }
                    });
                    resolve(items.docs);
                })
                .catch(reject);
        });

    }

    static save(job:Job):Promise<PouchUpdateResponse> {
            if (!job._id) {
            return nextJobNumber()
                .then(number => {
                    job._id = `job:${number}`;
                    job.number = number;
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
    return new Promise((resolve, reject) => {
        db().put(job, function (err, result) {
            if (err) return reject(err);

            return resolve(result);
        });
    })
}