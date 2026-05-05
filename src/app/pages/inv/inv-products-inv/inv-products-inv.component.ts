import { ChangeDetectorRef, Component, OnInit } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { IProductsService } from "../../../services/inv/i-products.service";
import { IProductsInvService } from "../../../services/inv/i-products-inv.service";
import { finalize } from "rxjs/operators";
import { addUtcDaysFromToday, earliestOpenLotExpiry } from "../../../utils/inv-expiry";
//import { NgbModal, ModalDismissReasons } from "@ng-bootstrap/ng-bootstrap";

@Component({
    selector: "app-inv-products-inv",
    templateUrl: "./inv-products-inv.component.html",
    styleUrls: ["./inv-products-inv.component.css"],
    standalone: false
})
export class InvProductsInvComponent implements OnInit {
  invInfo: any = {};
  productInvs: any[] = [];
  invItemInfo: any = {};
  closeResult: string;
  loadingProductInvs = true;
  receiveError = '';
  constructor(
    private route: ActivatedRoute,
    //private modalService: NgbModal,
    private productSvc: IProductsService,
    private productInvSvc: IProductsInvService,
    private router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {
    
  }

  ngOnInit() {
    let id = this.route.snapshot.paramMap.get("id");
    if (id != "new") {
      this.loadInvInfo(id);
      this.loadProductInvs(id);
    }
  }

  open(content) {
    /**
     * 
    this.modalService.open(content).result.then(
      result => {
        this.closeResult = `Closed with: ${result}`;
      },
      reason => {
        this.closeResult = `Dismissed ${this.getDismissReason(reason)}`;
      }
    );
     */
  }

  goBack(): void {
    this.router.navigate(["/inv/products"]);
  }

  private getDismissReason(reason: any): string {
    // if (reason === ModalDismissReasons.ESC) {
    //   return "by pressing ESC";
    // } else if (reason === ModalDismissReasons.BACKDROP_CLICK) {
    //   return "by clicking on a backdrop";
    // } else {
    //   return `with: ${reason}`;
    // }

    throw Error("Change to material dialog")
  }

  loadInvInfo(id: string) {
    this.productSvc.getById(id, { includeLots: true }).subscribe(inv => {
      this.invInfo = inv;
      this.invItemInfo.price = this.invInfo.cost;
    });
  }

  get tracksExpiry(): boolean {
    return !!this.invInfo?.trackExpiry;
  }

  get inventoryLots(): any[] {
    const raw = this.invInfo?.inventoryLots;
    return Array.isArray(raw) ? raw : [];
  }

  /** Next expiry among lots still open (qty &gt; 0). */
  get nextLotExpiry(): string | null {
    return earliestOpenLotExpiry(this.invInfo?.inventoryLots);
  }

  private resolvedExpiryForReceipt(): string | undefined {
    if (!this.tracksExpiry) {
      return undefined;
    }
    const manual = String(this.invItemInfo.expiryDate || '').trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(manual)) {
      return manual;
    }
    if (this.hasDefaultShelfLifeOnProduct()) {
      const days = Math.floor(Number(this.invInfo.defaultShelfLifeDays));
      const s = addUtcDaysFromToday(days);
      return s || undefined;
    }
    return undefined;
  }

  private hasValidExpiryInput(): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(this.invItemInfo.expiryDate || '').trim());
  }

  private hasDefaultShelfLifeOnProduct(): boolean {
    const n = Number(this.invInfo?.defaultShelfLifeDays);
    return Number.isFinite(n) && n >= 0;
  }

  loadProductInvs(id: string) {
    this.productInvSvc.getByProductId(id).pipe(finalize(() => {
      this.loadingProductInvs = false;
      this.cdr.detectChanges();
    })).subscribe(invs => {
      this.productInvs = invs;
    });
  }

  saveInvItem() {
    this.receiveError = '';
    if (!this.invInfo?.id) {
      return;
    }
    const q = Number(this.invItemInfo.quantity);
    const p = Number(this.invItemInfo.price);
    if (!Number.isFinite(q) || q <= 0 || !Number.isFinite(p) || p < 0) {
      return;
    }

    /** First receipt with an expiry date: turn on tracking so lots and FEFO apply without leaving Inventory. */
    if (!this.invInfo.trackExpiry && this.hasValidExpiryInput()) {
      this.productSvc
        .update({ id: this.invInfo.id, trackExpiry: true } as any)
        .subscribe({
          next: (u: any) => {
            this.invInfo = { ...this.invInfo, ...(u || {}), trackExpiry: true };
            this.runReceivePurchase();
          },
          error: () => {
            this.receiveError =
              'Could not enable expiry tracking. Try again or turn on "Track expiry" under Register → Products.';
            this.cdr.detectChanges();
          },
        });
      return;
    }

    this.runReceivePurchase();
  }

  private runReceivePurchase(): void {
    if (this.tracksExpiry && !this.hasDefaultShelfLifeOnProduct() && !this.hasValidExpiryInput()) {
      this.receiveError =
        'Enter an expiry date, or set default shelf life (days) on the product under Register → Products.';
      this.cdr.detectChanges();
      return;
    }

    const qty = Number(this.invItemInfo.quantity);
    const pCost = Number(this.invItemInfo.price);
    const totalPrice = qty * pCost;
    const productId = String(this.invInfo.id);
    const resolvedEx = this.tracksExpiry ? this.resolvedExpiryForReceipt() : undefined;
    const batchTrim = String(this.invItemInfo.batchCode || '').trim();

    const purchasePayload: Record<string, unknown> = {
      quantity: qty,
      price: pCost,
      totalPrice,
      productId: Number(this.invInfo.id),
    };
    if (batchTrim) {
      purchasePayload.batchCode = batchTrim;
    }
    if (this.tracksExpiry && resolvedEx) {
      purchasePayload.expiryDate = resolvedEx;
    }

    const addOpts =
      this.tracksExpiry
        ? { expiryDate: resolvedEx, batchCode: batchTrim || undefined }
        : undefined;

    this.productInvSvc.save(purchasePayload as any).subscribe({
      next: () => {
        this.productSvc.addToInventory(productId, qty, addOpts).subscribe({
          next: () => {
            this.loadProductInvs(productId);
            this.loadInvInfo(productId);
            this.invItemInfo.quantity = '';
            this.invItemInfo.expiryDate = '';
            this.invItemInfo.batchCode = '';
            this.cdr.detectChanges();
          },
          error: () => {
            this.receiveError =
              'Purchase was saved but stock could not be increased (check expiry / server). Adjust inventory if needed.';
            this.loadProductInvs(productId);
            this.loadInvInfo(productId);
            this.cdr.detectChanges();
          },
        });
      },
      error: () => {
        this.receiveError = 'Could not save purchase line. Try again.';
        this.cdr.detectChanges();
      },
    });
  }

  delInvItem(invItem: any) {
    this.productSvc.reduceInventory(this.invInfo.id, Number(invItem.quantity)).subscribe(res => {
      console.log(res);
      this.loadInvInfo(this.invInfo.id);
    });

    this.productInvSvc.remove(invItem.id).subscribe(product => {
      this.loadProductInvs(this.invInfo.id);
    });
  }
}
