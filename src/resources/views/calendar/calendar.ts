import {NavigationInstruction, RouteConfig, Router} from 'aurelia-router';
import {autoinject} from 'aurelia-framework';
import {ViewLocator,ViewSlot,ViewEngine,ViewCompileInstruction} from 'aurelia-templating';
import {inject, Container} from 'aurelia-dependency-injection';
import {ViewObject, EventObject} from 'fullcalendar';
import { Foreman } from '../../models/foreman';
import { JobType } from '../../models/job-type';
import { JobDocument } from '../../models/job';
import {JobService} from '../../services/data/job-service';
import {Notifications} from '../../services/notifications';
import {EventPopup} from './event-popup';

@autoinject
export class Calendar {
    cal:JQuery;
    date:Date;

    constructor(private jobService: JobService, private router:Router, private element:Element, private viewLocator:ViewLocator, private viewEngine:ViewEngine, private container:Container) { }

    activate(params:any, routeConfig: RouteConfig, navigationInstruction:NavigationInstruction) {
        let d = moment(navigationInstruction.params.date, 'YYYY-MM-DD');
        if(!d.isValid()) {
            d = moment();
        }
        this.date = d.toDate();
    }

    attached() {
        // to get the HTML from a data-bound template, we do this: http://stackoverflow.com/a/37869319
        const view = this.viewLocator.getViewStrategy('resources/views/calendar/event-popup.html');
        const c = this.container;
        view.loadViewFactory(this.viewEngine, new ViewCompileInstruction())
            .then(vf => {
                this.jobService
                    .getAll()
                    .then(items => {
                        const events = items
                            .filter(i => i.startDate)
                            .map(i => {
                                const result = vf.create(this.container);
                                result.bind(new EventPopup(i));
                                const fragment = result.fragment,
                                    div = $('<div><div class="ui cards"><list-item class="card"></list-item></div></div>'),
                                    foreman = (i.foreman || '').toLowerCase(),
                                    backgroundColor = Foreman.BackgroundColours[foreman] || 'white';

                                div.find('list-item').append(fragment);

                                const event:EventObject = _.extend(i, {
                                        title: i.number,
                                        start: moment(i.startDate).format('YYYY-MM-DD'),
                                        allDay: true,
                                        backgroundColor: backgroundColor,
                                        textColor: '#000',
                                        url: this.router.generate('jobs.edit', { id: i._id }),
                                        end: i.endDate ? moment(i.endDate).add(1, 'day').format('YYYY-MM-DD') : null,
                                        popup: div.html()
                                    });                                
                                return event;
                            });

                        this.cal = $('#calendar', this.element).fullCalendar({
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
                        });                        
                    });
            });
    }

    onDayClick(date:moment) {
        this.router.navigateToRoute('jobs.new', { date: date.format('YYYY-MM-DD')});
    }

    onViewRender(view:ViewObject) {
        this.router.navigateToRoute('calendar', { date: view.intervalStart.format('YYYY-MM-DD')});
    }

    onEventRender(ev:EventObject, el:Element) {
        const $el = $(el),
            $title = $el.find('.fc-title'),
            className = (ev.job_type === JobType.SERVICE_CALL) ? 'wrench' : 'building',
            icon = `<i class="icon ${className}"></i>&nbsp;`,
            description = `${icon}<strong>${getTitle(ev)}</strong><br><em>${ev.customer.name}</em>`;

        if(ev.description) {
            description += `<br>${ev.description}`;
        }
        
        $title
            .html(getTitle(ev))
            .before(icon);

        $el.popup({
            title: `${getTitle(ev)}: ${ev.name}`,
            html: ev.popup
        });
    }

    onEventDrop(ev:EventObject) {
        const start = ev.start.format('YYYY-MM-DD'),
            end = ev.endDate ? ev.end.format('YYYY-MM-DD') : null;
        this.jobService.move(ev._id, start, end)
            .then(() => Notifications.success('Job moved successfully.'))
            .catch(Notifications.error);
    }

    onEventResize(ev:EventObject) {
        const start = ev.start.format('YYYY-MM-DD'),
            end = ev.end.clone().subtract(1, 'day').format('YYYY-MM-DD');
        this.jobService.move(ev._id, start, end)
            .then(() => Notifications.success('Job moved successfully.'))
            .catch(Notifications.error);
    }

    onEventDestroy(ev, el) {
        $(el).popup('destroy');
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
}

function getTitle(job:Job):string {
    const prefix = job.job_type === JobType.SERVICE_CALL ? 'S' : 'P';
    return `${prefix}-${job.number}: ${job.name}`;
}