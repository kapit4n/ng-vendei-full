import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PosTicketLinesComponent } from './pos-ticket-lines.component';
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatDialogModule } from "@angular/material/dialog";

describe('PosTicketLinesComponent', () => {
  let component: PosTicketLinesComponent;
  let fixture: ComponentFixture<PosTicketLinesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PosTicketLinesComponent],
      imports: [MatIconModule, MatListModule, MatDialogModule]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PosTicketLinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
