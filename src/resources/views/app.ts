import {Router, RouterConfiguration} from 'aurelia-router';
import {AuthorizeStep} from '../services/auth';
import * as data from 'text!../../../package.json';

export class App {
    router:Router;
    footerText:string;

    activate() {
        const pkg = JSON.parse(data);
        this.footerText = `&copy; ${new Date().getFullYear()} ${pkg.publisher} v${pkg.version}`;
    }

    configureRouter(config:RouterConfiguration, router:Router) {
        config.addPipelineStep('authorize', AuthorizeStep);
        config.title = 'Langendoen Mechanical Job Management Application';
        config.map([
            {route: ['', 'jobs'], name: 'jobs.list', moduleId: 'resources/views/jobs/list', title: 'Jobs List', nav: true, auth: true, settings: { icon: 'browser', mobileTitle: 'Jobs' }},
            {route: 'jobs/new', name: 'jobs.new', moduleId: 'resources/views/jobs/detail', title: 'New Job', nav: true, auth: true, settings: { icon: 'plus', mobileTitle: 'New' }},
            {route: 'jobs/:id', name: 'jobs.edit', moduleId: 'resources/views/jobs/detail', title: 'Edit Job', auth: true},
            {route: 'customers', name: 'customers.list', moduleId: 'resources/views/customers/list', title: 'Customer List', nav: true, auth: true, settings: { icon: 'building outline', hideMobile: true }},
            {route: 'calendar/:date?', href: '#calendar', name: 'calendar', moduleId: 'resources/views/calendar/calendar', title: 'Calendar', nav: true, auth: true, settings: { icon: 'calendar', hideMobile: true }},
            {route: 'calendar/mobile/:date?', href: '#calendar/mobile', name: 'calendar.mobile', moduleId: 'resources/views/calendar/mobile', title: 'Calendar', nav: true, auth: true, settings: { icon: 'calendar', hideDesktop: true, mobileTitle: 'Cal' }}
        ]);

        this.router = router;
    }
}
