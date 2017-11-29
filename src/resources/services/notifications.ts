import * as toastr from 'toastr';

toastr.options.positionClass = "toast-bottom-left";

export class Notifications {
    static success(message: string) {
        toastr.success(message);
    }

    static error(err:any) {
        let message = JSON.stringify(err);
        if(err && err.message) {
            message = err.message;
        }
        toastr.error(message);
    }
}