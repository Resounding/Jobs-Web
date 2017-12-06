import {autoinject} from 'aurelia-framework';
import {Database} from './db';
import {ServiceBase} from './service-base';
import {Quote, QuoteDocument} from '../../models/quote';
import { ISerializable } from '../../models/serializable';
import { PayloadValidationResult } from '../../models/validation';

@autoinject
export class QuoteService extends ServiceBase<Quote> {
    constructor(database:Database) {
        super(database, 'filters/quotes');
    }

    async save(item:QuoteDocument):Promise<PayloadValidationResult> {
        const isNew = !item._id;
        let saved = await super.save(item);
        if(saved.ok && isNew) {
            const quoteNumber = await this.database.nextQuoteNumber();
            item._id = saved.payload.id;
            item._rev = saved.payload.rev;
            item.number = quoteNumber;
            saved = await super.save(item);
        }

        return saved;
    }
}