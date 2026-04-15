import { Component, OnInit, Input, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";

export interface DialogData {
  id: string;
  name: string;
  img: string;
  quantity: number;
  price: number;
}

@Component({
  selector: "app-selected-list",
  templateUrl: "./selected-list.component.html",
  styleUrls: ["./selected-list.component.css"]
})
export class SelectedListComponent implements OnInit {
  pResult: any;
  name: string = "Luis";
  @Input() selectedProducts: any[];
  @Input() printOrderCount: number;

  @Input() removeProduct: Function;
  @Input() recalTotal: Function;

  constructor(public dialog: MatDialog) {}

  openDialog(product: any): void {
    const dialogRef = this.dialog.open(SelectedProductEditDialog, {
      width: "250px",
      height: "250px",
      data: {
        id: product.id,
        name: product.Product?.name || product.name,
        img: product.Product?.img || product.img,
        quantity: product.quantity,
        price: product.currentPrice
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        let product = this.selectedProducts.filter(
          p => p.id == result.id
        )[0];

        product.quantity = Number(result.quantity);
        const p = Number(result.price);
        product.currentPrice = p;
        (product as any).price = p;
        this.recalTotal();
      }
    });
  }
  ngOnInit() {}

  lineDisplayName(product: any): string {
    return product?.Product?.name || product?.name || "Item";
  }

  lineImageUrl(product: any): string {
    const raw = product?.Product?.img || product?.img;
    if (!raw || typeof raw !== "string") {
      return "assets/vendei/placeholders/product-card.svg";
    }
    const t = raw.trim();
    if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("/")) {
      return t;
    }
    if (t.startsWith("assets/")) {
      return t;
    }
    return "assets/vendei/placeholders/product-card.svg";
  }
}

@Component({
  selector: "selected-product-edit-dialog",
  templateUrl: "selected-product-edit-dialog.html"
})
export class SelectedProductEditDialog {
  constructor(
    public dialogRef: MatDialogRef<SelectedProductEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}

