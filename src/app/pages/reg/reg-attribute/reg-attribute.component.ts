import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import {
  IAttributeDefinition,
  RAttributeDefinitionService,
} from '../../../services/reg/r-attribute-definition.service';
import { VStoreProfileService } from '../../../services/vendei/v-store-profile.service';
import { normalizeApiRecord } from 'src/app/utils/api-body';

@Component({
  selector: 'app-reg-attribute',
  templateUrl: './reg-attribute.component.html',
  styleUrls: ['./reg-attribute.component.css'],
  standalone: false,
})
export class RegAttributeComponent implements OnInit {
  attrInfo: IAttributeDefinition;
  saveError = '';
  loadError = '';
  optionsInput = '';

  attributeTypes = [
    { value: 'TEXT', label: 'Text' },
    { value: 'NUMBER', label: 'Number' },
    { value: 'SELECT', label: 'Select (dropdown)' },
    { value: 'BOOLEAN', label: 'Boolean (yes/no)' },
  ];

  constructor(
    private attrSvc: RAttributeDefinitionService,
    private profileSvc: VStoreProfileService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.attrInfo = this.emptyAttr();
  }

  get isNew(): boolean {
    return !this.route.snapshot.paramMap.get('id');
  }

  get pageTitle(): string {
    return this.isNew ? 'New attribute' : 'Edit attribute';
  }

  get isSelectType(): boolean {
    return this.attrInfo.type === 'SELECT';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.attrSvc
      .getById(id)
      .pipe(catchError(() => of(null)))
      .subscribe((raw) => {
        const row = normalizeApiRecord(raw) as IAttributeDefinition | null;
        if (row && typeof row === 'object') {
          this.attrInfo = {
            ...row,
            id: row.id,
            storeProfileId: row.storeProfileId,
            name: (row.name || '').trim(),
            code: (row.code || '').trim(),
            type: row.type || 'TEXT',
            options: Array.isArray(row.options) ? row.options : [],
            required: !!row.required,
            active: row.active !== false,
            sortOrder: row.sortOrder || 0,
          };
          this.optionsInput = (row.options || []).join(', ');
        } else {
          this.loadError = 'Could not load this attribute definition.';
        }
        this.cdr.detectChanges();
      });
  }

  save(): void {
    this.saveError = '';
    const name = (this.attrInfo.name || '').trim();
    const code = (this.attrInfo.code || '').trim();

    if (!name) {
      this.saveError = 'Attribute name is required.';
      return;
    }
    if (!code) {
      this.saveError = 'Attribute code is required.';
      return;
    }

    const storeProfileId =
      this.attrInfo.storeProfileId || this.profileSvc.getActiveProfileId() || 1;

    const options =
      this.attrInfo.type === 'SELECT'
        ? this.parseOptions(this.optionsInput)
        : [];

    const payload = {
      storeProfileId,
      name,
      code: code.toUpperCase(),
      type: this.attrInfo.type,
      options,
      required: this.attrInfo.required,
      active: this.attrInfo.active,
      sortOrder: this.attrInfo.sortOrder,
    };

    const onErr = () => {
      this.saveError =
        'Could not save. Check your connection and try again.';
    };

    if (this.isNew) {
      this.attrSvc.save(payload).subscribe({
        next: () => this.router.navigate(['/reg/attributes']),
        error: onErr,
      });
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.saveError = 'Missing attribute id.';
      return;
    }
    this.attrSvc.update({ ...payload, id }).subscribe({
      next: () => this.router.navigate(['/reg/attributes']),
      error: onErr,
    });
  }

  cancel(): void {
    this.router.navigate(['/reg/attributes']);
  }

  onTypeChange(): void {
    if (this.attrInfo.type !== 'SELECT') {
      this.optionsInput = '';
    }
  }

  private parseOptions(raw: string): string[] {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  private emptyAttr(): IAttributeDefinition {
    return {
      storeProfileId: 0,
      name: '',
      code: '',
      type: 'TEXT',
      options: [],
      required: false,
      active: true,
      sortOrder: 0,
    };
  }
}
