import {autoinject} from 'aurelia-framework';
import {NavigationInstruction, Router, RouteConfig} from 'aurelia-router';
import {DialogService, DialogCloseResult} from 'aurelia-dialog';
import * as $ from 'jquery';
import 'semantic-ui-calendar';
import * as moment from 'moment';
import {Prompt} from '../controls/prompt';
import {isUndefined, isString, isDate} from '../../services/utils';
import {CustomerService} from '../../services/data/customer-service';
import {JobService} from '../../services/data/job-service';
import {QuoteService} from '../../services/data/quote-service';
import {Notifications} from '../../services/notifications';
import {QuoteDocument} from '../../models/quote';
import {CustomerDocument} from '../../models/customer';
import {JobDocument} from '../../models/job';
import {JobType} from '../../models/job-type';
import {JobStatus} from '../../models/job-status';
import {BillingType} from "../../models/billing-type";
import {WorkType} from "../../models/work-type";


@autoinject()
export class EditJob {
  el: Element;
  quote: QuoteDocument;
  customers: CustomerDocument[];
  customerServicePromise:Promise<any>;
  activities: string[];
  jobTypes: JobType[] = JobType.OPTIONS;
  jobStatuses: JobStatus[] = JobStatus.OPTIONS;
  billingTypes: BillingType[] = BillingType.OPTIONS;
  workTypes: WorkType[] = WorkType.OPTIONS;
  isFollowup:boolean = false;
  errors:string[];

  constructor(private router: Router, private quoteService: QuoteService, private customerService: CustomerService, private jobService:JobService,
    private dialogService:DialogService) {

    this.customerServicePromise = customerService.getAll()
      .then(customers => this.customers = customers)
      .catch(Notifications.error);
  }

  async activate(params: any, routeConfig:RouteConfig, navigationInstruction:NavigationInstruction) {

    try {
      this.customers = await this.customerService.getAll();

      const id = params.id,
      date = moment(params.date, 'YYYY-MM-DD');

      if(isUndefined(id)) {
        this.quote = new QuoteDocument();
        if (isString(params.type)) {
          this.quote.type = params.type;
        }

        if(!isUndefined(params.date) && date.isValid()) {
          this.quote.startDate = date.toDate();
          $('.calendar.start', this.el).calendar('set date', this.quote.startDate);
        }
      } else {

        const quote = await this.quoteService.getOne(id);
        this.quote = new QuoteDocument(quote);

        if (isDate(this.quote.startDate)) {
          $('.calendar.start', this.el).calendar('set date', this.quote.startDate);
        }

        if(isDate(this.quote.endDate)) {
          $('.calendar.end', this.el).calendar('set date', this.quote.endDate);
        }

        if(this.quote.customer) {
          $('.customer', this.el).dropdown('set selected', this.quote.customer.name);
          $('.customer', this.el).dropdown('set value', this.quote.customer._id);
        }

        if(this.quote.status) {
          $('#status', this.el).dropdown('set selected', this.quote.status);
          $('#status', this.el).dropdown('set value', this.quote.status);
        }
      }
    } catch(e) {
      Notifications.error(e);
    }
  }

  attached() {
    $('.dropdown.customer', this.el).dropdown({
      allowAdditions: true,
      hideAdditions: false,
      fullTextSearch: 'exact',
      match: 'text',
      onChange: (value: string): void => {
        this.quote.customer = this.customers.find(c => c._id === value);
        if (!this.quote.customer) {
          this.quote.customer = new CustomerDocument();
          this.quote.customer.name = value;
        }
      }
    });
    $('.dropdown.basic.button', this.el).dropdown();
    $('#status', this.el).dropdown();
    $('#billingType', this.el).dropdown();
    $('#workType', this.el).dropdown();
    $('.calendar.start', this.el).calendar({
      type: 'date',
      onChange: date => this.quote.startDate = moment(date).toDate()
    });
    $('.calendar.end', this.el).calendar({
      type: 'date',
      onChange: date => this.quote.endDate = moment(date).toDate()
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
    $('.dropdown.activity', this.el).dropdown('destroy');
    $('#status', this.el).dropdown('destroy');
    $('#billingType', this.el).dropdown('destroy');
    $('#workType', this.el).dropdown('destroy');
    $('.calendar.start', this.el).calendar('destroy');
    $('.calendar.end', this.el).calendar('destroy');
    $('.button-bar', this.el).visibility('destroy');
    $('.dropdown.basic.button', this.el).dropdown('destroy');
  }

  get customer_id(): string {
    return (this.quote && this.quote.customer) ? this.quote.customer._id : null;
  }

  set customer_id(value:string) {
    const customer = this.customers.find(c => c._id === value);
    if(customer) {
      this.quote.customer = customer;
    }
  }

  onIsMultiDayChange() {
    if (this.quote.isMultiDay) {
      $('#days', this.el).focus();
    } else {
      this.quote.days = null;
    }
  }

  async onSaveClick() {
    try {

      this.errors = [];

      if(this.quote.customer && !this.customer_id) {
        const customer = await this.saveCustomer(this.quote.customer);
        this.quote.customer = customer;
      }

      const result = await this.quoteService.save(this.quote);
      if(result.ok) {
        Notifications.success('Quote Saved');
        this.router.navigateBack();
      } else {
        this.errors = result.errors;
      }

    } catch(e) {
      Notifications.error(e);
    }    
  }

  onCancelClick() {
    this.router.navigateBack();
  }

  async onConvertToJobClick() {
    try {
      this.quote.type = JobDocument.DOCUMENT_TYPE;
      const job = new JobDocument(this.quote);
      await this.jobService.save(job);
      this.router.navigateToRoute('jobs.edit', { id: job._id });
    
    } catch(e) {
      Notifications.error(e)
    }
  }

  onDeleteClick() {
    this.dialogService.open({ viewModel: Prompt, model: 'Are you sure you want to delete this job?'})
      .whenClosed(async (result:DialogCloseResult) => {
        if(result.wasCancelled) return;

        try {

          await this.quoteService.delete(this.quote);
          Notifications.success('Quote Deleted');
          this.router.navigateBack();

        } catch(e) {
          Notifications.error(e);
        }
      });
  }

  saveCustomer(customer: CustomerDocument): Promise<CustomerDocument> {
    return this.customerService.create(customer.toJSON());
  }
}

