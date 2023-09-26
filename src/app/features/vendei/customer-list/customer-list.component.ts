import { Component, OnInit, Input } from '@angular/core';

import { VCustomersService } from '../../../services/vendei/v-customers.service';

@Component({
  selector: "app-customer-list",
  templateUrl: "./customer-list.component.html",
  styleUrls: ["./customer-list.component.css"]
})
export class CustomerListComponent implements OnInit {
  @Input() selectCustomer: Function;

  searchText: string = "";
  customers: any[];
  constructor(private customersSvc: VCustomersService) {

  }

  ngOnInit() {
    this.customersSvc.getAll().subscribe(customers => this.customers = customers);
  }

  loadCustomers(){
    console.log("Loocking for " + this.searchText);
  }

  addCustomer(customer) {
    console.log(customer);
  }
}
