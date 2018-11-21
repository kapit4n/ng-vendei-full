import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RepSellsByOrderComponent } from './rep-sells-by-order.component';

describe('RepSellsByOrderComponent', () => {
  let component: RepSellsByOrderComponent;
  let fixture: ComponentFixture<RepSellsByOrderComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RepSellsByOrderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepSellsByOrderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
