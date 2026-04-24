import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, timeout } from 'rxjs/operators';
import {
  IProductPresentation, RProductPresentationService
} from '../../../services/reg/r-product-presentation.service';
import {
  RProductService,
  IProduct
} from "../../../services/reg/r-product.service";
import { IUnitOfMeasure, RUnitOfMeasureService } from '../../../services/reg/r-unit-of-measure.service';
import { RUploadService } from '../../../services/reg/r-upload.service';
import { roundToCents } from 'src/app/utils/money';
import { resolvePresentationImageUrl } from 'src/app/utils/product-image-url';
import { normalizeApiArray, normalizeApiRecord } from 'src/app/utils/api-body';

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
  allUnitOfMeasures: IUnitOfMeasure[] = [];
  allowedUnitOfMeasures: IUnitOfMeasure[] = [];
  saveError = '';
  useProductImage = false;
  detailImageUploading = false;
  detailImageUploadError = '';

  constructor(
    private productPresentationSvc: RProductPresentationService,
    private router: Router,
    private productSvc: RProductService,
    private route: ActivatedRoute,
    private uploadSvc: RUploadService,
    private uomSvc: RUnitOfMeasureService,
    private cdr: ChangeDetectorRef
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

  /**
   * Mat-option values and ngModel must use the same type; we standardize on string ids.
   */
  compareProductId(a: string | number | null | undefined, b: string | number | null | undefined): boolean {
    if (a == null && b == null) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    return String(a) === String(b);
  }

  /** String id for mat-option [value] to match string productId on the model. */
  selectValueForProductId(id: string | number | null | undefined): string {
    return id != null && id !== '' ? String(id) : '';
  }

  get unitOptions(): IUnitOfMeasure[] {
    return this.allowedUnitOfMeasures.length ? this.allowedUnitOfMeasures : this.allUnitOfMeasures;
  }

  compareUnitId(a: string | number | null | undefined, b: string | number | null | undefined): boolean {
    if (a == null && b == null) {
      return true;
    }
    if (a == null || b == null) {
      return false;
    }
    return String(a) === String(b);
  }

  selectValueForUnitId(id: string | number | null | undefined): string {
    return id != null && id !== '' ? String(id) : '';
  }

  private ensureSelectedUnitStillValid(): void {
    const cur = String(this.productPresentationInfo.unitOfMeasureId ?? '').trim();
    if (!cur) {
      return;
    }
    const ok = this.unitOptions.some(u => String(u.id) === cur);
    if (!ok) {
      this.productPresentationInfo.unitOfMeasureId = '';
    }
  }

  private refreshAllowedUnitsForProductId(productId: string): void {
    if (!productId) {
      this.allowedUnitOfMeasures = [];
      return;
    }
    const p = this.products.find(x => String(x.id) === String(productId));
    const embedded = p?.UnitOfMeasures;
    if (embedded?.length) {
      this.allowedUnitOfMeasures = embedded as IUnitOfMeasure[];
      this.ensureSelectedUnitStillValid();
      return;
    }
    this.productSvc.getById(String(productId)).subscribe({
      next: full => {
        const u = (full as IProduct)?.UnitOfMeasures;
        this.allowedUnitOfMeasures = Array.isArray(u) ? (u as IUnitOfMeasure[]) : [];
        this.ensureSelectedUnitStillValid();
        this.cdr.detectChanges();
      },
      error: () => {
        this.allowedUnitOfMeasures = [];
      },
    });
  }

  private isUsablePresentationRow(rec: unknown): rec is IProductPresentation {
    if (rec == null || typeof rec !== 'object') {
      return false;
    }
    const o = rec as Record<string, unknown>;
    return (
      o['id'] != null ||
      o['productId'] != null ||
      o['product_id'] != null ||
      (o['Product'] != null && typeof o['Product'] === 'object' && (o['Product'] as any).id != null)
    );
  }

  private loadPresentationRow$(presentationId: string) {
    return this.productPresentationSvc.getById(presentationId).pipe(
      timeout(8000),
      map(r => normalizeApiRecord(r) as IProductPresentation | null),
      switchMap(rec => {
        if (this.isUsablePresentationRow(rec)) {
          return of(rec);
        }
        return this.productPresentationSvc.getAll().pipe(
          map(body => normalizeApiArray(body) as IProductPresentation[]),
          map(list => list.find(x => String(x.id) === String(presentationId)) ?? null)
        );
      }),
      catchError(() =>
        this.productPresentationSvc.getAll().pipe(
          map(body => normalizeApiArray(body) as IProductPresentation[]),
          map(list => list.find(x => String(x.id) === String(presentationId)) ?? null)
        )
      )
    );
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    const presetProductId = this.route.snapshot.queryParamMap.get('productId');

    const products$ = this.productSvc.getAll().pipe(
      map(body => normalizeApiArray(body) as IProduct[]),
      map(list =>
        [...list].sort((a, b) =>
          (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
        )
      ),
      catchError(() => of([] as IProduct[]))
    );

    const uoms$ = this.uomSvc.getAll().pipe(catchError(() => of([] as IUnitOfMeasure[])));

    if (id) {
      forkJoin({
        row: this.loadPresentationRow$(id),
        products: products$,
        uoms: uoms$,
      }).subscribe(({ row, products, uoms }) => {
        this.products = products;
        this.allUnitOfMeasures = Array.isArray(uoms) ? uoms : [];
        if (row != null && typeof row === 'object') {
          const raw = row as any;
          const pid = raw.productId ?? raw.product_id ?? raw.Product?.id;
          const uomid = raw.unitOfMeasureId ?? raw.UnitOfMeasure?.id;
          this.productPresentationInfo = {
            ...raw,
            productId: pid != null && pid !== '' ? String(pid) : '',
            unitOfMeasureId:
              uomid != null && uomid !== '' ? String(uomid) : '',
            currentPrice: raw.currentPrice != null ? Number(raw.currentPrice) : 0,
            quantity: raw.quantity != null ? Number(raw.quantity) : 0,
          };
        } else {
          this.saveError = 'Could not load this product detail.';
        }
        this.refreshAllowedUnitsForProductId(this.productPresentationInfo.productId);
        this.syncUseProductImageFlag();
        // Mat-select needs a tick after options + model are both set (string ids must match mat-option values).
        this.cdr.detectChanges();
        queueMicrotask(() => this.cdr.detectChanges());
      });
      return;
    }

    forkJoin({ products: products$, uoms: uoms$ }).subscribe(({ products: sorted, uoms }) => {
      this.products = sorted;
      this.allUnitOfMeasures = Array.isArray(uoms) ? uoms : [];
      if (sorted.length) {
        const presetOk =
          presetProductId && sorted.some(p => String(p.id) === String(presetProductId));
        if (presetOk) {
          this.productPresentationInfo.productId = String(presetProductId);
        } else if (
          this.productPresentationInfo.productId == null ||
          this.productPresentationInfo.productId === ''
        ) {
          this.productPresentationInfo.productId = String(sorted[0].id);
        }
        this.refreshAllowedUnitsForProductId(this.productPresentationInfo.productId);
        this.syncUseProductImageFlag();
      }
      this.cdr.detectChanges();
    });
  }

  syncUseProductImageFlag(): void {
    this.useProductImage = !(this.productPresentationInfo.img || '').trim();
  }

  onProductIdSelected(): void {
    if (this.useProductImage) {
      this.productPresentationInfo.img = '';
    }
    this.refreshAllowedUnitsForProductId(this.productPresentationInfo.productId);
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
    const unitIdStr = String(this.productPresentationInfo.unitOfMeasureId ?? '').trim();
    if (!unitIdStr) {
      this.saveError = 'Please select a unit of measure.';
      return;
    }
    const unitId = Number(unitIdStr);
    if (!Number.isFinite(unitId) || unitId <= 0) {
      this.saveError = 'Please select a valid unit of measure.';
      return;
    }
    const uomRow = this.unitOptions.find(u => String(u.id) === unitIdStr);
    if (!uomRow) {
      this.saveError = 'Selected unit is not available for this product. Add it on the product form first.';
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
      unitOfMeasureId: unitId,
      unitOfMeasure: uomRow.name || uomRow.code || String(unitId),
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
