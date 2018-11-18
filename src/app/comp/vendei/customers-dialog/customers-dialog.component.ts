import { Component, OnInit, Inject, Input } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface DialogData {
  selectedCustomer: Function;
  name: string;
}

@Component({
  selector: "app-customers-dialog",
  templateUrl: "./customers-dialog.component.html",
  styleUrls: ["./customers-dialog.component.css"]
})
export class CustomersDialogComponent implements OnInit {
  @Input() selectedCustomer: Function;

  constructor(
    public dialogRef: MatDialogRef<CustomersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    console.log(data);
  }

  ngOnInit() {}

  onNoClick(): void {
    this.dialogRef.close();
  }
}
