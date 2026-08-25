import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RegCategoryListComponent } from './reg-category-list.component';
import { RCategoryService } from '../../../services/reg/r-category.service';

describe('RegCategoryListComponent', () => {
  let component: RegCategoryListComponent;
  let fixture: ComponentFixture<RegCategoryListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      declarations: [RegCategoryListComponent],
      providers: [
        { provide: RCategoryService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegCategoryListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
