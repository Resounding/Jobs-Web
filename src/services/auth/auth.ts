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

                        resolve(user_info);
                    })
                    .catch(reject);
            };

            const addUsers = () => {
                return Promise.all([
                    database.signUp('cliffe', 'password', { roles: ["administrator"]}),
                    database.signUp('phil', 'password', { roles: ["owner", "office_admin"]}),
                    database.signUp('dan', 'password', { roles: ["owner", "foreman"]}),
                    database.signUp('kurt', 'password', { roles: ["owner", "foreman"]}),
                    database.signUp('barry', 'password', { roles: ["foreman"]})
                ]);
            };

            if (typeof database.logIn === 'undefined') {
                return database.useAsAuthenticationDB()
                    .then(addUsers)
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

    userInfo():UserInfo {
        return user_info;
    }
}