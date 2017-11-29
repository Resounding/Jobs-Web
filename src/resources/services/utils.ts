let device:boolean = undefined;

const toString = Object.prototype.toString;

export function isDevice(): boolean {
    if(typeof device === 'undefined') {
        var el = $('<div class="hide-mobile"></div>');
        el.appendTo(document.documentElement);
        device = !el.is(':visible');
        el.remove();
    }
    
    return device;
}

export function isString(value:any):boolean {
    return toString.call(value) === toString.call("");
}

export function isUndefined(value:any):boolean {
    return typeof value === 'undefined';
}

const date = new Date;
export function isDate(value:any):boolean {
    return toString.call(value) === toString.call(date);
}

export function isObject(value:any):boolean {
    return toString.call(value) === toString.call({});
}