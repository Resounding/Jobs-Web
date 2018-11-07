import {autoinject} from 'aurelia-framework';
import {Database} from './db';
import {Customer, CustomerDocument} from "../../models/customer";
import {Job, JobDocument} from "../../models/job";

@autoinject()
export class CustomerService {
    db: PouchDB.Database;

    constructor(database:Database) {
        this.db = database.db;
    }

    getAll():Promise<CustomerDocument[]> {
        return new Promise((resolve, reject) => {
            this.db.find({selector: {type: CustomerDocument.DOCUMENT_TYPE}, sort: ['type', 'name'] })
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
                    this.db.get(result.id)
                      .then(custResult => {
                        const saved = new CustomerDocument(custResult);
                        resolve(saved);
                      })
                      .catch(reject);
                })
                .catch(reject);
        });
    }

  save(customer:Customer): Promise<PouchDB.Core.Response> {
    return new Promise((resolve, reject) => {
      if (!customer._id) {
        return this.create(customer);
      } else {
        return this.db.put(customer)
          .then(resolve)
          .catch(reject);
      }
    });
  }

    delete(customer:Customer):Promise<Customer> {
      return new Promise((resolve, reject) => {
        this.db.remove(customer)
          .then(() => Promise.resolve(customer))
          .catch(reject);
      });
    }

    async merge(keep:Customer, replace:Customer):Promise<void> {
      const result = await (<PouchDB.Database<Job>>this.db).find({selector: {type: JobDocument.DOCUMENT_TYPE, 'customer._id': replace._id }}),
        jobs = result.docs;
      for(const job of jobs) {
        job.customer = Object.assign({}, keep);
        await this.db.post(job);
      }
    }
}
