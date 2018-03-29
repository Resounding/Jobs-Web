export class Configuration {
    constructor() {
        this.remote_database_name = Configuration.isDebug() ? `${this.remote_server}/langendoen-test` : `${this.remote_server}/langendoen`;
    }

    app_database_name:string = 'LangendoenJobs';
    app_root:string = 'resources/views/app';
    login_root:string = 'resources/views/login';
    remote_server:string = 'https://7bff221b-c372-4033-bf6c-59d2e859a520-bluemix.cloudant.com';
    remote_database_name:string;

    static isDebug():boolean {
        return window.location.hostname === 'localhost';
    }

    static isMobile():boolean {
        return typeof window.orientation !== 'undefined';
    }
}
