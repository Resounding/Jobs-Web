import {ISerializable} from './serializable'
import {IValidatable} from './validation'

export interface CouchDoc extends PouchDB.Core.IdMeta, PouchDB.Core.RevisionIdMeta, PouchDB.Core.TypeMeta { }

export abstract class CouchDocBase<T extends CouchDoc> implements CouchDoc, IValidatable, ISerializable<T> {
    _id:string;
    _rev:string;
    abstract type:string;

    constructor(data:T | {} = {}) {
        Object.assign(this, {
            _id: '',
            _rev: '',
            type: this.type
        }, data);
    }

    validate() {
        return {
            ok: true,
            errors: []
        };
    }

    toJSON():T {
        return Object.assign(<T>{}, this);
    }
}