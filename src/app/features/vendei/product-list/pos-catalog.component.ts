import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from "@angular/core";
import { forkJoin, of, Subject } from "rxjs";
import { catchError, switchMap, takeUntil } from "rxjs/operators";
import { MatDialog } from "@angular/material/dialog";
import { VProductsService } from "../../../services/vendei/v-products.service";
import { VCategoriesService } from "../../../services/vendei/v-categories.service";
import { VConfigService } from "../../../services/vendei/v-config.service";
import { VStoreProfileService } from "../../../services/vendei/v-store-profile.service";
import { VProductVariantService } from "../../../services/vendei/v-product-variant.service";
import { VariantSelectDialogComponent } from "../variant-select-dialog/variant-select-dialog.component";
import { QtyInputDialogComponent } from "./qty-input-dialog.component";
import { Router } from "@angular/router";
import { roundToCents } from "src/app/utils/money";
import { resolvePresentationImageUrl } from "src/app/utils/product-image-url";
import {
  productLabelFromFields,
  productLabelFromFullName,
  productTitleFromFullName,
} from "src/app/utils/product-display-text";
import { CAPABILITIES, SELLING_MODES, isDecimalSellingMode, sellingModeUnitLabel, SellingMode, ProductCardSize, PRODUCT_CARD_SIZES } from "src/app/services/vendei/v-store-profile.service";

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
  /** True while the initial catalog load is in flight. */
  loading = true;
  /** Error loading the initial catalog. */
  loadError = "";
  /** Current product card density (synced from the profile config). */
  private _cardSize: ProductCardSize = "medium";

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
    this._cardSize = this.profileSvc.getCatalogCardSize();
    this.profileSvc.getActiveProfileId$().pipe(
      takeUntil(this.destroy$),
      switchMap((profileId) => this.loadCatalog(profileId))
    ).subscribe({
      next: () => this.cdr.detectChanges(),
      error: () => {
        this.loading = false;
        this.originalP = [];
        this.products = [];
        this.categories = [];
        this.loadError = "Unable to load products.";
        this.cdr.detectChanges();
      },
    });
  }

  /** Fetch products + categories for a profile and populate the catalog. */
  private loadCatalog(profileId: number | null): any {
    this.loading = true;
    this.loadError = "";
    return forkJoin({
      products: this.productsSvc.getProducts(profileId || undefined),
      categories: this.categoriesSvc.getAll(profileId || undefined),
    }).pipe(
      switchMap(({ products, categories }) => {
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
        this._cardSize = this.profileSvc.getCatalogCardSize();
        this.applyFilters();
        this.loading = false;
        return of({});
      }),
      catchError((err) => {
        throw err;
      })
    );
  }

  /** Re-run the catalog load after an error. */
  retry(): void {
    this.loadCatalog(this.profileSvc.getActiveProfileId()).subscribe({
      next: () => this.cdr.detectChanges(),
      error: () => {
        this.loading = false;
        this.loadError = "Unable to load products.";
        this.cdr.detectChanges();
      },
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

    // Resolve selling mode: per-product override → profile default → UNIT
    const sellingMode = this.profileSvc.resolveSellingMode(
      product.sellingMode ?? product.Product?.sellingMode
    );

    // For WEIGHT / VARIABLE_QTY, prompt for decimal quantity
    if (isDecimalSellingMode(sellingMode)) {
      this.openQuantityDialog(product, sellingMode);
      return;
    }

    if (productId && this.hasVariantsEnabled) {
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

  private openQuantityDialog(product: any, sellingMode: SellingMode): void {
    const unitLabel = sellingModeUnitLabel(sellingMode);
    const dialogRef = this.dialog.open(QtyInputDialogComponent, {
      width: '300px',
      data: {
        productName: this.displayProductName(product),
        unitLabel,
        initialQuantity: 0.25,
      },
    });

    dialogRef.afterClosed().subscribe((qty) => {
      if (qty && Number(qty) > 0) {
        this.addProductToCart(product, undefined, sellingMode, Number(qty));
      }
    });
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

  private addProductToCart(product: any, variant?: any, sellingMode?: string, decimalQty?: number) {
    const list = this.selectedProducts;
    const lineId = variant ? `${product.id ?? product.productId}-v${variant.variantId}` : product.id;
    const existing = list.find(p => p.id == lineId);
    if (existing) {
      if (decimalQty != null) {
        existing.quantity = roundToCents(Number(existing.quantity) + decimalQty);
      } else {
        existing.quantity = Number(existing.quantity) + 1;
      }
      existing.currentPrice = roundToCents(existing.currentPrice ?? existing.price);
    } else {
      const mode = sellingMode || product.sellingMode || product.Product?.sellingMode || '';
      const unitLabel = sellingModeUnitLabel(mode);
      const qty = decimalQty != null ? decimalQty : 1;
      const selectedP = Object.assign({}, product, {
        id: lineId,
        quantity: qty,
        currentPrice: variant ? roundToCents(variant.currentPrice) : roundToCents(product.currentPrice ?? product.price),
        variantId: variant?.variantId || null,
        variantName: variant?.variantName || null,
        variantSku: variant?.variantSku || null,
        sellingMode: mode || null,
        unitLabel: unitLabel || null,
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
  focusQuickCode(): void {
    setTimeout(() => this.quickCodeInput?.nativeElement?.focus(), 0);
  }

  /** Presentation image, else parent product image, else placeholder. */
  productCardImageUrl(product: any): string {
    return resolvePresentationImageUrl(product?.img, product?.Product?.img);
  }

  /** Whether the active profile supports barcode scanning / quick code entry. */
  get canScanBarcode(): boolean {
    return this.profileSvc.hasCapability(CAPABILITIES.BARCODE);
  }

  /** Whether the active profile supports product variants. */
  get hasVariantsEnabled(): boolean {
    return this.profileSvc.hasCapability(CAPABILITIES.PRODUCT_VARIANTS);
  }

  /** Whether sold-out products should be shown as disabled (per profile). */
  get respectStock(): boolean {
    return this.profileSvc.getPosConfig().respectStock !== false;
  }

  /** Catalog grid columns from profile config (default: 4). */
  get catalogColumns(): number {
    const cols = this.profileSvc.getPosConfig().catalogColumns;
    return cols >= 2 && cols <= 8 ? cols : 4;
  }

  /** Current product card density (medium fallback). */
  get cardSize(): ProductCardSize {
    return this._cardSize;
  }

  /** Available densities for the quick display control. */
  get cardSizes(): ProductCardSize[] {
    return PRODUCT_CARD_SIZES;
  }

  /** Human-friendly label for a card size (internal ids stay lowercase). */
  sizeLabel(size: ProductCardSize): string {
    switch (size) {
      case "small": return "Small";
      case "large": return "Large";
      default: return "Medium";
    }
  }

  /**
   * Apply a product card size and persist it for the active profile.
   * Presentation-only: no products/ticket/search/category are reloaded or reset.
   */
  setCardSize(size: ProductCardSize): void {
    if (!PRODUCT_CARD_SIZES.includes(size)) {
      size = "medium";
    }
    this._cardSize = size;
    this.cdr.detectChanges();
    this.profileSvc.setCatalogCardSize(size).subscribe({
      error: () => this.cdr.detectChanges(),
    });
  }

  /** Minimum grid track width for the active card size (auto-fill remains responsive). */
  get minColumnWidth(): number {
    switch (this._cardSize) {
      case "small": return 186;
      case "large": return 296;
      default: return 228;
    }
  }

  /** Grid variant class used to theme gaps per card size. */
  get gridVariantClass(): string {
    return `product-cards-grid--${this._cardSize}`;
  }

  /** Whether to show product images on catalog cards (default: true). */
  get showProductImages(): boolean {
    return this.profileSvc.getPosConfig().showProductImages !== false;
  }

  /** Inline style for responsive grid template columns driven by card size. */
  get gridStyle(): Record<string, string> {
    return { 'grid-template-columns': `repeat(auto-fill, minmax(${this.minColumnWidth}px, 1fr))` };
  }

  /** Quick-access products resolved from profile config (by ID). */
  get quickProductsList(): any[] {
    const ids = this.profileSvc.getPosConfig().quickProducts;
    if (!ids?.length) return [];
    return ids
      .map((id) => this.originalP.find((p) => (p.productId ?? p.Product?.id ?? p.id) == id))
      .filter(Boolean)
      .slice(0, 6);
  }

  displayProductName(product: any): string {
    return product?.Product?.name || product?.name || "Product";
  }

  /** Placeholder count for the loading skeleton grid (enough to fill one screen). */
  skeletonCards(): number[] {
    const cols = this._cardSize === "small" ? 5 : this._cardSize === "large" ? 3 : 4;
    return new Array(Math.max(cols, cols * 3)).fill(0).map((_, i) => i);
  }

  productCardTitle(product: any): string {
    return productTitleFromFullName(this.displayProductName(product));
  }

  productCardLabel(product: any): string | null {
    const full = this.displayProductName(product);
    return productLabelFromFullName(full) ?? productLabelFromFields(product);
  }
}
