import { Component, Input, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { CustomersDialogComponent } from "../customers-dialog/customers-dialog.component";
import { roundToCents, isOrderReadyToSubmit, orderAmountDue } from "src/app/utils/money";
import { PaymentType } from "src/app/features/vendei/payment-types";

/**
 * POS payment pattern: **single incoming lane** (cash vs QR only tags the line),
 * optional **adjustments** (discount / change) in a collapsed section.
 * Quick amounts + “pay balance” cover the common case without mode switching.
 */
@Component({
  selector: "app-cal-table",
  templateUrl: "./cal-table.component.html",
  styleUrls: ["./cal-table.component.css"],
  standalone: false,
})
export class CalTableComponent implements OnInit {
  @Input()
  orderTotal = 0;

  @Input()
  selectCustomer: (c: any) => void;

  @Input()
  printOrderCount: number;

  /** When set, shown as primary CTA when the net balance is covered (e.g. save order). */
  @Input()
  finalizeOrder: () => void;

  @Input()
  calTotals: () => void;

  @Input()
  payIt: (payItem: any, payType: any) => void;

  @Input()
  removeItem: (payItem: any) => void;

  @Input()
  selectedCustomer: any;

  @Input()
  payedItems: Array<any>;
  @Input()
  discountItems: Array<any>;
  @Input()
  returnItems: Array<any>;

  @Input()
  totalPayed: number;
  @Input()
  totalDiscount: number;
  @Input()
  totalReturn: number;

  /** Next incoming line: cash or QR (same flow, different `payType`). */
  incomingMethod: "cash" | "qr" = "cash";

  /** Common Boliviano quick amounts — enough for typical checkout without a full denomination matrix. */
  readonly quickAmounts = [5, 10, 20, 50, 100, 200];

  customAmountStr = "";
  discountAmountStr = "";
  changeAmountStr = "";

  constructor(public dialog: MatDialog) {
    this.payedItems = [];
    this.discountItems = [];
    this.returnItems = [];
  }

  openDialog(): void {
    if (this.isPrintLocked) {
      return;
    }
    this.dialog.open(CustomersDialogComponent, {
      width: "min(92vw, 480px)",
      maxHeight: "90vh",
      data: {
        // `selectCustomer` is already bound to the POS parent (ShoppingCartComponent).
        selectCustomer: this.selectCustomer,
      },
    });
  }

  ngOnInit(): void {}

  /**
   * True while checkout is frozen for the print step.
   * Do not pass `printOrderCount` directly to MatButton `[disabled]`: Angular's `booleanAttribute`
   * treats numeric `0` as disabled (0 is neither boolean nor the string `'false'`).
   */
  get isPrintLocked(): boolean {
    return Number(this.printOrderCount) > 0;
  }

  submitOrderClick(): void {
    if (!this.readyToSubmit || typeof this.finalizeOrder !== "function") {
      return;
    }
    this.finalizeOrder();
  }

  /** Same rule as the cart toolbar (`isOrderReadyToSubmit` in `money.ts`). */
  get readyToSubmit(): boolean {
    return isOrderReadyToSubmit(
      this.orderTotal,
      this.totalPayed,
      this.totalReturn,
      this.totalDiscount,
      this.printOrderCount
    );
  }

  get amountDue(): number {
    return orderAmountDue(
      this.orderTotal,
      this.totalPayed,
      this.totalReturn,
      this.totalDiscount
    );
  }

  private incomePayType(): PaymentType {
    return this.incomingMethod === "qr" ? PaymentType.PAYQR : PaymentType.PAYMONEY;
  }

  setIncomingMethod(m: "cash" | "qr"): void {
    if (this.isPrintLocked) {
      return;
    }
    this.incomingMethod = m;
  }

  isQrPayment(payI: any): boolean {
    return payI?.payType === PaymentType.PAYQR;
  }

  private makePayLine(value: number): { name: string; value: number } {
    const v = roundToCents(value);
    return { name: v.toFixed(2), value: v };
  }

  private parsePositiveAmount(rawStr: string): number | null {
    const raw = String(rawStr ?? "").replace(",", ".").trim();
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
      return null;
    }
    return roundToCents(n);
  }

  addQuickAmount(value: number): void {
    if (this.isPrintLocked) {
      return;
    }
    if (typeof this.payIt !== "function") {
      return;
    }
    this.payIt(this.makePayLine(value), this.incomePayType());
  }

  registerIncomingAmount(): void {
    if (this.isPrintLocked) {
      return;
    }
    const n = this.parsePositiveAmount(this.customAmountStr);
    if (n == null) {
      return;
    }
    this.payIt(this.makePayLine(n), this.incomePayType());
    this.customAmountStr = "";
  }

  registerPendingDue(): void {
    if (this.isPrintLocked) {
      return;
    }
    const due = this.amountDue;
    if (due <= 0) {
      return;
    }
    this.payIt(this.makePayLine(due), this.incomePayType());
  }

  registerDiscountAmount(): void {
    if (this.isPrintLocked) {
      return;
    }
    const n = this.parsePositiveAmount(this.discountAmountStr);
    if (n == null) {
      return;
    }
    this.payIt(this.makePayLine(n), PaymentType.DISCOUNT);
    this.discountAmountStr = "";
  }

  registerChangeAmount(): void {
    if (this.isPrintLocked) {
      return;
    }
    const n = this.parsePositiveAmount(this.changeAmountStr);
    if (n == null) {
      return;
    }
    this.payIt(this.makePayLine(n), PaymentType.PAYRETURN);
    this.changeAmountStr = "";
  }
}
