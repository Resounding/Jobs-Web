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

  constructor(private element: Element, private auth: Authentication, database: Database, csvExport: CsvExport) {
    csvExport.export()
      .then(result => {
        const csv = encodeURIComponent(result);
        this.csv = `data:text/csv;charset=utf-8, ${csv}`;
      });

    this.changes = database.db.changes({live: true})
      .on('change', () => {
        csvExport.export()
          .then(result => {
            const csv = encodeURIComponent(result);
            this.csv = `data:text/csv;charset=utf-8, ${csv}`;
          });
      });
  }

  attached() {
    $('.dropdown', this.element).dropdown();
  }

  detached() {
    $('.dropdown', this.element).dropdown('destroy');
    this.changes.cancel();
  }

  logout() {
    this.auth.logout();
  }

  get userName() {
    return (this.auth.userInfo() || {}).name;
  }
}
