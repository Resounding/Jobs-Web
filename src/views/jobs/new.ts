import {autoinject} from "aurelia-framework";
import {Router} from "aurelia-router";
import {Job, JobDocument} from '../../models/job';
import {Customer} from '../../models/customer';
import {JobService} from '../../services/data/job-service';
import {Notifications} from '../../services/notifications';

@autoinject()
export class NewJob {
    job: JobDocument;
    customers: Customer[];
    activities: string[];

    constructor(private element:Element, private router: Router, private notifications: Notifications, private jobService:JobService) {
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
            allowAdditions: true
        });
        $('#status', this.element).dropdown();
        $('#billingType', this.element).dropdown();
        $('#jobType', this.element).dropdown();
        $('.calendar.start', this.element).calendar({
            type: 'date'
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
        this.jobService.save(this.job.toJSON())
            .then(() => {
                this.notifications.success('Job Saved');
                this.router.navigateToRoute('jobs.list')
            })
            .catch((err) => {
                this.notifications.error(err);
            })

    }
}