import {autoinject, computedFrom} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {EditCustomer} from './edit';
import {MergeCustomer} from './merge';
import {Prompt} from '../controls/prompt';
import {CustomerService} from "../../services/data/customer-service";
import {Customer} from "../../models/customer";
import {Notifications} from "../../services/notifications";

@autoinject()
export class CustomerList {
  search:string = '';
  allCustomers:Customer[];

  constructor(private customerService:CustomerService, private dialogService:DialogService) { }

  refresh() {
    this.customerService.getAll()
      .then(result => {
        this.allCustomers = result;
      })
      .catch(Notifications.error);
  }

  attached() {
    this.refresh();
  }

  @computedFrom('search', 'allCustomers')
  get customers() {
    if(!this.search) return this.allCustomers;

    return this.allCustomers.filter(c => {
      return c.name.toLowerCase().indexOf(this.search.toLowerCase()) !== -1;
    });
  }

  delete(customer:Customer) {
    this.dialogService.open({ viewModel: Prompt, model: 'Are you sure you want to delete this Customer?' })
      .whenClosed(result => {
        if(result.wasCancelled) return;

        this.customerService.delete(customer)
          .then(() => {
            Notifications.success('Customer deleted successfully');
            this.refresh();
          })
          .catch(Notifications.error);
      });
  }

  edit(customer:Customer) {
    this.dialogService.open({ viewModel: EditCustomer, model: customer })
      .whenClosed(result => {
        if(result.wasCancelled) return;

        this.customerService.save(result.output)
          .then(() => {
            Notifications.success('Customer saved successfully');
            this.refresh();
          })
          .catch(Notifications.error);
      });
  }

  merge(customer:Customer) {
    this.dialogService.open({ viewModel: MergeCustomer, model: customer })
      .whenClosed(result => {
        if(result.wasCancelled) return;

        this.customerService.merge(result.output, customer)
          .then(() => {
            Notifications.success('Customer merged successfully');
            this.refresh();
          })
          .catch(Notifications.error);
      });
  }
}
