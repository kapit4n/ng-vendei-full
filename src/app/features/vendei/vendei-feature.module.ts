import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { PosCheckoutComponent } from '../../pages/vendei/shopping-cart/pos-checkout.component';
import { PosCatalogComponent } from './product-list/pos-catalog.component';
import { PosPaymentPanelComponent } from './cal-table/pos-payment-panel.component';
import { PosTicketLinesComponent, PosTicketLineEditDialog } from './selected-list/pos-ticket-lines.component';
import { CustomersDialogComponent } from './customers-dialog/customers-dialog.component';
import { StoreProfileSelectorComponent } from './store-profile-selector/store-profile-selector.component';
import { ProfileSwitchDialogComponent } from './profile-switch-dialog/profile-switch-dialog.component';
import { VariantSelectDialogComponent } from './variant-select-dialog/variant-select-dialog.component';
import { QtyInputDialogComponent } from './product-list/qty-input-dialog.component';
import { CustomerListComponent } from './customer-list/customer-list.component';

const routes: Routes = [
  { path: '', component: PosCheckoutComponent, data: { title: 'POS Checkout' } },
];

@NgModule({
  declarations: [
    PosCheckoutComponent,
    PosCatalogComponent,
    PosPaymentPanelComponent,
    PosTicketLinesComponent,
    PosTicketLineEditDialog,
    CustomersDialogComponent,
    StoreProfileSelectorComponent,
    ProfileSwitchDialogComponent,
    VariantSelectDialogComponent,
    QtyInputDialogComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTabsModule,
    MatTooltipModule,
    CustomerListComponent,
  ],
})
export class VendeiFeatureModule {}
