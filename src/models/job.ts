import {JobStatus} from './jobStatus.ts';

export class Job {
    id: number;
    type:string = Job.DOCUMENT_TYPE;
    job_type: string = 'project';
    number: string;
    name: string;
    customer: string;
    status: JobStatus;
    description: string;
    billing_type: string = 't+m';
    work_type: string = 'materials';
    isMultiDay: boolean = false;
    days: number = 1;
    startDate: Date;
    foreman: string;

    static DOCUMENT_TYPE:string = 'job';
}