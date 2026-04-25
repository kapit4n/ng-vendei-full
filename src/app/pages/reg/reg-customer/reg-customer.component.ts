import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ICustomer, RCustomerService } from '../../../services/reg/r-customer.service';
import { normalizeApiRecord } from 'src/app/utils/api-body';

@Component({
  selector: 'app-reg-customer',
  templateUrl: './reg-customer.component.html',
  styleUrls: ['./reg-customer.component.css'],
  standalone: false,
})
export class RegCustomerComponent implements OnInit {
  customerInfo: ICustomer;
  saveError = '';
  loadError = '';

  constructor(
    private customerSvc: RCustomerService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {
    this.customerInfo = {
      name: '',
      code: '',
      address: '',
    };
  }

  get isNew(): boolean {
    return !this.route.snapshot.paramMap.get('id');
  }

  get pageTitle(): string {
    return this.isNew ? 'New customer' : 'Edit customer';
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.customerSvc
      .getById(id)
      .pipe(catchError(() => of(null)))
      .subscribe(raw => {
        const row = normalizeApiRecord(raw) as ICustomer | null;
        if (row && typeof row === 'object') {
          this.customerInfo = {
            ...row,
            id: row.id,
            name: (row.name || '').trim(),
            code: (row.code || '').trim(),
            address: (row.address || '').trim(),
          };
        } else {
          this.loadError = 'Could not load this customer.';
        }
        this.cdr.detectChanges();
      });
  }

  save(): void {
    this.saveError = '';
    const name = (this.customerInfo.name || '').trim();
    const code = (this.customerInfo.code || '').trim();
    const address = (this.customerInfo.address || '').trim();

    if (!name) {
      this.saveError = 'Customer name is required.';
      return;
    }
    if (!code) {
      this.saveError = 'Customer code is required.';
      return;
    }

    const payload: ICustomer = { name, code, address };

    const onErr = () => {
      this.saveError = 'Could not save. Check your connection and try again.';
    };

    if (this.isNew) {
      this.customerSvc.save(payload).subscribe({
        next: () => this.router.navigate(['/reg/customers']),
        error: onErr,
      });
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.saveError = 'Missing customer id.';
      return;
    }
    this.customerSvc.update({ ...payload, id }).subscribe({
      next: () => this.router.navigate(['/reg/customers']),
      error: onErr,
    });
  }

  cancel(): void {
    this.router.navigate(['/reg/customers']);
  }
}
