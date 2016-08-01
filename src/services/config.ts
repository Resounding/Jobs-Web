export class Configuration {
    constructor() {
        this.remote_database_name = this.isDebug() ? `${this.remote_server}/langendoen-test` : `${this.remote_server}/langendoen`;
    }

    app_database_name:string = 'LangendoenJobs';
    app_root:string = 'views/app';
    login_root:string = 'views/login';
    remote_server:string = 'https://resounding.cloudant.com';
    remote_database_name:string;

    isDebug():boolean {
        return window.location.hostname === 'localhost';
    }
}
