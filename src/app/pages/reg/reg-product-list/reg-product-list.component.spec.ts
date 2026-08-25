import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { RegProductListComponent } from './reg-product-list.component';
import { RProductService } from '../../../services/reg/r-product.service';
import { RProductPresentationService } from '../../../services/reg/r-product-presentation.service';

describe('RegProductListComponent', () => {
  let component: RegProductListComponent;
  let fixture: ComponentFixture<RegProductListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      declarations: [RegProductListComponent],
      providers: [
        { provide: RProductService, useValue: {} },
        { provide: RProductPresentationService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
