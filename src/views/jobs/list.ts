import {autoinject} from 'aurelia-framework';
import {Job} from '../../models/job'
import {JobService} from '../../services/data/jobService';

@autoinject()
export class JobList {
    items:Job[];
    todaysItems:Job[];
    weekItems:Job[];
    unscheduled:Job[];
    myJobs:boolean = true;
    showCompleted:boolean = false;
    filtersExpanded:boolean = false;

    constructor(jobService: JobService) {
        jobService.getAll()
            .then(items => {
                this.items = items;
                this.filter();
            });
    }

    filter() {
        const sameDay = i => moment(i.startDate).isSame(moment(), 'day');
        const thisWeek = i => moment(i.startDate).isBefore(moment().startOf('week').add(1, 'week'));
        const mine = i => !this.myJobs || i.foreman === 'Kurt';
        const completed = i => this.showCompleted || i.status._id !== 'complete';

        this.todaysItems = _.filter(this.items, i => sameDay(i) && mine(i) && completed(i));
        this.weekItems = _.filter(this.items, i => thisWeek(i) && !sameDay(i) && mine(i) && completed(i));
        this.unscheduled = _.filter(this.items, i => !i.startDate && mine(i) && completed(i));
    }

    toggleFiltersExpanded() {
        this.filtersExpanded = !this.filtersExpanded;
    }
}