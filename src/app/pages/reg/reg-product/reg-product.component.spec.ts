import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RegProductComponent } from './reg-product.component';
import { RProductService } from '../../../services/reg/r-product.service';
import { RCategoryService } from '../../../services/reg/r-category.service';
import { RUnitOfMeasureService } from '../../../services/reg/r-unit-of-measure.service';

describe('RegProductComponent', () => {
  let component: RegProductComponent;
  let fixture: ComponentFixture<RegProductComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      declarations: [RegProductComponent],
      providers: [
        { provide: RProductService, useValue: {} },
        { provide: RCategoryService, useValue: {} },
        { provide: RUnitOfMeasureService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
