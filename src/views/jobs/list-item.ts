import {autoinject, bindable} from 'aurelia-framework';
import {Job} from "../../models/job";

@autoinject()
export class ListItem {
    @bindable job:Job;

    constructor(private element:Element) { }
    
    attached() {
        $('.dropdown.status', this.element).dropdown();
        $('.dropdown.foreman', this.element).dropdown();
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
        return this.job.status === 'pending';
    }
    get isInProgress() {
        return this.job.status === 'inprogress';
    }
    get isComplete() {
        return this.job.status === 'complete';
    }
}