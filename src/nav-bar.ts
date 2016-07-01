import {bindable} from 'aurelia-framework';
import {Router} from 'aurelia-router';

export class NavBar {

    @bindable router:Router;

    attached() {
        let $fixedMenu = $('#fixed-menu'),
            $mainMenu = $('#main-menu');

        $mainMenu.visibility({
            once: false,
            onBottomPassed: () => $fixedMenu.transition('fade in'),
            onBottomPassedReverse: () =>  $fixedMenu.transition('fade out')
        });
    }
}