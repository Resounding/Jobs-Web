import * as moment from 'moment';
import {Customer, CustomerDocument} from './customer';
import {JobPhaseStatus} from './job-phase-status';
import {JobStatus} from './job-status'
import {JobType} from  './job-type'
import {isDate, isString} from '../services/utils'

export type AdditionalDates = [Date, Date] | [string | null, string | null];

export interface Job {
  _id: string;
  job_type: string;
  number: string;
  name: string;
  creator: string | null;
  customer: Customer;
  status: string;
  description: string;
  billing_type: string;
  work_type: string;
  startDate: Date | string;
  endDate: Date | string;
  additionalDates: AdditionalDates[] | null;
  foreman: string;
  notes: string;
  deleted: boolean;
  jobPhases:JobPhaseStatus[] | null;
  type: string;
  _rev: string;
}

export class JobDocument implements Job {
  _id: string = null;
  job_type: string = JobType.SERVICE_CALL;
  number: string = null;
  name: string = '';
  creator: string | null = null;
  customer: CustomerDocument = null;
  status: string = JobStatus.PENDING;
  description: string = '';
  billing_type: string;
  work_type: string;
  startDate: Date = null;
  endDate: Date = null;
  additionalDates: AdditionalDates[] = [];
  foreman: string;
  notes: string = '';
  deleted: boolean = false;
  jobPhases:JobPhaseStatus[] | null = null;
  // couch props
  type: string;
  _rev: string;

  constructor(props:Job | {} = {}) {
    Object.assign(this, props);
  }

  toJSON(): Job {
    const json = {
      _id: this._id,
      job_type: this.job_type,
      number: this.number,
      name: this.name,
      creator: this.creator,
      customer: this.customer,
      status: this.status,
      description: this.description,
      billing_type: this.billing_type,
      work_type: this.work_type,
      startDate: this.startDate,
      endDate: this.endDate,
      additionalDates: [],
      foreman: this.foreman,
      notes: this.notes,
      deleted: this.deleted,
      jobPhases: this.jobPhases,
      type: JobDocument.DOCUMENT_TYPE,
      _rev: this._rev
    };

    if(Array.isArray(this.additionalDates)) {
      json.additionalDates = this.additionalDates.reduce((memo, d) => {
        const start = isString(d[0]) ? d[0] : 
            isDate(d[0]) ? moment(d[0]).format('YYYY-MM-DD') :
            null,
          end = isString(d[1]) ? d[1] : 
          isDate(d[1]) ? moment(d[1]).format('YYYY-MM-DD') :
          null;

        if(start || end) {
          memo.push([start, end]);
        }

        return memo;
      }, []);
    }

    return json;
  }

  static DOCUMENT_TYPE: string = 'job';
}
