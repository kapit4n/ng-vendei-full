import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { RepProductsComponent } from '../../pages/rep/rep-products/rep-products.component';
import { RepSellsComponent } from '../../pages/rep/rep-sells/rep-sells.component';
import { RepDailySalesComponent } from '../../pages/rep/rep-daily-sales/rep-daily-sales.component';
import { RepOrdersComponent } from '../../pages/rep/rep-orders/rep-orders.component';
import { RepSellsByOrderComponent } from '../../pages/rep/rep-sells-by-order/rep-sells-by-order.component';
import { RepSellsByProductComponent } from '../../pages/rep/rep-sells-by-product/rep-sells-by-product.component';

const routes: Routes = [
  { path: 'products', component: RepProductsComponent, data: { breadcrumb: 'Rep Products' } },
  { path: 'sells', component: RepSellsComponent, data: { breadcrumb: 'Rep Sells' } },
  { path: 'daily-sales', component: RepDailySalesComponent, data: { breadcrumb: 'Daily Sales' } },
];

@NgModule({
  declarations: [
    RepProductsComponent,
    RepSellsComponent,
    RepDailySalesComponent,
    RepOrdersComponent,
    RepSellsByOrderComponent,
    RepSellsByProductComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
  ],
})
export class RepFeatureModule {}
