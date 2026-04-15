import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { RProductService, IProduct } from '../../../services/reg/r-product.service';
import {
  RProductPresentationService,
  IProductPresentation,
} from '../../../services/reg/r-product-presentation.service';
import { RUploadService } from '../../../services/reg/r-upload.service';
import { resolvePresentationImageUrl, resolveProductImageUrl } from 'src/app/utils/product-image-url';

@Component({
  selector: 'app-reg-product-show',
  templateUrl: './reg-product-show.component.html',
  styleUrls: ['./reg-product-show.component.css'],
})
export class RegProductShowComponent implements OnInit {
  product: IProduct | null = null;
  presentations: IProductPresentation[] = [];
  productId = '';
  loadError = '';
  notFound = false;
  imageUploadBusy = false;
  imageUploadError = '';
  inheritBusy = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productSvc: RProductService,
    private presentationSvc: RProductPresentationService,
    private uploadSvc: RUploadService
  ) {}

  ngOnInit(): void {
    this.productId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.productId) {
      this.loadError = 'Missing product id.';
      return;
    }
    this.loadProduct();
    this.loadPresentations();
  }

  loadProduct(): void {
    this.notFound = false;
    this.loadError = '';
    this.productSvc.getById(this.productId).subscribe({
      next: p => {
        this.product = p;
      },
      error: () => {
        this.notFound = true;
        this.product = null;
      },
    });
  }

  loadPresentations(): void {
    this.presentationSvc.getAll().subscribe(rows => {
      const list = rows || [];
      this.presentations = list
        .filter(r => String(r.productId) === String(this.productId))
        .sort((a, b) => (a.unitOfMeasure || '').localeCompare(b.unitOfMeasure || '', undefined, { sensitivity: 'base' }));
    });
  }

  displayProductName(): string {
    return this.product?.name || 'Product';
  }

  displayCategory(): string {
    const c = (this.product as any)?.Category;
    return c?.name || '—';
  }

  productImageUrl(): string {
    return resolveProductImageUrl(this.product?.img);
  }

  presentationThumbUrl(row: IProductPresentation): string {
    return resolvePresentationImageUrl(row.img, this.product?.img);
  }

  usesInheritedImage(row: IProductPresentation): boolean {
    return !(row.img || '').trim();
  }

  onProductImageSelected(ev: Event, input: HTMLInputElement): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    input.value = '';
    if (!file || !this.product) {
      return;
    }
    this.imageUploadBusy = true;
    this.imageUploadError = '';
    this.uploadSvc.uploadProductImage(file).subscribe({
      next: ({ url }) => {
        const updated = { ...this.product!, img: url };
        this.productSvc.update(updated).subscribe({
          next: () => {
            this.product = updated;
            this.imageUploadBusy = false;
            this.loadPresentations();
          },
          error: () => {
            this.imageUploadBusy = false;
            this.imageUploadError = 'Image uploaded but saving the product failed.';
          },
        });
      },
      error: () => {
        this.imageUploadBusy = false;
        this.imageUploadError = 'Upload failed. Check file type (JPEG, PNG, GIF, WebP) and size (max 5 MB).';
      },
    });
  }

  clearCustomPresentationImages(): void {
    const toClear = this.presentations.filter(p => (p.img || '').trim());
    if (!toClear.length) {
      return;
    }
    if (
      !confirm(
        'Clear custom images on all details listed below? In the POS they will use this product’s photo until you set a specific image on a detail (e.g. box vs unit).'
      )
    ) {
      return;
    }
    this.inheritBusy = true;
    this.imageUploadError = '';
    forkJoin(toClear.map(p => this.presentationSvc.update({ ...p, img: '' }))).subscribe({
      next: () => {
        this.inheritBusy = false;
        this.loadPresentations();
      },
      error: () => {
        this.inheritBusy = false;
        this.imageUploadError = 'Could not update one or more details.';
      },
    });
  }

  backToCatalog(): void {
    this.router.navigate(['/reg/products']);
  }

  editProduct(): void {
    this.router.navigate(['/reg/products', this.productId]);
  }

  addPresentation(): void {
    this.router.navigate(['/reg/productPresentations/new'], {
      queryParams: { productId: this.productId, returnTo: this.productId },
    });
  }

  editPresentation(presentationId: string): void {
    this.router.navigate(['/reg/productPresentations', presentationId], {
      queryParams: { returnTo: this.productId },
    });
  }

  removePresentation(presentationId: string): void {
    if (!confirm('Delete this product detail? This cannot be undone.')) {
      return;
    }
    this.presentationSvc.remove(presentationId).subscribe(() => {
      this.loadPresentations();
    });
  }
}
