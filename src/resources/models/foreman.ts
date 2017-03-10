interface ForemanColours {
    [index:string]:string
}

export class Foreman {

    static OPTIONS:string[] = [
        'Barry',
        'Bruce',
        'Dan',
        'Kurt',
        'Phil'
    ];

    static BackgroundColours:ForemanColours = {
        Barry: 'red',
        Bruce: 'cornflower',
        Dan: 'lightblue',
        Kurt: 'lightgreen',
        Phil: 'yellow'
    }
}