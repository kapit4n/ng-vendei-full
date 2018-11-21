import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RepSellsByProductComponent } from './rep-sells-by-product.component';

describe('RepSellsByProductComponent', () => {
  let component: RepSellsByProductComponent;
  let fixture: ComponentFixture<RepSellsByProductComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RepSellsByProductComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepSellsByProductComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
