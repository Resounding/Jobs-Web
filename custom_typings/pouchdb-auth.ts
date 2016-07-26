import {Promise} from 'es6-promise';

declare global {
    interface PouchLogInResponse {
        ok: boolean;
        name: string;
        roles: string[];
    }

    interface PouchSignUpOptions {
        roles?: string[];
    }

    interface PouchDB {
        plugin(plugin:any);
        useAsAuthenticationDB():Promise<PouchUpdateResponse>;
        logIn(user:string, password:string):Promise<PouchLogInResponse>;
        signUp(user:string, password: string, options?:PouchSignUpOptions):Promise<PouchUpdateResponse>
    }
}

declare module 'pouchdb-auth' {
    export = PouchDB;
}