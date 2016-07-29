import {Aurelia, autoinject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Promise} from 'es6-promise';
import PouchDB = require('pouchdb');
import pouchdbauth = require('pouchdb-auth');
import {Configuration} from "../config";

PouchDB.plugin(pouchdbauth);

const storage_key:string = 'auth_token';
let database = null;
let user_info: UserInfo = null;

interface UserInfo {
    name: string;
    roles: string[];
}

@autoinject()
export class Authentication {
    constructor(private app: Aurelia, private config: Configuration, private router:Router) {
        database = new PouchDB(this.config.users_database_name, { skip_setup: true });
        user_info = JSON.parse(localStorage[storage_key] || null);
    }

    login(user:string, password:string):Promise<UserInfo> {
        return new Promise((resolve, reject) => {
            const login = () => {
                database.logIn(user, password)
                    .then(result => {
                        user_info = {
                            name: result.name,
                            roles: result.roles
                        };

                        localStorage[storage_key] = JSON.stringify(user_info);
                        this.app.setRoot(this.config.app_root);
                        return resolve(user_info);
                    })
                    .catch(reject);
            };

            if (typeof database.logIn === 'undefined') {
                return database.useAsAuthenticationDB()
                    .then(login)
                    .catch(reject);
            } else {
                login();
            }
        });
    }


    logout():Promise {
        user_info = null;
        localStorage[storage_key] = null;
        this.app.setRoot(this.config.login_root);
        this.router.navigateToRoute('login');
        return Promise.resolve();
    }

    isAuthenticated() {
        return user_info !== null;
    }

    isInRole(role:string) {
        return this.isAuthenticated() && user_info.roles.indexOf(role) !== -1;
    }

    userInfo():UserInfo {
        return user_info;
    }
}

export class Roles {
    static Foreman:string = 'foreman';
    static Administrator:string = 'administrator';
    static Owner:string = 'owner';
    static OfficeAdmin:string = 'office_admin';
}