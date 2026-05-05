import { ChangeDetectorRef, Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
import { forkJoin } from "rxjs";
import { VProductsService } from "../../../services/vendei/v-products.service";
import { VCategoriesService } from "../../../services/vendei/v-categories.service";
import { VConfigService } from "../../../services/vendei/v-config.service";
import { Router } from "@angular/router";
import { roundToCents } from "src/app/utils/money";
import { resolvePresentationImageUrl } from "src/app/utils/product-image-url";
import {
  productLabelFromFields,
  productLabelFromFullName,
  productTitleFromFullName,
} from "src/app/utils/product-display-text";

@Component({
    selector: "app-product-list",
    templateUrl: "./product-list.component.html",
    styleUrls: ["./product-list.component.css"],
    standalone: false
})
export class ProductListComponent implements OnInit {
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

  constructor(
    private productsSvc: VProductsService,
    private categoriesSvc: VCategoriesService,
    public configSvc: VConfigService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Single completion tick avoids stale UI between the two HTTP calls, and we
    // run CD explicitly so the grid paints without needing a user event (e.g.
    // focusing the search field).
    forkJoin({
      products: this.productsSvc.getProducts(),
      categories: this.categoriesSvc.getAll(),
    }).subscribe(({ products, categories }) => {
      const normalized = (products || []).map((p: any) => ({
        ...p,
        currentPrice: roundToCents(p.currentPrice ?? p.price),
      }));
      this.originalP = normalized;
      const list = Array.isArray(categories) ? categories : [];
      /** Sentinel -1 avoids clashing with a real category id of 0 from the API. */
      this.categories = [{ id: -1, name: "All" }, ...list];
      this.activeCategory = null;
      this.applyFilters();
      this.cdr.detectChanges();
    });
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

    // Mutate the array in place: it is the same reference as the parent's
    // `selectedProducts`. Reassigning `this.selectedProducts = [...]` would only
    // update this @Input locally and would not update the ticket.
    const list = this.selectedProducts;
    if (list.some(p => p.id == product.id)) {
      const line = list.filter(p => p.id == product.id)[0];
      line.quantity = Number(line.quantity) + 1;
      line.currentPrice = roundToCents(line.currentPrice ?? line.price);
    } else {
      const selectedP = Object.assign({}, product, {
        quantity: 1,
        currentPrice: roundToCents(product.currentPrice ?? product.price),
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
