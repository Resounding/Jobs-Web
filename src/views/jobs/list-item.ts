import {autoinject, bindable} from 'aurelia-framework';
import {Job} from "../../models/job";
import {JobStatus} from "../../models/jobStatus";
import {ReferenceService} from "../../services/data/reference-service";
import {isDevice} from "../../services/utils";

@autoinject()
export class ListItem {
    @bindable job:Job;
    foremen:string[];
    statuses:JobStatus[];
    expanded:boolean = false;

    constructor(private element:Element, referenceService: ReferenceService) {
        referenceService.getForemen()
            .then(foremen => this.foremen = foremen);

        referenceService.getJobStatuses()
            .then(statuses => this.statuses = statuses);
    }
    
    attached() {
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
    get foremanDisplay(): string {
        return this.job.foreman || 'Unassigned';
    }
    get isPending() {
        return this.job.status._id === 'pending';
    }
    get isInProgress() {
        return this.job.status._id === 'inprogress';
    }
    get isComplete() {
        return this.job.status._id === 'complete';
    }
    get isProject() {
        return this.job.job_type === 'project';
    }
     get isServiceCall() {
         return this.job.job_type === 'service';
     }
}