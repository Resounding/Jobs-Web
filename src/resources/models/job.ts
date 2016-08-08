import {JobStatus} from './job-status'
import {JobType} from  './job-type'
import {Customer, CustomerDocument} from './customer';

export interface Job {
  _id: string;
  job_type: string;
  number: string;
  name: string;
  customer: Customer;
  status: string;
  description: string;
  billing_type: string;
  work_type: string;
  isMultiDay: boolean;
  days: number;
  startDate: Date;
  foreman: string;
  activities: string[];
  notes: string;
  manHours: number;
  type: string;
  _rev: string;
}

export class JobDocument implements Job {
  _id: string = null;
  job_type: string = JobType.SERVICE_CALL;
  number: string = null;
  name: string = '';
  customer: CustomerDocument = null;
  status: string = JobStatus.PENDING;
  description: string = '';
  billing_type: string;
  work_type: string;
  isMultiDay: boolean = false;
  days: number = 1;
  startDate: Date = null;
  foreman: string;
  activities: string[] = [];
  notes: string = '';
  manHours: number;
  // couch props
  type: string;
  _rev: string;

  constructor(props?: Object) {
    if (props) {
      _.extend(this, props);
    }
  }

  toJSON(): Job {
    return {
      _id: this._id,
      job_type: this.job_type,
      number: this.number,
      name: this.name,
      customer: this.customer,
      status: this.status,
      description: this.description,
      billing_type: this.billing_type,
      work_type: this.work_type,
      isMultiDay: this.isMultiDay,
      days: this.days,
      startDate: this.startDate,
      foreman: this.foreman,
      activities: this.activities,
      notes: this.notes,
      manHours: this.manHours,
      type: JobDocument.DOCUMENT_TYPE,
      _rev: this._rev
    };
  }

  static DOCUMENT_TYPE: string = 'job';
}