import { Component, OnInit, Input, Output, EventEmitter} from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
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
    standalone: false
})
export class CalTableComponent implements OnInit {
  /** Ticket total (Bs) — used to show balance due. */
  @Input()
  orderTotal = 0;

  @Input()
  selectCustomer: Function;
  @Input()
  printOrderCount: number;

  @Input()
  calTotals: Function;
  @Input()
  payIt: Function;

  @Input()
  removeItem: Function;

  @Input()
  selectedCustomer: any;

  bills = [
    {
      name: "0.5",
      value: 0.5,
      img: "0-50.jpg"
    },
    {
      name: "1",
      value: 1,
      img: "/assets/vendei/money/1-Boliviano.jpg"
    },
    {
      name: "2",
      value: 2,
      img: "/assets/vendei/money/2-Bolivianos.jpg"
    },
    {
      name: "5",
      value: 5,
      img: "/assets/vendei/money/5-Bolivianos.jpg"
    },
    {
      name: "10",
      value: 10,
      img: "/assets/vendei/money/10-Bolivianos.jpg"
    },
    {
      name: "20",
      value: 20,
      img: "/assets/vendei/money/20-Bolivianos.jpg"
    },
    {
      name: "50",
      value: 50,
      img: "/assets/vendei/money/50-Bolivianos.jpg"
    },
    {
      name: "100",
      value: 100,
      img: "/assets/vendei/money/100-Bolivianos.jpeg"
    },
    {
      name: "200",
      value: 200,
      img: "/assets/vendei/money/200-Bolivianos.jpeg"
    }
  ];

  numbers = [
    { name: "1", value: 1, img: "" },
    { name: "2", value: 2, img: "" },
    { name: "3", value: 3, img: "" },
    { name: "4", value: 4, img: "" },
    { name: "5", value: 5, img: "" },
    { name: "6", value: 6, img: "" },
    { name: "7", value: 7, img: "" }
  ];

  payItems: Array<any>;

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

  animal: string;
  name: string;

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
    if (this.printOrderCount) return;
    const dialogRef = this.dialog.open(CustomersDialogComponent, {
      width: "350px",
      height: "350px",
      data: {
        selectCustomer: this.selectCustomer.bind(this),
        animal: this.animal
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      this.animal = result;
    });
  }

  ngOnInit() {}

  /** Bs left to collect (efectivo + QR + …), same basis as the Pay button. */
  get amountDue(): number {
    const effective = roundToCents((this.totalPayed || 0) - (this.totalReturn || 0));
    return roundToCents(Math.max(0, (this.orderTotal || 0) - effective));
  }

  get keypadHint(): string {
    switch (this.payType) {
      case PaymentType.PAYMONEY:
        return "Toque cada billete o moneda en efectivo.";
      case PaymentType.PAYQR:
        return "Toque el monto que el cliente pagó por QR (app o billetera).";
      case PaymentType.PAYRETURN:
        return "Registre billetes devueltos al cliente (cambio).";
      case PaymentType.DISCOUNT:
        return "Toque el valor del descuento aplicado.";
      default:
        return "";
    }
  }

  isQrPayment(payI: any): boolean {
    return payI?.payType === PaymentType.PAYQR;
  }

  payMoney() {
    if (this.printOrderCount) return;
    this.displayCurrentType = true;
    this.payItems = this.bills;
    this.payType = PaymentType.PAYMONEY;
    this.payTypeLabel = "PAYMENT";
  }

  payWithQr() {
    if (this.printOrderCount) return;
    this.displayCurrentType = true;
    this.payItems = this.bills;
    this.payType = PaymentType.PAYQR;
    this.payTypeLabel = "QR";
  }

  discount() {
    if (this.printOrderCount) return;
    this.displayCurrentType = false;
    this.payItems = this.numbers;
    this.payType = PaymentType.DISCOUNT;
    this.payTypeLabel = "DISCOUNT";
  }

  returnMoney() {
    if (this.printOrderCount) return;
    this.payItems = this.bills;
    this.displayCurrentType = true;
    this.payType = PaymentType.PAYRETURN;
    this.payTypeLabel = "RETURN";
  }
}
