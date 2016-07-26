import {autoinject, Aurelia} from 'aurelia-framework';
import {Authentication} from '../services/auth/auth';
import {Configuration} from '../services/config';

@autoinject()
export class Login {
    username:string;
    password:string;

    constructor(private app:Aurelia, private auth:Authentication, private config:Configuration) { }

    login() {
        this.auth.login(this.username, this.password)
            .then(result => {
                console.log(result)
                this.app.setRoot(this.config.app_root);

            })
            .catch(err => {
                alert(err.message);
            })
    }
}