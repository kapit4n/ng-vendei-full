import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { ActivatedRoute } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import {
  IProduct, RProductService
} from '../../../services/reg/r-product.service';
import {
  RCategoryService,
  ICategory
} from "../../../services/reg/r-category.service";
import { IUnitOfMeasure, RUnitOfMeasureService } from '../../../services/reg/r-unit-of-measure.service';
import { normalizeApiArray, normalizeApiRecord } from 'src/app/utils/api-body';
import {
  categoryOptionLabel,
  coerceCategoryRows,
  coerceUnitOfMeasureRows,
  uomOptionLabel,
} from 'src/app/utils/reg-catalog-entities';

const PLACEHOLDER_IMG = 'assets/vendei/placeholders/product-card.svg';

@Component({
    selector: 'app-reg-product',
    templateUrl: './reg-product.component.html',
    styleUrls: ['./reg-product.component.css'],
    standalone: false
})
export class RegProductComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  productInfo: IProduct;
  categories: ICategory[];
  allUnitOfMeasures: IUnitOfMeasure[] = [];
  saveError = '';

  constructor(private productSvc: RProductService, private router: Router,
    private categorySvc: RCategoryService, private route: ActivatedRoute,
    private uomSvc: RUnitOfMeasureService,
    private cdr: ChangeDetectorRef) {
    this.productInfo = { unitOfMeasureIds: [] } as IProduct;
    this.categories = [];
  }

  get pageTitle(): string {
    return this.isEditing() ? 'Edit product' : 'New product';
  }

  get pageSubtitle(): string {
    return this.isEditing()
      ? 'Update details and save when you are done.'
      : 'Fill in the basics. You can add pricing and units under Product details.';
  }

  get imagePreviewUrl(): string {
    const raw = (this.productInfo?.img || '').trim();
    if (!raw) {
      return PLACEHOLDER_IMG;
    }
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/') || raw.startsWith('assets/')) {
      return raw;
    }
    return PLACEHOLDER_IMG;
  }

  isEditing(): boolean {
    return !!this.route.snapshot.paramMap.get('id');
  }

  /** Mat-select compare when API mixes string/number ids. */
  compareCategoryId(a: string | number | null | undefined, b: string | number | null | undefined): boolean {
    if (a == null || b == null) {
      return a == b;
    }
    return String(a) === String(b);
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

  /** mat-option `[value]` must use component helpers — `String()` is not valid in templates. */
  categoryOptionValue(c: ICategory): string {
    return c.id != null && c.id !== '' ? `${c.id}` : '';
  }

  uomOptionValue(u: IUnitOfMeasure): string {
    return u.id != null && u.id !== '' ? `${u.id}` : '';
  }

  categoryLabel(c: ICategory): string {
    return categoryOptionLabel(c);
  }

  uomLabel(u: IUnitOfMeasure): string {
    return uomOptionLabel(u);
  }

  trackUomRow(index: number, u: IUnitOfMeasure): string | number {
    return u.id != null && u.id !== '' ? u.id : `uom-${index}`;
  }

  uomTriggerText(): string {
    const ids = (this.productInfo.unitOfMeasureIds || []).map((x) => String(x));
    if (!ids.length) {
      return 'None';
    }
    const byId = new Map(this.allUnitOfMeasures.map((u) => [String(u.id), u]));
    const labels = ids
      .map((id) => {
        const u = byId.get(id);
        return u?.code || u?.name || id;
      })
      .filter(Boolean);
    if (!labels.length) {
      return `${ids.length} selected`;
    }
    const first = labels.slice(0, 3);
    const more = labels.length - first.length;
    return more > 0 ? `${first.join(', ')} +${more}` : first.join(', ');
  }

  ngOnInit(): void {
    /** Reload when route id changes; unwrap list APIs that are not plain arrays. */
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() => {
          const id = this.route.snapshot.paramMap.get('id');
          return forkJoin({
            cats: this.categorySvc.getAll().pipe(
              map(body => coerceCategoryRows(normalizeApiArray(body))),
              catchError(() => of([] as ICategory[]))
            ),
            uoms: this.uomSvc.getAll().pipe(
              map(body => coerceUnitOfMeasureRows(normalizeApiArray(body))),
              catchError(() => of([] as IUnitOfMeasure[]))
            ),
            product: id ? this.productSvc.getById(id).pipe(catchError(() => of(null))) : of(null),
          }).pipe(map(data => ({ ...data, id })));
        })
      )
      .subscribe(({ cats, uoms, product, id }) => {
        this.categories = cats;
        this.allUnitOfMeasures = uoms;

        const normalized = normalizeApiRecord(product) as IProduct | null;
        if (id && normalized) {
          const rec = normalized as IProduct & Record<string, unknown>;
          const linked =
            normalized.UnitOfMeasures ||
            (rec['unitOfMeasures'] as IUnitOfMeasure[] | undefined) ||
            (rec['UnitOfMeasures'] as IUnitOfMeasure[] | undefined);
          const uomList = Array.isArray(linked) ? linked : [];
          this.productInfo = {
            ...normalized,
            categoryId: normalized.categoryId != null ? String(normalized.categoryId) : '',
            unitOfMeasureIds: uomList.map(u => String(u.id)),
          };
        } else if (!id && this.categories.length && (this.productInfo.categoryId == null || this.productInfo.categoryId === '')) {
          this.productInfo.categoryId = String(this.categories[0].id);
        }

        this.cdr.detectChanges();
        queueMicrotask(() => this.cdr.detectChanges());
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  save() {
    this.saveError = '';
    const name = (this.productInfo.name || '').trim();
    const code = (this.productInfo.code || '').trim();
    if (!name) {
      this.saveError = 'Product name is required.';
      return;
    }
    if (!code) {
      this.saveError = 'Product code is required.';
      return;
    }
    if (this.productInfo.categoryId == null || this.productInfo.categoryId === '') {
      this.saveError = 'Please choose a category.';
      return;
    }

    const unitIds = (this.productInfo.unitOfMeasureIds || [])
      .map(x => Number(x))
      .filter(n => Number.isFinite(n) && n > 0);

    const p = this.productInfo as IProduct & Record<string, unknown>;
    const payload: Record<string, unknown> = {
      id: p.id,
      name,
      code,
      description: p.description ?? '',
      img: p.img ?? '',
      categoryId: p.categoryId,
      unitOfMeasureIds: unitIds,
    };
    if (p.vendorId != null && String(p.vendorId).trim() !== '') {
      payload.vendorId = Number(p.vendorId);
    }

    const onErr = () => {
      this.saveError = 'Could not save. Check your connection and try again.';
    };

    if (this.productInfo.id) {
      this.productSvc.update(payload).subscribe({
        next: () => this.router.navigate(['/reg/products']),
        error: onErr,
      });
    } else {
      this.productSvc.save(payload).subscribe({
        next: () => this.router.navigate(['/reg/products']),
        error: onErr,
      });
    }
  }

  cancel() {
    this.router.navigate(['/reg/products']);
  }
}
