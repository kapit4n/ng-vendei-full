import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

import { IProductsService, IProduct } from "../../../services/inv/i-products.service";
import { finalize } from "rxjs/operators";

@Component({
    selector: "app-inv-products",
    templateUrl: "./inv-products.component.html",
    styleUrls: ["./inv-products.component.css"],
    standalone: false
})
export class InvProductsComponent implements OnInit {
  
  products: IProduct[];
  loadingProducts = true;
  constructor(
    private productsSrv: IProductsService, 
    public router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {
    this.products = [];
  }

  ngOnInit() {
    this.productsSrv.getAll().pipe(finalize(() => {
      this.loadingProducts = false;
      this.cdr.detectChanges();
    })).subscribe(p => (this.products = p));
  }

  openInventory(productId: string) {
    this.router.navigate(["/inv/products/" + productId]);
  }
}
