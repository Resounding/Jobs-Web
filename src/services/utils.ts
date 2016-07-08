let device:boolean = undefined;
export function isDevice(): boolean {
    if(typeof device === 'undefined') {
        var el = $('<div class="mobile only"></div>');
        el.appendTo(document.documentElement);
        device = el.is(':visible');
        el.remove();
    }
    
    return device;
}