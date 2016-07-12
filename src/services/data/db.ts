import PouchDB = require('pouchdb');

const database:PouchDB = new PouchDB("LangendoenJobs")

export function db():PouchDB {
    return database;
}