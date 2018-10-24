import * as $ from 'jquery';
import 'semantic-ui';
import {autoinject, bindable} from 'aurelia-framework';
import {Router, NavModel} from 'aurelia-router';
import {Authentication, UserInfo} from '../../services/auth';
import {CsvExport} from "../../services/csv-export";

@autoinject()
export class NavBar {

  @bindable router: Router;
  csv: string;
  navItems:NavModel[];
  settingsNavItems:NavModel[];

  constructor(private element: Element, private auth: Authentication, private csvExport: CsvExport) { }

  attached() {
    $('.dropdown', this.element).dropdown();

    this.navItems = this.router.navigation.filter(n => !n.settings.showInSettings);
    this.settingsNavItems = this.router.navigation.filter(n => n.settings.showInSettings);
  }

  detached() {
    $('.dropdown', this.element).dropdown('destroy');
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
    return (this.auth.userInfo() || <UserInfo>{}).name;
  }
}
