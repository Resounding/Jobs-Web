import {JobStatus} from './jobStatus.ts';

var job_statuses = {
    pending: ''
}

export interface Job {
    id: number;
    job_type: string;
    number: string;
    name: string;
    customer: string;
    status_id: string;
    status: JobStatus;
    description: string;
    billing_type: string;
    work_type: string;
    isMultiDay: boolean;
    days: number;
    startDate: Date;
    foreman: string;
}

export class JobDocument implements Job {
    id: number;
    job_type: string;
    number: string;
    name: string;
    customer: string;
    status_id: string;
    status: JobStatus;
    description: string;
    billing_type: string;
    work_type: string;
    isMultiDay: boolean;
    days: number;
    startDate: Date;
    foreman: string;

    constructor() {
        this.id = null;
        this.job_type = 'project';
    }

    toJSON():Job {
        return {
            id: this.id,
            job_type: this.job_type,
            number: this.number,
            name: this.name,
            customer: this.customer,
            status: this.status,
            status_id: this.status_id,
            description: this.description,
            billing_type: this.billing_type,
            work_type: this.work_type,
            isMultiDay: this.isMultiDay,
            days: this.days,
            startDate: this.startDate,
            foreman: this.foreman
        };
    }
}

export class Constants {
    static JOB_DOCUMENT:string = 'job';
}