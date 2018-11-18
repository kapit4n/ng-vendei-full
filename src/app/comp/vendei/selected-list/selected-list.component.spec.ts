import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SelectedListComponent } from './selected-list.component';
import { MatIconModule } from "@angular/material/icon";
import { MatListModule } from "@angular/material/list";
import { MatDialogModule } from "@angular/material/dialog";

describe('SelectedListComponent', () => {
  let component: SelectedListComponent;
  let fixture: ComponentFixture<SelectedListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SelectedListComponent],
      imports: [MatIconModule, MatListModule, MatDialogModule]
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectedListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
