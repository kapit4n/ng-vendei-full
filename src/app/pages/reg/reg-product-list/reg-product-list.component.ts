import { Component, OnInit } from '@angular/core';
import { RProductService, IProduct } from '../../../services/reg/r-product.service'
import { RProductPresentationService, IProductPresentation } from '../../../services/reg/r-product-presentation.service'
import {
  StoreProfile,
  VStoreProfileService
} from '../../../services/vendei/v-store-profile.service';
import {
  filterProductsByStoreType,
  storeTypeChips,
  StoreTypeChip
} from '../../../utils/store-type-filter';
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
  /** Store profiles used to resolve a product's business type. */
  profiles: StoreProfile[] = [];
  /** Business-type chips; empty until both products and profiles have loaded. */
  storeTypeChips: StoreTypeChip[] = [];
  /** Active chip's profile id, or null for "All". */
  selectedStoreProfileId: string | number | null = null;

  constructor(
    private productSvc: RProductService,
    private productPresentationSvc: RProductPresentationService,
    private profileSvc: VStoreProfileService,
     private router: Router
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadProductPresentations();
    this.loadProfiles();
  }

  /** Products matching the active chip. */
  get filteredProducts(): IProduct[] {
    return filterProductsByStoreType(this.products, this.selectedStoreProfileId);
  }

  isStoreTypeActive(chip: StoreTypeChip): boolean {
    return this.selectedStoreProfileId !== null
      && String(this.selectedStoreProfileId) === String(chip.profileId);
  }

  /** Clicking the active chip clears the filter, matching the POS chips. */
  selectStoreType(chip: StoreTypeChip): void {
    this.selectedStoreProfileId = this.isStoreTypeActive(chip) ? null : chip.profileId;
  }

  clearStoreTypeFilter(): void {
    this.selectedStoreProfileId = null;
  }

  private loadProfiles(): void {
    // getProfiles() swallows errors and yields [], so the chips simply stay
    // hidden rather than the list failing to render.
    this.profileSvc.getProfiles().subscribe((profiles) => {
      this.profiles = profiles ?? [];
      this.rebuildStoreTypeChips();
    });
  }

  private rebuildStoreTypeChips(): void {
    this.storeTypeChips = storeTypeChips(this.products, this.profiles);
    // A filter can survive a reload that empties its chip; drop it so the
    // table never shows "no products" with no way to tell why.
    if (this.selectedStoreProfileId !== null
      && !this.storeTypeChips.some((c) => String(c.profileId) === String(this.selectedStoreProfileId))) {
      this.selectedStoreProfileId = null;
    }
  }

  loadProducts() {
    // No explicit detectChanges in finalize: a synchronous service emits during
    // ngOnInit, so a nested check here would run while the first render pass is
    // still being verified and raise NG0100 on whatever the header binds to.
    // Zone-driven CD already covers the async case for this default-CD component.
    this.productSvc.getAll().pipe(finalize(() => {
      this.loadingProducts = false;
    }
    )).subscribe(products => {
      this.products = products;
      this.rebuildStoreTypeChips();
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
