import {autoinject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import * as moment from 'moment';
import {JobService} from '../../services/data/job-service';
import {Notifications} from '../../services/notifications';
import {JobDocument} from '../../models/job';
import {JobStatus} from '../../models/job-status';
import {JobType} from '../../models/job-type';
import {isUndefined} from "../../services/utils";

@autoinject()
export class EditJob {
  job: JobDocument;
  isFollowup:boolean = false;
  startDate:string | null = null;
  endDate:string | null = null;
  jobStatusClass:string | null = null;

  constructor(private router: Router, private jobService: JobService) { }

  activate(params: any) {

    const id = params.id;

    if(isUndefined(id)) {
      this.onCancelClick();
    } else {
      return this.jobService.getOne(id)
        .then(job => {
          this.job = job;
          const start = moment(this.job.startDate),
            end = moment(this.job.endDate);

          if(start.isValid()) {
            this.startDate = start.format('ddd MMM D, YYYY');
          }
          if(end.isValid()) {
            this.endDate = end.format('ddd MMM D, YYYY');
          }
          const statuses = JobStatus.OPTIONS,
            status = statuses.find(s => s.id === job.status);

          if(status) {
            this.jobStatusClass = status.cssClass;
          }
        })
        .catch(err => {
          Notifications.error(err);
          this.router.navigateToRoute('jobs.list');
        });
    }
  }

  onCancelClick() {
    this.router.navigateBack();
  }

  get isProject() {
    return this.job.job_type === JobType.PROJECT;
  }

  get isServiceCall() {
    return this.job.job_type === JobType.SERVICE_CALL;
  }
}

