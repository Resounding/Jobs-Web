import {NavigationInstruction, RouteConfig, Router} from 'aurelia-router';
import {autoinject} from 'aurelia-framework';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {ViewObject, EventObject, Options} from 'fullcalendar';
import * as fullcalendar from 'fullcalendar';
import * as $ from 'jquery';
import * as moment from 'moment';
import {JobListFilters} from '../jobs/job-list-filters';
import {Foreman} from '../../models/foreman';
import {JobStatus} from '../../models/job-status';
import {JobType} from '../../models/job-type';
import {Job, JobDocument} from '../../models/job';
import {Configuration} from '../../services/config';
import {Database} from '../../services/data/db';
import {JobService} from '../../services/data/job-service';
import {Notifications} from '../../services/notifications';
import {Authentication, Roles} from '../../services/auth';
import {equals} from '../../utilities/equals'
import { JobPhaseStatuses } from '../../models/job-phase-status';

// for some reason, without this, we get a $().fullCalendar
//  doesn't exist error.
const z = fullcalendar;

@autoinject
export class Calendar {
    cal:JQuery;
    date:Date;
    createdSubscription:Subscription;
    updatedSubscription:Subscription;
    deletedSubscription:Subscription;
    optionsExpanded:boolean = false;
    canCreate:boolean = false;
    myJobs: boolean = true;
    showOpen: boolean = true;
    showClosed: boolean = false;
    showCompleted: boolean = false;
    filters:JobListFilters | null = null;
    activeJobs:Job[] = [];

    constructor(private jobService: JobService, private router:Router, private element:Element, private events:EventAggregator,
        private auth:Authentication) {
          const owner = auth.isInRole(Roles.Owner)
          this.canCreate = owner;
          if(!owner) {
            this.filters = JobListFilters.load(this);
            Object.assign(this, this.filters);
          }
        }

    activate(params:any, routeConfig: RouteConfig, navigationInstruction:NavigationInstruction) {

        this.createdSubscription = this.events.subscribe(Database.DocumentCreatedEvent, this.onDocumentCreated.bind(this));
        this.updatedSubscription = this.events.subscribe(Database.DocumentUpdatedEvent, this.onDocumentUpdated.bind(this));
        this.deletedSubscription = this.events.subscribe(Database.DocumentDeletedEvent, this.onDocumentDeleted.bind(this));

        let d = moment(navigationInstruction.params.date, 'YYYY-MM-DD');
        if(!d.isValid()) {
            d = moment();
        }
        this.date = d.toDate();
    }

    deactivate() {
        this.createdSubscription.dispose();
        this.updatedSubscription.dispose();
        this.deletedSubscription.dispose();
    }

    async attached() {        
        await this.fillCalendar();
        await this.fillActiveJobs();
    }

    async fillCalendar() {
      const me = this.auth.userInfo().name,
        mine = i => !this.myJobs || equals(i.foreman, me),
        open = i => this.showOpen && (equals(i.status, JobStatus.PENDING) || equals(i.status, JobStatus.IN_PROGRESS)),
        completed = i => this.showCompleted && (equals(i.status, JobStatus.COMPLETE)),
        closed = i => this.showClosed && (equals(i.status, JobStatus.CLOSED)),
        items = await this.jobService.getAll(),
        events = items
          .filter(i => i.startDate)
          .filter(i => !this.filters || (mine(i) && (open(i) || closed(i) || completed(i))))
          .map(this.createEvent, this),
        options:Options = {
          weekNumberCalculation: 'ISO',
          editable: true,
          eventStartEditable: true,
          eventDurationEditable: true,
          weekNumbers: this.showWeekNumbers,
          weekends: this.showWeekends,
          defaultView: this.currentView,
          defaultDate: this.date,
          dayClick: this.onDayClick.bind(this),
          viewRender: this.onViewRender.bind(this),
          eventRender: this.onEventRender.bind(this),
          eventDrop: this.onEventDrop.bind(this),
          eventResize: this.onEventResize.bind(this),
          eventDestroy: this.onEventDestroy.bind(this),
          events: events                    
      };
      if(Configuration.isMobile()) {
          Object.assign(options, {
              height: 'auto',
              selectable: true,
              select: this.onSelect.bind(this)
          });
      }                                            
          
      if(this.cal) {
        this.cal.fullCalendar('destroy');
      }
      this.cal = $('#calendar', this.element).fullCalendar(options);
    }

    async fillActiveJobs() {
      const allJobs = await this.jobService.getAll();
      this.activeJobs = allJobs.filter(i => equals(i.status, JobStatus.PENDING) || equals(i.status, JobStatus.IN_PROGRESS));
    }

    toggleOptionsExpanded() {
        this.optionsExpanded = !this.optionsExpanded;
    }

    onDayClick(date:moment.Moment) {
        if(this.canCreate && !Configuration.isMobile()) {
            this.router.navigateToRoute('jobs.new', { date: date.format('YYYY-MM-DD')});
        }
    }

    onSelect(start:moment.Moment) {
        if(this.canCreate)  {
          this.router.navigateToRoute('jobs.new', { date: start.format('YYYY-MM-DD')});
        }
    }

    onViewRender(view:ViewObject) {
        this.router.navigateToRoute('calendar', { date: view.intervalStart.format('YYYY-MM-DD')});
    }

    onEventRender(ev:EventObject & Job, el:Element) {
        const $el = $(el),
            $title = $el.find('.fc-title'),
            className = this.getIconClass(ev.job_type),
            icon = `<i class="icon ${className}"></i>&nbsp;`;
            
        $title
            .html(this.getTitle(ev))
            .before(icon);
    }

    onEventDrop(ev:EventObject & {start:moment.Moment,end:moment.Moment}) {
        const start = ev.start.toDate(),
            end = ev.endDate ? ev.end.toDate() : null;
        this.jobService.move(ev._id, start, end)
            .then(() => Notifications.success('Job moved successfully.'))
            .catch(Notifications.error);
    }

    onEventResize(ev:EventObject & {start:moment.Moment,end:moment.Moment}) {
        const start = ev.start.toDate(),
            end = ev.end.clone().subtract(1, 'day').toDate();
        this.jobService.move(ev._id, start, end)
            .then(() => Notifications.success('Job moved successfully.'))
            .catch(Notifications.error);
    }

    onEventDestroy(ev, el) {
        $(el).popup('destroy');
    }

    onDocumentCreated(doc:JobDocument) {
        console.log(`document created:`);
        console.log(doc);
        const event = this.createEvent(doc);

        this.cal.fullCalendar('addEventSource', [event]);
    }

    onDocumentUpdated(doc:JobDocument) {
        console.log(`document updated:`);
        console.log(doc);

        const events = this.getCalendarEvents(doc._id);
        if(Array.isArray(events) && events.length) {
            const event = events[0];
            this.createEvent(doc, event);
            this.cal.fullCalendar('updateEvent', event);
        }
    }
    
    onDocumentDeleted(id:string) {
        console.log(`document deleted: ${id}`);
        this.cal.fullCalendar('removeEvents', id);
    }

    get currentView():string {
        return localStorage.getItem(`calendar:currentView`) || 'month';
    }
    set currentView(view:string) {
        localStorage.setItem(`calendar:currentView`, view);
        this.cal.fullCalendar('changeView', view);
    }

    get showWeekends():boolean {
        return this.getOption('weekends') === 'true';
    }
    set showWeekends(show:boolean) {
        this.setOption('weekends', show);
    }

    get showWeekNumbers():boolean {
        return this.getOption('weekNumbers') === 'true';
    }
    set showWeekNumbers(show:boolean) {
        this.setOption('weekNumbers', show);
    }

    private setOption(name:string, value:any) {
        this.cal.fullCalendar('option', name, value);
        localStorage.setItem(`calendar:${name}`, value);
    }

    private getOption(name:string):string {
        return localStorage.getItem(`calendar:${name}`);
    }

    private getCalendarEvents(id):EventObject[] {
        return this.cal.fullCalendar('clientEvents', id);
    }

    private createEvent(job:Job, originalEvent?:EventObject | number):EventObject {
        
        const backgroundColor = this.getColour(job.foreman),
          baseObject = (originalEvent && (<any>originalEvent).id) ? originalEvent : { },
            event:EventObject = Object.assign(baseObject, job, {
                id: job._id,
                title: job.number,
                start: moment(job.startDate).format('YYYY-MM-DD'),
                allDay: true,
                backgroundColor: backgroundColor,
                textColor: '#000',
                // don't link to the job on mobile
                url: Configuration.isMobile() ? null : this.router.generate('jobs.edit', { id: job._id }),
                end: job.endDate ? moment(job.endDate).add(1, 'day').format('YYYY-MM-DD') : null
            });                                
        return event;
    }

    getTitle(job:Job):string {
      const prefix = job.job_type === JobType.SERVICE_CALL ? 'S' : 'P';
      return `${prefix}-${job.number}: ${job.customer.name}`;
    }

    getIconClass(jobType:string):string {
      return jobType === JobType.SERVICE_CALL ? 'wrench' : 'building';
    }

    getColour(foreman:string, defaultColour:string = 'white'):string {
      const key = (foreman || '').toLowerCase();
      return Foreman.BackgroundColours[key] || defaultColour
    }
}
