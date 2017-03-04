import { JobType } from '../../models/job-type';
import {ViewObject, EventObject} from 'fullcalendar';
import {NavigationInstruction, RouteConfig, Router} from 'aurelia-router';
import {autoinject} from 'aurelia-framework';
import {JobService} from '../../services/data/job-service';

@autoinject
export class Calendar {
    cal:JQuery;
    date:Date;
    _currentView:string = 'month';
    _showWeekends:boolean = true;
    _showWeekNumbers:boolean = true;

    constructor(private jobService: JobService, private router:Router, private element:Element) { }

    activate(params:any, routeConfig: RouteConfig, navigationInstruction:NavigationInstruction) {
        var d = moment(navigationInstruction.params.date, 'YYYY-MM-DD');
        if(!d.isValid()) {
            d = moment();
        }
        this.date = d.toDate();
    }

    attached() {
        this.jobService
            .getAll()
            .then(items => {
                const events = items
                    .filter(i => i.startDate)
                    .map(i => {
                        const event:EventObject = _.extend(i, {
                            title: i.number,
                            start: i.startDate,
                            allDay: true,
                            backgroundColor: (i.job_type === JobType.SERVICE_CALL ? '#ba3237' : '#3343bd'),
                            url: this.router.generate('jobs.edit', { id: i._id }),
                            end: i.endDate || i.startDate
                        });
                        return event;
                    });

                this.cal = $('#calendar', this.element).fullCalendar({
                    weekNumberCalculation: 'ISO',
                    weekNumbers: this._showWeekNumbers,
                    weekends: this._showWeekends,
                    defaultView: this.currentView,
                    defaultDate: this.date,
                    dayClick: this.onDayClick.bind(this),
                    viewRender: this.onViewRender.bind(this),
                    events: events,
                    eventRender: (ev:EventObject, el:Element)  => {
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
                            html: description
                        });
                    },
                    eventDestroy: (ev, el) {
                        $(el).popup('destroy');
                    }
                });
            });
    }

    onDayClick(date:moment) {
        this.router.navigateToRoute('jobs.new', { date: date.format('YYYY-MM-DD')});
    }

    onViewRender(view:ViewObject) {
        this.router.navigateToRoute('calendar', { date: view.intervalStart.format('YYYY-MM-DD')});
    }

    get currentView():string {
        return this._currentView;
    }
    set currentView(view:string) {
        this._currentView = view;
        this.cal.fullCalendar('changeView', view);
    }

    get showWeekends():boolean {
        return this._showWeekends;
    }
    set showWeekends(show:boolean) {
        this._showWeekends = show;
        this.setOption('weekends', show);
    }

    get showWeekNumbers():boolean {
        return this._showWeekNumbers;
    }
    set showWeekNumbers(show:boolean) {
        this._showWeekNumbers = show;
        this.setOption('weekNumbers', show);
    }

    private setOption(name:string, value:any) {
        this.cal.fullCalendar('option', name, value);
    }
}

function getTitle(job:Job):string {
    const prefix = job.job_type === JobType.SERVICE_CALL ? 'S' : 'P';
    return `${prefix}-${job.number}: ${job.name}`;
}