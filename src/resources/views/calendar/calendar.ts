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
    _events:EventObject[];

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
                const filtered = items
                    .filter(i => i.startDate);
                
                const mapped = filtered
                    .map(i => {
                        return {title: i.number, start: i.startDate}
                    });

                this.cal = $('#calendar', this.element).fullCalendar({
                    weekNumberCalculation: 'ISO',
                    weekNumbers: this._showWeekNumbers,
                    weekends: this._showWeekends,
                    defaultView: this.currentView,
                    defaultDate: this.date,
                    dayClick: this.onDayClick.bind(this),
                    viewRender: this.onViewRender.bind(this),
                    events: mapped
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