export class Notifications {
    constructor() {
        toastr.options.positionClass = "toast-bottom-left";
    }

    success(message: string) {
        toastr.success(message);
    }

    error(err:Object) {
        toastr.error(JSON.stringify(err));
    }
}