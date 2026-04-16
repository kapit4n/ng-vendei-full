import { Component, OnInit, Input } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { CustomersDialogComponent } from "../customers-dialog/customers-dialog.component";
import { roundToCents } from "src/app/utils/money";

enum PaymentType {
  PAYMONEY = 1,
  PAYRETURN = 2,
  DISCOUNT = 3,
  PAYQR = 4,
}

@Component({
  selector: "app-cal-table",
  templateUrl: "./cal-table.component.html",
  styleUrls: ["./cal-table.component.css"],
  standalone: false,
})
export class CalTableComponent implements OnInit {
  /** Ticket total (Bs) — used to show balance due. */
  @Input()
  orderTotal = 0;

  @Input()
  selectCustomer: (c: any) => void;

  @Input()
  printOrderCount: number;

  @Input()
  calTotals: () => void;

  @Input()
  payIt: (payItem: any, payType: any) => void;

  @Input()
  removeItem: (payItem: any) => void;

  @Input()
  selectedCustomer: any;

  /** Denominations in Bs — text-only (no bill photos). */
  bills = [
    { name: "0.50", value: 0.5 },
    { name: "1", value: 1 },
    { name: "2", value: 2 },
    { name: "5", value: 5 },
    { name: "10", value: 10 },
    { name: "20", value: 20 },
    { name: "50", value: 50 },
    { name: "100", value: 100 },
    { name: "200", value: 200 },
  ];

  numbers = [
    { name: "1", value: 1 },
    { name: "2", value: 2 },
    { name: "3", value: 3 },
    { name: "4", value: 4 },
    { name: "5", value: 5 },
    { name: "6", value: 6 },
    { name: "7", value: 7 },
  ];

  payItems: Array<{ name: string; value: number }>;

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

  currentType = "Bs";
  displayCurrentType: boolean;

  payType: PaymentType;
  payTypeLabel = "";

  /** Expose enum to template for mode tabs. */
  readonly PayKind = PaymentType;

  /** Typed amount for cash / QR / return custom entry. */
  customAmountStr = "";

  constructor(public dialog: MatDialog) {
    this.payType = PaymentType.PAYMONEY;
    this.payTypeLabel = "PAYMENT";
    this.payItems = this.bills;
    this.displayCurrentType = true;

    this.payedItems = [];
    this.discountItems = [];
    this.returnItems = [];
  }

  openDialog(): void {
    if (this.printOrderCount) {
      return;
    }
    this.dialog.open(CustomersDialogComponent, {
      width: "min(92vw, 480px)",
      maxHeight: "90vh",
      data: {
        selectCustomer: this.selectCustomer.bind(this),
      },
    });
  }

  ngOnInit(): void {}

  /** Bs left to collect (efectivo + QR + …), same basis as the Pay button. */
  get amountDue(): number {
    const effective = roundToCents((this.totalPayed || 0) - (this.totalReturn || 0));
    return roundToCents(Math.max(0, (this.orderTotal || 0) - effective));
  }

  get keypadHint(): string {
    switch (this.payType) {
      case PaymentType.PAYMONEY:
        return "Use montos rápidos o escriba un monto y pulse «Registrar». También «Registrar pendiente» si coincide con lo que falta.";
      case PaymentType.PAYQR:
        return "Registre cada pago QR con el monto exacto (rápido o campo personalizado).";
      case PaymentType.PAYRETURN:
        return "Registre el cambio devuelto al cliente (mismos montos rápidos o monto libre).";
      case PaymentType.DISCOUNT:
        return "Indique el valor del descuento (botones o monto libre).";
      default:
        return "";
    }
  }

  isQrPayment(payI: any): boolean {
    return payI?.payType === PaymentType.PAYQR;
  }

  payMoney(): void {
    if (this.printOrderCount) {
      return;
    }
    this.displayCurrentType = true;
    this.payItems = this.bills;
    this.payType = PaymentType.PAYMONEY;
    this.payTypeLabel = "PAYMENT";
  }

  payWithQr(): void {
    if (this.printOrderCount) {
      return;
    }
    this.displayCurrentType = true;
    this.payItems = this.bills;
    this.payType = PaymentType.PAYQR;
    this.payTypeLabel = "QR";
  }

  discount(): void {
    if (this.printOrderCount) {
      return;
    }
    this.displayCurrentType = false;
    this.payItems = this.numbers;
    this.payType = PaymentType.DISCOUNT;
    this.payTypeLabel = "DISCOUNT";
  }

  returnMoney(): void {
    if (this.printOrderCount) {
      return;
    }
    this.payItems = this.bills;
    this.displayCurrentType = true;
    this.payType = PaymentType.PAYRETURN;
    this.payTypeLabel = "RETURN";
  }

  /** Build a line item for the parent `payIt` handler (no images). */
  private makePayLine(value: number): { name: string; value: number } {
    const v = roundToCents(value);
    return {
      name: v.toFixed(2),
      value: v,
    };
  }

  registerCustomAmount(): void {
    if (this.printOrderCount) {
      return;
    }
    const raw = String(this.customAmountStr ?? "").replace(",", ".").trim();
    const n = Number(raw);
    if (!Number.isFinite(n) || n <= 0) {
      return;
    }
    const line = this.makePayLine(n);
    const type =
      this.payType === PaymentType.DISCOUNT ? PaymentType.DISCOUNT : this.payType;
    this.payIt(line, type);
    this.customAmountStr = "";
  }

  /** One tap to register exactly the remaining balance (cash or QR). */
  registerPendingDue(): void {
    if (this.printOrderCount) {
      return;
    }
    if (this.payType !== PaymentType.PAYMONEY && this.payType !== PaymentType.PAYQR) {
      return;
    }
    const due = this.amountDue;
    if (due <= 0) {
      return;
    }
    const line = this.makePayLine(due);
    this.payIt(line, this.payType);
  }
}

