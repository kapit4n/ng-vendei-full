import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RepOrdersComponent } from './rep-orders.component';

describe('RepOrdersComponent', () => {
  let component: RepOrdersComponent;
  let fixture: ComponentFixture<RepOrdersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RepOrdersComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepOrdersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
