import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PosPaymentPanelComponent } from './pos-payment-panel.component';
import { MatIconModule } from "@angular/material/icon";

describe('PosPaymentPanelComponent', () => {
  let component: PosPaymentPanelComponent;
  let fixture: ComponentFixture<PosPaymentPanelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PosPaymentPanelComponent ],
      imports: [ MatIconModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PosPaymentPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
