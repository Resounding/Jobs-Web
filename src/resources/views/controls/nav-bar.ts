import {autoinject, bindable} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Authentication} from '../../services/auth';
import {CsvExport} from "../../services/csv-export";
import {Database} from "../../services/data/db";

@autoinject()
export class NavBar {

  @bindable router: Router;
  csv: string;
  changes: PouchCancellable;

  constructor(private element: Element, private auth: Authentication, database: Database, private csvExport: CsvExport) { }

  attached() {
    $('.dropdown', this.element).dropdown();
  }

  detached() {
    $('.dropdown', this.element).dropdown('destroy');
    this.changes.cancel();
  }

  downloadCsv() {
    this.csvExport.export()
      .then(result => {
        const csv = encodeURIComponent(result),
          href = `data:text/csv;charset=utf-8, ${csv}`,
          link = document.createElement('a');

        link.download = 'jobs.csv';
        link.href = href;
        link.click();
      });
  }

  logout() {
    this.auth.logout();
  }

  get userName() {
    return (this.auth.userInfo() || {}).name;
  }
}
