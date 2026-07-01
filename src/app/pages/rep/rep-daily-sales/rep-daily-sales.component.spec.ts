import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { of, throwError } from 'rxjs';
import { RepDailySalesComponent } from './rep-daily-sales.component';
import { RepDailySalesService } from '../../../services/rep/rep-daily-sales.service';
import { Router } from '@angular/router';

describe('RepDailySalesComponent', () => {
  let component: RepDailySalesComponent;
  let fixture: ComponentFixture<RepDailySalesComponent>;
  let dailySrvSpy: jasmine.SpyObj<RepDailySalesService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockSummary = {
    date: '2026-07-01',
    orderCount: 5,
    totalSales: 350,
    totalCash: 200,
    totalQr: 150,
    totalDiscount: 10,
    totalReturn: 5,
  };

  beforeEach(waitForAsync(() => {
    dailySrvSpy = jasmine.createSpyObj('RepDailySalesService', ['getTodaySummary']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      schemas: [NO_ERRORS_SCHEMA],
      declarations: [RepDailySalesComponent],
      providers: [
        { provide: RepDailySalesService, useValue: dailySrvSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();
  }));

  beforeEach(() => {
    dailySrvSpy.getTodaySummary.and.returnValue(of(mockSummary));
    fixture = TestBed.createComponent(RepDailySalesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads daily summary on init', () => {
    expect(dailySrvSpy.getTodaySummary).toHaveBeenCalled();
    expect(component.summary).toEqual(mockSummary);
    expect(component.loading).toBe(false);
  });

  it('computes netCash as cash minus return', () => {
    expect(component.netCash).toBe(195);
  });

  it('computes netTotal as sales minus discount', () => {
    expect(component.netTotal).toBe(340);
  });

  it('cashPercent returns correct ratio', () => {
    expect(component.cashPercent()).toBe(57);
  });

  it('qrPercent returns correct ratio', () => {
    expect(component.qrPercent()).toBe(43);
  });

  it('cashPercent returns 0 when no payments', () => {
    component.summary = { ...mockSummary, totalCash: 0, totalQr: 0 };
    expect(component.cashPercent()).toBe(0);
  });

  it('navigates to POS on openCart', () => {
    component.openCart();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/']);
  });

  it('navigates to sells on openSells', () => {
    component.openSells();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/rep/sells']);
  });

  it('shows error state on load failure', () => {
    dailySrvSpy.getTodaySummary.and.returnValue(throwError(() => new Error('fail')));
    component.ngOnInit();
    expect(component.loadError).toBeTruthy();
  });

  it('refresh reloads data', () => {
    spyOn(component as any, 'loadData');
    component.refresh();
    expect((component as any).loadData).toHaveBeenCalled();
  });
});
