import {Promise} from 'es6-promise';
import PouchDB = require('pouchdb');
import pouchdbfind = require('pouchdb-find');
import {Job, JobDocument} from '../../models/job';
import {Configuration} from '../config';

PouchDB.plugin(pouchdbfind);

let localDB:PouchDB = null;
let remoteDB:PouchDB = null;
const config = new Configuration();

init();

export function db():PouchDB {
    return localDB;
}

export function destroy():Promise<any> {
    return localDB.destroy()
        .then(init);
}

function init() {
    localDB = new PouchDB(config.app_database_name);
    remoteDB = new PouchDB(config.remote_database_name, { skip_setup: true });
    localDB.sync(remoteDB, { live: true })
        .on('complete', () => {
            console.log('Sync complete!')
        })
        .on('error', err => {
            console.error(err);
        })
        .on('change', change => {
            console.log('changed!');
            console.log(change);
        }).on('paused', info => {
            console.log('paused!');
            console.log(info);
        }).on('active', info => {
            console.log('active!');
            console.log(info);
        });
}

export function nextJobNumber():Promise<string> {
    return new Promise((resolve, reject) =>{
        localDB.find<Job>({
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