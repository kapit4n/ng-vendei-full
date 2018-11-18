import { Component, OnInit, Input, Inject } from "@angular/core";
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface DialogData {
  id: string;
  name: string;
  img: string;
  quantity: number;
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
  
  @Input() removeProduct: Function;

  constructor(public dialog: MatDialog) {}

  openDialog(product: any): void {
    const dialogRef = this.dialog.open(SelectedProductEditDialog, {
      width: "250px",
      height: "250px",
      data: { id: product.id,  name: product.name, img: product.img, quantity: product.quantity }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result) {
        this.selectedProducts.filter(p => p.id == result.id)[0].quantity = Number(result.quantity);
      }
    });
  }

  

  ngOnInit() {}

}

@Component({
  selector: 'selected-product-edit-dialog',
  templateUrl: 'selected-product-edit-dialog.html',
})
export class SelectedProductEditDialog {

  constructor(
    public dialogRef: MatDialogRef<SelectedProductEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}