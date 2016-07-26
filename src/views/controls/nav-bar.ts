import {autoinject, bindable} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Authentication} from '../../services/auth/auth';

@autoinject()
export class NavBar {

    @bindable router:Router;

    constructor(private auth:Authentication) { }

    attached() {
        let $fixedMenu = $('#fixed-menu'),
            $mainMenu = $('#main-menu');

        $mainMenu.visibility({
            once: false,
            onBottomPassed: () => $fixedMenu.transition('fade in'),
            onBottomPassedReverse: () =>  $fixedMenu.transition('fade out')
        });
    }

    logout() {
        this.auth.logout();
    }

    get userName() {
        return this.auth.userInfo().name;
    }
}