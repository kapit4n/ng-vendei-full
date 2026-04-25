import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ICustomer, RCustomerService } from '../../../services/reg/r-customer.service';
import { normalizeApiArray } from 'src/app/utils/api-body';

@Component({
  selector: 'app-reg-customer-list',
  templateUrl: './reg-customer-list.component.html',
  styleUrls: ['./reg-customer-list.component.css'],
  standalone: false,
})
export class RegCustomerListComponent implements OnInit {
  customers: ICustomer[] = [];
  loadError = '';
  deleteBusyId: string | number | null = null;

  constructor(
    private customerSvc: RCustomerService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loadError = '';
    this.customerSvc.getAll().subscribe({
      next: body => {
        const raw = normalizeApiArray(body) as ICustomer[];
        const list = raw.filter(
          (row): row is ICustomer =>
            row != null && typeof row === 'object' && !Array.isArray(row)
        );
        this.customers = [...list].sort((a, b) =>
          String(a?.name || '').localeCompare(String(b?.name || ''), undefined, {
            sensitivity: 'base',
          })
        );
        this.cdr.detectChanges();
      },
      error: () => {
        this.customers = [];
        this.loadError = 'Could not load customers. Check your connection and try again.';
        this.cdr.detectChanges();
      },
    });
  }

  trackCustomerRow(index: number, c: ICustomer): string | number {
    return c.id != null && c.id !== '' ? c.id : `row-${index}`;
  }

  newCustomer(): void {
    this.router.navigate(['/reg/customers/new']);
  }

  openCustomer(id: string | number): void {
    this.router.navigate(['/reg/customers', id]);
  }

  removeCustomer(c: ICustomer): void {
    const id = c.id;
    if (id == null || id === '') {
      return;
    }
    if (
      !confirm(
        `Delete customer “${c.name || c.code}”? Orders linked to this client may prevent delete.`
      )
    ) {
      return;
    }
    this.deleteBusyId = id;
    this.customerSvc.remove(id).subscribe({
      next: () => {
        this.deleteBusyId = null;
        this.loadCustomers();
      },
      error: () => {
        this.deleteBusyId = null;
        this.loadError = 'Could not delete this customer. It may still be in use.';
        this.cdr.detectChanges();
      },
    });
  }
}
