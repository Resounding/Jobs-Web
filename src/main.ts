import {Aurelia} from 'aurelia-framework';
import {Authentication} from './services/auth/auth';
import {Configuration} from './services/config';

export function configure(aurelia: Aurelia) {
    aurelia.use
        .standardConfiguration()
        .developmentLogging();

    aurelia.start().then(() => {
        const auth = aurelia.container.get(Authentication),
              config = aurelia.container.get(Configuration),
              root = auth.isAuthenticated() ? config.app_root : config.login_root;
        aurelia.setRoot(root)
    });
}