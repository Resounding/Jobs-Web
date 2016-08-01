export interface Customer {
    _id:string;
    _rev:string;
    type: string;
    name:string;
}

export class CustomerDocument implements Customer {
    _id: string;
    _rev: string;
    type: string;
    name: string;

    constructor(props?:Object) {
        if(props) {
            _.extend(this, props);
        }
    }

    toJSON():Customer {
        return {
            _id: this._id,
            _rev: this._rev,
            type: CustomerDocument.DOCUMENT_TYPE,
            name: this.name
        };
    }

    static createId(name:string):string {
        return `${CustomerDocument.DOCUMENT_TYPE}:${name.toLowerCase().replace(' ', '-')}`;
    }

    static DOCUMENT_TYPE:string = 'customer';
}