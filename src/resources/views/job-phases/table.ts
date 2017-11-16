import {autoinject} from 'aurelia-framework';
import {Job} from '../../models/job';
import {JobPhase} from '../../models/job-phase';
import {JobType} from '../../models/job-type';
import {JobService} from '../../services/data/job-service';
import {JobPhaseService} from '../../services/data/job-phase-service';

@autoinject
export class JobPhaseTable {
    el:Element;
    phases:JobPhase[];
    jobs:Job[];

    constructor(private jobService:JobService, private jobPhaseService:JobPhaseService) { }

    async attached() {

        const $sticky = $('.row.header', this.el);

        $sticky
            .visibility({
                onBottomPassed: () => $sticky.addClass('fixed'),
                onBottomPassedReverse: () => $sticky.removeClass('fixed'),
                continuous: true
            });

        this.phases = await this.jobPhaseService.getAll();
        const jobs = await this.jobService.getAll(),
            projects = jobs
                .filter(j => j.job_type == JobType.PROJECT);

        this.jobs = projects;        
    }    
}