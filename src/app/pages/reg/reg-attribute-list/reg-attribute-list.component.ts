import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import {
  RAttributeDefinitionService,
  IAttributeDefinition,
} from '../../../services/reg/r-attribute-definition.service';
import { VStoreProfileService } from '../../../services/vendei/v-store-profile.service';
import { normalizeApiArray } from 'src/app/utils/api-body';

@Component({
  selector: 'app-reg-attribute-list',
  templateUrl: './reg-attribute-list.component.html',
  styleUrls: ['./reg-attribute-list.component.css'],
  standalone: false,
})
export class RegAttributeListComponent implements OnInit {
  attributes: IAttributeDefinition[] = [];
  loadError = '';
  deleteBusyId: string | number | null = null;

  constructor(
    private attrSvc: RAttributeDefinitionService,
    private profileSvc: VStoreProfileService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAttributes();
  }

  loadAttributes(): void {
    this.loadError = '';
    const profileId = this.profileSvc.getActiveProfileId();
    this.attrSvc.getAll(profileId || undefined).subscribe({
      next: (body) => {
        const raw = normalizeApiArray(body) as IAttributeDefinition[];
        const list = raw.filter(
          (row): row is IAttributeDefinition =>
            row != null && typeof row === 'object' && !Array.isArray(row)
        );
        this.attributes = [...list].sort(
          (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
        );
        this.cdr.detectChanges();
      },
      error: () => {
        this.attributes = [];
        this.loadError =
          'Could not load attribute definitions. Check your connection and try again.';
      },
    });
  }

  trackAttrRow(index: number, attr: IAttributeDefinition): string | number {
    return attr.id != null && attr.id !== '' ? attr.id : `row-${index}`;
  }

  newAttribute(): void {
    this.router.navigate(['/reg/attributes/new']);
  }

  openAttribute(id: string | number): void {
    this.router.navigate(['/reg/attributes', id]);
  }

  removeAttribute(attr: IAttributeDefinition): void {
    const id = attr.id;
    if (id == null || id === '') {
      return;
    }
    if (
      !confirm(
        `Delete attribute "${attr.name || attr.code}"? Products using this attribute may be affected.`
      )
    ) {
      return;
    }
    this.deleteBusyId = id;
    this.attrSvc.remove(id).subscribe({
      next: () => {
        this.deleteBusyId = null;
        this.loadAttributes();
      },
      error: () => {
        this.deleteBusyId = null;
        this.loadError =
          'Could not delete this attribute. It may still be in use.';
      },
    });
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      TEXT: 'Text',
      NUMBER: 'Number',
      SELECT: 'Select',
      BOOLEAN: 'Boolean',
    };
    return labels[type] || type;
  }
}
