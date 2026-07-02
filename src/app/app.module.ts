import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { provideHttpClient } from "@angular/common/http";
import { FormsModule } from "@angular/forms";
import { ReactiveFormsModule } from "@angular/forms";
//import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/auth/login/login.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule} from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatRadioModule } from '@angular/material/radio';
import { ClipboardModule } from '@angular/cdk/clipboard';


import { PageNotFoundComponent } from './pages/vendei/page-not-found/page-not-found.component';
import { MainScreenshotComponent } from './pages/vendei/main-screenshot/main-screenshot.component';
import { PosCheckoutComponent } from './pages/vendei/shopping-cart/pos-checkout.component';
import { MainComponent } from "./pages/main/main.component";

//reg pages
import { RCustomerService } from "./services/reg/r-customer.service";
import { RegProductComponent } from "./pages/reg/reg-product/reg-product.component";
import { RegProductPresentationComponent } from "./pages/reg/reg-product-presentation/reg-product-presentation.component";
import { RegCategoryComponent } from "./pages/reg/reg-category/reg-category.component";
import { RegCategoryListComponent } from "./pages/reg/reg-category-list/reg-category-list.component";
import { RegProductListComponent } from "./pages/reg/reg-product-list/reg-product-list.component";
import { RegProductShowComponent } from "./pages/reg/reg-product-show/reg-product-show.component";
import { RegCustomerComponent } from "./pages/reg/reg-customer/reg-customer.component";
import { RegCustomerListComponent } from "./pages/reg/reg-customer-list/reg-customer-list.component";
import { RegUnitOfMeasureListComponent } from "./pages/reg/reg-unit-of-measure-list/reg-unit-of-measure-list.component";
import { RegUnitOfMeasureComponent } from "./pages/reg/reg-unit-of-measure/reg-unit-of-measure.component";
// inv pages
import { InvProductsComponent } from "./pages/inv/inv-products/inv-products.component";
import { InvProductsInvComponent } from "./pages/inv/inv-products-inv/inv-products-inv.component";
// rep pages
import { RepProductsComponent } from "./pages/rep/rep-products/rep-products.component";
import { RepSellsComponent } from "./pages/rep/rep-sells/rep-sells.component";
import { RepSellsByOrderComponent } from "./pages/rep/rep-sells-by-order/rep-sells-by-order.component";
import { RepSellsByProductComponent } from "./pages/rep/rep-sells-by-product/rep-sells-by-product.component";
import { RepOrdersComponent } from "./pages/rep/rep-orders/rep-orders.component";
import { RepDailySalesComponent } from "./pages/rep/rep-daily-sales/rep-daily-sales.component";
import { BackendApiPageComponent } from "./pages/tools/backend-api-page/backend-api-page.component";

// ang pages
import { AngQuestionsComponent } from "./pages/ang/ang-questions/ang-questions.component";
import { AngQuestionFormComponent } from "./pages/ang/ang-question-form/ang-question-form.component";
import { AngExamsComponent } from "./pages/ang/ang-exams/ang-exams.component";
import { AngExamFormComponent } from "./pages/ang/ang-exam-form/ang-exam-form.component";
import { AngExamTakeComponent } from "./pages/ang/ang-exam-take/ang-exam-take.component";
import { AngExamResultComponent } from "./pages/ang/ang-exam-result/ang-exam-result.component";
import { AngFeaturesGuideComponent } from "./pages/ang/ang-features-guide/ang-features-guide.component";


import { PosCatalogComponent } from './features/vendei/product-list/pos-catalog.component';
import { PosPaymentPanelComponent } from './features/vendei/cal-table/pos-payment-panel.component';
import { PosTicketLinesComponent, PosTicketLineEditDialog } from './features/vendei/selected-list/pos-ticket-lines.component';
import { CustomerListComponent } from './features/vendei/customer-list/customer-list.component';
import { CustomersDialogComponent } from './features/vendei/customers-dialog/customers-dialog.component';
// reg comp

import { VProductsService } from './services/vendei/v-products.service';
import { VCustomersService } from './services/vendei/v-customers.service';
import { VConfigService } from './services/vendei/v-config.service';
// reg services
import { RProductService } from "./services/reg/r-product.service";
import { RProductPresentationService } from "./services/reg/r-product-presentation.service";
import { RCategoryService } from "./services/reg/r-category.service";
import { RUnitOfMeasureService } from "./services/reg/r-unit-of-measure.service";
import { RConfigService } from "./services/reg/r-config.service";
// inv services
import { IConfigService } from './services/inv/i-config.service';
import { IProductsService } from './services/inv/i-products.service';
// rep services
import { RepConfigService } from "./services/rep/rep-config.service";
// ang services
import { AngQuestionService } from "./services/ang/ang-question.service";
import { AngExamService } from "./services/ang/ang-exam.service";
import { RepProductsService } from "./services/rep/rep-products.service";
import { RepSellsService } from "./services/rep/rep-sells.service";

const appRoutes: Routes = [
  { path: "mock", component: MainScreenshotComponent },
  {
    path: "",
    component: PosCheckoutComponent,
    data: { title: "POS Checkout" }
  },
  {
    path: "main",
    component: MainComponent,
    data: { title: "Main" }
  },
  {
    path: "tools/backend-api",
    component: BackendApiPageComponent,
    data: { title: "Backend API" }
  },
  {
    path: "customers",
    component: RegCustomerListComponent,
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
    path: "reg/products/view/:id",
    component: RegProductShowComponent,
    data: { breadcrumb: "Product" }
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
    path: "reg/categories/new",
    component: RegCategoryComponent,
    data: { breadcrumb: "New category" }
  },
  {
    path: "reg/categories/:id",
    component: RegCategoryComponent,
    data: { breadcrumb: "Edit category" }
  },
  {
    path: "reg/unit-of-measures",
    component: RegUnitOfMeasureListComponent,
    data: { breadcrumb: "Units of measure" }
  },
  {
    path: "reg/unit-of-measures/:id",
    component: RegUnitOfMeasureComponent,
    data: { breadcrumb: "Unit of measure" }
  },
  {
    path: "reg/customers",
    component: RegCustomerListComponent,
    data: { breadcrumb: "List Customer" }
  },
  {
    path: "reg/customers/new",
    component: RegCustomerComponent,
    data: { breadcrumb: "New customer" }
  },
  {
    path: "reg/customers/:id",
    component: RegCustomerComponent,
    data: { breadcrumb: "Edit customer" }
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
    path: "rep/daily-sales",
    component: RepDailySalesComponent,
    data: { breadcrumb: "Daily Sales" }
  },
  // Angular exams module
  {
    path: "angular/questions",
    component: AngQuestionsComponent,
    data: { title: "Angular Questions" }
  },
  {
    path: "angular/questions/new",
    component: AngQuestionFormComponent,
    data: { title: "New Question" }
  },
  {
    path: "angular/questions/:id",
    component: AngQuestionFormComponent,
    data: { title: "Edit Question" }
  },
  {
    path: "angular/exams",
    component: AngExamsComponent,
    data: { title: "Angular Exams" }
  },
  {
    path: "angular/exams/new",
    component: AngExamFormComponent,
    data: { title: "New Exam" }
  },
  {
    path: "angular/exams/take/:id",
    component: AngExamTakeComponent,
    data: { title: "Take Exam" }
  },
  {
    path: "angular/exams/result/:id",
    component: AngExamResultComponent,
    data: { title: "Exam Result" }
  },
  {
    path: "angular/guide",
    component: AngFeaturesGuideComponent,
    data: { title: "Angular Features Guide" }
  },
  { path: "**", component: PageNotFoundComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    PosCatalogComponent,
    MainScreenshotComponent,
    PageNotFoundComponent,
    PosCheckoutComponent,
    PosPaymentPanelComponent,
    PosTicketLinesComponent,
    PosTicketLineEditDialog,
    CustomerListComponent,
    CustomersDialogComponent,
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
    InvProductsComponent,
    InvProductsInvComponent,
    RepProductsComponent,
    RepSellsComponent,
    RepOrdersComponent,
    RepSellsByOrderComponent,
    RepSellsByProductComponent,
    RepDailySalesComponent,
    MainComponent,
    BackendApiPageComponent,
    AngQuestionsComponent,
    AngQuestionFormComponent,
    AngExamsComponent,
    AngExamFormComponent,
    AngExamTakeComponent,
    AngExamResultComponent,
    AngFeaturesGuideComponent,
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    BrowserModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatTooltipModule,
    MatTabsModule,
    MatSelectModule,
    MatGridListModule,
    MatIconModule,
    MatListModule,
    MatTableModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatRadioModule,
    ClipboardModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  providers: [
    VProductsService,
    VCustomersService,
    VConfigService,
    RProductService,
    RProductPresentationService,
    RCategoryService,
    RUnitOfMeasureService,
    RConfigService,
    RCustomerService,
    IConfigService,
    IProductsService,
    RepConfigService,
    RepProductsService,
    RepSellsService,
    AngQuestionService,
    AngExamService,
    provideHttpClient(),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
