import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RegProductPresentationComponent } from './reg-product-presentation.component';
import { RProductPresentationService } from '../../../services/reg/r-product-presentation.service';
import { RProductService } from '../../../services/reg/r-product.service';
import { RUploadService } from '../../../services/reg/r-upload.service';
import { RUnitOfMeasureService } from '../../../services/reg/r-unit-of-measure.service';

describe('RegProductPresentationComponent', () => {
  let component: RegProductPresentationComponent;
  let fixture: ComponentFixture<RegProductPresentationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      declarations: [RegProductPresentationComponent],
      providers: [
        { provide: RProductPresentationService, useValue: {} },
        { provide: RProductService, useValue: {} },
        { provide: RUploadService, useValue: {} },
        { provide: RUnitOfMeasureService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegProductPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
