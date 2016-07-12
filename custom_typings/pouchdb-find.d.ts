import {Promise} from 'es6-promise';

interface FindRequest {
    selector?: any;
    fields?: string[],
    sort?: string[]
}

declare global {
    interface PouchDB {
        plugin(plugin:any);
        find<T>(request?:FindRequest):Promise<T>;
    }
}

declare module 'pouchdb-find' {
    export = PouchDB;
}