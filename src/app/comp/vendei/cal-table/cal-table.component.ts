import { Component, OnInit, Input, Output, EventEmitter} from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { CustomersDialogComponent } from "../customers-dialog/customers-dialog.component";

enum PaymentType {
    PAYMONEY = 1,
    PAYRETURN = 2,
    DISCOUNT = 3
}

@Component({
  selector: "app-cal-table",
  templateUrl: "./cal-table.component.html",
  styleUrls: ["./cal-table.component.css"]
})
export class CalTableComponent implements OnInit {
  @Input()
  selectCustomer: Function;
  
  @Input()
  calTotals: Function;

  @Input()
  selectedCustomer: any;

  bills = [
    { name: "0.1", value: 0.1, img: "" },
    { name: "0.2", value: 0.2, img: "" },
    {
      name: "0.5",
      value: 0.5,
      img: "https://en.numista.com/catalogue/photos/bolivie/g397.jpg"
    },
    {
      name: "1",
      value: 1,
      img:
        "https://i.ucoin.net/coin/15/048/15048242-1/bolivia-1-boliviano-2012.jpg"
    },
    {
      name: "2",
      value: 2,
      img: "https://i.colnect.net/f/4353/166/2-Bolivianos-Large-Type.jpg"
    },
    {
      name: "5",
      value: 5,
      img: "https://i.colnect.net/f/2815/611/5-Bolivianos.jpg"
    },
    {
      name: "10",
      value: 10,
      img:
        "http://www.lostiempos.com/sites/default/files/styles/noticia_detalle/public/media_imagen/2018/4/4/sin_titulo-1_0.jpg?itok=xuBQscCf"
    },
    {
      name: "20",
      value: 20,
      img: "https://media2.allnumis.com/1189_572233078c3986fL.jpg"
    },
    {
      name: "50",
      value: 50,
      img:
        "https://img.ma-shops.com/aurich/pic/14169_bolivien_50_bolivianos_28.11.1986_bn_.jpg"
    },
    {
      name: "100",
      value: 100,
      img:
        "https://www.paginasiete.bo/u/fotografias/m/2017/9/27/f800x450-180473_231919_0.jpg"
    },
    {
      name: "200",
      value: 200,
      img:
        "https://www.eldeber.com.bo/__export/1481083317747/sites/eldeber/img/2015/07/02/5595aa693d5f4.jpeg_1775534641.jpeg"
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

  payMoney() {
    this.displayCurrentType = true;
    this.payItems = this.bills;
    this.payType = PaymentType.PAYMONEY;
    this.payTypeLabel = "PAYMENT";
  }

  discount() {
    this.displayCurrentType = false;
    this.payItems = this.numbers;
    this.payType = PaymentType.DISCOUNT;
    this.payTypeLabel = "DISCOUNT";
  }

  returnMoney() {
    this.payItems = this.bills;
    this.displayCurrentType = true;
    this.payType = PaymentType.PAYRETURN;
    this.payTypeLabel = "RETURN";
  }

  payIt(payItem: any) {
    switch (this.payType) {
      case PaymentType.PAYMONEY:
        this.payedItems.push(payItem);
        break;
      case PaymentType.DISCOUNT:
        this.discountItems.push(payItem);
        break;
      case PaymentType.PAYRETURN:
        this.returnItems.push(payItem);
        break;
      default:
        break;
    }

    this.calTotals();
  }
}
