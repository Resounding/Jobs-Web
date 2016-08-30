import {autoinject, bindable} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Authentication} from '../../services/auth';

@autoinject()
export class NavBar {

    @bindable router:Router;

    constructor(private element:Element, private auth:Authentication) { }

    attached() {
        $('.dropdown', this.element).dropdown();
    }

    detached() {
        $('.dropdown', this.element).dropdown('destroy');
    }

    logout() {
        this.auth.logout();
    }

    get userName() {
        return (this.auth.userInfo() || { }).name;
    }
}
