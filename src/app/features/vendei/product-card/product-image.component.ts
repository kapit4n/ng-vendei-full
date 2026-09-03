import { Component, Input } from '@angular/core';
import { PRODUCT_CARD_PLACEHOLDER, resolveProductImageUrl } from 'src/app/utils/product-image-url';

/**
 * Renders a product image on a predictable square tile.
 * Falls back to a clean placeholder when the source is empty, invalid, or fails to load,
 * and never breaks the surrounding layout (fixed tile, object-fit cover).
 */
@Component({
  selector: 'app-product-image',
  templateUrl: './product-image.component.html',
  styleUrls: ['./product-image.component.css'],
  standalone: false,
})
export class ProductImageComponent {
  @Input() src: string | null | undefined = '';
  @Input() alt = '';
  @Input() loading: 'lazy' | 'eager' = 'lazy';

  placeholder = PRODUCT_CARD_PLACEHOLDER;

  get resolvedSrc(): string {
    return resolveProductImageUrl(this.src, this.placeholder);
  }

  onError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src !== this.placeholder) {
      img.src = this.placeholder;
    }
  }
}
