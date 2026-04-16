import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { RCustomerService } from "../../../services/reg/r-customer.service";

export interface CustomersDialogData {
  /** Called when a customer is chosen or created (already bound to parent). */
  selectCustomer: (c: any) => void;
}

@Component({
  selector: "app-customers-dialog",
  templateUrl: "./customers-dialog.component.html",
  styleUrls: ["./customers-dialog.component.css"],
  standalone: false,
})
export class CustomersDialogComponent implements OnInit {
  selectedTabIndex = 0;

  newName = "";
  newCode = "";
  newAddress = "";
  saving = false;
  saveError = "";

  constructor(
    public dialogRef: MatDialogRef<CustomersDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: CustomersDialogData,
    private customerReg: RCustomerService
  ) {}

  ngOnInit(): void {}

  /** Stable callback for `app-customer-list` (avoid `bind` in template each CD). */
  readonly selectCustomerFromList = (c: any) => this.pickCustomer(c);

  /** Map API/test fields to what the POS ticket expects (ci for display). */
  private normalizeCustomer(c: any): any {
    if (!c) {
      return c;
    }
    return {
      ...c,
      ci: c.ci ?? c.code ?? "",
    };
  }

  pickCustomer(c: any): void {
    if (this.data?.selectCustomer) {
      this.data.selectCustomer(this.normalizeCustomer(c));
    }
    this.dialogRef.close(c);
  }

  saveNewCustomer(): void {
    const name = (this.newName || "").trim();
    const code = (this.newCode || "").trim();
    if (!name || !code) {
      this.saveError = "Nombre y CI / código son obligatorios.";
      return;
    }
    this.saveError = "";
    this.saving = true;
    const payload = {
      name,
      code,
      address: (this.newAddress || "").trim(),
      img: "",
    };
    this.customerReg.save(payload).subscribe({
      next: created => {
        this.saving = false;
        const row =
          created && typeof created === "object" && created !== null && "id" in created
            ? created
            : { ...payload, id: (created as string | number | undefined) ?? "" };
        this.pickCustomer(row);
      },
      error: err => {
        this.saving = false;
        this.saveError =
          err?.error?.message || err?.message || "No se pudo guardar el cliente.";
        console.error(err);
      },
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}
