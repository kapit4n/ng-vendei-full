import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IUnitOfMeasure, RUnitOfMeasureService } from '../../../services/reg/r-unit-of-measure.service';
import { normalizeApiArray } from 'src/app/utils/api-body';

@Component({
  selector: 'app-reg-unit-of-measure-list',
  templateUrl: './reg-unit-of-measure-list.component.html',
  styleUrls: ['./reg-unit-of-measure-list.component.css'],
  standalone: false,
})
export class RegUnitOfMeasureListComponent implements OnInit {
  rows: IUnitOfMeasure[] = [];
  loadError = '';

  constructor(
    private uomSvc: RUnitOfMeasureService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadError = '';
    this.uomSvc.getAll().subscribe({
      next: body => {
        const raw = normalizeApiArray(body) as IUnitOfMeasure[];
        const list = raw.filter(
          (row): row is IUnitOfMeasure =>
            row != null && typeof row === 'object' && !Array.isArray(row)
        );
        this.rows = [...list].sort((a, b) =>
          String(a?.code || '').localeCompare(String(b?.code || ''), undefined, {
            sensitivity: 'base',
          })
        );
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadError = 'Could not load units of measure.';
        this.rows = [];
        this.cdr.detectChanges();
      },
    });
  }

  trackUomRow(index: number, u: IUnitOfMeasure): string | number {
    return u.id != null && u.id !== '' ? u.id : `row-${index}`;
  }

  newUnit(): void {
    this.router.navigate(['/reg/unit-of-measures/new']);
  }

  openUnit(id: string | number): void {
    this.router.navigate(['/reg/unit-of-measures', id]);
  }
}
