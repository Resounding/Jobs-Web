import {autoinject, bindable, computedFrom, containerless} from 'aurelia-framework';
import * as moment from 'moment';
import {Quote, QuoteDocument} from '../../models/quote';
import {JobStatus} from '../../models/job-status';
import {JobType} from '../../models/job-type';
import {Foreman} from '../../models/foreman';
import {QuoteService} from '../../services/data/quote-service';
import {Notifications} from '../../services/notifications';
import {Authentication, Roles} from '../../services/auth';

@autoinject
@containerless
export class ListItem {
  @bindable quote:Quote;
  el:Element;
  expanded: boolean = false;
  foremen: string[] = Foreman.OPTIONS;
  jobStatuses: JobStatus[] = JobStatus.OPTIONS;

  constructor(private quoteService:QuoteService, private auth:Authentication) {
    // only office admin can close jobs
    if (!this.auth.isInRole(Roles.OfficeAdmin)) {
      var close = this.jobStatuses.findIndex(status => status.id === JobStatus.CLOSED);
      if (close !== -1) {
        this.jobStatuses.splice(close, 1);
      }
    }
  }

  attached() {

    $('.dropdown.status', this.el).dropdown({
      onChange: this.onStatusChanged.bind(this)
    });
    $('.dropdown.foreman', this.el).dropdown({
      onChange: this.onForemanChanged.bind(this)
    });
  }

  detached() {
    $('.dropdown.status', this.el).dropdown('destroy');
    $('.dropdown.foreman', this.el).dropdown('destroy');
  }

  toggleExpanded() {
    this.expanded = !this.expanded;
  }

  @computedFrom('quote.startDate')
  get startDateDisplay(): string {

    let display = 'Not Scheduled';

    if (this.quote.startDate) {
      display = moment(this.quote.startDate).format('ddd, MMM Do');
    }

    return display;
  }

  @computedFrom('quote.endDate')
  get endDateDisplay(): string {
    let display = '';

    if (this.quote.endDate) {
      display = moment(this.quote.endDate).format('ddd, MMM Do');
    }

    return display;
  }

  @computedFrom('quote.status')
  get jobStatus(): JobStatus {
    return this.jobStatuses.find(s => s.id == this.quote.status);
  }

  @computedFrom('quote.foreman')
  get foremanDisplay(): string {
    return this.quote.foreman || 'Unassigned';
  }

  @computedFrom('quote.foreman')
  get foremanColour(): any {
    const foreman = (this.quote.foreman || '').toLowerCase(),
      bg = Foreman.BackgroundColours[foreman] || 'white',
      color = bg === 'white' ? 'black' : 'white',
      margin = '1px';
    return {'background-color': bg, color, margin};
  }

  @computedFrom('quote.status')
  get isPending() {
    return this.quote.status === 'pending';
  }

  @computedFrom('quote.status')
  get isInProgress() {
    return this.quote.status === JobStatus.PENDING;
  }

  @computedFrom('quote.status')
  get isComplete() {
    return this.quote.status === JobStatus.COMPLETE;
  }

  @computedFrom('quote.status')
  get isClosed(): boolean {
    return this.quote.status === JobStatus.CLOSED;
  }

  @computedFrom('quote.job_type')
  get isProject() {
    return this.quote.job_type === JobType.PROJECT;
  }

  @computedFrom('quote.job_type')
  get isServiceCall() {
    return this.quote.job_type === JobType.SERVICE_CALL;
  }

  @computedFrom('quote.job_type', 'quote.number')
  get jobNumberDisplay() {
    return `Q-${this.quote.number}`;
  }

  onStatusChanged(value: string) {
    this.quote.status = value;

    this.save('Status');
  }

  onForemanChanged(value: string) {
    this.quote.foreman = value;
    this.save('Foreman');
  }

  async save(field: string): Promise<void> {
    try {

      const quote = new QuoteDocument(this.quote),
        response = await this.quoteService.save(quote);
      if(response.ok && response.payload) {
        this.quote._rev = response.payload.rev;
      }
      Notifications.success(`${field} updated`);

    } catch(e) {
      Notifications.error(e);
    }
  }
}
