import {autoinject} from 'aurelia-framework';
import {Router, RouteConfig} from 'aurelia-router';
import * as moment from 'moment';
import * as $ from 'jquery';
import 'semantic-ui-calendar';
import {JobService} from '../../services/data/job-service';
import {CustomerService} from '../../services/data/customer-service';
import {Notifications} from '../../services/notifications';
import {isString} from '../../services/utils';
import {Job, JobDocument} from '../../models/job';
import {CustomerDocument} from '../../models/customer';
import {JobType} from '../../models/job-type';
import {JobStatus} from '../../models/job-status';
import {BillingType} from "../../models/billing-type";
import {WorkType} from "../../models/work-type";

@autoinject()
export class NewJob {
  job: JobDocument;
  customers: CustomerDocument[];
  jobTypes: JobType[] = JobType.OPTIONS;
  jobStatuses: JobStatus[] = JobStatus.OPTIONS;
  billingTypes: BillingType[] = BillingType.OPTIONS;
  workTypes: WorkType[] = WorkType.OPTIONS;
  isFollowup:boolean = false;

  constructor(private element: Element, private router: Router, private jobService: JobService, private customerService: CustomerService) {
    this.job = new JobDocument();
    customerService.getAll()
      .then(customers => this.customers = customers)
      .catch(Notifications.error);
  }

  activate(params: any, routeConfig: RouteConfig) {
    routeConfig.title = this.title;

    if (isString(params.type)) {
      this.job.type = params.type;
    }

    if (params.from) {
      this.jobService.getOne(params.from)
        .then(prev => {
          this.isFollowup = true;
          this.job.customer = prev.customer;
        });
    }
  }

  attached() {
    $('.dropdown.customer', this.element).dropdown({
      allowAdditions: true,
      hideAdditions: false,
      fullTextSearch: true,
      onChange: (value: string): void => {
        this.job.customer = this.customers.find(c => c._id === value);
        if (!this.job.customer) {
          this.job.customer = new CustomerDocument();
          this.job.customer.name = value;
        }
        console.log(this.job.customer);
      }
    });

    $('#status', this.element).dropdown();
    $('#billingType', this.element).dropdown();
    $('#workType', this.element).dropdown();
    $('.calendar.start', this.element).calendar({
      type: 'date',
      onChange: date => this.job.startDate = moment(date).toDate()
    });

    const $buttonBar = $('.button-bar', this.element);
    $buttonBar.visibility({
      once: false,
      onBottomPassed: () => {
        $buttonBar.addClass('fixed top');
      },
      onBottomPassedReverse: function () {
        $buttonBar.removeClass('fixed top');
      }
    });
  }

  detached() {
    $('.dropdown.customer', this.element).dropdown('destroy');
    $('#status', this.element).dropdown('destroy');
    $('#billingType', this.element).dropdown('destroy');
    $('#workType', this.element).dropdown('destroy');
    $('.calendar.start', this.element).calendar('destroy');
    $('.button-bar', this.element).visibility('destroy');
  }

  get title() {
    return 'New Job';
  }

  get customer_id(): string {
    return this.job.customer ? this.job.customer._id : null;
  }

  addDates() {
    if(!Array.isArray(this.job.additionalDates)) {
      this.job.additionalDates = [];
    }

    const length = this.job.additionalDates.length;

    this.job.additionalDates.push([new Date, new Date]);

    window.setTimeout(() => {
        $(`.calendar.start-${length}`, this.element)
          .calendar({
            type: 'date',
            onChange: date => this.job.additionalDates[length][0] = moment(date).toDate()
          })
          .calendar('set date', new Date);
        $(`.calendar.end-${length}`, this.element)
          .calendar({
            type: 'date',
            onChange: date => this.job.additionalDates[length][1] = moment(date).toDate()
          })
          .calendar('set date', new Date);
    }, 100);
  }

  removeDates(index: number) {
    const length = $(`.calendar.start-${index},.calendar.end-${index}`, this.element).length;
    console.log(length);
    $(`.calendar.start-${index},.calendar.end-${index}`, this.element).calendar('destroy');

    this.job.additionalDates.splice(index, 1);
  }

  onSaveClick() {
    if (this.customer_id) {
      this.saveJob()
        .then(() => this.router.navigateToRoute('jobs.list'));
    } else {
      this.saveCustomer(this.job.customer)
        .then(customer => {
          this.job.customer = customer;
          this.saveJob()
            .then(() => this.router.navigateToRoute('jobs.list'));
        })
        .catch(Notifications.error);
    }
  }

  saveJob(): Promise<Job | void> {
    return this.jobService.save(this.job.toJSON())
      .then(() => {
        Notifications.success('Job Saved');
      })
      .catch((err) => {
        Notifications.error(err);
      });
  }

  saveCustomer(customer: CustomerDocument): Promise<CustomerDocument> {
    return this.customerService.create(customer.toJSON());
  }
}

