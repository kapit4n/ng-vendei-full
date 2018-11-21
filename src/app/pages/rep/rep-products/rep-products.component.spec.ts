import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RepProductsComponent } from './rep-products.component';

describe('RepProductsComponent', () => {
  let component: RepProductsComponent;
  let fixture: ComponentFixture<RepProductsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RepProductsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepProductsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
