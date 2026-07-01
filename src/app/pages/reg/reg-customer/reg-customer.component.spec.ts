import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegCustomerComponent } from './reg-customer.component';

describe('RegCustomerComponent', () => {
  let component: RegCustomerComponent;
  let fixture: ComponentFixture<RegCustomerComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RegCustomerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegCustomerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
