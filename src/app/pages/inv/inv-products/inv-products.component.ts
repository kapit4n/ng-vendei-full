import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

import { IProductsService, IProduct } from "../../../services/inv/i-products.service";

@Component({
  selector: "app-inv-products",
  templateUrl: "./inv-products.component.html",
  styleUrls: ["./inv-products.component.css"]
})
export class InvProductsComponent implements OnInit {
  
  products: IProduct[];
  constructor(
    private productsSrv: IProductsService, 
    private router: Router) {
    this.products = [];
  }

  ngOnInit() {
    this.productsSrv.getAll().subscribe(p => (this.products = p));
  }

  openInventory(productId: string) {
    this.router.navigate(["/inv/products/" + productId]);
  }
}
