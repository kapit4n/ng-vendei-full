import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { RCategoryService, ICategory } from '../../../services/reg/r-category.service';
import { normalizeApiArray } from 'src/app/utils/api-body';

@Component({
  selector: 'app-reg-category-list',
  templateUrl: './reg-category-list.component.html',
  styleUrls: ['./reg-category-list.component.css'],
  standalone: false,
})
export class RegCategoryListComponent implements OnInit {
  categories: ICategory[] = [];
  loadError = '';
  deleteBusyId: string | number | null = null;

  constructor(
    private categorySvc: RCategoryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loadError = '';
    this.categorySvc.getAll().subscribe({
      next: body => {
        const raw = normalizeApiArray(body) as ICategory[];
        const list = raw.filter(
          (row): row is ICategory =>
            row != null && typeof row === 'object' && !Array.isArray(row)
        );
        this.categories = [...list].sort((a, b) =>
          String(a?.name || '').localeCompare(String(b?.name || ''), undefined, {
            sensitivity: 'base',
          })
        );
        this.cdr.detectChanges();
      },
      error: () => {
        this.categories = [];
        this.loadError = 'Could not load categories. Check your connection and try again.';
      },
    });
  }

  trackCategoryRow(index: number, cat: ICategory): string | number {
    return cat.id != null && cat.id !== '' ? cat.id : `row-${index}`;
  }

  newCategory(): void {
    this.router.navigate(['/reg/categories/new']);
  }

  openCategory(id: string | number): void {
    this.router.navigate(['/reg/categories', id]);
  }

  removeCategory(cat: ICategory): void {
    const id = cat.id;
    if (id == null || id === '') {
      return;
    }
    if (
      !confirm(
        `Delete category “${cat.name || cat.code}”? Products still linked to it may be affected or the delete may fail if the database forbids it.`
      )
    ) {
      return;
    }
    this.deleteBusyId = id;
    this.categorySvc.remove(id).subscribe({
      next: () => {
        this.deleteBusyId = null;
        this.loadCategories();
      },
      error: () => {
        this.deleteBusyId = null;
        this.loadError = 'Could not delete this category. It may still be in use by products.';
      },
    });
  }
}
