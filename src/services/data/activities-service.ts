import {Promise} from 'es6-promise';
import {db} from './db';

export class ActivitiesService {
    static getAll():Promise<string[]> {
        return new Promise((resolve, reject) => {
            db().get('activities')
                .then(result => {
                    resolve(result.items);
                })
                .catch(err => {
                    if(err.status === 404) {
                        var activities = {
                            _id: 'activities',
                            items: []
                        };
                        db().put(activities)
                            .then(() => resolve([]))
                            .catch(reject);
                    } else {
                        reject(err);
                    }
                });
        });
    }

    static create(activity:string):Promise<any> {
        return new Promise((resolve, reject) => {
            db().get('activities')
                .then(result => {
                    result.items.push(activity);
                    return db().put(result);
                })
                .catch(err => {
                    if(err.status === 404) {
                        var activities = {
                            _id: 'activities',
                            items: [activity]
                        };
                        return db().put(activities);
                    } else {
                        reject(err);
                    }
                });
        })
    }
}