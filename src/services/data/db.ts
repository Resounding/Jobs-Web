import PouchDB = require('pouchdb');
import pouchdbfind = require('pouchdb-find');

PouchDB.plugin(pouchdbfind);
const database:PouchDB = new PouchDB("LangendoenJobs")

export function db():PouchDB {
    return database;
}