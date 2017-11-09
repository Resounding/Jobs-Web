export {};

declare global {
    interface PopupOptions {
        title?:string;
        html?:string;
        hoverable?:boolean;
        position?:string;
        variation?:string;
        lastResort?:boolean;
        on?:string;
        onVisible?:(any)
    }

    interface JQuery<TElement extends Node = HTMLElement> {
        tab(selector: JQuery.Selector | Element | JQuery) : this;
        popup(selector: JQuery.Selector | Element | JQuery | PopupOptions) : this;
        visibility(options?: visibilityOptions | string) : this;
    }
}