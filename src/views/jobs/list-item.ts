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
        if(isDevice()) {
            // swipe to reveal delete?
        } else {
            $('.dropdown.status', this.element).dropdown({
                onChange: value => {
                    this.job.status = value;
                    JobService.save(this.job)
                        .then((response) => {
                            this.job._rev = response.rev;
                            Notifications.success('Status updated');
                        })
                        .catch(Notifications.error);
                }
            });
            $('.dropdown.foreman', this.element).dropdown({
                onChange: value => {
                    this.job.foreman = value;
                    JobService.save(this.job)
                        .then((response) => {
                            this.job._rev = response.rev;
                            Notifications.success('Foreman updated');
                        })
                        .catch(Notifications.error);
                }
            });
        }
    }

    detached() {
        if(isDevice()) {
            // swipe to reveal delete?
        } else {
            $('.dropdown.status', this.element).dropdown();
            $('.dropdown.foreman', this.element).dropdown();
        }
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