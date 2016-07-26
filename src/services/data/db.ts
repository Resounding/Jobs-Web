import {Promise} from 'es6-promise';
import PouchDB = require('pouchdb');
import pouchdbfind = require('pouchdb-find');
import pouchdbauth = require('pouchdb-auth');
import {Job, JobDocument} from '../../models/job';
import {Configuration} from '../config';

PouchDB.plugin(pouchdbfind);
PouchDB.plugin(pouchdbauth);

let database:PouchDB = null;
const config = new Configuration();

init();

export function db():PouchDB {
    return database;
}

export function destroy():Promise<any> {
    return new Promise((resolve, reject) => {
        database.destroy()
            .then(() => {
                init()
                    .then(resolve)
                    .catch(reject);
            })
            .catch(reject);
    });
}

function init() {
    database = new PouchDB(config.app_database_name);
}

export function nextJobNumber():Promise<string> {
    return new Promise((resolve, reject) =>{
        database.find<Job>({
            selector: { type: JobDocument.DOCUMENT_TYPE },
            fields: ['number']
        })
        .then(rows => {
            console.log(rows);
            const nextNumber:number = rows.docs.reduce((memo, job) => {
                var number = parseInt(job.number);
                if(!isNaN(number) && number > memo) memo = number;
                return memo;
            }, 0) + 1;

            //http://stackoverflow.com/a/10073761
            const formattedNumber:string = nextNumber < 99999 ? `0000${nextNumber}`.slice(-5) : nextNumber.toString();
            resolve(formattedNumber);
        })
        .catch(reject);
    });
}