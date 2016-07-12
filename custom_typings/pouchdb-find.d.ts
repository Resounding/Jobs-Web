import {Promise} from 'es6-promise';

interface FindRequest {

}

interface PouchDB {
    find<T>(request?:FindRequest):Promise<T>
}