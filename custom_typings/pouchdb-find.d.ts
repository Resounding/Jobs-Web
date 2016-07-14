import {Promise} from 'es6-promise';

interface FindRequest {
    selector?: any;
    fields?: string[];
    sort?: string[] | Object;
}

interface DocList<T> {
    docs:T[];
}

declare global {
    interface PouchDB {
        plugin(plugin:any);
        find<T>(request?:FindRequest):Promise<DocList<T>>;
    }
}

declare module 'pouchdb-find' {
    export = PouchDB;
}