import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { VProductVariantService, ProductVariant } from '../../../services/vendei/v-product-variant.service';
import { VStoreProfileService } from '../../../services/vendei/v-store-profile.service';
import { roundToCents } from 'src/app/utils/money';

export interface VariantSelectData {
  productId: number | string;
  productName: string;
  basePrice: number;
}

@Component({
  selector: 'app-variant-select-dialog',
  templateUrl: './variant-select-dialog.component.html',
  styleUrls: ['./variant-select-dialog.component.css'],
  standalone: false,
})
export class VariantSelectDialogComponent implements OnInit {
  variants: ProductVariant[] = [];
  loading = true;
  loadError = '';

  get currencySymbol(): string {
    return this.profileSvc.getCurrencySymbol();
  }

  constructor(
    private variantSvc: VProductVariantService,
    private profileSvc: VStoreProfileService,
    public dialogRef: MatDialogRef<VariantSelectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: VariantSelectData
  ) {}

  ngOnInit(): void {
    this.variantSvc.getByProductId(this.data.productId).subscribe({
      next: (variants) => {
        this.variants = variants.filter((v) => v.active);
        this.loading = false;
      },
      error: () => {
        this.loadError = 'Could not load variants.';
        this.loading = false;
      },
    });
  }

  selectVariant(variant: ProductVariant): void {
    this.dialogRef.close({
      variantId: variant.id,
      variantName: variant.name,
      variantSku: variant.sku,
      variantBarcode: variant.barcode,
      currentPrice: roundToCents(variant.price || this.data.basePrice),
    });
  }

  selectBase(): void {
    this.dialogRef.close({ base: true });
  }

  variantAttributeSummary(variant: ProductVariant): string {
    if (!variant.attributeLinks?.length) return '';
    return variant.attributeLinks
      .map((link) => {
        const def = link.attributeValue?.definition;
        return def ? `${def.name}: ${link.attributeValue?.value}` : link.attributeValue?.value || '';
      })
      .filter(Boolean)
      .join(' · ');
  }

  close(): void {
    this.dialogRef.close(null);
  }
}
