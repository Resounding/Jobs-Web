interface visibilityOptions {
    once?: boolean;
    continuous?: boolean;
    onBottomPassed?(e?: JQueryEventObject);
    onBottomPassedReverse?(e?: JQueryEventObject);
}

interface dropdownOptions {
    allowAdditions?: boolean;
    onChange(e:string):void;
}

interface calendarOptions {
    type: string;
    onChange(e:string):void;
}

interface JQuery {
    visibility(options?: visibilityOptions) : JQuery;
    transition(transition:string) : JQuery;
    dropdown(options?: dropdownOptions) : JQuery;
    calendar(options?: calendarOptions) : JQuery;
}