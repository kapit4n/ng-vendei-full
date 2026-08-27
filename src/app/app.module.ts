import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { apiInterceptor } from "./interceptors/api.interceptor";
import { FormsModule } from "@angular/forms";
import { ReactiveFormsModule } from "@angular/forms";
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from './app.component';
import { LoginComponent } from './components/auth/login/login.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';

import { PageNotFoundComponent } from './pages/vendei/page-not-found/page-not-found.component';
import { MainScreenshotComponent } from './pages/vendei/main-screenshot/main-screenshot.component';
import { MainComponent } from "./pages/main/main.component";
import { BackendApiPageComponent } from "./pages/tools/backend-api-page/backend-api-page.component";
import { CustomerListComponent } from './features/vendei/customer-list/customer-list.component';

// ang pages
import { AngQuestionsComponent } from "./pages/ang/ang-questions/ang-questions.component";
import { AngQuestionFormComponent } from "./pages/ang/ang-question-form/ang-question-form.component";
import { AngExamsComponent } from "./pages/ang/ang-exams/ang-exams.component";
import { AngExamFormComponent } from "./pages/ang/ang-exam-form/ang-exam-form.component";
import { AngExamTakeComponent } from "./pages/ang/ang-exam-take/ang-exam-take.component";
import { AngExamResultComponent } from "./pages/ang/ang-exam-result/ang-exam-result.component";
import { AngFeaturesGuideComponent } from "./pages/ang/ang-features-guide/ang-features-guide.component";
import { InvProductsComponent } from "./pages/inv/inv-products/inv-products.component";
import { InvProductsInvComponent } from "./pages/inv/inv-products-inv/inv-products-inv.component";

// ang services
import { AngQuestionService } from "./services/ang/ang-question.service";
import { AngExamService } from "./services/ang/ang-exam.service";

const appRoutes: Routes = [
  {
    path: '',
    loadChildren: () => import('./features/vendei/vendei-feature.module').then(m => m.VendeiFeatureModule),
  },
  {
    path: 'main',
    component: MainComponent,
    data: { title: 'Main' }
  },
  {
    path: 'tools/backend-api',
    component: BackendApiPageComponent,
    data: { title: 'Backend API' }
  },
  {
    path: 'customers',
    component: CustomerListComponent,
    data: { title: 'Customers' }
  },
  {
    path: 'reg',
    loadChildren: () => import('./features/reg/reg-feature.module').then(m => m.RegFeatureModule),
  },
  {
    path: 'inv/products',
    component: InvProductsComponent,
    data: { breadcrumb: 'Inv Products' }
  },
  {
    path: 'inv/products/:id',
    component: InvProductsInvComponent,
    data: { breadcrumb: 'Inv Products' }
  },
  {
    path: 'rep',
    loadChildren: () => import('./features/rep/rep-feature.module').then(m => m.RepFeatureModule),
  },
  // Angular exams module
  {
    path: 'angular/questions',
    component: AngQuestionsComponent,
    data: { title: 'Angular Questions' }
  },
  {
    path: 'angular/questions/new',
    component: AngQuestionFormComponent,
    data: { title: 'New Question' }
  },
  {
    path: 'angular/questions/:id',
    component: AngQuestionFormComponent,
    data: { title: 'Edit Question' }
  },
  {
    path: 'angular/exams',
    component: AngExamsComponent,
    data: { title: 'Angular Exams' }
  },
  {
    path: 'angular/exams/new',
    component: AngExamFormComponent,
    data: { title: 'New Exam' }
  },
  {
    path: 'angular/exams/take/:id',
    component: AngExamTakeComponent,
    data: { title: 'Take Exam' }
  },
  {
    path: 'angular/exams/result/:id',
    component: AngExamResultComponent,
    data: { title: 'Exam Result' }
  },
  {
    path: 'angular/guide',
    component: AngFeaturesGuideComponent,
    data: { title: 'Angular Features Guide' }
  },
  { path: '**', component: PageNotFoundComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    MainComponent,
    BackendApiPageComponent,
    PageNotFoundComponent,
    MainScreenshotComponent,
    AngQuestionsComponent,
    AngQuestionFormComponent,
    AngExamsComponent,
    AngExamFormComponent,
    AngExamTakeComponent,
    AngExamResultComponent,
    AngFeaturesGuideComponent,
    InvProductsComponent,
    InvProductsInvComponent,
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    CustomerListComponent,
  ],
  providers: [
    AngQuestionService,
    AngExamService,
    provideHttpClient(withInterceptors([apiInterceptor])),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
