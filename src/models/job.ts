export class Job {
    id: number;
    number: string;
    name: string;
    type: string;
    customer: string;
    status: string;
    description: string;
    isMultiDay: boolean = false;
    days: number = 1;
    startDate: Date;
    foreman: string;
}