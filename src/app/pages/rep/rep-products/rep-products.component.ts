import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";

import {
  RepProductsService,
  IProduct
} from "../../../services/rep/rep-products.service";

@Component({
  selector: "app-rep-products",
  templateUrl: "./rep-products.component.html",
  styleUrls: ["./rep-products.component.css"]
})
export class RepProductsComponent implements OnInit {
  products: IProduct[];
  constructor(private productsSrv: RepProductsService, private router: Router) {
    this.products = [];
  }

  ngOnInit() {
    this.productsSrv.getAll().subscribe(p => (this.products = p));
  }

  openProductRep(pId: string) {
    this.router.navigate(["/rep/products/" + pId]);
  }

  openSells() {
    this.router.navigate(["/rep/sells"]);
  }

  openCart() {
    this.router.navigate([""]);
  }

}
