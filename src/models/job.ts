import {JobStatus} from './jobStatus.ts';

export class Job {
    id: number;
    number: string;
    name: string;
    type: string;
    customer: string;
    status: JobStatus;
    description: string;
    isMultiDay: boolean = false;
    days: number = 1;
    startDate: Date;
    foreman: string;
}