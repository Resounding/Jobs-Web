import {NavigationInstruction, RouteConfig, Router} from 'aurelia-router';
import {autoinject} from 'aurelia-framework';
import {ViewLocator, ViewSlot, ViewEngine, ViewCompileInstruction, ViewFactory} from 'aurelia-templating';
import {inject, Container} from 'aurelia-dependency-injection';
import {EventAggregator, Subscription} from 'aurelia-event-aggregator';
import {ViewObject, EventObject, Options} from 'fullcalendar';
import * as fullcalendar from 'fullcalendar';
import * as $ from 'jquery';
import * as moment from 'moment';
import * as _ from 'underscore';
import {EventPopup} from './event-popup';
import {Foreman} from '../../models/foreman';
import {JobType} from '../../models/job-type';
import {Job, JobDocument} from '../../models/job';
import {Configuration} from '../../services/config';
import {Database} from '../../services/data/db';
import {JobService} from '../../services/data/job-service';
import {Notifications} from '../../services/notifications';

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
    viewFactory:ViewFactory;
    optionsExpanded:boolean = false;

    constructor(private jobService: JobService, private router:Router, private element:Element, private events:EventAggregator,
        private viewLocator:ViewLocator, private viewEngine:ViewEngine, private container:Container) { }

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

    attached() {
        // to get the HTML from a data-bound template, we do this: http://stackoverflow.com/a/37869319
        const strategy = this.viewLocator.getViewStrategy('resources/views/calendar/event-popup.html');
        strategy.loadViewFactory(this.viewEngine, new ViewCompileInstruction())
            .then(vf => {
                this.viewFactory = vf;
                this.jobService
                    .getAll()
                    .then(items => {
                        const events = items
                            .filter(i => i.startDate)
                            .map(this.createEvent, this);

                        const options:Options = {
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
                            _.extend(options, {
                                height: 'auto',
                                selectable: true,
                                select: this.onSelect.bind(this)
                            });
                        }                                            
                            
                        this.cal = $('#calendar', this.element).fullCalendar(options);
                    });
            });
    }

    toggleOptionsExpanded() {
        this.optionsExpanded = !this.optionsExpanded;
    }

    onDayClick(date:moment.Moment) {
        if(!Configuration.isMobile()) {
            this.router.navigateToRoute('jobs.new', { date: date.format('YYYY-MM-DD')});
        }
    }

    onSelect(start:moment.Moment) {
        this.router.navigateToRoute('jobs.new', { date: start.format('YYYY-MM-DD')});
    }

    onViewRender(view:ViewObject) {
        this.router.navigateToRoute('calendar', { date: view.intervalStart.format('YYYY-MM-DD')});
    }

    onEventRender(ev:EventObject & Job, el:Element) {
        const $el = $(el),
            $title = $el.find('.fc-title'),
            className = (ev.job_type === JobType.SERVICE_CALL) ? 'wrench' : 'building',
            icon = `<i class="icon ${className}"></i>&nbsp;`;
            
        let description = `${icon}<strong>${getTitle(ev)}</strong><br><em>${ev.customer.name}</em>`;

        if(ev.description) {
            description += `<br>${ev.description}`;
        }
        
        $title
            .html(getTitle(ev))
            .before(icon);

        const options = {
            title: `${getTitle(ev)}: ${ev.name}`,
            html: ev.popup,
            hoverable: true
        };

        if(Configuration.isMobile()) {
            _.extend(options, {
                position: 'top center',
                variation: 'fluid',
                lastResort: true,
                on: 'click',
                onVisible: function($module) {
                    this
                        .css({left: 'auto', right: 'auto', top: '10px', bottom: 'auto'})
                        .on('click', 'button.close', (e) => {
                            $el.popup('hide');
                        });
                },
                onHide: function() {
                    this.off('click');
                }
            })
        }

        $el.popup(options);

        // need this to stop click event on the event or underlying calendar day
        $el.on('touchstart', function(e) {
            //e.preventDefault();
        });
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
        if(_.isArray(events) && events.length) {
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
        
        const foreman = (job.foreman || '').toLowerCase(),
            backgroundColor = Foreman.BackgroundColours[foreman] || 'white',
            popup = this.getViewHtml(job);

        const baseObject = (_.isObject(originalEvent) && (<any>originalEvent).id) ? originalEvent : { },
            event:EventObject = _.extend(baseObject, job, {
                id: job._id,
                title: job.number,
                start: moment(job.startDate).format('YYYY-MM-DD'),
                allDay: true,
                backgroundColor: backgroundColor,
                textColor: '#000',
                // don't link to the job on mobile
                url: Configuration.isMobile() ? null : this.router.generate('jobs.edit', { id: job._id }),
                end: job.endDate ? moment(job.endDate).add(1, 'day').format('YYYY-MM-DD') : null,
                popup: popup
            });                                
        return event;
    }

    getViewHtml(job:Job) {
        const view = this.viewFactory.create(this.container);
        view.bind(new EventPopup(job, this.router));
        const fragment = view.fragment,
            div = document.createElement('div');

        div.appendChild(fragment);
        return div.innerHTML;
    }
}

function getTitle(job:Job):string {
    const prefix = job.job_type === JobType.SERVICE_CALL ? 'S' : 'P';
    return `${prefix}-${job.number}: ${job.name}`;
}