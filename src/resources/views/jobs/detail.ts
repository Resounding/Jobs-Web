import {autoinject} from "aurelia-framework";
import {Router} from "aurelia-router";
import {JobService} from '../../services/data/job-service';
import {CustomerService} from '../../services/data/customer-service';
import {ActivitiesService} from '../../services/data/activities-service';
import {Notifications} from '../../services/notifications';
import {Job, JobDocument} from '../../models/job';
import {CustomerDocument} from '../../models/customer';
import {JobType} from '../../models/job-type';
import {JobStatus} from '../../models/job-status';
import {BillingType} from "../../models/billing-type";
import {WorkType} from "../../models/work-type";
import {RouteConfig} from "aurelia-router";

@autoinject()
export class EditJob {
  job: JobDocument;
  customers: CustomerDocument[];
  customerServicePromise:Promise;
  activities: string[];
  jobTypes: JobType[] = JobType.OPTIONS;
  jobStatuses: JobStatus[] = JobStatus.OPTIONS;
  billingTypes: BillingType[] = BillingType.OPTIONS;
  workTypes: WorkType[] = WorkType.OPTIONS;
  isFollowup:boolean = false;
  routeConfig: RouteConfig;

  constructor(private element: Element, private router: Router, private jobService: JobService, private customerService: CustomerService) {

    this.customerServicePromise = customerService.getAll()
      .then(customers => this.customers = customers)
      .catch(Notifications.error);
  }

  activate(params: any, routeConfig: RouteConfig) {
    this.routeConfig = routeConfig;

    this.customerServicePromise.then(() => {
      const id = params.id;
      if(_.isUndefined(id)) {
        this.job = new JobDocument();
        if (_.isString(params.type)) {
          this.job.type = params.type;
        }

        if (params.from) {
          this.jobService.getOne(params.from)
            .then(prev => {
              this.isFollowup = true;
              this.job.customer = prev.customer;
            });
        }
      } else {
        this.jobService.getOne(id)
          .then(job => {
            this.job = job;

            if (_.isDate(job.startDate)) {
              $('.calendar.start', this.element).calendar('set date', job.startDate);
            }

            if(_.isDate(job.endDate)) {
              $('.calendar.end', this.element).calendar('set date', job.endDate);
            }

            if(job.customer) {
              $('.customer', this.element).dropdown('set selected', job.customer.name);
              $('.customer', this.element).dropdown('set value', job.customer._id);
            }

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
        this.job.customer = _.find(this.customers, c => c._id === value);
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
    $('.calendar.start', this.element).calendar('destroy');
    $('.calendar.end', this.element).calendar('destroy');
    $('.button-bar', this.element).visibility('destroy');
    $('.dropdown.basic.button', this.element).dropdown('destroy');
  }

  get customer_id(): string {
    return (this.job && this.job.customer) ? this.job.customer._id : null;
  }

  set customer_id(value:string) {
    var customer = _.findWhere(this.customers, c => c._id === value);
    if(customer) {
      this.job.customer = customer;
    }
  }

  onIsMultiDayChange() {
    if (this.job.isMultiDay) {
      $('#days', this.element).focus();
    } else {
      this.job.days = null;
    }
  }

  onSaveClick() {
    this.saveJob()
      .then(() => this.router.navigateToRoute('jobs.list'))
      .catch(Notifications.error);
  }

  onDeleteClick() {
    return this.jobService.delete(this.job.toJSON())
      .then(() => {
        Notifications.success('Job Deleted');
        this.router.navigateToRoute('jobs.list');
      })
      .catch(Notifications.error);
  }

  saveJob(): Promise<Job> {
    return this.jobService.save(this.job.toJSON())
      .then(() => {
        Notifications.success('Job Saved');
      })
      .catch((err) => {
        Notifications.error(err);
      });
  }
}
