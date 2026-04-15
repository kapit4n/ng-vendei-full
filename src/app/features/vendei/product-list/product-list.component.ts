import { Component, OnInit, Input } from "@angular/core";
import { VProductsService } from "../../../services/vendei/v-products.service";
import { VCategoriesService } from "../../../services/vendei/v-categories.service";
import { VConfigService } from "../../../services/vendei/v-config.service";
import { Router } from "@angular/router";
import { roundToCents } from "src/app/utils/money";
import { resolvePresentationImageUrl } from "src/app/utils/product-image-url";

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
    private router: Router
  ) {}

  ngOnInit() {
    this.productsSvc.getProducts().subscribe(res => {
      const normalized = (res || []).map((p: any) => ({
        ...p,
        currentPrice: roundToCents(p.currentPrice),
      }));
      this.originalP = normalized;
      this.applyFilters();
    });

    this.categoriesSvc.getAll().subscribe(res => {
      const list = res || [];
      this.categories = [{ id: 0, name: "All" }, ...list];
      this.activeCategory = null;
      this.applyFilters();
    });
  }

  applyFilters(): void {
    let list = [...this.originalP];
    if (this.activeCategory && this.activeCategory.id > 0) {
      list = list.filter(p => {
        const cid = p.Product?.categoryId ?? p.categoryId;
        return cid === this.activeCategory!.id;
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
    this.activeCategory = cat.id === 0 ? null : cat;
    this.applyFilters();
  }

  isCategoryActive(cat: { id: number; name: string }): boolean {
    if (cat.id === 0) {
      return this.activeCategory === null;
    }
    return this.activeCategory?.id === cat.id;
  }

  addProduct(product: any) {
    if (this.printOrderCount) {
      return;
    }

    if (this.selectedProducts.some(p => p.id == product.id)) {
      const line = this.selectedProducts.filter(p => p.id == product.id)[0];
      line.quantity += 1;
      line.currentPrice = roundToCents(line.currentPrice);
    } else {
      const selectedP = Object.assign({}, product, {
        quantity: 1,
        currentPrice: roundToCents(product.currentPrice),
      });
      this.selectedProducts.push(selectedP);
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

  /** Presentation image, else parent product image, else placeholder. */
  productCardImageUrl(product: any): string {
    return resolvePresentationImageUrl(product?.img, product?.Product?.img);
  }

  displayProductName(product: any): string {
    return product?.Product?.name || product?.name || "Product";
  }
}
