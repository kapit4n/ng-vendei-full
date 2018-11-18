import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { InvProductsComponent } from './inv-products.component';

describe('InvProductsComponent', () => {
  let component: InvProductsComponent;
  let fixture: ComponentFixture<InvProductsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ InvProductsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(InvProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
