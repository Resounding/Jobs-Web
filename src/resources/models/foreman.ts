interface ForemanColours {
    [index:string]:string
}

export class Foreman {

    static OPTIONS:string[] = [
        'Unassigned',
        'Andy',
        'Barry',
        'Bemar',
        'Bruce',
        'Dan',
        'Kurt',
        'Matt',
        'Marc',
        'MarkP',
        'Phil',
        'Will'
    ];

    static BackgroundColours:ForemanColours = {
        andy: '#d43f3a',
        barry: '#474747',
        bemar: 'blueviolet',
        bruce: '#b9c7d2',
        dan: '#73d3e7',
        kurt: '#ffbc70',
        matt: 'crimson',
        marc: 'violet',
        markp: 'orange',
        phil: '#7ee54f',
        will: 'darkcyan'
    }
}
