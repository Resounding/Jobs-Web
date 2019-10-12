import {autoinject} from 'aurelia-framework';
import {Router, RouterConfiguration} from 'aurelia-router';
import {AuthorizeStep, Authentication, Roles} from '../services/auth';
//@ts-ignore
import * as data from 'text!../../../package.json';

@autoinject
export class App {
    router:Router;
    footerText:string;

    constructor(private auth:Authentication) { }

    activate() {
        const pkg = JSON.parse(data);
        this.footerText = `&copy; ${new Date().getFullYear()} ${pkg.publisher} v${pkg.version}`;
    }

    configureRouter(config:RouterConfiguration, router:Router) {
        config.addPipelineStep('authorize', AuthorizeStep);
        config.title = 'Langendoen Mechanical Job Management Application';
        config.map([
            {route: ['', 'jobs'], name: 'jobs.list', moduleId: 'resources/views/jobs/list', title: 'Jobs List', nav: true, auth: true, settings: { icon: 'browser', mobileTitle: '' }}
        ]);


        if(this.auth.isInRole(Roles.Owner)) {
          config.map([
            {route: 'jobs/:id', name: 'jobs.edit', moduleId: 'resources/views/jobs/detail', title: 'Edit Job', auth: true},
            {route: 'jobs/new', name: 'jobs.new', moduleId: 'resources/views/jobs/detail', title: 'New Job', nav: true, auth: true, settings: { icon: 'plus square outline', mobileTitle: '' }},            
            {route: 'customers', name: 'customers.list', moduleId: 'resources/views/customers/list', title: 'Customer List', nav: true, auth: true, settings: { icon: 'building outline', hideMobile: true, showInSettings: true }}
          ])
        } else {
          config.map([
            {route: 'jobs/:id', name: 'jobs.edit', moduleId: 'resources/views/jobs/display', title: 'Edit Job', auth: true},
          ])
        }

        config.map([
          {route: 'calendar/:date?', href: '#calendar', name: 'calendar', moduleId: 'resources/views/calendar/calendar', title: 'Calendar', nav: true, auth: true, settings: { icon: 'calendar', mobileTitle: '' } }
        ]);

        if(this.auth.isInRole(Roles.OfficeAdmin)) {
            config.map([
                {route: 'quotes', name: 'quotes.list', moduleId: 'resources/views/quotes/list', title: 'Quotes List', nav: true, auth: true, settings: { icon: 'edit', mobileTitle: '' }},
                {route: 'quotes/new', name: 'quotes.new', moduleId: 'resources/views/quotes/detail', title: 'New Quote', auth: true, settings: { icon: 'plus' }},
                {route: 'quotes/:id', name: 'quotes.edit', moduleId: 'resources/views/quotes/detail', title: 'Edit Quote', auth: true},
                {route: 'job-phases/list', name: 'job.phases.list', moduleId: 'resources/views/job-phases/list', title: 'Job Phases', nav: true, auth: true, settings: { icon: 'tasks', hideMobile: true, showInSettings: true }},
                {route: 'job-phases', name: 'job.phases.table', moduleId: 'resources/views/job-phases/table', title: 'Phase List', nav: true, auth: true, settings: { icon: 'table', hideMobile: true }},
            ])
        }

        config.map([
          {route: 'search', name: 'search', moduleId: 'resources/views/jobs/search', title: 'Search', nav: true, auth: true, settings: { icon: 'search', mobileTitle: '' } }
        ]);

        this.router = router;
    }
}
