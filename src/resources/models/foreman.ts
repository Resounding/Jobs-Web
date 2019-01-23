interface ForemanColours {
    [index:string]:string
}

export class Foreman {

    static OPTIONS:string[] = [
        'Unassigned',
        'Andy',
        'Barry',
        'Bruce',
        'Dan',
        'Kurt',
        'Phil'
    ];

    static BackgroundColours:ForemanColours = {
        andy: '#d43f3a',
        barry: '#474747',
        bruce: '#b9c7d2',
        dan: '#73d3e7',
        kurt: '#ffbc70',
        phil: '#7ee54f'        
    }
}
