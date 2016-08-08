import {autoinject} from 'aurelia-framework';
import {Database} from './db';
import {Customer, CustomerDocument} from "../../models/customer";

@autoinject()
export class CustomerService {
    db: PouchDB;

    constructor(database:Database) {
        this.db = database.db;
    }

    getAll():Promise<CustomerDocument[]> {
        return new Promise((resolve, reject) => {
            this.db.find({selector: {type: CustomerDocument.DOCUMENT_TYPE}})
                .then(items => {
                    var customers = items.docs.map(item => {
                        var customer = new CustomerDocument(item);
                        return customer;
                    });
                    resolve(customers);
                })
                .catch(reject);
        })
    }

    create(customer:Customer):Promise<CustomerDocument> {
        if(!customer._id) {
            customer._id = CustomerDocument.createId(customer.name);
        }

        return new Promise((resolve, reject) => {
            return this.db.put(customer)
                .then(result => {
                    var customer = new CustomerDocument(customer);
                    customer._id = result.id;
                    customer._rev = result.rev;
                    resolve(customer);
                })
                .catch(reject);
        });
    }
}
