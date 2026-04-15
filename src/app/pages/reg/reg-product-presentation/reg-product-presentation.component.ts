import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { ActivatedRoute } from '@angular/router';
import {
  IProductPresentation, RProductPresentationService
} from '../../../services/reg/r-product-presentation.service';
import {
  RProductService,
  IProduct
} from "../../../services/reg/r-product.service";
import { RUploadService } from '../../../services/reg/r-upload.service';
import { roundToCents } from 'src/app/utils/money';
import { resolvePresentationImageUrl } from 'src/app/utils/product-image-url';

const PLACEHOLDER_IMG = 'assets/vendei/placeholders/product-card.svg';

@Component({
    selector: 'app-reg-product-presentation',
    templateUrl: './reg-product-presentation.component.html',
    styleUrls: ['./reg-product-presentation.component.css'],
    standalone: false
})
export class RegProductPresentationComponent implements OnInit {
  productPresentationInfo: IProductPresentation;
  products: IProduct[];
  saveError = '';
  useProductImage = false;
  detailImageUploading = false;
  detailImageUploadError = '';

  constructor(
    private productPresentationSvc: RProductPresentationService,
    private router: Router,
    private productSvc: RProductService,
    private route: ActivatedRoute,
    private uploadSvc: RUploadService
  ) {
    this.productPresentationInfo = {} as IProductPresentation;
    this.products = [];
  }

  get pageTitle(): string {
    return this.isEditing() ? 'Edit product detail' : 'New product detail';
  }

  get pageSubtitle(): string {
    return this.isEditing()
      ? 'Update price, unit, and stock for this sellable presentation.'
      : 'Define how this product is sold (unit, price, and quantity) for the POS catalog.';
  }

  get parentProductImg(): string {
    const pid = this.productPresentationInfo?.productId;
    if (!pid) {
      return '';
    }
    const p = this.products.find(x => String(x.id) === String(pid));
    return (p?.img || '').trim();
  }

  get imagePreviewUrl(): string {
    return resolvePresentationImageUrl(
      this.productPresentationInfo?.img,
      this.parentProductImg || null,
      PLACEHOLDER_IMG
    );
  }

  isEditing(): boolean {
    return !!this.route.snapshot.paramMap.get('id');
  }

  compareProductId(a: string | number | null | undefined, b: string | number | null | undefined): boolean {
    if (a == null || b == null) {
      return a == b;
    }
    return String(a) === String(b);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    const presetProductId = this.route.snapshot.queryParamMap.get('productId');
    if (id) {
      this.productPresentationSvc.getById(id).subscribe(row => {
        this.productPresentationInfo = {
          ...row,
          productId: row.productId != null ? String(row.productId) : '',
          currentPrice: row.currentPrice != null ? Number(row.currentPrice) : 0,
          quantity: row.quantity != null ? Number(row.quantity) : 0,
        };
        this.syncUseProductImageFlag();
      });
    }
    this.productSvc.getAll().subscribe(list => {
      const sorted = [...(list || [])].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
      );
      this.products = sorted;
      if (!id && sorted.length) {
        const presetOk =
          presetProductId && sorted.some(p => String(p.id) === String(presetProductId));
        if (presetOk) {
          this.productPresentationInfo.productId = String(presetProductId);
        } else if (this.productPresentationInfo.productId == null || this.productPresentationInfo.productId === '') {
          this.productPresentationInfo.productId = String(sorted[0].id);
        }
        this.syncUseProductImageFlag();
      }
    });
  }

  syncUseProductImageFlag(): void {
    this.useProductImage = !(this.productPresentationInfo.img || '').trim();
  }

  onProductIdSelected(): void {
    if (this.useProductImage) {
      this.productPresentationInfo.img = '';
    }
  }

  onUseProductImageToggle(): void {
    if (this.useProductImage) {
      this.productPresentationInfo.img = '';
      this.detailImageUploadError = '';
    }
  }

  onDetailImgFieldChange(_value: string): void {
    if ((this.productPresentationInfo.img || '').trim()) {
      this.useProductImage = false;
    }
  }

  onDetailImageSelected(_ev: Event, input: HTMLInputElement): void {
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    this.useProductImage = false;
    this.detailImageUploading = true;
    this.detailImageUploadError = '';
    this.uploadSvc.uploadProductImage(file).subscribe({
      next: ({ url }) => {
        this.productPresentationInfo.img = url;
        this.detailImageUploading = false;
      },
      error: () => {
        this.detailImageUploading = false;
        this.detailImageUploadError = 'Upload failed. Use JPEG, PNG, GIF, or WebP (max 5 MB).';
      },
    });
  }

  private sanitizeReturnTo(raw: string | null): string | null {
    if (!raw || !raw.trim()) {
      return null;
    }
    const t = raw.trim();
    if (t.includes('/') || t.includes('\\') || t.includes('..')) {
      return null;
    }
    return t;
  }

  private goBackAfterForm(): void {
    const returnTo = this.sanitizeReturnTo(this.route.snapshot.queryParamMap.get('returnTo'));
    if (returnTo) {
      this.router.navigate(['/reg/products/view', returnTo]);
      return;
    }
    this.router.navigate(['/reg/products']);
  }

  save() {
    this.saveError = '';
    const productId = this.productPresentationInfo.productId;
    if (productId == null || productId === '') {
      this.saveError = 'Please choose a product.';
      return;
    }
    const unit = (this.productPresentationInfo.unitOfMeasure || '').trim();
    if (!unit) {
      this.saveError = 'Unit of measure is required.';
      return;
    }
    const price = roundToCents(this.productPresentationInfo.currentPrice);
    if (!Number.isFinite(price) || price < 0) {
      this.saveError = 'Enter a valid price (0 or greater).';
      return;
    }
    const qty = Number(this.productPresentationInfo.quantity);
    if (!Number.isFinite(qty) || qty < 0) {
      this.saveError = 'Quantity must be a valid number (0 or greater).';
      return;
    }

    const imgStored = this.useProductImage ? '' : (this.productPresentationInfo.img || '').trim();

    const payload = {
      ...this.productPresentationInfo,
      productId,
      unitOfMeasure: unit,
      currentPrice: price,
      quantity: qty,
      brand: (this.productPresentationInfo.brand || '').trim(),
      code: (this.productPresentationInfo.code || '').trim(),
      img: imgStored,
    };

    const onErr = () => {
      this.saveError = 'Could not save. Check your connection and try again.';
    };

    if (this.productPresentationInfo.id) {
      this.productPresentationSvc.update(payload).subscribe({
        next: () => this.goBackAfterForm(),
        error: onErr,
      });
    } else {
      this.productPresentationSvc.save(payload).subscribe({
        next: () => this.goBackAfterForm(),
        error: onErr,
      });
    }
  }

  cancel() {
    this.goBackAfterForm();
  }
}
