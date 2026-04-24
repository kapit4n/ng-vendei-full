import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ICategory, RCategoryService } from '../../../services/reg/r-category.service';
import { normalizeApiRecord } from 'src/app/utils/api-body';

const PLACEHOLDER_IMG = 'assets/vendei/placeholders/product-card.svg';

@Component({
  selector: 'app-reg-category',
  templateUrl: './reg-category.component.html',
  styleUrls: ['./reg-category.component.css'],
  standalone: false,
})
export class RegCategoryComponent implements OnInit {
  categoryInfo: ICategory;
  saveError = '';
  loadError = '';

  constructor(
    private categorySvc: RCategoryService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.categoryInfo = {
      name: '',
      code: '',
      description: '',
      img: '',
    };
  }

  get isNew(): boolean {
    return !this.route.snapshot.paramMap.get('id');
  }

  get pageTitle(): string {
    return this.isNew ? 'New category' : 'Edit category';
  }

  get imagePreviewUrl(): string {
    const raw = (this.categoryInfo?.img || '').trim();
    if (!raw) {
      return PLACEHOLDER_IMG;
    }
    if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/') || raw.startsWith('assets/')) {
      return raw;
    }
    return PLACEHOLDER_IMG;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.categorySvc
      .getById(id)
      .pipe(catchError(() => of(null)))
      .subscribe(raw => {
        const row = normalizeApiRecord(raw) as ICategory | null;
        if (row && typeof row === 'object') {
          this.categoryInfo = {
            ...row,
            id: row.id,
            name: (row.name || '').trim(),
            code: (row.code || '').trim(),
            description: (row.description || '').trim(),
            img: (row.img || '').trim(),
          };
        } else {
          this.loadError = 'Could not load this category.';
        }
        this.cdr.detectChanges();
      });
  }

  save(): void {
    this.saveError = '';
    const name = (this.categoryInfo.name || '').trim();
    const code = (this.categoryInfo.code || '').trim();
    const description = (this.categoryInfo.description || '').trim();
    const img = (this.categoryInfo.img || '').trim();

    if (!name) {
      this.saveError = 'Category name is required.';
      return;
    }
    if (!code) {
      this.saveError = 'Category code is required.';
      return;
    }

    const payload: ICategory = { name, code, description, img };

    const onErr = () => {
      this.saveError = 'Could not save. Check your connection and try again.';
    };

    if (this.isNew) {
      this.categorySvc.save(payload).subscribe({
        next: () => this.router.navigate(['/reg/categories']),
        error: onErr,
      });
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.saveError = 'Missing category id.';
      return;
    }
    this.categorySvc.update({ ...payload, id }).subscribe({
      next: () => this.router.navigate(['/reg/categories']),
      error: onErr,
    });
  }

  cancel(): void {
    this.router.navigate(['/reg/categories']);
  }
}
