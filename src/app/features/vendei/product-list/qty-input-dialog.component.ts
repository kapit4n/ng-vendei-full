import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface QtyDialogData {
  productName: string;
  unitLabel: string;
  initialQuantity: number;
}

@Component({
  selector: 'app-qty-input-dialog',
  template: `
    <h2 mat-dialog-title>{{ data.productName }}</h2>
    <mat-dialog-content>
      <mat-form-field appearance="outline" class="qty-field">
        <mat-label>Quantity ({{ data.unitLabel }})</mat-label>
        <input matInput type="number" [(ngModel)]="quantity" [step]="step" min="0.01" autofocus />
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button type="button" (click)="cancel()">Cancel</button>
      <button mat-flat-button type="button" color="primary" [mat-dialog-close]="quantity" cdkFocusInitial>Add</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .qty-field { width: 100%; }
  `],
  standalone: false,
})
export class QtyInputDialogComponent {
  quantity: number;
  step: number;

  constructor(
    public dialogRef: MatDialogRef<QtyInputDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QtyDialogData,
  ) {
    this.quantity = data.initialQuantity || 0.25;
    this.step = data.unitLabel === 'kg' || data.unitLabel === 'm' ? 0.01 : 1;
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
