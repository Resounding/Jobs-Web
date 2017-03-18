import {Router} from 'aurelia-router';
import {Foreman} from '../../models/foreman';
import {Job} from '../../models/job';
import {JobType} from '../../models/job-type';
import {JobStatus} from '../../models/job-status';

export class EventPopup {

    jobStatuses: JobStatus[] = JobStatus.OPTIONS;
    
    constructor(public job:Job, private router:Router) { }

    get startDateDisplay(): string {

        let display = 'Not Scheduled';

        if (this.job.startDate) {
            display = moment(this.job.startDate).format('ddd, MMM Do');
        }

        return display;
    }

    get endDateDisplay(): string {
        let display = '';

        if (this.job.endDate) {
            display = moment(this.job.endDate).format('ddd, MMM Do');
        }

        return display;
    }

    get jobStatus(): JobStatus {
        return _.find(this.jobStatuses, s => s.id == this.job.status);
    }

    get foremanDisplay(): string {
        return this.job.foreman || 'Unassigned';
    }

    get foremanColour(): any {
        const foreman = (this.job.foreman || '').toLowerCase(),
            bg = Foreman.BackgroundColours[foreman] || 'white',
            color = bg === 'white' ? 'black' : 'white',
            margin = '1px';
        return {'background-color': bg, color, margin};
    }

    get isProject(): boolean {
        return this.job.job_type === JobType.PROJECT;
    }

    get isServiceCall(): boolean {
        return this.job.job_type === JobType.SERVICE_CALL;
    }

    get jobNumberDisplay(): string {
        const prefix = this.job.job_type === JobType.SERVICE_CALL ? 'S' : 'P';
        return `${prefix}-${this.job.number}`;
    }

    get routeHref(): string {
        const href = this.router.generate('jobs.edit', { id: this.job._id});
        return href;
    }
}