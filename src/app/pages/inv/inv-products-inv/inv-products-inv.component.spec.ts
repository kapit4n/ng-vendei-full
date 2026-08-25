import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { InvProductsInvComponent } from './inv-products-inv.component';
import { IProductsService } from '../../../services/inv/i-products.service';
import { IProductsInvService } from '../../../services/inv/i-products-inv.service';

describe('InvProductsInvComponent', () => {
  let component: InvProductsInvComponent;
  let fixture: ComponentFixture<InvProductsInvComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule.withRoutes([])],
      declarations: [InvProductsInvComponent],
      providers: [
        { provide: IProductsService, useValue: {} },
        { provide: IProductsInvService, useValue: {} },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvProductsInvComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
