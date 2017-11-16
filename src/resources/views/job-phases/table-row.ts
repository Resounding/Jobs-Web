import {bindable, containerless} from 'aurelia-framework';
import {Job} from '../../models/job';
import {JobPhase} from '../../models/job-phase';
import {JobType} from '../../models/job-type';

@containerless
export class JobPhaseTableRow {
    @bindable job:Job;
    @bindable phases:JobPhase[];
    jobNumber:string;

    attached() {
        const prefix = this.job.job_type === JobType.SERVICE_CALL ? 'S' : 'P';
        this.jobNumber = `${prefix}-${this.job.number}`;
    }
}