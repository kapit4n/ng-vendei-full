import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegProductListComponent } from './reg-product-list.component';

describe('RegProductListComponent', () => {
  let component: RegProductListComponent;
  let fixture: ComponentFixture<RegProductListComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RegProductListComponent ]
    })
    .compileComponents();
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
