import {autoinject} from 'aurelia-framework';
import {DialogController} from 'aurelia-dialog';
import * as $ from 'jquery';
import {Customer} from "../../models/customer";
import {CustomerService} from '../../services/data/customer-service';

@autoinject()
export class MergeCustomer {
  replace:Customer;
  keep:Customer | null;
  customers:Customer[];
  error:string | null = null;

  constructor(private element: Element, private service:CustomerService, private controller:DialogController) { }

  async activate(customer:Customer) {
    this.replace = customer;
    this.customers = await this.service.getAll();    
  }

  attached() {
    $('.dropdown', this.element).dropdown({
      onChange: this.onChange.bind(this)
    });
  }

  detached() {
    $('.dropdown', this.element).dropdown('destroy');
  }

  onChange(value:string) {
    const customer = this.customers.find(c => c._id === value);
    if(customer) {
      this.error = null;
      this.keep = customer;
    }
  }

  async save() {
    this.error = null;

    if(!this.keep) {
      this.error = `Please choose the customer to replace ${this.replace.name} with.`;
      return;
    }

    this.controller.ok(this.keep);
  }
}
