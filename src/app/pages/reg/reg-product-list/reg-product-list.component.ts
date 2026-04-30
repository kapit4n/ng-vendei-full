import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RProductService, IProduct } from '../../../services/reg/r-product.service'
import { RProductPresentationService, IProductPresentation } from '../../../services/reg/r-product-presentation.service'
import { Router } from "@angular/router";
import { finalize } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
    selector: "app-reg-product-list",
    templateUrl: "./reg-product-list.component.html",
    styleUrls: ["./reg-product-list.component.css"],
    standalone: false
})
export class RegProductListComponent implements OnInit {
  products: IProduct[];
  loadingProducts = true;
  productPresentations: IProductPresentation[];
  /** 0 = Products, 1 = Product details */
  tabIndex = 0;
  constructor(
    private productSvc: RProductService,
    private productPresentationSvc: RProductPresentationService,
     private router: Router, private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadProductPresentations();
  }

  loadProducts() {
    this.productSvc.getAll().pipe(finalize(() => {
      this.loadingProducts = false;
      this.cdr.detectChanges();
    }
    )).subscribe(products => {
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

  openProductShow(id: string) {
    this.router.navigate(["/reg/products/view", id]);
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

  presentationUnitLabel(row: IProductPresentation & { UnitOfMeasure?: { code?: string; name?: string } }): string {
    const u = row.UnitOfMeasure;
    if (u?.code && u?.name) {
      return `${u.code} — ${u.name}`;
    }
    if (u?.name) {
      return u.name;
    }
    return (row.unitOfMeasure || '').trim() || '—';
  }
}
