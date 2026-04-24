import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IUnitOfMeasure, RUnitOfMeasureService } from '../../../services/reg/r-unit-of-measure.service';

@Component({
  selector: 'app-reg-unit-of-measure-list',
  templateUrl: './reg-unit-of-measure-list.component.html',
  styleUrls: ['./reg-unit-of-measure-list.component.css'],
  standalone: false,
})
export class RegUnitOfMeasureListComponent implements OnInit {
  rows: IUnitOfMeasure[] = [];
  loadError = '';

  constructor(private uomSvc: RUnitOfMeasureService, private router: Router) {}

  ngOnInit(): void {
    this.uomSvc.getAll().subscribe({
      next: list => {
        this.rows = Array.isArray(list) ? list : [];
      },
      error: () => {
        this.loadError = 'Could not load units of measure.';
        this.rows = [];
      },
    });
  }

  newUnit(): void {
    this.router.navigate(['/reg/unit-of-measures/new']);
  }

  openUnit(id: string | number): void {
    this.router.navigate(['/reg/unit-of-measures', id]);
  }
}
