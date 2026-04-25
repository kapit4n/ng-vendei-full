import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of, Subject } from 'rxjs';
import { catchError, map, switchMap, takeUntil, tap } from 'rxjs/operators';
import { ICategory, RCategoryService } from '../../../services/reg/r-category.service';
import { IProduct, RProductService } from '../../../services/reg/r-product.service';
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
  selector: 'app-reg-product-quick-edit',
  templateUrl: './reg-product-quick-edit.component.html',
  styleUrls: ['./reg-product-quick-edit.component.css'],
  standalone: false,
})
export class RegProductQuickEditComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  pageLoading = true;
  pageError = '';
  saveError = '';
  categories: ICategory[] = [];
  allUnitOfMeasures: IUnitOfMeasure[] = [];
  /** Set when editing an existing row (from loaded product). */
  currentProductId: string | null = null;

  readonly form = this.fb.group({
    categoryId: ['', Validators.required],
    name: ['', Validators.required],
    code: ['', Validators.required],
    img: [''],
    description: [''],
    unitOfMeasureIds: [[] as string[]],
  });

  constructor(
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productSvc: RProductService,
    private readonly categorySvc: RCategoryService,
    private readonly uomSvc: RUnitOfMeasureService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  get pageTitle(): string {
    return this.currentProductId ? 'Edit product' : 'New product';
  }

  get pageSubtitle(): string {
    return this.currentProductId
      ? 'Reliable editor: category and units load before the form is shown.'
      : 'Create a product with category and allowed units.';
  }

  get imagePreviewUrl(): string {
    const raw = (this.form.controls.img.value || '').trim();
    if (!raw) {
      return PLACEHOLDER_IMG;
    }
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/') || raw.startsWith('assets/')) {
      return raw;
    }
    return PLACEHOLDER_IMG;
  }

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        takeUntil(this.destroy$),
        tap(() => {
          this.pageLoading = true;
          this.pageError = '';
          this.saveError = '';
        }),
        switchMap(params => {
          const idParam = params.get('id');
          const productId =
            idParam != null && idParam !== '' && idParam !== 'new' ? idParam : null;
          return forkJoin({
            cats: this.categorySvc.getAll().pipe(
              map(body => coerceCategoryRows(normalizeApiArray(body))),
              catchError(() => of([] as ICategory[]))
            ),
            uoms: this.uomSvc.getAll().pipe(
              map(body => coerceUnitOfMeasureRows(normalizeApiArray(body))),
              catchError(() => of([] as IUnitOfMeasure[]))
            ),
            product: productId
              ? this.productSvc.getById(productId).pipe(
                  map(raw => normalizeApiRecord(raw) as IProduct | null),
                  catchError(() => of(null))
                )
              : of(null),
          }).pipe(map(result => ({ ...result, productId })));
        })
      )
      .subscribe({
        next: ({ cats, uoms, product, productId }) => {
          this.categories = cats;
          this.allUnitOfMeasures = uoms;

          if (productId) {
            if (!product || product.id == null || String(product.id).trim() === '') {
              this.pageError = 'Product not found.';
              this.currentProductId = null;
              this.pageLoading = false;
              this.cdr.detectChanges();
              return;
            }
            this.applyProductToForm(product);
            this.currentProductId = String(product.id);
          } else {
            this.currentProductId = null;
            const firstCat = this.categories[0];
            this.form.reset({
              categoryId: firstCat?.id != null ? String(firstCat.id) : '',
              name: '',
              code: '',
              img: '',
              description: '',
              unitOfMeasureIds: [] as string[],
            });
          }

          this.pageLoading = false;
          this.cdr.detectChanges();
          queueMicrotask(() => this.cdr.detectChanges());
        },
        error: () => {
          this.pageError = 'Could not load categories, units, or this product.';
          this.pageLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyProductToForm(product: IProduct): void {
    const rec = product as IProduct & Record<string, unknown>;
    const linked =
      product.UnitOfMeasures ||
      (rec['unitOfMeasures'] as IUnitOfMeasure[] | undefined) ||
      (rec['UnitOfMeasures'] as IUnitOfMeasure[] | undefined);
    const uomList = Array.isArray(linked) ? linked : [];
    this.form.reset({
      categoryId: product.categoryId != null ? String(product.categoryId) : '',
      name: (product.name || '').trim(),
      code: (product.code || '').trim(),
      img: (product.img || '').trim(),
      description: (product.description || '').trim(),
      unitOfMeasureIds: uomList.map(u => String(u.id)),
    });
  }

  uomSelected(id: string | number): boolean {
    const ids = (this.form.get('unitOfMeasureIds')?.value as string[] | undefined) ?? [];
    return ids.includes(String(id));
  }

  onUomToggle(id: string | number, checked: boolean): void {
    const ctrl = this.form.get('unitOfMeasureIds');
    if (!ctrl) {
      return;
    }
    const sid = String(id);
    const cur = new Set((ctrl.value as string[] | undefined) ?? []);
    if (checked) {
      cur.add(sid);
    } else {
      cur.delete(sid);
    }
    ctrl.setValue([...cur]);
    ctrl.markAsDirty();
    this.cdr.detectChanges();
  }

  /** Native `<option [value]>` must be a string; do not use `String()` in templates (not in template scope). */
  categoryOptionValue(c: ICategory): string {
    return c.id != null && c.id !== '' ? `${c.id}` : '';
  }

  /** Template: readable category line for native option text. */
  categoryLabel(c: ICategory): string {
    return categoryOptionLabel(c);
  }

  /** Template: readable UOM line next to checkboxes. */
  uomLabel(u: IUnitOfMeasure): string {
    return uomOptionLabel(u);
  }

  trackUomRow(index: number, u: IUnitOfMeasure): string | number {
    return u.id != null && u.id !== '' ? u.id : `uom-${index}`;
  }

  cancel(): void {
    this.router.navigate(['/reg/products']);
  }

  save(): void {
    this.saveError = '';
    if (this.form.invalid) {
      this.saveError = 'Please fill required fields (category, name, code).';
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const name = (v.name || '').trim();
    const code = (v.code || '').trim();
    const unitIds = (v.unitOfMeasureIds || [])
      .map(x => Number(x))
      .filter(n => Number.isFinite(n) && n > 0);

    const payload: Record<string, unknown> = {
      name,
      code,
      description: (v.description || '').trim(),
      img: (v.img || '').trim(),
      categoryId: String(v.categoryId ?? ''),
      unitOfMeasureIds: unitIds,
    };

    const onErr = () => {
      this.saveError = 'Could not save. Check your connection and try again.';
      this.cdr.detectChanges();
    };

    if (this.currentProductId) {
      payload.id = this.currentProductId;
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
}
