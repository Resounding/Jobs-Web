import {autoinject, bindable, computedFrom} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
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
    
    if(Array.isArray(this.job.additionalDates) && this.job.additionalDates.length) {
      const start = [this.job.startDate, this.job.endDate],
        additionalDates = [start].concat(this.job.additionalDates),
        html = additionalDates
          .map(d => {
            const start = d[0] ? moment(d[0]).format('ddd MMM D, YYYY') : 'No start date',
              end = d[1] ? moment(d[1]).format('ddd MMM D, YYYY') : 'No end date';

            return `<p>${start} - ${end}</p>`;
          })
          .join('');

      $('.icon.asterisk', this.element).popup({
        title: 'Job dates',
        html
      })
    }
  }

  detached() {
    //if(isDevice()) {
    // swipe to reveal delete?
    //} else {
    $('.dropdown.status', this.element).dropdown('destroy');
    $('.dropdown.foreman', this.element).dropdown('destroy');
    $('.icon.asterisk', this.element).popup('destroy');
    //}
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  @computedFrom('job.startDate', 'job.additionalDates')
  get startDateDisplay(): string {
    const startDate = this.closestStartDate();
    return (startDate && startDate.isValid()) ? startDate.format('ddd MMM D, YYYY') : 'Not Scheduled';
  }

  @computedFrom('job.startDate', 'job.additionalDates')
  get endDateDisplay(): string {
    const endDate = this.closestEndDate();
    return (endDate && endDate.isValid()) ? endDate.format('ddd MMM D, YYYY') : '';
  }

  @computedFrom('job.additionalDates')
  get hasMultipleDates(): boolean {
    return Array.isArray(this.job.additionalDates) && !!this.job.additionalDates.length;
  }

  @computedFrom('job.status')
  get jobStatus(): JobStatus {
    return this.jobStatuses.find(s => s.id == this.job.status);
  }

  @computedFrom('job.foreman')
  get foremanDisplay(): string {
    return this.job.foreman || 'Unassigned';
  }

  @computedFrom('job.foreman')
  get foremanColour(): any {
    const foreman = (this.job.foreman || '').toLowerCase(),
      bg = Foreman.BackgroundColours[foreman] || 'white',
      color = bg === 'white' ? 'black' : 'white',
      margin = '1px';
    return {'background-color': bg, color, margin};
  }

  @computedFrom('job.status')
  get isPending() {
    return this.job.status === 'pending';
  }

  @computedFrom('job.status')
  get isInProgress() {
    return this.job.status === JobStatus.PENDING;
  }

  @computedFrom('job.status')
  get isComplete() {
    return this.job.status === JobStatus.COMPLETE;
  }

  @computedFrom('job.status')
  get isClosed(): boolean {
    return this.job.status === JobStatus.CLOSED;
  }

  @computedFrom('job.job_type')
  get isProject() {
    return this.job.job_type === JobType.PROJECT;
  }

  @computedFrom('job.job_type')
  get isServiceCall() {
    return this.job.job_type === JobType.SERVICE_CALL;
  }

  @computedFrom('job.job_type', 'job.number')
  get jobNumberDisplay() {
    const prefix = this.job.job_type === JobType.SERVICE_CALL ? 'S' : 'P';
    return `${prefix}-${this.job.number}`;
  }

  closestStartDate(): moment.Moment | null {
    const start = [this.job.startDate, this.job.endDate],
      additionalDates = [start].concat(this.job.additionalDates),      
      closest = additionalDates
        .map(d => {
          const start = d[0] ? moment(d[0]) : null,
            end = d[1] ? moment(d[1]) : null;

          return [start, end];
        })
        .filter(d => d[0] && d[0].isValid())
        .sort(d => d[0].toDate().getTime())
        .sort((a, b) => getScore(b) - getScore(a))
        .map(d => d[0]);

      return closest[0] || null;
  }

  closestEndDate(): moment.Moment | null {
    const start = [this.job.startDate, this.job.endDate],
      additionalDates = [start].concat(this.job.additionalDates),      
      closest = additionalDates
        .map(d => {
          const start = d[0] ? moment(d[0]) : null,
            end = d[1] ? moment(d[1]) : null;

          return [start, end];
        })
        .filter(d => d[0] && d[0].isValid())
        .sort(d => d[0].toDate().getTime())
        .sort((a, b) => getScore(b) - getScore(a))
        .map(d => d[1]);

      return closest[0] || null;
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

function getScore(dates: Array<moment.Moment | null>): number {
  const today = moment();

  if(dates[0].isSameOrBefore(today, 'day') && ((dates[1] && today.isBefore(dates[1], 'day') || !dates[1]))) {
    return 3;
  }

  if(dates[0].isAfter(today, 'day')) {
    return 2;
  }

  if(dates[0]) {
    return 1;
  }
            
  return 0;
}
