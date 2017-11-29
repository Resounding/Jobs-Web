import {autoinject} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {Authentication, Roles} from '../../services/auth';
import * as numeral from 'numeral';
import {log} from '../../services/log'
import {Database} from '../../services/data/db'
import {Quote} from '../../models/quote';
import {JobType} from '../../models/job-type';
import {JobStatus} from '../../models/job-status';
import {QuoteService} from '../../services/data/quote-service';

@autoinject()
export class JobList {
  el:Element;
  items: Quote[];
  filteredItems: Quote[];
  myQuotes: boolean = false;
  showOpen: boolean = true;
  showClosed: boolean = false;
  showCompleted: boolean = false;
  reverseSort: boolean = false;
  customerSort: boolean = false;
  showProjects: boolean = true;
  showServiceCalls: boolean = true;
  filtersExpanded: boolean = false;
  showModalSubscription: Subscription;
  syncChangeSubscription: Subscription;

  constructor(private auth: Authentication, private quoteService: QuoteService, private events: EventAggregator) {
    this.showCompleted = auth.isInRole(Roles.OfficeAdmin);
  }

  attached() {
    $('.ui.toggle.checkbox', this.el)
      .checkbox({
        onChange: this.filter.bind(this)
      });

    this.syncChangeSubscription = this.events.subscribe(Database.SyncChangeEvent, this.refresh.bind(this));

    this.refresh();
  }

  detached() {
    this.syncChangeSubscription.dispose();
  }

  refresh() {
    this.quoteService.getAll()
      .then(items => {
        this.items = items;
        this.filter();
      });
  }

  filter() {
    const me = this.auth.userInfo().name;

    const mine = i => !this.myQuotes || i.foreman === me;
    const open = i => this.showOpen && (i.status === JobStatus.PENDING || i.status === JobStatus.IN_PROGRESS);
    const completed = i => this.showCompleted && (i.status == JobStatus.COMPLETE);
    const closed = i => this.showClosed && (i.status === JobStatus.CLOSED);
    const projects = i => this.showProjects && i.job_type == JobType.PROJECT;
    const serviceCalls = i => this.showServiceCalls && i.job_type == JobType.SERVICE_CALL;

    const  sortedItems = this.items.filter(i => mine(i) && (open(i) || closed(i) || completed(i)) && (projects(i) || serviceCalls(i)));
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
  }

  toggleFiltersExpanded() {
    this.filtersExpanded = !this.filtersExpanded;
  }

  get isOwner(): boolean {
    return this.auth.isInRole(Roles.Owner);
  }
}
