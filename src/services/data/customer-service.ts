import {Promise} from 'es6-promise';
import {db} from './db';
import {Customer, CustomerDocument} from "../../models/customer";

export class CustomerService {
    static getAll():Promise<CustomerDocument[]> {
        return new Promise((resolve, reject) => {
            db().find({selector: {type: CustomerDocument.DOCUMENT_TYPE}})
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

    static create(customer:Customer):Promise<CustomerDocument> {
        if(!customer._id) {
            customer._id = CustomerDocument.createId(customer.name);
        }

        return new Promise((resolve, reject) => {
            return db().put(customer)
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