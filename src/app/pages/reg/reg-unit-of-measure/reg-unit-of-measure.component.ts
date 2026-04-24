import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IUnitOfMeasure, RUnitOfMeasureService } from '../../../services/reg/r-unit-of-measure.service';

@Component({
  selector: 'app-reg-unit-of-measure',
  templateUrl: './reg-unit-of-measure.component.html',
  styleUrls: ['./reg-unit-of-measure.component.css'],
  standalone: false,
})
export class RegUnitOfMeasureComponent implements OnInit {
  info: IUnitOfMeasure = { id: '', code: '', name: '' };
  saveError = '';

  constructor(
    private uomSvc: RUnitOfMeasureService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  get isNew(): boolean {
    return this.route.snapshot.paramMap.get('id') === 'new';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.uomSvc.getById(id).subscribe({
        next: row => {
          this.info = { ...row, id: row.id as string };
        },
        error: () => {
          this.saveError = 'Could not load this unit.';
        },
      });
    }
  }

  save(): void {
    this.saveError = '';
    const code = (this.info.code || '').trim().toUpperCase();
    const name = (this.info.name || '').trim();
    if (!code) {
      this.saveError = 'Code is required (e.g. KG, BOX).';
      return;
    }
    if (!name) {
      this.saveError = 'Display name is required.';
      return;
    }
    const onErr = () => {
      this.saveError = 'Could not save. Check that the code is unique.';
    };
    if (this.isNew) {
      this.uomSvc.save({ code, name }).subscribe({
        next: () => this.router.navigate(['/reg/unit-of-measures']),
        error: onErr,
      });
    } else {
      this.uomSvc.update({ id: this.info.id, code, name }).subscribe({
        next: () => this.router.navigate(['/reg/unit-of-measures']),
        error: onErr,
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/reg/unit-of-measures']);
  }
}
