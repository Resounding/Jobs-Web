import {autoinject, bindable} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import * as moment from 'moment';
import {Job} from '../../models/job';
import {JobStatus} from '../../models/job-status';
import {JobType} from '../../models/job-type';
import {Foreman} from '../../models/foreman';
import {JobService} from '../../services/data/job-service';
import {Notifications} from '../../services/notifications';
import {Authentication, Roles} from '../../services/auth';
import {CloseJobArgs} from './close-job';
import {equals} from '../../utilities/equals';

@autoinject()
export class ListItem {
  @bindable job: Job;
  expanded: boolean = false;
  foremen: string[] = Foreman.OPTIONS;
  jobStatuses: JobStatus[] = JobStatus.OPTIONS;

  constructor(private element: Element, private jobService: JobService, private auth: Authentication, private events: EventAggregator) {
    // only office admin can close jobs
    if (!this.auth.isInRole(Roles.OfficeAdmin)) {
      var close = this.jobStatuses.findIndex(status => equals(status.id, JobStatus.CLOSED));
      if (close !== -1) {
        this.jobStatuses.splice(close, 1);
      }
    }    
  }

  attached() {
    //prevent changing these
    if(this.auth.isInRole(Roles.Owner)) {
      $('.dropdown.status', this.element).dropdown({
        onChange: this.onStatusChanged.bind(this)
      });
      $('.dropdown.foreman', this.element).dropdown({
        onChange: this.onForemanChanged.bind(this)
      });
    } else {
      this.foremen = [];
      
      const status = this.jobStatuses.find(s => equals(s.id, this.job.status));
      if(status) {
        this.jobStatuses = [status];
      }
    }    
  }

  detached() {
    //if(isDevice()) {
    // swipe to reveal delete?
    //} else {
    $('.dropdown.status', this.element).dropdown('destroy');
    $('.dropdown.foreman', this.element).dropdown('destroy');
    //}
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  get startDateDisplay(): string {

    let display = 'Not Scheduled';

    if (this.job.startDate) {
      display = moment(this.job.startDate).format('ddd MMM D, YYYY');
    }

    return display;
  }

  get endDateDisplay(): string {
    let display = '';

    if (this.job.endDate) {
      display = moment(this.job.endDate).format('ddd MMM D, YYYY');
    }

    return display;
  }

  get jobStatus(): JobStatus {
    return this.jobStatuses.find(s => s.id == this.job.status);
  }

  get foremanDisplay(): string {
    return this.job.foreman || 'Unassigned';
  }

  get foremanColour(): any {
    const foreman = (this.job.foreman || '').toLowerCase(),
      bg = Foreman.BackgroundColours[foreman] || 'white',
      color = bg === 'white' ? 'black' : 'white',
      margin = '1px';
    return {'background-color': bg, color, margin};
  }

  get isPending() {
    return this.job.status === 'pending';
  }

  get isInProgress() {
    return this.job.status === JobStatus.PENDING;
  }

  get isComplete() {
    return this.job.status === JobStatus.COMPLETE;
  }

  get isClosed(): boolean {
    return this.job.status === JobStatus.CLOSED;
  }

  get isProject() {
    return this.job.job_type === JobType.PROJECT;
  }

  get isServiceCall() {
    return this.job.job_type === JobType.SERVICE_CALL;
  }

  get jobNumberDisplay() {
    const prefix = this.job.job_type === JobType.SERVICE_CALL ? 'S' : 'P';
    return `${prefix}-${this.job.number}`;
  }

  onStatusChanged(value: string) {
    this.job.status = value;

    this.save('Status')
      .then(() => {
        if (value === JobStatus.CLOSED) {
          this.events.publish(CloseJobArgs.ShowModalEvent, this.job._id);
        }
      });
  }

  onForemanChanged(value: string) {
    this.job.foreman = value;
    this.save('Foreman');
  }

  save(field: string): Promise<void> {
    return this.jobService.save(this.job)
      .then(response => {
        this.job._rev = response.rev;
        Notifications.success(`${field} updated`);
      })
      .catch(Notifications.error);
  }
}
