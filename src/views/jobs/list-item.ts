import {Promise} from 'es6-promise';
import * as _ from 'underscore';
import {autoinject, bindable} from 'aurelia-framework';
import {Job} from "../../models/job";
import {JobStatus} from "../../models/job-status";
import {JobType} from "../../models/job-type";
import {isDevice} from "../../services/utils";
import {Foreman} from "../../models/foreman";
import {JobService} from "../../services/data/job-service";
import {Notifications} from "../../services/notifications";

@autoinject()
export class ListItem {
    @bindable job:Job;
    statuses:JobStatus[] = JobStatus.OPTIONS;
    expanded:boolean = false;
    foremen:string[] = Foreman.OPTIONS;
    jobStatuses:JobStatus[] = JobStatus.OPTIONS;

    constructor(private element:Element) {
        console.log(element);
    }
    
    attached() {
        // if(isDevice()) {
            // swipe to reveal delete?
        // } else {
            $('.calendar', this.element).calendar({
                type: 'date',
                onChange: date => {
                    this.job.startDate = moment(date).toDate();
                    save(this.job, 'Start Date');
                }
            });

            $('.dropdown.status', this.element).dropdown({
                onChange: value => {
                    this.job.status = value;
                    save(this.job, 'Status');
                }
            });
            $('.dropdown.foreman', this.element).dropdown({
                onChange: value => {
                    this.job.foreman = value;
                    save(this.job, 'Foreman');
                }
            });
        //}
    }

    detached() {
        //if(isDevice()) {
            // swipe to reveal delete?
        //} else {
            $('.calendar', this.element).calendar('destroy');
            $('.dropdown.status', this.element).dropdown('destroy');
            $('.dropdown.foreman', this.element).dropdown('destroy');
        //}
    }

    toggleExpanded() {
        this.expanded = !this.expanded;
    }
    
    get dateDisplay():string {

        let display = 'Not Scheduled';

        if(this.job.startDate == null && this.job.days > 1) {
            display += ` (${this.job.days} days)`;
        } else if(this.job.startDate) {

            let start = moment(this.job.startDate);

            display = start.format('ddd, MMM Do');

            if (this.job.days > 1) {
                let end = start.clone().add(this.job.days, 'days');
                while(end.weekday() === 6 || end.weekday() === 0) {
                    end.add(1, 'day');
                }
                display = `${display} - ${end.format('ddd, MMM Do')}`;
            }
        }

        return display;
    }
    get jobStatus():JobStatus {
        return _.find(this.jobStatuses, s => s.id == this.job.status);
    }
    get foremanDisplay(): string {
        return this.job.foreman || 'Unassigned';
    }
    get isPending() {
        return this.job.status === 'pending';
    }
    get isInProgress() {
        return this.job.status === JobStatus.PENDING;
    }
    get isComplete() {
        return this.job.status === JobStatus.COMPLETE;
    }
    get isClosed():boolean {
        return this.job.status === JobStatus.CLOSED;
    }
    get isProject() {
        return this.job.job_type === JobType.PROJECT;
    }
     get isServiceCall() {
         return this.job.job_type === JobType.SERVICE_CALL;
     }
}

function save(job:Job, field:string):Promise<void> {
    return JobService.save(job)
        .then(response => {
            job._rev = response.rev;
            Notifications.success(`${field} updated`);
        })
        .catch(Notifications.error);
}
