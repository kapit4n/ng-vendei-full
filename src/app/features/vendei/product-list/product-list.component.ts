import { Component, OnInit, Input } from "@angular/core";
import { VProductsService } from "../../../services/vendei/v-products.service";
import { VCategoriesService } from "../../../services/vendei/v-categories.service";
import { VConfigService } from "../../../services/vendei/v-config.service";
import { Router } from "@angular/router";

@Component({
  selector: "app-product-list",
  templateUrl: "./product-list.component.html",
  styleUrls: ["./product-list.component.css"]
})
export class ProductListComponent implements OnInit {
  @Input()
  selectedProducts: any[];
  @Input() recalTotal: Function;
  @Input() printOrderCount: number;

  products = [];
  productCode = "";
  originalP = [];
  categories = [
    { id: 0, name: "All" },
    { id: 1, name: "Gatgets" },
    { id: 2, name: "TVs" },
    { id: 3, name: "Computer" }
  ];
  displayCat = false;

  constructor(
    private productsSvc: VProductsService,
    private categoriesSvc: VCategoriesService,
    public configSvc: VConfigService,
    private router: Router
  ) {}

  ngOnInit() {
    this.productsSvc.getProducts().subscribe(res => {
      this.products = res;
      this.originalP = res;
    });

    this.categoriesSvc.getAll().subscribe(res => {
      this.categories = res;
    });
  }

  addProduct(product: any) {
    if (this.printOrderCount) {
      return;
    }

    if (this.selectedProducts.some(p => p.id == product.id)) {
      this.selectedProducts.filter(p => p.id == product.id)[0].quantity += 1;
    } else {
      const selectedP = Object.assign({...product}, { quantity: 1 });
      this.selectedProducts.push(selectedP);
    }
    this.recalTotal();
  }

  filterByCategory(cat: any) {
    if (cat.id > 0) {
      this.products = this.originalP.filter(p => {
        const cid = p.Product?.categoryId ?? p.categoryId;
        return cid === cat.id;
      });
    } else {
      this.products = this.originalP;
    }
  }

  filterByName(event) {
    let searchText = event.target.value;
    if (searchText) {
      let sText = searchText.toLowerCase();
      this.products = this.originalP.filter(p => {
        const n = (p.Product?.name || p.name || "").toLowerCase();
        return n.includes(sText);
      });
    } else {
      this.products = this.originalP;
    }
  }

  addByCode(event) {
    if (this.printOrderCount) {
      return;
    }

    let searchCode = event.target.value;

    if (searchCode) {
      const codeMatch = (p: any) =>
        (p.Product?.code || p.code || "").toLowerCase() === searchCode.toLowerCase();
      let cProduct = this.originalP.find(codeMatch);
      if (cProduct) {
        this.addProduct(cProduct);
        this.productCode = "";
      }
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

  /** Background image for product card; falls back to placeholder when path missing or relative-only. */
  productCardImageUrl(product: any): string {
    const raw = product?.Product?.img;
    if (!raw || typeof raw !== "string") {
      return "assets/vendei/placeholders/product-card.svg";
    }
    const t = raw.trim();
    if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/")) {
      return t;
    }
    if (t.startsWith("assets/")) {
      return t;
    }
    return "assets/vendei/placeholders/product-card.svg";
  }

  displayProductName(product: any): string {
    return product?.Product?.name || product?.name || "Product";
  }
}
