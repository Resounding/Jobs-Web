import {autoinject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {DialogService} from 'aurelia-dialog';
import * as $ from 'jquery';
import 'semantic-ui-calendar';
import * as moment from 'moment';
import {Prompt} from '../controls/prompt';
import {JobService} from '../../services/data/job-service';
import {CustomerService} from '../../services/data/customer-service';
import {Notifications} from '../../services/notifications';
import {Job, JobDocument} from '../../models/job';
import {CustomerDocument} from '../../models/customer';
import {JobType} from '../../models/job-type';
import {JobStatus} from '../../models/job-status';
import {BillingType} from "../../models/billing-type";
import {WorkType} from "../../models/work-type";
import {Authentication} from "../../services/auth";
import {isUndefined, isString, isDate} from "../../services/utils";

@autoinject()
export class EditJob {
  job: JobDocument;
  customers: CustomerDocument[];
  customerServicePromise:Promise<any>;
  activities: string[];
  jobTypes: JobType[] = JobType.OPTIONS;
  jobStatuses: JobStatus[] = JobStatus.OPTIONS;
  billingTypes: BillingType[] = BillingType.OPTIONS;
  workTypes: WorkType[] = WorkType.OPTIONS;
  isFollowup:boolean = false;

  constructor(private element: Element, private router: Router, private jobService: JobService, private customerService: CustomerService, auth: Authentication, private dialogService:DialogService) {

    this.customerServicePromise = customerService.getAll()
      .then((customers:CustomerDocument[]) => this.customers = customers)
      .catch(Notifications.error);
  }

  activate(params: any) {

    this.customerServicePromise.then(() => {
      const id = params.id,
        date = moment(params.date, 'YYYY-MM-DD'),
        el = this.element;

      if(isUndefined(id)) {
        this.job = new JobDocument();
        if (isString(params.type)) {
          this.job.type = params.type;
        }

        if(!isUndefined(params.date) && date.isValid()) {
          this.job.startDate = date.toDate();
          $('.calendar.start', this.element).calendar('set date', this.job.startDate);
        }

        if (params.from) {
          this.jobService.getOne(params.from)
            .then((prev:JobDocument) => {
              this.isFollowup = true;
              this.job.customer = prev.customer;
            });
        }
      } else {
        this.jobService.getOne(id)
          .then((job:JobDocument) => {
            this.job = job;

            if (isDate(job.startDate)) {
              $('.calendar.start', this.element).calendar('set date', job.startDate);
            }

            if(isDate(job.endDate)) {
              $('.calendar.end', this.element).calendar('set date', job.endDate);
            }            

            if(job.customer) {
              $('.customer', this.element).dropdown('set selected', job.customer.name);
              $('.customer', this.element).dropdown('set value', job.customer._id);
            }

            if(job.status) {
              $('#status', this.element).dropdown('set selected', job.status);
              $('#status', this.element).dropdown('set value', job.status);
            }

            window.setTimeout(() => {
              if(Array.isArray(job.additionalDates) && job.additionalDates.length) {
                job.additionalDates.forEach((d, i) => {
                  let date: Date | null = null;
                  if (isDate(d[0])) {
                    date = d[0]
                  } else if(isString(d[0])) {
                    date = moment(d[0]).toDate();
                  }

                  if(date) {
                    $(`.calendar.start-${i}`, this.element)
                      .calendar({
                        type: 'date',
                        onChange: d => this.job.additionalDates[i][0] = moment(d).toDate()
                      })
                      .calendar('set date', date);
                  }

                  date = null;
                  if (isDate(d[1])) {
                    date = d[1]
                  } else if(isString(d[1])) {
                    date = moment(d[1]).toDate();
                  }
      
                  if(date) {
                    $(`.calendar.end-${i}`, this.element)
                      .calendar({
                        type: 'date',
                        onChange: d => this.job.additionalDates[i][1] = moment(d).toDate()
                      })
                      .calendar('set date', date);
                  }
                });
              }
            }, 100);

          })
          .catch(err => {
            Notifications.error(err);
            this.router.navigateToRoute('jobs.list');
          });
      }
    });
  }

  attached() {
    $('.dropdown.customer', this.element).dropdown({
      allowAdditions: true,
      hideAdditions: false,
      fullTextSearch: 'exact',
      match: 'text',
      onChange: (value: string): void => {
        this.job.customer = this.customers.find(c => c._id === value);
        if (!this.job.customer) {
          this.job.customer = new CustomerDocument();
          this.job.customer.name = value;
        }
      }
    });
    $('.dropdown.basic.button', this.element).dropdown();
    $('#status', this.element).dropdown();
    $('#billingType', this.element).dropdown();
    $('#workType', this.element).dropdown();
    $('.calendar.start', this.element).calendar({
      type: 'date',
      onChange: date => this.job.startDate = moment(date).toDate()
    });
    $('.calendar.end', this.element).calendar({
      type: 'date',
      onChange: date => this.job.endDate = moment(date).toDate()
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
    $('.dropdown.activity', this.element).dropdown('destroy');
    $('#status', this.element).dropdown('destroy');
    $('#billingType', this.element).dropdown('destroy');
    $('#workType', this.element).dropdown('destroy');
    $('.calendar', this.element).calendar('destroy');
    $('.button-bar', this.element).visibility('destroy');
    $('.dropdown.basic.button', this.element).dropdown('destroy');
  }

  get customer_id(): string {
    return (this.job && this.job.customer) ? this.job.customer._id : null;
  }

  set customer_id(value:string) {
    var customer = this.customers.find(c => c._id === value);
    if(customer) {
      this.job.customer = customer;
    }
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
      this.saveJob();
    } else {
      this.saveCustomer(this.job.customer)
        .then((customer:CustomerDocument) => {
          this.job.customer = customer;
          this.saveJob();
        })
        .catch(Notifications.error);
    }
  }

  onCancelClick() {
    this.router.navigateBack();
  }

  onDeleteClick() {
    this.dialogService.open({ viewModel: Prompt, model: 'Are you sure you want to delete this job?'})
      .whenClosed(result => {
        if(result.wasCancelled) return;

        this.jobService.delete(this.job.toJSON())
          .then(() => {
            Notifications.success('Job Deleted');
            this.router.navigateBack();
          })
          .catch(Notifications.error);
      });
  }

  saveJob(): Promise<Job | void> {
    return this.jobService.save(this.job.toJSON())
      .then(() => {
        Notifications.success('Job Saved');
        this.router.navigateToRoute('jobs.list');
      })
      .catch((err) => {
        Notifications.error(err);
      });
  }

  saveCustomer(customer: CustomerDocument): Promise<CustomerDocument> {
    return this.customerService.create(customer.toJSON());
  }
}

