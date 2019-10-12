import {autoinject, computedFrom} from 'aurelia-framework';
import {Job} from '../../models/job';
import {Notifications} from '../../services/notifications';
import {JobService} from '../../services/data/job-service';
import {contains} from '../../utilities/equals';
import { Configuration } from '../../services/config';

@autoinject
export class Search {
  allJobs:Job[] = [];
  search:string = '';
  hasFocus:boolean = false;
  isDesktop: boolean = true;

  constructor(jobService: JobService) {
    jobService.getAll()
      .then(jobs => this.allJobs = jobs)
      .catch(Notifications.error);
  }

  attached() {
    this.hasFocus = true;
    this.isDesktop = !Configuration.isMobile()
  }

  @computedFrom('search', 'allJobs')
  get jobs() {
    if(!this.search) return [];

    return this.allJobs.filter(j => {
      return contains(j.customer.name, this.search) ||
        contains(j.name, this.search);
    });
  }
}
