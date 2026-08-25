import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { concatMap, forkJoin } from "rxjs";
import { MatDialog } from "@angular/material/dialog";
import { VOrdersService } from "../../../services/vendei/v-orders.service";
import { VInventoryService } from "../../../services/vendei/v-inventory.service";
import { VInvoiceService } from "../../../services/vendei/v-invoice.service";
import { VConfigService } from "src/app/services/vendei/v-config.service";
import { VStoreProfileService, StoreProfile } from "src/app/services/vendei/v-store-profile.service";
import { ProfileSwitchDialogComponent } from "src/app/features/vendei/profile-switch-dialog/profile-switch-dialog.component";
import { roundToCents, isOrderReadyToSubmit, orderAmountDue } from "src/app/utils/money";
import { PaymentType } from "src/app/features/vendei/payment-types";

/** Shown in POS footer; align with product branding rather than package.json patch noise. */
const POS_DISPLAY_VERSION = "1.0.0";

@Component({
    selector: "app-pos-checkout",
    templateUrl: "./pos-checkout.component.html",
    styleUrls: ["./pos-checkout.component.css"],
    standalone: false
})
export class PosCheckoutComponent implements OnInit {

  // config
  displayCal = true;
  printTwice = false;
  printIt = false;

  total: number;
  /** Anonymous walk-in; omit document so the UI can show a placeholder ID line. */
  emptyCustomer = { id: 1, name: "Anonymous", ci: null as number | null, code: null as string | null };

  readonly posVersion = POS_DISPLAY_VERSION;

  selectedProducts = [];
  selectedCustomer: any;

  payedItems = [];
  discountItems = [];
  returnItems = [];

  paymentItemIds = 1;
  discountItemIds = 1;
  returnItemIds = 1;

  totalPayed = 0;
  totalDiscount = 0;
  totalReturn = 0;
  toReturn = 0;
  printOrderCount = 0;

  constructor(
    private ordersSvc: VOrdersService,
    private inventorySvc: VInventoryService,
    private invoiceSvc: VInvoiceService,
    public config: VConfigService,
    private readonly cdr: ChangeDetectorRef,
    private readonly router: Router,
    private readonly dialog: MatDialog,
    private readonly profileSvc: VStoreProfileService
  ) {
    this.total = 0;
    this.selectedCustomer = Object.assign({}, this.emptyCustomer);
  }

  @ViewChild("toPrint", { static: false }) myDiv: ElementRef;

  get currencySymbol(): string {
    return this.profileSvc.getCurrencySymbol();
  }

  ngOnInit() { }

  public removeProduct(product: any) {
    if (this.printOrderCount) {
      return;
    }
    this.selectedProducts = this.selectedProducts.filter(
      p => p.id != product.id
    );
    this.recalTotal();
  }

  recalTotal() {
    if (this.printOrderCount) {
      return;
    }
    let sum = 0;
    this.selectedProducts.forEach(val => {
      sum += roundToCents(val.currentPrice) * Number(val.quantity);
    });
    this.total = roundToCents(sum);
    this.calTotals();
  }

  printOrder() {
    let popupWindow;
    var todayTime = new Date();
    const locale = this.profileSvc.getLocale();
    const businessName = this.profileSvc.getBusinessName() || 'Codigo Casero';
    const address = this.profileSvc.getAddress() || 'Cochabamba Bolivia, Times St 1414';

    const productRows = this.selectedProducts.map(
      p => `<tr>
        <td>${p.quantity}</td>
        <td>${p.Product.name}</td>
        <td>${roundToCents(p.currentPrice).toFixed(2)}</td>
        <td>${roundToCents(p.currentPrice * p.quantity).toFixed(2)}</td>
      </tr>`
    ).join("");

    const innerContents = [
      `<div style='padding-left: 20px;'><div>`,
      `<p style="font-size: 13px;">`,
      `<img style="float: left;" src="http://localhost:4200/assets/vendei/print-logo.png" alt="Logo" height="120" width="120">`,
      `${businessName}:<br>Software development company offers you web page development,`,
      `Billing software, Accounting, and customisable software.`,
      `</p>`,
      `<p style="font-size: 13px;">Address. ${address}</p>`,
      `<div>Date: ${todayTime.toLocaleDateString(locale)}</div>`,
      `</div>`,
      `<table style='padding-left: 20px;'>`,
      `<tr><th>Qty</th><th>Detail</th><th>Price</th><th>SubTotal</th></tr>`,
      productRows,
      `</table>`,
      `<div>Total: ${roundToCents(this.total).toFixed(2)}</div>`,
      `<div>Payed: ${roundToCents(this.totalPayed).toFixed(2)}</div>`,
      `<div>Returned: ${roundToCents(this.toReturn).toFixed(2)}</div>`,
      `<p style="font-size: 13px;">Quality software developed by experienced developers.</p>`,
      `</div>`,
    ].join("");
    popupWindow = window.open(
      "",
      "_blank",
      "width=600,height=400,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no"
    );
    popupWindow.document.open();
    popupWindow.document.write(
      `<html><head><link rel="stylesheet" type="text/css" href="style.css" />
    </head><body onload="window.print()">
    <style>
    img2 {
        display: none !important;
    }
    button {
        display: none !important;
    }
    .noPrint {
      display: none;
    }
   @media print {  
  @page {
    size: 85mm 100mm; /* landscape */
    /* you can also specify margins here: */
    margin: 25mm;
    margin-right: 45mm; /* for compatibility with both A4 and Letter */
  }
}
    </style>

    <script>
    (function() {

    var beforePrint = function() {
        console.log('Functionality to run before printing.');
    };

    var afterPrint = function() {
        console.log('Functionality to run after printing');
    };

    if (window.matchMedia) {
        var mediaQueryList = window.matchMedia('print');
        mediaQueryList.addListener(function(mql) {
            if (mql.matches) {
                beforePrint();
            } else {
                afterPrint();
            }
        });
    }

    window.onbeforeprint = beforePrint;
    window.onafterprint = afterPrint;

}());
    </script>

    ` +
      innerContents +
      "</html>"
    );

    var selfx = this;

    popupWindow.document.close();
  }

  submitOrder() {

    // strategy to save an order
    if (this.config.printInvoice) {
      if (!this.printTwice) {
        this.printOrder();
        return;
      }

      if (this.printOrderCount) {
        this.printOrder();
        this.clearItems();
        return;
      }

    }

    if (this.config.printInvoiceBeforeSubmit) {
      this.printInvoiceAndSave();
      return;
    }

    this.saveOrder();
  }

  buildOrderAndDetails() {
    const order: any = {};
    order.customerId = this.selectedCustomer.id;
    order.createdDate = new Date();
    order.total = roundToCents(this.total);
    order.description = "";
    order.paid = true;
    order.delivered = true;
    order.deliveryDate = new Date();

    const cashTotal = this.payedItems
      .filter(p => p.payType === PaymentType.PAYMONEY)
      .reduce((sum, p) => sum + (p.value || 0), 0);
    const qrTotal = this.payedItems
      .filter(p => p.payType === PaymentType.PAYQR)
      .reduce((sum, p) => sum + (p.value || 0), 0);

    order.paidCash = roundToCents(cashTotal);
    order.paidQr = roundToCents(qrTotal);
    order.totalDiscount = roundToCents(this.totalDiscount);
    order.totalReturn = roundToCents(this.totalReturn);

    const activeProfileId = this.profileSvc.getActiveProfileId();
    if (activeProfileId != null) {
      order.storeProfileId = activeProfileId;
    }

    const details: any[] = [];
    this.selectedProducts.forEach(p => {
      const detail: any = {};
      detail.quantity = p.quantity;
      detail.currentPrice = roundToCents(p.currentPrice);
      detail.discount = 0;
      detail.totalPrice = roundToCents(Number(p.quantity) * Number(p.currentPrice));
      detail.productId = p.productId ?? p.Product?.id ?? p.id;
      detail.orderId = "0";
      details.push(detail);
    });

    return { order, details };
  }

  saveOrder() {
    const { order, details } = this.buildOrderAndDetails();

    const orderDone$ = this.ordersSvc.save(order).pipe(
      concatMap((o: any) => {
        details.forEach((d: any) => {
          d.orderId = o.id;
          d.createdDate = o.createdDate;
        });
        return forkJoin(
          details.map((d: any) =>
            this.ordersSvc.saveDetail(d).pipe(
              concatMap(() =>
                forkJoin([
                  this.inventorySvc.reduceInventory(String(d.productId), d.quantity),
                  this.inventorySvc.updateTotalSelled(String(d.productId), d.totalPrice),
                  this.inventorySvc.updateQuantitySelled(String(d.productId), d.quantity),
                ])
              )
            )
          )
        );
      })
    );

    orderDone$.subscribe({
      complete: () => this.clearItems(),
      error: (err) => {
        console.error("submitOrder inventory pipeline", err);
        this.printOrderCount = 0;
      },
    });
  }

  printInvoiceAndSave(): void {
    this.printOrderCount = 1;

    const html = this.invoiceSvc.generate({
      products: this.selectedProducts,
      customer: this.selectedCustomer,
      total: this.total,
      totalPayed: this.totalPayed,
      totalDiscount: this.totalDiscount,
      totalReturn: this.totalReturn,
      payedItems: this.payedItems,
    });

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      this.printOrderCount = 0;
      this.saveOrder();
      return;
    }

    printWindow.document.write(html);
    printWindow.document.close();

    let saved = false;
    const doSave = () => {
      if (saved) return;
      saved = true;
      if (!printWindow.closed) {
        printWindow.close();
      }
      this.saveOrder();
    };

    printWindow.onafterprint = doSave;

    const checkClosed = setInterval(() => {
      if (printWindow.closed) {
        clearInterval(checkClosed);
        doSave();
      }
    }, 500);

    printWindow.print();
  }

  clearItems() {
    this.selectedCustomer = Object.assign({}, this.emptyCustomer);
    this.selectedProducts = [];
    this.total = 0;
    this.payedItems = [];
    this.discountItems = [];
    this.returnItems = [];

    this.totalPayed = 0;
    this.totalDiscount = 0;
    this.totalReturn = 0;
    this.toReturn = 0;
    this.printOrderCount = 0;
  }

  /** Clears the ticket (lines + payments + customer to anonymous). Blocked while print flow locks the sale. */
  clearTicket(): void {
    if (this.printOrderCount) {
      return;
    }
    this.clearItems();
    this.recalTotal();
    this.cdr.markForCheck();
  }

  openPosMore(): void {
    this.router.navigate(["/main"]);
  }

  onProfileChanged(profile: StoreProfile): void {
    if (this.selectedProducts.length > 0) {
      const confirmDialog = this.dialog.open(ProfileSwitchDialogComponent, {
        width: '380px',
        data: { profileName: profile.name },
      });
      confirmDialog.afterClosed().subscribe((confirmed) => {
        if (confirmed) {
          this.clearItems();
          this.recalTotal();
        }
      });
    }
  }

  public selectCustomer(customer: any) {
    if (this.printOrderCount) {
      return;
    }
    // New object reference so child inputs refresh; dialog close can otherwise
    // leave the POS view stale until the next zone turn / user event.
    this.selectedCustomer =
      customer && typeof customer === "object"
        ? { ...customer }
        : Object.assign({}, this.emptyCustomer);
    this.cdr.detectChanges();
  }

  public calTotals() {
    this.totalPayed = roundToCents(
      this.payedItems.map(x => x.value).reduce((a, b) => a + b, 0)
    );

    this.totalReturn = roundToCents(
      this.returnItems.map(x => x.value).reduce((a, b) => a + b, 0)
    );

    this.totalDiscount = roundToCents(
      this.discountItems.map(x => x.value).reduce((a, b) => a + b, 0)
    );

    const net = Math.max(0, roundToCents(this.total - this.totalDiscount));
    this.toReturn = roundToCents(this.totalPayed - net - this.totalReturn);
  }

  /** Gross ticket total minus discounts — amount the customer must cover. */
  get netOrderTotal(): number {
    return Math.max(0, roundToCents(this.total - this.totalDiscount));
  }

  /** Cash/QR taken in minus change lines already registered. */
  get effectivePaid(): number {
    return roundToCents(this.totalPayed - this.totalReturn);
  }

  get amountDue(): number {
    return orderAmountDue(this.total, this.totalPayed, this.totalReturn, this.totalDiscount);
  }

  get isOrderPaid(): boolean {
    return isOrderReadyToSubmit(
      this.total,
      this.totalPayed,
      this.totalReturn,
      this.totalDiscount,
      this.printOrderCount
    );
  }

  removeItem(payItem: any) {
    if (this.printOrderCount) return;

    switch (payItem.payType) {
      case PaymentType.PAYMONEY:
      case PaymentType.PAYQR:
        this.payedItems = this.payedItems.filter(p => p.id != payItem.id);
        break;
      case PaymentType.DISCOUNT:
        this.discountItems = this.discountItems.filter(p => p.id != payItem.id);
        break;
      case PaymentType.PAYRETURN:
        this.returnItems = this.returnItems.filter(p => p.id != payItem.id);
        break;
      default:
        break;
    }
    this.calTotals();
  }

  payIt(payItem: any, payType: any) {
    if (this.printOrderCount) {
      return;
    }
    let payItemAux = Object.assign({}, payItem);
    switch (payType) {
      case PaymentType.PAYMONEY:
        payItemAux.id = this.paymentItemIds++;
        payItemAux.payType = PaymentType.PAYMONEY;
        this.payedItems.push(payItemAux);
        break;
      case PaymentType.PAYQR:
        payItemAux.id = this.paymentItemIds++;
        payItemAux.payType = PaymentType.PAYQR;
        this.payedItems.push(payItemAux);
        break;
      case PaymentType.DISCOUNT:
        payItemAux.id = this.discountItemIds++;
        payItemAux.payType = PaymentType.DISCOUNT;
        this.discountItems.push(payItemAux);
        break;
      case PaymentType.PAYRETURN:
        payItemAux.id = this.returnItemIds++;
        payItemAux.payType = PaymentType.PAYRETURN;
        this.returnItems.push(payItemAux);
        break;
      default:
        break;
    }

    this.calTotals();
  }
}
