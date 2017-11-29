import {autoinject, computedFrom} from 'aurelia-framework';
import {Database} from './db';
import {Notifications} from '../notifications';
import {CouchDoc} from '../../models/couch-doc';
import {ISerializable} from '../../models/serializable';
import {IValidatable, ValidationResult, PayloadValidationResult} from '../../models/validation';

@autoinject
export abstract class ServiceBase<T extends CouchDoc> {
    constructor(protected database:Database, private getAllFilter:string) { }

    @computedFrom('database.db')
    get db():PouchDB.Database {
        return this.database.db;
    }

    async getAll():Promise<T[]> {
        try {

            const result = await this.db.query<T>(this.getAllFilter, { include_docs: true }),
                docs = result.rows.map(row => row.doc);

            return docs;

        } catch(e) {
            throw e;
        }
    }

    async getOne(id:string):Promise<T> {
        try {

            const result = await this.db.get<T>(id);

            return result;

        } catch(e) {
            throw e;
        }
    }

    async save(item:T & ISerializable<T> & IValidatable, options?:any):Promise<PayloadValidationResult> {
        const valid:PayloadValidationResult = Object.assign({payload: null, ok: true, errors: []}, item.validate()),
            json = item.toJSON(),
            isNew = !item._id;

        if(!valid.ok) return valid;

        try {
            const result = await (isNew ? this.database.db.post(json) : this.database.db.put(<PouchDB.Core.PutDocument<T>>json)),
                ok = result.ok;

            Object.assign(valid, { payload: { id: result.id, rev: result.rev } });
            if(!ok) {
                valid.errors.push('There was a problem saving.')
            }
        } catch(e) {
            valid.ok = false;
            valid.errors.push(e);
        }

        return valid;
    }

    async delete(item:T):Promise<boolean> {
        try {

            const result = await this.database.db.remove(item);

            if(result.ok) return true;

            Notifications.error('There was a problem deleting.');
            return false;

        } catch(e) {
            Notifications.error(e);
            return false;
        }
    }
}