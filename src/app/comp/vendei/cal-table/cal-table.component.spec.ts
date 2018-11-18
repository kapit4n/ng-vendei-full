import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CalTableComponent } from './cal-table.component';
import { MatIconModule } from "@angular/material/icon";

describe('CalTableComponent', () => {
  let component: CalTableComponent;
  let fixture: ComponentFixture<CalTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CalTableComponent ],
      imports: [ MatIconModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CalTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
