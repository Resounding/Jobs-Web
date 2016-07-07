import {JobStatus} from "../../models/jobStatus";

export class ReferenceService {
    foremen: string[] = ['Barry', 'Dan', 'Kurt'];
    statii: JobStatus[] = [
        {
            _id: 'pending',
            name: 'Pending',
            cssClass: 'hourglass start inverted blue'
        },
        {
            _id: 'inprogress',
            name: 'In Progress',
            cssClass: 'hourglass half inverted green'
        },
        {
            _id: 'complete',
            name: 'Complete',
            cssClass: 'hourglass end'
        },
        {
            _id: 'closed',
            name: 'Closed',
            cssClass: ''
        }
    ];
    
    getForemen(): Promise<string[]> {
        return new Promise(resolve => resolve(this.foremen));
    }
    
    getJobStatuses(): Promise<JobStatus[]> {
        return new Promise(resolve => resolve(this.statii));
    }
}