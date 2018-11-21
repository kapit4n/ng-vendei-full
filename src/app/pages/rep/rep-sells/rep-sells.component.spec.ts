import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RepSellsComponent } from './rep-sells.component';

describe('RepSellsComponent', () => {
  let component: RepSellsComponent;
  let fixture: ComponentFixture<RepSellsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RepSellsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RepSellsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
