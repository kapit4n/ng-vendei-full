import { Component, OnInit } from '@angular/core';
import { RProductService, IProduct } from '../../../services/reg/r-product.service'
import { RProductPresentationService, IProductPresentation } from '../../../services/reg/r-product-presentation.service'
import { Router } from "@angular/router";

@Component({
  selector: "app-reg-product-list",
  templateUrl: "./reg-product-list.component.html",
  styleUrls: ["./reg-product-list.component.css"]
})
export class RegProductListComponent implements OnInit {
  products: IProduct[];
  productPresentations: IProductPresentation[];
  /** 0 = Products, 1 = Product details */
  tabIndex = 0;
  constructor(private productSvc: RProductService, private productPresentationSvc: RProductPresentationService, private router: Router) {}

  ngOnInit() {
    this.loadProducts();
    this.loadProductPresentations();
  }

  loadProducts() {
    this.productSvc.getAll().subscribe(products => {
      this.products = products;
    });
  }

  loadProductPresentations() {
    this.productPresentationSvc.getAll().subscribe(productPresentations => {
      this.productPresentations = productPresentations;
    });
  }

  newProduct() {
    this.router.navigate(["/reg/products/new"]);
  }

  newProductPresentation() {
    this.router.navigate(["/reg/productPresentations/new"]);
  }

  openProduct(id: string) {
    this.router.navigate(["/reg/products/" + id]);
  }

  openProductPresentation(id: string) {
    this.router.navigate(["/reg/productPresentations/" + id]);
  }

  openCart() {
    this.router.navigate([""]);
  }

  removeProduct(productId: string) {
    if (!confirm('Delete this product? This cannot be undone.')) {
      return;
    }
    this.productSvc.remove(productId).subscribe(() => {
      this.loadProducts();
    });
  }

  removeProductPresentation(productPId: string) {
    if (!confirm('Delete this product detail? This cannot be undone.')) {
      return;
    }
    this.productPresentationSvc.remove(productPId).subscribe(() => {
      this.loadProductPresentations();
    });
  }
}
