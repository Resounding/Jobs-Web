import {CouchDoc, CouchDocBase} from './couch-doc';
import {ValidationResult} from './validation';

export interface JobPhase extends CouchDoc {
    name:string;
    cssClass:string;
    sortOrder:number;
}

export class JobPhaseDoc extends CouchDocBase<JobPhase> implements JobPhase {
    name:string;
    cssClass:string | null;
    sortOrder:number;

    constructor(data:JobPhase | {} = {}) {
        super(Object.assign({
            _id: null,
            _rev: null,
            type: JobPhaseDoc.JobPhaseType,
            name: '',
            cssClass: null,
            sortOrder: 0
        }, data))
    }

    validate():ValidationResult {
        const result:ValidationResult = {
            ok: true,
            errors: []
        };

        if(!this.name){
            result.ok = false;
            result.errors.push('Please enter the Phase name.');
        }

        return result;
    }

    static JobPhaseType:string = 'job-phase';
}