import {autoinject} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {Authentication, Roles} from '../../services/auth/auth';
import {Job} from '../../models/job'
import {JobService} from '../../services/data/job-service';
import {CloseJobArgs} from './close-job';

@autoinject()
export class JobList {
    items:Job[];
    todaysItems:Job[];
    weekItems:Job[];
    unscheduled:Job[];
    myJobs:boolean;
    showCompleted:boolean = false;
    filtersExpanded:boolean = false;
    closeJobArgs:CloseJobArgs = new CloseJobArgs;
    showModalSubscription:Subscription;

    constructor(private element:Element, private auth:Authentication, private jobService:JobService, private events:EventAggregator) {
        this.myJobs = this.auth.isInRole(Roles.Foreman);
        this.refresh();
    }

    attached() {
        const that = this;
        $('.modal.close-job', this.element).modal({
            onApprove: () => {
                this.events.publish(CloseJobArgs.ModalApprovedEvent, that.closeJobArgs);
            }
        });

        this.showModalSubscription = this.events.subscribe(CloseJobArgs.ShowModalEvent, this.showCloseJobModal.bind(this));
    }

    detached() {
        $('.modal.close-job', this.element).modal('destroy');

        this.showModalSubscription.dispose();
    }

    refresh() {
        this.jobService.getAll()
            .then(items => {
                this.items = items;
                this.filter();
            });
    }

    filter() {
        const me = this.auth.userInfo().name;

        const sameDay = i => moment(i.startDate).isSame(moment(), 'day');
        const thisWeek = i => moment(i.startDate).isBefore(moment().startOf('week').add(1, 'week'));
        const mine = i => !this.myJobs || i.foreman === me;
        const completed = i => this.showCompleted || (i.status && i.status._id !== 'complete');

        this.todaysItems = _.filter(this.items, i => sameDay(i) && mine(i) && completed(i));
        this.weekItems = _.filter(this.items, i => thisWeek(i) && !sameDay(i) && mine(i) && completed(i));
        this.unscheduled = _.filter(this.items, i => !i.startDate && mine(i) && completed(i));
    }

    toggleFiltersExpanded() {
        this.filtersExpanded = !this.filtersExpanded;
    }

    showCloseJobModal(id:string) {
        this.closeJobArgs.jobId = id;
        this.closeJobArgs.manHours = null;
        $('.modal.close-job').modal('show');
    }

    get isOwner():boolean {
        return this.auth.isInRole(Roles.Owner);
    }
}