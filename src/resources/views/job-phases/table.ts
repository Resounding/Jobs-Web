import {autoinject} from 'aurelia-framework';
import * as numeral from 'numeral';
import {Job} from '../../models/job';
import {JobPhase} from '../../models/job-phase';
import {JobType} from '../../models/job-type';
import {Authentication, Roles} from '../../services/auth';
import {Notifications} from '../../services/notifications';
import {JobService} from '../../services/data/job-service';
import {JobPhaseService} from '../../services/data/job-phase-service';
import {JobStatus} from '../../models/job-status';

@autoinject
export class JobPhaseTable {
    el:Element;
    phases:JobPhase[];
    items:Job[];
    filteredItems: Job[];
    myJobs: boolean = false;
    showOpen: boolean = true;
    showClosed: boolean = false;
    showCompleted: boolean = false;
    reverseSort: boolean = false;
    customerSort: boolean = false;
    showProjects: boolean = true;

    constructor(private auth:Authentication, private jobService:JobService, private jobPhaseService:JobPhaseService) { }

    async attached() {

        const $headerRow = $('.row.header', this.el);
        $headerRow
            .visibility({
                onBottomPassed: () => {
                    const width = $('.phase-list', this.el).width();
                    // you have to set the whole style attribute to override an !important
                    //  style set on .row. See https://stackoverflow.com/a/1577204
                    $headerRow.addClass('fixed').attr('style', `width: ${width}px !important`);
                },
                onBottomPassedReverse: () => {
                    $headerRow.removeClass('fixed').removeAttr('style');
                },
                continuous: true
            });

        $('.ui.toggle.checkbox', this.el)
            .checkbox({
                onChange: this.filter.bind(this)
            });

        this.phases = await this.jobPhaseService.getAll();
        await this.refresh();      
    }

    async refresh() {
        try {
            const jobs = await this.jobService.getAll(),
                projects = jobs
                    .filter(j => j.job_type == JobType.PROJECT);

            this.items = projects;  
            this.filter();

        } catch(e) {
            Notifications.error(e);
        }
    }

    filter() {
        const me = this.auth.userInfo().name;
    
        const mine = i => !this.myJobs || i.foreman === me;
        const open = i => this.showOpen && (i.status === JobStatus.PENDING || i.status === JobStatus.IN_PROGRESS);
        const completed = i => this.showCompleted && (i.status == JobStatus.COMPLETE);
        const closed = i => this.showClosed && (i.status === JobStatus.CLOSED);
        const projects = i => this.showProjects && i.job_type == JobType.PROJECT;
    
        const sortedItems = this.items.filter(i => mine(i) && (open(i) || closed(i) || completed(i)) && (projects(i)));
        sortedItems.sort((a, b) => {
            const val1 = this.customerSort ?
                (a.customer.name || '').toString().toLowerCase() + a.number :
                numeral(a.number).value(),
                val2 = this.customerSort ?
                (b.customer.name || '').toString().toLowerCase() + b.number :
                numeral(b.number).value();

            if(val1 !== val2) {
                if(val1 > val2 || val1 === void 0) return 1;
                if(val1 < val2 || val2 === void 0) return -1;
            }
            return 0;
        });
    
        if(this.reverseSort) {
          sortedItems.reverse();
        }
    
        this.filteredItems = sortedItems;
      }
}