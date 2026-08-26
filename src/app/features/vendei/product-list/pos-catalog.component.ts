import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { forkJoin, Subject } from "rxjs";
import { switchMap, takeUntil } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { VProductsService } from "../../../services/vendei/v-products.service";
import { VCategoriesService } from "../../../services/vendei/v-categories.service";
import { VConfigService } from "../../../services/vendei/v-config.service";
import { VStoreProfileService } from "../../../services/vendei/v-store-profile.service";
import { VProductVariantService } from "../../../services/vendei/v-product-variant.service";
import { VariantSelectDialogComponent } from "../variant-select-dialog/variant-select-dialog.component";
import { Router } from "@angular/router";
import { roundToCents } from "src/app/utils/money";
import { resolvePresentationImageUrl } from "src/app/utils/product-image-url";
import {
  productLabelFromFields,
  productLabelFromFullName,
  productTitleFromFullName,
} from "src/app/utils/product-display-text";

@Component({
    selector: "app-pos-catalog",
    templateUrl: "./pos-catalog.component.html",
    styleUrls: ["./pos-catalog.component.css"],
    standalone: false
})
export class PosCatalogComponent implements OnInit, OnDestroy {
  @Input()
  selectedProducts: any[];
  @Input() recalTotal: Function;
  @Input() printOrderCount: number;

  @ViewChild("quickCodeInput", { static: false })
  quickCodeInput?: ElementRef<HTMLInputElement>;

  products = [];
  productCode = "";
  searchQuery = "";
  originalP = [];
  categories: { id: number; name: string }[] = [];
  /** When set, filters by category id; null means all categories. */
  activeCategory: { id: number; name: string } | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private productsSvc: VProductsService,
    private categoriesSvc: VCategoriesService,
    public configSvc: VConfigService,
    private profileSvc: VStoreProfileService,
    private variantSvc: VProductVariantService,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.profileSvc.getActiveProfileId$().pipe(
      takeUntil(this.destroy$),
      switchMap((profileId) => {
        return forkJoin({
          products: this.productsSvc.getProducts(profileId || undefined),
          categories: this.categoriesSvc.getAll(profileId || undefined),
        });
      })
    ).subscribe(({ products, categories }) => {
      const normalized = (products || []).map((p: any) => ({
        ...p,
        currentPrice: roundToCents(p.currentPrice ?? p.price),
      }));
      this.originalP = normalized;
      const list = Array.isArray(categories) ? categories : [];
      /** Sentinel -1 avoids clashing with a real category id of 0 from the API. */
      this.categories = [{ id: -1, name: "All" }, ...list];
      this.activeCategory = null;
      this.searchQuery = "";
      this.applyFilters();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Stable @for track when `id` is missing or not unique (presentations often use `productId`). */
  productRowTrack(index: number, product: any): string | number {
    const id = product?.id ?? product?.productId;
    if (id !== undefined && id !== null && id !== "") {
      return id;
    }
    return index;
  }

  applyFilters(): void {
    let list = [...this.originalP];
    if (this.activeCategory != null) {
      const want = Number(this.activeCategory.id);
      list = list.filter(p => {
        const cid = p.Product?.categoryId ?? p.categoryId;
        return Number(cid) === want;
      });
    }
    const q = (this.searchQuery || "").trim().toLowerCase();
    if (q) {
      list = list.filter(p => {
        const name = (p.Product?.name || p.name || "").toLowerCase();
        const code = (p.Product?.code || p.code || "").toLowerCase();
        return name.includes(q) || code.includes(q);
      });
    }
    this.products = list;
  }

  onSearchChange(value: string): void {
    this.searchQuery = value;
    this.applyFilters();
  }

  clearSearch(): void {
    this.searchQuery = "";
    this.applyFilters();
  }

  resetFilters(): void {
    this.activeCategory = null;
    this.searchQuery = "";
    this.applyFilters();
  }

  selectCategoryChip(cat: { id: number; name: string }): void {
    this.activeCategory = cat.id === -1 ? null : cat;
    this.applyFilters();
  }

  isCategoryActive(cat: { id: number; name: string }): boolean {
    if (cat.id === -1) {
      return this.activeCategory === null;
    }
    return Number(this.activeCategory?.id) === Number(cat.id);
  }

  addProduct(product: any) {
    if (this.printOrderCount) {
      return;
    }

    const productId = product.productId ?? product.Product?.id ?? product.id;
    if (productId) {
      this.variantSvc.getByProductId(productId).subscribe({
        next: (variants) => {
          const activeVariants = variants.filter((v) => v.active);
          if (activeVariants.length > 0) {
            this.openVariantDialog(product, activeVariants);
          } else {
            this.addProductToCart(product);
          }
        },
        error: () => {
          this.addProductToCart(product);
        },
      });
    } else {
      this.addProductToCart(product);
    }
  }

  private openVariantDialog(product: any, variants: any[]): void {
    const dialogRef = this.dialog.open(VariantSelectDialogComponent, {
      width: '400px',
      data: {
        productId: product.productId ?? product.Product?.id ?? product.id,
        productName: product.Product?.name || product.name || 'Product',
        basePrice: roundToCents(product.currentPrice ?? product.price),
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === null) {
        return;
      }
      if (result.base) {
        this.addProductToCart(product);
      } else {
        this.addProductToCart(product, result);
      }
    });
  }

  private addProductToCart(product: any, variant?: any) {
    const list = this.selectedProducts;
    const lineId = variant ? `${product.id ?? product.productId}-v${variant.variantId}` : product.id;
    const existing = list.find(p => p.id == lineId);
    if (existing) {
      existing.quantity = Number(existing.quantity) + 1;
      existing.currentPrice = roundToCents(existing.currentPrice ?? existing.price);
    } else {
      const selectedP = Object.assign({}, product, {
        id: lineId,
        quantity: 1,
        currentPrice: variant ? roundToCents(variant.currentPrice) : roundToCents(product.currentPrice ?? product.price),
        variantId: variant?.variantId || null,
        variantName: variant?.variantName || null,
        variantSku: variant?.variantSku || null,
      });
      list.push(selectedP);
    }
    this.recalTotal();
  }

  addByCodeField(): void {
    if (this.printOrderCount) {
      return;
    }
    const searchCode = (this.productCode || "").trim();
    if (!searchCode) {
      return;
    }
    const codeMatch = (p: any) =>
      (p.Product?.code || p.code || "").toLowerCase() === searchCode.toLowerCase();
    const cProduct = this.originalP.find(codeMatch);
    if (cProduct) {
      this.addProduct(cProduct);
      this.productCode = "";
    }
    this.recalTotal();
  }
  openReports() {
    this.router.navigate(["/rep/products"]);
  }
  openRegister() {
    this.router.navigate(["/reg/products"]);
  }
  openMain() {
    this.router.navigate(["/main"]);
  }

  openCategoriesManage(): void {
    this.router.navigate(["/reg/categories"]);
  }

  focusQuickCode(): void {
    setTimeout(() => this.quickCodeInput?.nativeElement?.focus(), 0);
  }

  /** Presentation image, else parent product image, else placeholder. */
  productCardImageUrl(product: any): string {
    return resolvePresentationImageUrl(product?.img, product?.Product?.img);
  }

  displayProductName(product: any): string {
    return product?.Product?.name || product?.name || "Product";
  }

  productCardTitle(product: any): string {
    return productTitleFromFullName(this.displayProductName(product));
  }

  productCardLabel(product: any): string | null {
    const full = this.displayProductName(product);
    return productLabelFromFullName(full) ?? productLabelFromFields(product);
  }
}
