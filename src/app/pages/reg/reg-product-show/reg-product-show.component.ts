import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize, map, switchMap, timeout } from 'rxjs/operators';
import { RProductService, IProduct } from '../../../services/reg/r-product.service';
import {
  RProductPresentationService,
  IProductPresentation,
} from '../../../services/reg/r-product-presentation.service';
import { RUploadService } from '../../../services/reg/r-upload.service';
import { resolvePresentationImageUrl, resolveProductImageUrl } from 'src/app/utils/product-image-url';
import { normalizeApiArray, normalizeApiRecord } from 'src/app/utils/api-body';

@Component({
  selector: 'app-reg-product-show',
  templateUrl: './reg-product-show.component.html',
  styleUrls: ['./reg-product-show.component.css'],
  standalone: false,
})
export class RegProductShowComponent implements OnInit {
  product: IProduct | null = null;
  presentations: IProductPresentation[] = [];
  productId = '';
  loadError = '';
  notFound = false;
  /** True until the product request finishes (avoids a blank page when `product` is still null). */
  loadingProduct = true;
  imageUploadBusy = false;
  imageUploadError = '';
  inheritBusy = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productSvc: RProductService,
    private presentationSvc: RProductPresentationService,
    private uploadSvc: RUploadService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(
        switchMap(params => {
          const id = params.get('id') || '';
          this.productId = id;
          if (!id) {
            this.loadingProduct = false;
            this.loadError = 'Missing product id.';
            this.product = null;
            this.presentations = [];
            this.notFound = false;
            return of({ entity: null as IProduct | null, presentations: [] as IProductPresentation[] });
          }
          this.loadingProduct = true;
          this.loadError = '';
          this.notFound = false;

          const entity$ = this.productSvc.getById(id).pipe(
            timeout(8000),
            map(p => normalizeApiRecord(p) as IProduct | null),
            catchError(() =>
              this.productSvc.getAll().pipe(
                timeout(15000),
                map(rows => {
                  const list = normalizeApiArray(rows) as IProduct[];
                  return (list.find(x => String(x.id) === String(id)) as IProduct | null) ?? null;
                }),
                catchError(() => of(null as IProduct | null))
              )
            )
          );

          const rawPres$ = this.presentationSvc.getAll().pipe(
            timeout(15000),
            map(rows => normalizeApiArray(rows) as IProductPresentation[]),
            catchError(() => of([] as IProductPresentation[]))
          );

          return forkJoin({ entity: entity$, rawPresentations: rawPres$ }).pipe(
            map(({ entity, rawPresentations }) => {
              const merged = this.mergePresentationSources(rawPresentations, entity);
              return {
                entity,
                presentations: this.filterPresentationsByProductId(merged, id),
              };
            }),
            finalize(() => {
              this.loadingProduct = false;
              this.cdr.markForCheck();
            })
          );
        })
      )
      .subscribe({
        next: ({ entity, presentations }) => {
          if (!this.productId) {
            return;
          }
          this.presentations = presentations;
          if (entity != null && typeof entity === 'object') {
            this.product = entity;
            this.notFound = false;
          } else {
            this.product = null;
            this.notFound = true;
          }
          this.cdr.markForCheck();
        },
        error: () => {
          this.loadingProduct = false;
          this.product = null;
          this.presentations = [];
          this.notFound = true;
          this.cdr.markForCheck();
        },
      });
  }

  /** List + optional rows nested on the product record (some APIs include ProductPresentations on GET /products/:id). */
  private mergePresentationSources(
    fromListEndpoint: IProductPresentation[],
    entity: IProduct | null
  ): IProductPresentation[] {
    const extra = normalizeApiArray(
      (entity as any)?.ProductPresentations ?? (entity as any)?.productPresentations
    ) as IProductPresentation[];
    if (!extra.length) {
      return fromListEndpoint;
    }
    const byId = new Map(fromListEndpoint.map(r => [String((r as any).id), r]));
    const out = [...fromListEndpoint];
    for (const row of extra) {
      const rid = (row as any)?.id;
      if (rid != null && !byId.has(String(rid))) {
        byId.set(String(rid), row);
        out.push(row);
      }
    }
    return out;
  }

  /** Match API variants: camelCase, snake_case, or nested Product from Sequelize includes. */
  private presentationParentProductId(row: any): string | number | undefined {
    return row?.productId ?? row?.product_id ?? row?.Product?.id;
  }

  private filterPresentationsByProductId(
    list: IProductPresentation[],
    productId: string
  ): IProductPresentation[] {
    return list
      .filter(r => {
        const pid = this.presentationParentProductId(r);
        return pid != null && String(pid) === String(productId);
      })
      .sort((a, b) =>
        (a.unitOfMeasure || '').localeCompare(b.unitOfMeasure || '', undefined, { sensitivity: 'base' })
      );
  }

  loadPresentations(): void {
    if (!this.productId) {
      this.presentations = [];
      return;
    }
    this.presentationSvc
      .getAll()
      .pipe(
        timeout(15000),
        map(rows => this.filterPresentationsByProductId(normalizeApiArray(rows) as IProductPresentation[], this.productId)),
        catchError(() => of([] as IProductPresentation[])),
        finalize(() => this.cdr.markForCheck())
      )
      .subscribe(list => {
        this.presentations = list;
      });
  }

  presentationRowTrack(index: number, row: IProductPresentation): string | number {
    const id = row?.id as string | number | undefined;
    return id != null && id !== '' ? id : `idx-${index}`;
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
        'Clear custom images on all details listed below? In the POS they will use this product’s photo until you set a specific image on a detail (e.g. box vs single unit).'
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

  editPresentation(presentationId: string | number): void {
    this.router.navigate(['/reg/productPresentations', String(presentationId)], {
      queryParams: { returnTo: this.productId },
    });
  }

  removePresentation(presentationId: string | number): void {
    if (!confirm('Delete this product detail? This cannot be undone.')) {
      return;
    }
    this.presentationSvc.remove(presentationId).subscribe(() => {
      this.loadPresentations();
    });
  }
}
