import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";

import { IProductsService, IProduct } from "../../../services/inv/i-products.service";
import { finalize } from "rxjs/operators";
import { normalizeApiArray } from "../../../utils/api-body";
import { daysFromTodayUtc, earliestOpenLotExpiry } from "../../../utils/inv-expiry";

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
    this.productsSrv
      .getAll({ includeLots: true })
      .pipe(
        finalize(() => {
          this.loadingProducts = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe((p) => {
        this.products = normalizeApiArray(p) as IProduct[];
      });
  }

  openInventory(productId: string) {
    this.router.navigate(["/inv/products/" + productId]);
  }

  /** Earliest expiry among open lots (for perishable SKUs). */
  nextExpiry(p: IProduct): string | null {
    if (!p?.trackExpiry) {
      return null;
    }
    return earliestOpenLotExpiry(p.inventoryLots);
  }

  /** Short hint: days until next expiry, or empty. */
  expiryHint(p: IProduct): string {
    const d = this.nextExpiry(p);
    if (!d) {
      return '';
    }
    const days = daysFromTodayUtc(d);
    if (days === null) {
      return '';
    }
    if (days < 0) {
      return `${days}d`;
    }
    if (days === 0) {
      return 'today';
    }
    if (days === 1) {
      return '1 day';
    }
    return `${days} days`;
  }

  expiryRowClass(p: IProduct): string {
    const d = this.nextExpiry(p);
    if (!d) {
      return '';
    }
    const days = daysFromTodayUtc(d);
    if (days === null) {
      return '';
    }
    if (days < 0) {
      return 'expiry-row expiry-row--past';
    }
    if (days <= 7) {
      return 'expiry-row expiry-row--soon';
    }
    return 'expiry-row';
  }
}
