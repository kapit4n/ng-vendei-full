import { Component, OnInit, ElementRef, ViewChild } from "@angular/core";
import { VOrdersService } from '../../../services/vendei/v-orders.service'
import { VInventoryService } from "../../../services/vendei/v-inventory.service";

@Component({
  selector: "app-shopping-cart",
  templateUrl: "./shopping-cart.component.html",
  styleUrls: ["./shopping-cart.component.css"]
})
export class ShoppingCartComponent implements OnInit {
  total: number;
  emptyCustomer = { id: 1, name: "Anonimous", ci: 1234567 };

  constructor(
    private ordersSvc: VOrdersService,
    private inventorySvc: VInventoryService
  ) {
    this.total = 0;
    this.selectedCustomer = Object.assign({}, this.emptyCustomer);
  }

  selectedProducts = [];
  selectedCustomer: any;

  payedItems = [];
  discountItems = [];
  returnItems = [];

  totalPayed = 0;
  totalDiscount = 0;
  totalReturn = 0;
  toReturn = 0;

  @ViewChild("toPrint") myDiv: ElementRef;

  ngOnInit() {}

  public removeProduct(product: any) {
    this.selectedProducts = this.selectedProducts.filter(
      p => p.id != product.id
    );
    this.recalTotal();
  }

  recalTotal() {
    this.total = 0;
    this.selectedProducts.forEach(val => {
      this.total += val.price * val.quantity;
    });
  }

  submitOrder() {
    console.log(this.myDiv.nativeElement.innerHtml);

    let popupWinindow
    let innerContents = document.getElementById("toPrint").innerHTML;
    popupWinindow = window.open('', '_blank', 'width=600,height=700,scrollbars=no,menubar=no,toolbar=no,location=no,status=no,titlebar=no');
    popupWinindow.document.open();
    popupWinindow.document.write(`<html><head><link rel="stylesheet" type="text/css" href="style.css" />
    </head><body onload="window.print()">
    <style>
    img {
        display: none !important;
    }
    button {
        display: none !important;
    }
    </style>
    ` + innerContents + "</html>");
    popupWinindow.document.close();

    let order = {} as any;
    console.log(this.selectedCustomer);
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
          this.ordersSvc.saveDetail(d).subscribe(ds => {
            this.inventorySvc
              .reduceInventory(ds.productId, ds.quantity)
              .subscribe(dat => {
                console.log(dat);
              });
          });
        });
      });
    }, 800);

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
  }

  public selectCustomer(customer: any) {
    this.selectedCustomer = customer;
  }

  public calTotals() {
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
}
