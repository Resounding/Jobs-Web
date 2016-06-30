import {Router, RouterConfiguration} from 'aurelia-router';

export class App {
    router: Router;

    configureRouter(config: RouterConfiguration, router:Router) {
        config.title = "Langendoen Mechanical Job Management Application";
        config.map([
            { route: ['', 'jobs'], name: 'jobs.list', moduleId: 'jobs/list', nav: true, title: 'Jobs List' }
        ]);
    }
}