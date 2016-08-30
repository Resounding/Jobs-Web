import {autoinject} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {Authentication, Roles} from '../../services/auth';
import {log} from '../../services/log'
import {Database} from '../../services/data/db'
import {Job} from '../../models/job';
import {JobStatus} from '../../models/job-status';
import {JobService} from '../../services/data/job-service';
import {CloseJobArgs} from './close-job';

@autoinject()
export class JobList {
  items: Job[];
  filteredItems: Job[];
  todaysItems: Job[];
  weekItems: Job[];
  futureItems: Job[];
  unscheduled: Job[];
  myJobs: boolean = false;
  showOpen: boolean = true;
  showClosed: boolean = false;
  showCompleted: boolean = false;
  reverseSort: boolean = false;
  filtersExpanded: boolean = false;
  closeJobArgs: CloseJobArgs = new CloseJobArgs;
  showModalSubscription: Subscription;

  constructor(private element: Element, private auth: Authentication, private jobService: JobService, private events: EventAggregator) {
    this.refresh();

    this.showCompleted = auth.isInRole(Roles.OfficeAdmin);
    this.showClosed = auth.isInRole(Roles.OfficeAdmin);

    events.subscribe(Database.SyncChangeEvent, this.refresh.bind(this));
  }

  attached() {
    const that = this;
    $('.modal.close-job', this.element).modal({
      onApprove: () => {
        this.events.publish(CloseJobArgs.ModalApprovedEvent, that.closeJobArgs);
      }
    });

    $('.ui.toggle.checkbox', this.element)
      .checkbox({
        onChange: this.filter.bind(this)
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

    const mine = i => !this.myJobs || i.foreman === me;
    const open = i => this.showOpen && (i.status === JobStatus.PENDING || i.status === JobStatus.IN_PROGRESS);
    const completed = i => this.showCompleted && (i.status == JobStatus.COMPLETE);
    const closed = i => this.showClosed && (i.status === JobStatus.CLOSED);

    log.debug(`Only show my jobs: ${this.myJobs}`);
    log.debug(`Show open jobs: ${this.showOpen}`);
    log.debug(`Show completed jobs: ${this.showCompleted}`);
    log.debug(`Show closed jobs: ${this.showClosed}`);

    let items = _.filter(this.items, i => mine(i) && (open(i) || closed(i) || completed(i))),
        sortedItems = _.sortBy(items, i => parseInt(i.number));

    if(this.reverseSort) {
      sortedItems.reverse();
    }

    this.filteredItems = sortedItems;
  }

  toggleFiltersExpanded() {
    this.filtersExpanded = !this.filtersExpanded;
  }

  showCloseJobModal(id: string) {
    this.closeJobArgs.jobId = id;
    this.closeJobArgs.manHours = null;
    $('.modal.close-job').modal('show');
  }

  get isOwner(): boolean {
    return this.auth.isInRole(Roles.Owner);
  }
}
