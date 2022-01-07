import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { ReactiveFormsModule } from "@angular/forms";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/auth/login/login.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatButtonModule, MatCheckboxModule } from '@angular/material';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';


import { PageNotFoundComponent } from './pages/vendei/page-not-found/page-not-found.component';
import { MainScreenshotComponent } from './pages/vendei/main-screenshot/main-screenshot.component';
import { ShoppingCartComponent, PaymentEditDialog } from './pages/vendei/shopping-cart/shopping-cart.component';
import { MainComponent } from "./pages/main/main.component";

//reg pages
import { RCustomerService } from "./services/reg/r-customer.service";
import { RegProductComponent } from "./pages/reg/reg-product/reg-product.component";
import { RegProductPresentationComponent } from "./pages/reg/reg-product-presentation/reg-product-presentation.component";
import { RegCategoryComponent } from "./pages/reg/reg-category/reg-category.component";
import { RegCategoryListComponent } from "./pages/reg/reg-category-list/reg-category-list.component";
import { RegProductListComponent } from "./pages/reg/reg-product-list/reg-product-list.component";
import { RegCustomerComponent } from "./pages/reg/reg-customer/reg-customer.component";
import { RegCustomerListComponent } from "./pages/reg/reg-customer-list/reg-customer-list.component";
// inv pages
import { InvProductsComponent } from "./pages/inv/inv-products/inv-products.component";
import { InvProductsInvComponent } from "./pages/inv/inv-products-inv/inv-products-inv.component";
// rep pages
import { RepProductsComponent } from "./pages/rep/rep-products/rep-products.component";
import { RepSellsComponent } from "./pages/rep/rep-sells/rep-sells.component";
import { RepSellsByOrderComponent } from "./pages/rep/rep-sells-by-order/rep-sells-by-order.component";
import { RepSellsByProductComponent } from "./pages/rep/rep-sells-by-product/rep-sells-by-product.component";
import { RepOrdersComponent } from "./pages/rep/rep-orders/rep-orders.component";


import { ProductListComponent } from './comp/vendei/product-list/product-list.component';
import { CategoryListComponent } from "./comp/vendei/category-list/category-list.component";
import { CalTableComponent } from './comp/vendei/cal-table/cal-table.component';
import { SelectedListComponent, SelectedProductEditDialog } from './comp/vendei/selected-list/selected-list.component';
import { CustomerListComponent } from './comp/vendei/customer-list/customer-list.component';
import { CustomersDialogComponent } from './comp/vendei/customers-dialog/customers-dialog.component';
// reg comp

import { VProductsService } from './services/vendei/v-products.service';
import { VCustomersService } from './services/vendei/v-customers.service';
import { VConfigService } from './services/vendei/v-config.service';
// reg services
import { RProductService } from "./services/reg/r-product.service";
import { RProductPresentationService } from "./services/reg/r-product-presentation.service";
import { RCategoryService } from "./services/reg/r-category.service";
import { RConfigService } from "./services/reg/r-config.service";
// inv services
import { IConfigService } from './services/inv/i-config.service';
import { IProductsService } from './services/inv/i-products.service';
// rep services
import { RepConfigService } from "./services/rep/rep-config.service";
import { RepProductsService } from "./services/rep/rep-products.service";
import { RepSellsService } from "./services/rep/rep-sells.service";

const appRoutes: Routes = [
  { path: "mock", component: MainScreenshotComponent },
  {
    path: "",
    component: ShoppingCartComponent,
    data: { title: "Shopping Cart" }
  },
  {
    path: "main",
    component: MainComponent,
    data: { title: "Main" }
  },
  {
    path: "customers",
    component: CustomerListComponent,
    data: { title: "Customers" }
  },
  {
    path: "reg/products",
    component: RegProductListComponent,
    data: { breadcrumb: "Product List" }
  },
  {
    path: "reg/products/new",
    component: RegProductComponent,
    data: { breadcrumb: "Register Product" }
  },
  {
    path: "reg/products/:id",
    component: RegProductComponent,
    data: { breadcrumb: "Update Product" }
  },
  {
    path: "reg/productPresentations/new",
    component: RegProductPresentationComponent,
    data: { breadcrumb: "Register Product Presentation" }
  },
  {
    path: "reg/productPresentations/:id",
    component: RegProductPresentationComponent,
    data: { breadcrumb: "Update Product Presentation" }
  },
  {
    path: "reg/categories",
    component: RegCategoryListComponent,
    data: { breadcrumb: "List Category" }
  },
  {
    path: "reg/categories/:id",
    component: RegCategoryComponent,
    data: { breadcrumb: "Register Category" }
  },
  {
    path: "reg/customers",
    component: RegCustomerListComponent,
    data: { breadcrumb: "List Customer" }
  },
  {
    path: "reg/customers/:id",
    component: RegCustomerComponent,
    data: { breadcrumb: "Register Customer" }
  },
  {
    path: "inv/products",
    component: InvProductsComponent,
    data: { breadcrumb: "Inv Products" }
  },
  {
    path: "inv/products/:id",
    component: InvProductsInvComponent,
    data: { breadcrumb: "Inv Products" }
  },
  {
    path: "rep/products",
    component: RepProductsComponent,
    data: { breadcrumb: "Rep Products" }
  },
  {
    path: "rep/sells",
    component: RepSellsComponent,
    data: { breadcrumb: "Rep Sells" }
  },
  {
    path: "",
    redirectTo: "/",
    pathMatch: "full"
  },
  { path: "**", component: PageNotFoundComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ProductListComponent,
    CategoryListComponent,
    MainScreenshotComponent,
    PageNotFoundComponent,
    ShoppingCartComponent,
    PaymentEditDialog,
    CalTableComponent,
    SelectedListComponent,
    SelectedProductEditDialog,
    CustomerListComponent,
    CustomersDialogComponent,
    RegProductComponent,
    RegProductPresentationComponent,
    RegCategoryComponent,
    RegCategoryListComponent,
    RegProductListComponent,
    RegCustomerComponent,
    RegCustomerListComponent,
    InvProductsComponent,
    InvProductsInvComponent,
    RepProductsComponent,
    RepSellsComponent,
    RepOrdersComponent,
    RepSellsByOrderComponent,
    RepSellsByProductComponent,
    MainComponent
  ],
  imports: [
    RouterModule.forRoot(appRoutes, { enableTracing: true }),
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatInputModule,
    MatGridListModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    MatDialogModule,
    FormsModule,
    NgbModule,
    ReactiveFormsModule
  ],
  providers: [
    VProductsService,
    VCustomersService,
    VConfigService,
    RProductService,
    RProductPresentationService,
    RCategoryService,
    RConfigService,
    RCustomerService,
    IConfigService,
    IProductsService,
    RepConfigService, 
    RepProductsService, 
    RepSellsService
  ],
  bootstrap: [AppComponent],
  entryComponents: [PaymentEditDialog, SelectedProductEditDialog, CustomersDialogComponent]
})
export class AppModule {}
