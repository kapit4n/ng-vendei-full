import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { MatDialog } from "@angular/material/dialog";
import { AppConfigService } from "src/app/core/config/app-config.service";
import { PrintService } from "src/app/core/platform/print.service";
import { VInvoiceService } from "../../../services/vendei/v-invoice.service";
import { VConfigService } from "src/app/services/vendei/v-config.service";
import { PosSaleService, SaleDraft } from "src/app/services/vendei/pos-sale.service";
import { VStoreProfileService, StoreProfile } from "src/app/services/vendei/v-store-profile.service";
import { ProfileSwitchDialogComponent } from "src/app/features/vendei/profile-switch-dialog/profile-switch-dialog.component";
import { roundToCents, isOrderReadyToSubmit, orderAmountDue, orderChangeDue } from "src/app/utils/money";
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

  /** Collapse the payment panel (default collapsed) so an empty ticket gets more room. */
  paymentCollapsed = true;
  togglePaymentPanel(): void {
    this.paymentCollapsed = !this.paymentCollapsed;
  }

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
    private readonly saleSvc: PosSaleService,
    private invoiceSvc: VInvoiceService,
    public config: VConfigService,
    private readonly appConfig: AppConfigService,
    private readonly printer: PrintService,
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
    const todayTime = new Date();
    const locale = this.profileSvc.getLocale();
    const businessName = this.profileSvc.getBusinessName() || 'Codigo Casero';
    const address = this.profileSvc.getAddress() || 'Cochabamba Bolivia, Times St 1414';

    const productRows = this.selectedProducts.map(
      p => `<tr>
        <td>${p.quantity}</td>
        <td>${p.Product.name}${p.variantName ? ' (' + p.variantName + ')' : ''}</td>
        <td>${roundToCents(p.currentPrice).toFixed(2)}</td>
        <td>${roundToCents(p.currentPrice * p.quantity).toFixed(2)}</td>
      </tr>`
    ).join("");

    const innerContents = [
      `<div style='padding-left: 20px;'><div>`,
      `<p style="font-size: 13px;">`,
      `<img style="float: left;" src="${this.appConfig.absoluteAssetUrl('assets/vendei/print-logo.png')}" alt="Logo" height="120" width="120">`,
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
    this.printer.open(
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
      "</html>",
      "width=600,height=400,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no"
    );
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

  /** Snapshot of the open ticket, handed to the sale use case. */
  currentDraft(): SaleDraft {
    return {
      customerId: this.selectedCustomer?.id ?? null,
      lines: this.selectedProducts,
      payments: this.payedItems,
      total: this.total,
      totalDiscount: this.totalDiscount,
      totalReturn: this.totalReturn,
    };
  }

  /** Thin delegation — order assembly lives in {@link PosSaleService}. */
  buildOrderAndDetails() {
    return this.saleSvc.buildOrderAndDetails(this.currentDraft());
  }

  saveOrder() {
    this.saleSvc.submit(this.currentDraft()).subscribe({
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

    const handle = this.printer.open(html);
    if (!handle) {
      this.printOrderCount = 0;
      this.saveOrder();
      return;
    }

    let saved = false;
    const doSave = () => {
      if (saved) return;
      saved = true;
      handle.close();
      this.saveOrder();
    };

    const subscription = handle.closed$.subscribe({
      next: doSave,
      complete: () => subscription.unsubscribe(),
    });

    handle.print();
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

    this.toReturn = orderChangeDue(this.total, this.totalPayed, this.totalReturn, this.totalDiscount);
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
