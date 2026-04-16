import { Component, OnInit, Input } from "@angular/core";
import { VCustomersService } from "../../../services/vendei/v-customers.service";

@Component({
  selector: "app-customer-list",
  templateUrl: "./customer-list.component.html",
  styleUrls: ["./customer-list.component.css"],
  standalone: false,
})
export class CustomerListComponent implements OnInit {
  @Input() selectCustomer: (c: any) => void;

  searchText = "";
  customers: any[] = [];
  loading = true;
  loadError = "";

  constructor(private customersSvc: VCustomersService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.loadError = "";
    this.customersSvc.getAll().subscribe({
      next: res => {
        this.loading = false;
        const raw = Array.isArray(res) ? res : [];
        this.customers = raw;
      },
      error: err => {
        this.loading = false;
        this.customers = [];
        this.loadError = "No se pudieron cargar los clientes.";
        console.error(err);
      },
    });
  }

  get filteredCustomers(): any[] {
    const q = (this.searchText || "").trim().toLowerCase();
    if (!q) {
      return this.customers;
    }
    return this.customers.filter(c => {
      const name = String(c?.name ?? "").toLowerCase();
      const code = String(c?.code ?? c?.ci ?? "").toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }

  onSelect(customer: any): void {
    if (this.selectCustomer) {
      this.selectCustomer(customer);
    }
  }
}
