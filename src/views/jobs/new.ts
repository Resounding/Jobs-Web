import {autoinject} from "aurelia-framework";
import {Router} from "aurelia-router";
import {JobDocument} from '../../models/job';
import {Customer} from '../../models/customer';
import {JobService} from '../../services/data/job-service';
import {JobType} from '../../models/job-type';
import {JobStatus} from '../../models/job-status';
import {Notifications} from '../../services/notifications';
import {BillingType} from "../../models/billing-type";
import {WorkType} from "../../models/work-type";

@autoinject()
export class NewJob {
    job: JobDocument;
    customers: Customer[];
    activities: string[];
    jobTypes: JobType[] = JobType.OPTIONS;
    jobStatuses: JobStatus[] = JobStatus.OPTIONS;
    billingTypes: BillingType[] = BillingType.OPTIONS;
    workTypes:WorkType[] = WorkType.OPTIONS;

    constructor(private element:Element, private router: Router) {
        this.job = new JobDocument();

        this.customers = [
            { id: 'cosmic1', name: 'Cosmic Plant 1'},
            { id: 'cosmic2', name: 'Cosmic Plant 2'},
            { id: 'creekside', name: 'Creekside'},
            { id: 'maplecrest', name: 'Maple Crest'},
            { id: 'meyers', name: 'Meyers'},
        ];
        this.activities = [
            'Boiler Cleaning',
            'Boiler Service',
            'Heater Service',
            'Insulation'
        ];
    }
    
    attached() {
        $('.dropdown.customer', this.element).dropdown();
        $('.dropdown.activity', this.element).dropdown({
            allowAdditions: true,
            onChange: (value:string):void => {
                this.job.activities = (value || '').split(',');
            }
        });
        $('#status', this.element).dropdown();
        $('#billingType', this.element).dropdown();
        $('#workType', this.element).dropdown();
        $('.calendar.start', this.element).calendar({
            type: 'date',
            onChange: date => this.job.startDate = moment(date).toDate()
        });

        var $buttonBar = $('.button-bar', this.element);
        $buttonBar.visibility({
            once: false,
            onBottomPassed: () => {
                $buttonBar.addClass('fixed top');
            },
            onBottomPassedReverse: function() {
                $buttonBar.removeClass('fixed top');
            }
        });
    }

    onIsMultiDayChange() {
        if(this.job.isMultiDay) {
            $('#days', this.element).focus();
        } else {
            this.job.days = null;
        }
    }

    onSaveClick() {
        JobService.save(this.job.toJSON())
            .then(() => {
                Notifications.success('Job Saved');
                this.router.navigateToRoute('jobs.list')
            })
            .catch((err) => {
                Notifications.error(err);
            })

    }
}