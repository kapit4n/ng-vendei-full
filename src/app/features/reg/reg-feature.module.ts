import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';

import { RegProductComponent } from '../../pages/reg/reg-product/reg-product.component';
import { RegProductPresentationComponent } from '../../pages/reg/reg-product-presentation/reg-product-presentation.component';
import { RegCategoryComponent } from '../../pages/reg/reg-category/reg-category.component';
import { RegCategoryListComponent } from '../../pages/reg/reg-category-list/reg-category-list.component';
import { RegProductListComponent } from '../../pages/reg/reg-product-list/reg-product-list.component';
import { RegProductShowComponent } from '../../pages/reg/reg-product-show/reg-product-show.component';
import { RegCustomerComponent } from '../../pages/reg/reg-customer/reg-customer.component';
import { RegCustomerListComponent } from '../../pages/reg/reg-customer-list/reg-customer-list.component';
import { RegUnitOfMeasureListComponent } from '../../pages/reg/reg-unit-of-measure-list/reg-unit-of-measure-list.component';
import { RegUnitOfMeasureComponent } from '../../pages/reg/reg-unit-of-measure/reg-unit-of-measure.component';
import { CatalogTemplatesComponent } from '../../pages/reg/catalog-templates/catalog-templates.component';
import { RegAttributeListComponent } from '../../pages/reg/reg-attribute-list/reg-attribute-list.component';
import { RegAttributeComponent } from '../../pages/reg/reg-attribute/reg-attribute.component';
import { RegProductQuickEditComponent } from '../../pages/reg/reg-product-quick-edit/reg-product-quick-edit.component';

const routes: Routes = [
  { path: 'products', component: RegProductListComponent, data: { breadcrumb: 'Product List' } },
  { path: 'products/new', component: RegProductComponent, data: { breadcrumb: 'Register Product' } },
  { path: 'products/view/:id', component: RegProductShowComponent, data: { breadcrumb: 'Product' } },
  { path: 'products/:id', component: RegProductComponent, data: { breadcrumb: 'Update Product' } },
  { path: 'productPresentations/new', component: RegProductPresentationComponent, data: { breadcrumb: 'Register Product Presentation' } },
  { path: 'productPresentations/:id', component: RegProductPresentationComponent, data: { breadcrumb: 'Update Product Presentation' } },
  { path: 'categories', component: RegCategoryListComponent, data: { breadcrumb: 'List Category' } },
  { path: 'categories/new', component: RegCategoryComponent, data: { breadcrumb: 'New category' } },
  { path: 'categories/:id', component: RegCategoryComponent, data: { breadcrumb: 'Edit category' } },
  { path: 'unit-of-measures', component: RegUnitOfMeasureListComponent, data: { breadcrumb: 'Units of measure' } },
  { path: 'unit-of-measures/:id', component: RegUnitOfMeasureComponent, data: { breadcrumb: 'Unit of measure' } },
  { path: 'templates', component: CatalogTemplatesComponent, data: { title: 'Catalog Templates' } },
  { path: 'attributes', component: RegAttributeListComponent, data: { breadcrumb: 'Product Attributes' } },
  { path: 'attributes/new', component: RegAttributeComponent, data: { breadcrumb: 'New Attribute' } },
  { path: 'attributes/:id', component: RegAttributeComponent, data: { breadcrumb: 'Edit Attribute' } },
  { path: 'customers', component: RegCustomerListComponent, data: { breadcrumb: 'List Customer' } },
  { path: 'customers/new', component: RegCustomerComponent, data: { breadcrumb: 'New customer' } },
  { path: 'customers/:id', component: RegCustomerComponent, data: { breadcrumb: 'Edit customer' } },
];

@NgModule({
  declarations: [
    RegProductComponent,
    RegProductPresentationComponent,
    RegCategoryComponent,
    RegCategoryListComponent,
    RegProductListComponent,
    RegProductShowComponent,
    RegCustomerComponent,
    RegCustomerListComponent,
    RegUnitOfMeasureListComponent,
    RegUnitOfMeasureComponent,
    CatalogTemplatesComponent,
    RegAttributeListComponent,
    RegAttributeComponent,
    RegProductQuickEditComponent,
  ],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTabsModule,
  ],
})
export class RegFeatureModule {}
