import {Promise} from 'es6-promise';

interface FindRequest {
    selector?: any;
    fields?: string[];
    sort?: string[] | Object;
}

interface DocList<T> {
    docs:T[];
}

interface PouchDestroyResponse {
    ok:boolean;
}

declare global {
    interface PouchDB {
        destroy():Promise<PouchDestroyResponse>;
        plugin(plugin:any);
        find<T>(request?:FindRequest):Promise<DocList<T>>;
        get(id: string, opts?: PouchGetOptions):Promise<any>;
        put(item:any):Promise<PouchUpdateResponse>;
    }
}

declare module 'pouchdb-find' {
    export = PouchDB;
}