import {Job, JobDocument} from "./job";
import { ISerializable } from "./serializable";
import { IValidatable, ValidationResult } from "./validation";

export interface Quote extends Job { }

export class QuoteDocument extends JobDocument implements ISerializable<Quote>, IValidatable {
    constructor(props:Quote | {} = {}) {
        super(Object.assign(props, { type: QuoteDocument.DOCUMENT_TYPE }));
    }

    validate(): ValidationResult {
        return validateQuote(this);
    }

    toJSON():Quote {
        return Object.assign(super.toJSON(), { type: QuoteDocument.DOCUMENT_TYPE });
    }

    static DOCUMENT_TYPE:string = 'quote';
}

function validateQuote(quote:Quote):ValidationResult {
    const result = {
        ok: true,
        errors:[]
    };

    if(!quote.customer) {
        result.ok = false;
        result.errors.push('Please choose the customer');
    }

    if(!quote.name) {
        result.ok = false;
        result.errors.push('Please enter a name for the quote');
    }

    return result;
}