export class Configuration {
    constructor() {
        this.remote_database_name = (window.location.hostname === 'localhost') ? 'http://localhost:5984/langendoen' : 'resounding.cloudant.com';
    }

    app_database_name:string = 'LangendoenJobs';
    users_database_name:string = '_users';
    app_root = 'views/app';
    login_root = 'views/login';
    remote_database_name;
}
