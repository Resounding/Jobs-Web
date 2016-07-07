import {Job} from '../../models/job'

export class JobList {
    items:Job[];
    todaysItems:Job[];
    weekItems:Job[];
    unscheduled:Job[];
    myJobs:boolean = true;
    showCompleted:boolean = false;

    constructor() {
        let today = new Date,
            tomorrow = moment().add(1, 'day').toDate(),
            monday = moment().add(1, 'week').startOf('week').toDate(),
            description = 'Remove and replace boiler. Clean thoroughly and test to ensure there are no leaks.';

        this.items = [
            {
                id: 5,
                number: 'S-4286',
                name: 'Fix Volcano Boiler Leak',
                type: 'service',
                customer: 'Jeffery\'s',
                status: 'complete',
                isMultiDay: false,
                days: 1,
                startDate: today,
                foreman: 'Kurt',
                description
            },
            {
                id: 5,
                number: 'P-1718',
                name: 'Hot water heating',
                type: 'project',
                customer: 'Creekside',
                status: 'complete',
                isMultiDay: false,
                days: 1,
                startDate: today,
                foreman: 'Barry',
                description
            },
            {
                id: 5,
                number: 'P-1718',
                name: 'Install Cyclone Heater',
                type: 'project',
                customer: 'Will VanVliet',
                status: 'complete',
                isMultiDay: false,
                days: 1,
                startDate: today,
                foreman: 'Dan',
                description
            },
            {
                id: 5,
                number: 'P-4897',
                name: 'Meter hookup',
                type: 'project',
                customer: 'St. David\'s',
                status: 'inprogress',
                isMultiDay: false,
                days: 1,
                startDate: today,
                foreman: 'Barry',
                description
            },
            {
                id: 1,
                number: 'S-3875',
                name: 'Disconnect Storage Tank',
                type: 'service',
                customer: 'CedarWay Plant 1',
                status: 'inprogress',
                isMultiDay: false,
                days: 1,
                startDate: today,
                foreman: 'Dan',
                description
            },
            {
                id: 1,
                number: 'S-8855',
                name: 'Boiler Cleaning',
                type: 'service',
                customer: 'Cosmic Plant 1',
                status: 'pending',
                isMultiDay: false,
                days: 1,
                startDate: today,
                foreman: 'Dan',
                description
            },
            {
                id: 1,
                number: 'S-6487',
                name: 'CO2 Pump Repair',
                type: 'service',
                customer: 'Nickel\'s',
                status: 'pending',
                isMultiDay: false,
                days: 1,
                startDate: tomorrow,
                foreman: 'Dan',
                description
            },
            {
                id: 1,
                number: 'P-4198',
                name: 'Small Addition',
                type: 'project',
                customer: 'Jayden Floral',
                status: 'pending',
                isMultiDay: true,
                days: 2,
                startDate: tomorrow,
                foreman: 'Dan',
                description
            },
            {
                id: 1,
                number: 'S-8882',
                name: 'Valve Replacement',
                type: 'service',
                customer: 'Maple Crest',
                status: 'inprogress',
                isMultiDay: false,
                days: 1,
                startDate: today,
                foreman: 'Kurt',
                description
            },
            {
                id: 2,
                number: 'P-1234',
                name: 'Insulation Install',
                type: 'project',
                customer: 'Creekside',
                status: 'pending',
                isMultiDay: false,
                days: 1,
                startDate: today,
                foreman: 'Kurt',
                description
            },
            {
                id: 3,
                number: 'P-4564',
                name: 'Gas Line Installation',
                type: 'project',
                customer: 'OPG',
                status: 'pending',
                isMultiDay: true,
                days: 3,
                startDate: monday,
                foreman: 'Barry',
                description
            },
            {
                id: 3,
                number: 'P-2841',
                name: 'Retrofit',
                type: 'project',
                customer: 'Always Fresh',
                status: 'pending',
                isMultiDay: true,
                days: 3,
                startDate: null,
                foreman: 'Kurt',
                description
            },
            {
                id: 3,
                number: 'S-5584',
                name: 'Clean Boilers',
                type: 'service',
                customer: 'Boekestyn\'s',
                status: 'pending',
                isMultiDay: false,
                days: 1,
                startDate: null,
                foreman: 'Kurt',
                description
            },
            {
                id: 7,
                number: 'S-9875',
                name: 'Clean Boilers',
                type: 'service',
                customer: 'Meyers',
                status: 'pending',
                isMultiDay: false,
                days: 1,
                startDate: null,
                foreman: 'Kurt',
                description
            },
            {
                id: 7,
                number: 'S-55865',
                name: 'Mix Valve Replace',
                type: 'service',
                customer: 'Willowbrook - Farr Rd.',
                status: 'pending',
                isMultiDay: false,
                days: 1,
                startDate: null,
                foreman: null,
                description
            }
        ];

        this.filter();
    }

    filter() {
        const sameDay = (i) => moment(i.startDate).isSame(moment(), 'day');
        const thisWeek = (i) => moment(i.startDate).isBefore(moment().startOf('week').add(1, 'week'));
        const mine = (i) => !this.myJobs || i.foreman === 'Kurt';
        const completed = (i) => this.showCompleted || i.status !== 'complete';

        this.todaysItems = _.filter(this.items, (i) => sameDay(i) && mine(i) && completed(i));
        this.weekItems = _.filter(this.items, (i) => thisWeek(i) && !sameDay(i) && mine(i) && completed(i));
        this.unscheduled = _.filter(this.items, (i) => !i.startDate && mine(i) && completed(i));
    }
}