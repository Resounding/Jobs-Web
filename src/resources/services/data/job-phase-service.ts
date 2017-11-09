import {autoinject} from 'aurelia-framework';4
import {Database} from './db';
import {ServiceBase} from './service-base';
import {JobPhase} from '../../models/job-phase';

@autoinject
export class JobPhaseService extends ServiceBase<JobPhase> {
    constructor(database:Database) {
        super(database, 'filters/job-phases');
    }
}