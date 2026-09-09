import { Component, EventEmitter, Input, Output } from '@angular/core';
import { VStoreProfileService, ProductCardSize } from 'src/app/services/vendei/v-store-profile.service';
import { roundToCents } from 'src/app/utils/money';
import {
  productLabelFromFields,
  productLabelFromFullName,
  productTitleFromFullName,
} from 'src/app/utils/product-display-text';
import { resolvePresentationImageUrl } from 'src/app/utils/product-image-url';
import { sellingModeUnitLabel } from 'src/app/services/vendei/v-store-profile.service';

/**
 * Generic POS product card. Consumes a normalized product/presentation row and is
 * business-agnostic: all display values are derived from the row data.
 *
 * Emits `addProduct` when activated (click or keyboard Enter/Space). The card does
 * not mutate the ticket itself — the parent decides how to add the item.
 *
 * Density variants: `cardSize` picks small (compact, SKU/label hidden), medium
 * (default) or large (spacious, full details) purely via presentation classes.
 */
@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.css'],
  standalone: false,
})
export class ProductCardComponent {
  @Input() product: any = {};
  /** Hide the image area (driven by profile POS config). */
  @Input() showImage = true;
  /** Disable interaction (e.g. during print, or sold-out per business rules). */
  @Input() disabled = false;
  /** Whether stock level should gate the card (per business rules). */
  @Input() respectStock = false;
  /** Product card density (small | medium | large). Default: medium. */
  @Input() cardSize: ProductCardSize = 'medium';

  @Output() addProduct = new EventEmitter<void>();

  constructor(private profileSvc: VStoreProfileService) {}

  /** Product code / SKU for the secondary line. */
  get sku(): string {
    return this.product?.Product?.code || this.product?.code || '';
  }

  get productName(): string {
    return this.product?.Product?.name || this.product?.name || 'Product';
  }

  get title(): string {
    return productTitleFromFullName(this.productName);
  }

  get label(): string | null {
    const full = this.productName;
    return productLabelFromFullName(full) ?? productLabelFromFields(this.product);
  }

  get unitLabel(): string | null {
    const fromFields = productLabelFromFields(this.product);
    if (fromFields) {
      return fromFields;
    }
    const mode = this.product?.sellingMode || this.product?.Product?.sellingMode;
    if (mode) {
      const ul = sellingModeUnitLabel(mode);
      return ul ? `(${ul})` : null;
    }
    return null;
  }

  get price(): number {
    return roundToCents(this.product?.currentPrice ?? this.product?.price);
  }

  get currencySymbol(): string {
    return this.profileSvc.getCurrencySymbol();
  }

  get imageUrl(): string {
    return resolvePresentationImageUrl(this.product?.img, this.product?.Product?.img);
  }

  /** Stock for out-of-stock indication. Null = unknown (do not show). */
  get stock(): number | null {
    const s = Number(this.product?.Product?.stock ?? this.product?.stock);
    return Number.isFinite(s) ? s : null;
  }

  get isSoldOut(): boolean {
    if (!this.respectStock) {
      return false;
    }
    const s = this.stock;
    return s !== null && s <= 0;
  }

  get isDisabled(): boolean {
    return this.disabled || this.isSoldOut;
  }

  onActivate(): void {
    if (this.isDisabled) {
      return;
    }
    this.addProduct.emit();
  }
}
