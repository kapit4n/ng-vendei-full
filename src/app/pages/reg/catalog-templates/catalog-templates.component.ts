import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import {
  VCatalogTemplateService,
  CatalogTemplate,
} from '../../../services/vendei/v-catalog-template.service';

@Component({
  selector: 'app-catalog-templates',
  templateUrl: './catalog-templates.component.html',
  styleUrls: ['./catalog-templates.component.css'],
  standalone: false,
})
export class CatalogTemplatesComponent implements OnInit {
  templates: CatalogTemplate[] = [];
  loading = true;
  selectedTemplate: CatalogTemplate | null = null;

  applyName = '';
  applySlug = '';
  applyBusinessName = '';
  applying = false;
  applyError = '';

  constructor(
    private templateSvc: VCatalogTemplateService,
    private router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.loading = true;
    this.templateSvc
      .getAll()
      .pipe(finalize(() => { this.loading = false; this.cdr.detectChanges(); }))
      .subscribe((templates) => {
        this.templates = templates;
      });
  }

  viewTemplate(template: CatalogTemplate) {
    this.selectedTemplate = template;
    this.applyName = template.name;
    this.applySlug = template.slug + '-' + Date.now();
    this.applyBusinessName = template.name;
  }

  closeDetail() {
    this.selectedTemplate = null;
    this.applyError = '';
  }

  applyTemplate() {
    if (!this.selectedTemplate) return;
    this.applying = true;
    this.applyError = '';
    this.templateSvc
      .apply(this.selectedTemplate.id, {
        name: this.applyName,
        slug: this.applySlug,
        businessName: this.applyBusinessName,
      })
      .pipe(finalize(() => { this.applying = false; this.cdr.detectChanges(); }))
      .subscribe({
        next: (profile) => {
          this.selectedTemplate = null;
          this.router.navigate(['/reg/products'], {
            queryParams: { storeProfileId: profile.id },
          });
        },
        error: (err) => {
          this.applyError = err?.error?.error || 'Failed to apply template';
        },
      });
  }

  businessTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      supermarket: 'shopping_cart',
      'chicken-store': 'restaurant',
      butcher: 'set_meal',
      clothing: 'checkroom',
      bakery: 'cake',
      hardware: 'hardware',
    };
    return icons[type] || 'store';
  }
}
