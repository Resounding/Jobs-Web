import {autoinject} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {Authentication, Roles} from '../../services/auth';
import * as numeral from 'numeral';
import {log} from '../../services/log'
import {Database} from '../../services/data/db'
import {Job} from '../../models/job';
import {JobType} from '../../models/job-type';
import {JobStatus} from '../../models/job-status';
import {JobService} from '../../services/data/job-service';
import {CloseJobArgs} from './close-job';
import {JobListFilters} from './job-list-filters';
import {equals} from '../../utilities/equals';

@autoinject()
export class JobList {
  items: Job[];
  filteredItems: Job[];
  myJobs: boolean = false;
  showOpen: boolean = true;
  showClosed: boolean = false;
  showCompleted: boolean = false;
  reverseSort: boolean = false;
  customerSort: boolean = false;
  showProjects: boolean = true;
  showServiceCalls: boolean = true;
  filtersExpanded: boolean = false;
  closeJobArgs: CloseJobArgs = new CloseJobArgs;
  showModalSubscription: Subscription;
  syncChangeSubscription: Subscription;
  filters:JobListFilters;

  constructor(private element: Element, private auth: Authentication, private jobService: JobService, private events: EventAggregator) {
    this.showCompleted = auth.isInRole(Roles.OfficeAdmin);
    this.filters = JobListFilters.load(this)
    Object.assign(this, this.filters);
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
    this.syncChangeSubscription = this.events.subscribe(Database.SyncChangeEvent, this.refresh.bind(this));

    this.refresh();
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

    const mine = i => !this.myJobs || equals(i.foreman, me);
    const open = i => this.showOpen && (equals(i.status, JobStatus.PENDING) || equals(i.status, JobStatus.IN_PROGRESS));
    const completed = i => this.showCompleted && (equals(i.status, JobStatus.COMPLETE));
    const closed = i => this.showClosed && (equals(i.status, JobStatus.CLOSED));
    const projects = i => this.showProjects && equals(i.job_type, JobType.PROJECT);
    const serviceCalls = i => this.showServiceCalls && equals(i.job_type, JobType.SERVICE_CALL);

    log.debug(`Only show my jobs: ${this.myJobs}`);
    log.debug(`Show open jobs: ${this.showOpen}`);
    log.debug(`Show completed jobs: ${this.showCompleted}`);
    log.debug(`Show closed jobs: ${this.showClosed}`);
    log.debug(`Show projects: ${this.showProjects}`);
    log.debug(`Show service calls: ${this.showServiceCalls}`);

    let sortedItems = this.items.filter(i => mine(i) && (open(i) || closed(i) || completed(i)) && (projects(i) || serviceCalls(i)));
    sortedItems.sort((a, b) => {
      const val1 = this.customerSort ?
          (a.customer.name || '').toString().toLowerCase() + a.number :
          numeral(a.number).value(),
          val2 = this.customerSort ?
          (b.customer.name || '').toString().toLowerCase() + b.number :
          numeral(b.number).value();

      if(val1 !== val2) {
          if(val1 > val2 || val1 === void 0) return 1;
          if(val1 < val2 || val2 === void 0) return -1;
      }      

      return 0;
  });

    if(this.reverseSort) {
      sortedItems.reverse();
    }

    this.filteredItems = sortedItems;

    this.filters.save(this);
  }

  toggleFiltersExpanded() {
    this.filtersExpanded = !this.filtersExpanded;
  }

  showCloseJobModal(id: string) {
    this.closeJobArgs.jobId = id;
    $('.modal.close-job').modal('show');
  }

  get isOwner(): boolean {
    return this.auth.isInRole(Roles.Owner);
  }
}
