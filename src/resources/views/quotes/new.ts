import {autoinject} from 'aurelia-framework';
import {Router, RouteConfig} from 'aurelia-router';
import * as $ from 'jquery';
import 'semantic-ui-calendar';
import * as moment from 'moment';
import * as _ from 'underscore';
import {QuoteService} from '../../services/data/quote-service';
import {CustomerService} from '../../services/data/customer-service';
import {ActivitiesService} from '../../services/data/activities-service';
import {Notifications} from '../../services/notifications';
import {Quote, QuoteDocument} from '../../models/quote';
import {CustomerDocument} from '../../models/customer';
import {JobType} from '../../models/job-type';
import {JobStatus} from '../../models/job-status';
import {BillingType} from "../../models/billing-type";
import {WorkType} from "../../models/work-type";
import {isString} from '../../services/utils';

@autoinject()
export class NewQuote {
  el:Element;
  quote: QuoteDocument;
  customers: CustomerDocument[];
  jobTypes: JobType[] = JobType.OPTIONS;
  jobStatuses: JobStatus[] = JobStatus.OPTIONS;
  billingTypes: BillingType[] = BillingType.OPTIONS;
  workTypes: WorkType[] = WorkType.OPTIONS;
  isFollowup:boolean = false;

  constructor(private router: Router, private quoteService: QuoteService, private customerService: CustomerService) {
    this.quote = new QuoteDocument();
    customerService.getAll()
      .then(customers => this.customers = customers)
      .catch(Notifications.error);
  }

  activate(params: any, routeConfig: RouteConfig) {
    routeConfig.title = this.title;

    if (isString(params.type)) {
      this.quote.type = params.type;
    }

    if (params.from) {
      this.quoteService.getOne(params.from)
        .then(prev => {
          this.isFollowup = true;
          this.quote.customer = prev.customer;
        });
    }
  }

  attached() {
    $('.dropdown.customer', this.el).dropdown({
      allowAdditions: true,
      hideAdditions: false,
      fullTextSearch: true,
      onChange: (value: string): void => {
        this.quote.customer = this.customers.find(c => c._id === value);
        if (!this.quote.customer) {
          this.quote.customer = new CustomerDocument();
          this.quote.customer.name = value;
        }
      }
    });

    $('#status', this.el).dropdown();
    $('#billingType', this.el).dropdown();
    $('#workType', this.el).dropdown();
    $('.calendar.start', this.el).calendar({
      type: 'date',
      onChange: date => this.quote.startDate = moment(date).toDate()
    });

    const $buttonBar = $('.button-bar', this.el);
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
    $('.dropdown.customer', this.el).dropdown('destroy');
    $('#status', this.el).dropdown('destroy');
    $('#billingType', this.el).dropdown('destroy');
    $('#workType', this.el).dropdown('destroy');
    $('.calendar.start', this.el).calendar('destroy');
    $('.button-bar', this.el).visibility('destroy');
  }

  get title() {
    return 'New Quote';
  }

  get customer_id(): string {
    return this.quote.customer ? this.quote.customer._id : null;
  }

  onIsMultiDayChange() {
    if (this.quote.isMultiDay) {
      $('#days', this.el).focus();
    } else {
      this.quote.days = null;
    }
  }

  onSaveClick() {
    if (this.customer_id) {
      this.saveJob()
        .then(() => this.router.navigateToRoute('jobs.list'));
    } else {
      this.saveCustomer(this.quote.customer)
        .then(customer => {
          this.quote.customer = customer;
          this.saveJob()
            .then(() => this.router.navigateToRoute('jobs.list'));
        })
        .catch(Notifications.error);
    }
  }

  saveJob(): Promise<Job | void> {
    return this.jobService.save(this.quote.toJSON())
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

