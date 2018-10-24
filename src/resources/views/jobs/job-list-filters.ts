const storage_key:string = 'job_list_filters';

export class JobListFilters {
  myJobs: boolean = false;
  showOpen: boolean = true;
  showClosed: boolean = false;
  showCompleted: boolean = false;
  reverseSort: boolean = false;
  customerSort: boolean = false;
  showProjects: boolean = true;
  showServiceCalls: boolean = true;

  static exists():boolean {
    return !!localStorage[storage_key];
  }

  static load(props:{}):JobListFilters {
    const filters = new JobListFilters;
    for(const prop in filters) {
      if(filters.hasOwnProperty(prop)) {
        filters[prop] = props[prop];
      }
    }
    
    if(JobListFilters.exists()) {
      const json = localStorage[storage_key];
      Object.assign(filters, JSON.parse(json));
    }

    return filters;
  }

  save(props:{}):void {
    for(const prop in props) {
      if(this.hasOwnProperty(prop)) {
        this[prop] = props[prop];
      }
    }
    const json = JSON.stringify(this);
    localStorage[storage_key] = json;
  }
}
