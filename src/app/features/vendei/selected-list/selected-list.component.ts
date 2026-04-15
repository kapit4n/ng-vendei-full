import { Component, OnInit, Input, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { roundToCents } from "src/app/utils/money";
import { resolvePresentationImageUrl } from "src/app/utils/product-image-url";

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
    styleUrls: ["./selected-list.component.css"],
    standalone: false
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
        img: resolvePresentationImageUrl(product?.img, product?.Product?.img),
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
        const p = roundToCents(result.price);
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
    return resolvePresentationImageUrl(product?.img, product?.Product?.img);
  }
}

@Component({
    selector: "selected-product-edit-dialog",
    templateUrl: "selected-product-edit-dialog.html",
    standalone: false
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

