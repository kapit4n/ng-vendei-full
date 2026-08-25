import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of } from 'rxjs';
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
        {
          provide: IProductsService, useValue: {
            getById: jasmine.createSpy('getById').and.returnValue(of({})),
            addToInventory: jasmine.createSpy('addToInventory').and.returnValue(of({})),
            reduceInventory: jasmine.createSpy('reduceInventory').and.returnValue(of({})),
            update: jasmine.createSpy('update').and.returnValue(of({})),
          }
        },
        {
          provide: IProductsInvService, useValue: {
            getByProductId: jasmine.createSpy('getByProductId').and.returnValue(of([])),
            save: jasmine.createSpy('save').and.returnValue(of({})),
            remove: jasmine.createSpy('remove').and.returnValue(of({})),
          }
        },
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
