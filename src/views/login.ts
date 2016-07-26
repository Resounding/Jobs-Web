import {autoinject} from 'aurelia-framework';
import {Authentication} from '../services/auth/auth';

@autoinject()
export class Login {
    username:string;
    password:string;
    errorMessage:string;

    constructor(private auth:Authentication, private element:Element) { }

    attached() {
        $('form', this.element).form({
            fields: {
                username: 'empty',
                password: 'empty'
            }
        });
    }

    login() {
        this.errorMessage = '';

        return this.auth.login(this.username, this.password)
            .catch(err => {
                $('form', this.element).form('add errors', [err.message]);
            });
    }
}