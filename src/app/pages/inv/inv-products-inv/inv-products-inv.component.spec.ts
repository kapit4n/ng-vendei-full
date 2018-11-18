import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InvProductsInvComponent } from './inv-products-inv.component';

describe('InvProductsInvComponent', () => {
  let component: InvProductsInvComponent;
  let fixture: ComponentFixture<InvProductsInvComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvProductsInvComponent ]
    })
    .compileComponents();
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
