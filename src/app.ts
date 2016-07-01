import {Router, RouterConfiguration} from 'aurelia-router';

export class App {
    router:Router;

    configureRouter(config:RouterConfiguration, router:Router) {
        config.title = 'Langendoen Mechanical Job Management Application';
        config.map([
            {route: ['', 'jobs'], name: 'jobs.list', moduleId: 'views/jobs/list', nav: true, title: 'Jobs List'},
            {route: ['jobs/new'], name: 'jobs.new', moduleId: 'views/jobs/new', title: 'New Job'}
        ]);

        this.router = router;
    }
}