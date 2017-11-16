import {autoinject, bindable, containerless} from 'aurelia-framework';
import {Job} from '../../models/job';
import {JobPhase} from '../../models/job-phase';
import {JobPhaseStatus, JobPhaseStatuses} from '../../models/job-phase-status';
import {JobService} from '../../services/data/job-service';
import {Notifications} from '../../services/notifications';

@containerless
@autoinject
export class JobPhaseTableCell {
    @bindable job:Job;
    @bindable phase:JobPhase;
    statuses:string[];
    el:Element;

    constructor(private jobService:JobService) {
        this.statuses = Object.keys(JobPhaseStatuses)
            .map(k => JobPhaseStatuses[k]);
    }

    get value():string {
        if(!Array.isArray(this.job.jobPhases)) return JobPhaseStatuses.NOT_STARTED;
        const phase = this.job.jobPhases.find(p => p.phase._id === this.phase._id);
        if(!phase) return JobPhaseStatuses.NOT_STARTED;

        return phase.status;
    }

    attached() {
        $('.dropdown.status', this.el).dropdown({
            onChange: this.onStatusChanged.bind(this)
        });
    }  

    detached() {
        $('.dropdown.status', this.el).dropdown('destroy');
    }

    async onStatusChanged(value:JobPhaseStatuses) {
        try {

            const job = await this.jobService.getOne(this.job._id);
            
            if(!Array.isArray(job.jobPhases)) {
                job.jobPhases = [];
            }

            let phase = job.jobPhases.find(p => p.phase._id === this.phase._id);
            if(!phase) {
                phase = {
                    phase: this.phase,
                    status: value
                };
                job.jobPhases.push(phase);
            }

            phase.status = value;

            await this.jobService.save(job);

            Notifications.success('Status changed successfullly');

        } catch(e) {
            Notifications.error(e);
        }
    }
}