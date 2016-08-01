import {App} from '../../src/views/app';

class RouterStub {
    routes;

    configure(handler) {
        handler(this);
    }

    map(routes) {
        this.routes = routes;
    }
}

describe('the App module', () => {
   var sut, mockedRouter;

    beforeEach(() => {
        mockedRouter = new RouterStub();
        sut = new App();
        sut.configureRouter(mockedRouter, mockedRouter);
    });

    it('contains a router property', () => {
        expect(sut.router).toBeDefined();
    });

    it('configures the router config title', () => {
        expect(sut.router.title).toEqual('Langendoen Mechanical Job Management Application');
    });

    it('should have a Jobs route', () => {
       expect(sut.router.routes).toContain({route: ['', 'jobs'], name: 'jobs.list', moduleId: 'views/jobs/list', nav: true, title: 'Jobs List'});
    });

    it('should have a new Job route', () => {
       expect(sut.router.routes).toContain({route: ['jobs/new'], name: 'jobs.new', moduleId: 'views/jobs/new', nav: true, title: 'New Job'});
    });
});