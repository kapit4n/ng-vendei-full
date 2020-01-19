import { Component, OnInit, ElementRef, ViewChild, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material";
import { VOrdersService } from "../../../services/vendei/v-orders.service";
import { VInventoryService } from "../../../services/vendei/v-inventory.service";
import { Router } from "@angular/router";

enum PaymentType {
  PAYMONEY = 1,
  PAYRETURN = 2,
  DISCOUNT = 3
}

export interface PaymentDialogData {
  total: number;
  pay: number;
}



@Component({
  selector: "app-shopping-cart",
  templateUrl: "./shopping-cart.component.html",
  styleUrls: ["./shopping-cart.component.css"]
})
export class ShoppingCartComponent implements OnInit {

  // config
  displayCal = false;
  printTwice = false;

  total: number;
  emptyCustomer = { id: 1, name: "Anonymous", ci: 1234567 };

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
    private router: Router,
    public dialog: MatDialog
  ) {
    this.total = 0;
    this.selectedCustomer = Object.assign({}, this.emptyCustomer);
  }

  openPaymentDialog(): void {
    const dialogRef = this.dialog.open(PaymentEditDialog, {
      width: "250px",
      height: "250px",
      data: {
        pay: this.totalPayed,
        total: this.total
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log("set total with: " + result.total);
        this.totalPayed = result.pay;
        this.toReturn = this.totalPayed - this.total;
      }
    });
  }

  @ViewChild("toPrint", { static: false }) myDiv: ElementRef;

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
    this.total = 0;
    this.selectedProducts.forEach(val => {
      this.total += val.price * val.quantity;
    });
    this.calTotals();
  }

  printOrder() {
    let popupWindow;
    var todayTime = new Date();
    var options = {
      year: "numeric",
      month: "numeric",
      day: "numeric"
    };

    let headerInfo = `
    Codigo Casero: <br CLEAR=”left” />
      Software development company offers you web page development,
      Billing software, Accounting, and customisable software.
    `;

    let addressInfo = `
    <p style="font-size: 13px;">
      Address. Cochabamba Bolivia, Times St 1414
    </p>
    `;

    let footerInfo = `
    <p style="font-size: 13px;">
    Quality software developed by experienced developers.
    </p>
    `;

    let innerContents = `<div style='padding-left: 20px;'>
    <div>
    <p style="font-size: 13px;">
      <img style="float: left;" ALIGN=”left” HSPACE=”50” VSPACE=”50” src="http://localhost:4200/assets/vendei/print-logo.png" alt="Smiley face" height="120" width="120">
      ${headerInfo}
    </p>
    ${addressInfo}
    <div>Date: ${todayTime.toLocaleDateString("es-ES", options)} </div>
    </div>`;
    innerContents += "<table style='padding-left: 20px;'>";
    innerContents += "<tr>";
    innerContents += `<th>Qty</th>`;
    innerContents += `<th>Detail</th>`;
    innerContents += `<th>Price</th>`;
    innerContents += `<th>SubTotal</th>`;
    innerContents += "</tr>";
    for (let i = 0; i < this.selectedProducts.length; i++) {
      innerContents += "<tr>";
      innerContents += `<td>${this.selectedProducts[i].quantity}</td>`;
      innerContents += `<td>${this.selectedProducts[i].name}</td>`;
      innerContents += `<td>${this.selectedProducts[i].price}</td>`;
      innerContents += `<td>${this.selectedProducts[i].price *
        this.selectedProducts[i].quantity}</td>`;
      innerContents += "</tr>";
    }
    innerContents += "</table>";
    innerContents += "<div> Total: " + this.total + " </div>";
    innerContents += "<div> Payed: " + this.totalPayed + " </div>";
    innerContents += "<div> Returned: " + this.toReturn + " </div>";
    innerContents += footerInfo;
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

    if (!this.printTwice) {
      this.printOrder();
      this.clearItems();
      return;
    }

    if (this.printOrderCount) {
      this.printOrder();
      this.clearItems();
      return;
    }
    this.printOrderCount = 1;
    this.printOrder();

    let order = {} as any;
    order.customerId = this.selectedCustomer.id;
    order.createdDate = new Date();
    order.total = this.total;
    order.description = "";
    order.paid = true;
    order.delivered = true;
    order.deliveryDate = new Date();

    let details = [];
    this.selectedProducts.forEach(p => {
      let detail = {} as any;
      detail.quantity = p.quantity;
      detail.price = p.price;
      detail.discount = 0;
      detail.totalPrice = Number(p.quantity) * Number(p.price);
      detail.productId = p.id;
      detail.orderId = "0";
      details.push(detail);
    });
    let orderAux = {} as any;
    setTimeout(() => {
      this.ordersSvc.save(order).subscribe(o => {
        details.forEach(d => {
          d.orderId = order.id;
          d.createdDate = o.createdDate;
          this.ordersSvc.saveDetail(d).subscribe(ds => {
            this.inventorySvc
              .reduceInventory(ds.productId, ds.quantity)
              .subscribe(dat => {
                console.log(dat);
              });

            this.inventorySvc
              .updateTotalSelled(ds.productId, ds.totalPrice)
              .subscribe(dat => {
                console.log(dat);
              });

            this.inventorySvc
              .updateQuantitySelled(ds.productId, ds.quantity)
              .subscribe(dat => {
                console.log(dat);
              });
          });
        });
      });
    }, 800);
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

  public selectCustomer(customer: any) {
    if (this.printOrderCount) {
      return;
    }
    this.selectedCustomer = customer;
  }

  public calTotals() {
    if (this.printOrderCount) {
      return;
    }
    this.totalPayed = this.payedItems
      .map(x => x.value)
      .reduce((a, b) => a + b, 0);

    this.totalReturn = this.returnItems
      .map(x => x.value)
      .reduce((a, b) => a + b, 0);

    this.totalDiscount = this.discountItems
      .map(x => x.value)
      .reduce((a, b) => a + b, 0);

    this.toReturn = this.totalPayed - this.total - this.totalReturn;
  }

  removeItem(payItem: any) {
    if (this.printOrderCount) return;

    switch (payItem.payType) {
      case PaymentType.PAYMONEY:
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
    let payItemAux = Object.assign({}, payItem);
    switch (payType) {
      case PaymentType.PAYMONEY:
        payItemAux.id = this.paymentItemIds++;
        payItemAux.payType = PaymentType.PAYMONEY;
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

@Component({
  selector: "payment-edit-dialog",
  templateUrl: "payment-edit-dialog.html"
})
export class PaymentEditDialog {
  constructor(
    public dialogRef: MatDialogRef<PaymentEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: PaymentDialogData
  ) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}

