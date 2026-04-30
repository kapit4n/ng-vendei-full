import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { finalize } from 'rxjs/operators';
import { Router } from '@angular/router';
import Chart from 'chart.js/auto';

import { RepSellsService } from '../../../services/rep/rep-sells.service';
import {
  addCalendarDays,
  buildDailySeries,
  buildMonthlySeries,
  filterSellsByDateRange,
  parseInputDateValue,
  sumSellTotals,
  toInputDateValue,
} from '../../../utils/rep-sell-analytics';

@Component({
  selector: 'app-rep-sells',
  templateUrl: './rep-sells.component.html',
  styleUrls: ['./rep-sells.component.css'],
  standalone: false,
})
export class RepSellsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('dailyCanvas') dailyCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('monthlyCanvas') monthlyCanvas?: ElementRef<HTMLCanvasElement>;

  /** Full list from API (client-side range filter). */
  allSells: any[] = [];
  /** Lines in the selected date range (table + charts). */
  filteredSells: any[] = [];
  /** Alias for template table (`filteredSells`). */
  sells: any[] = [];

  rangeStartStr = '';
  rangeEndStr = '';
  rangeTotal = 0;
  lineCount = 0;

  loading = true;
  loadError: string | null = null;

  readonly displayedColumns = ['product', 'quantity', 'price', 'totalPrice', 'createdDate'];

  private chartDaily?: Chart;
  private chartMonthly?: Chart;
  private viewReady = false;

  constructor(
    private readonly sellsSrv: RepSellsService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {
    const today = new Date();
    this.rangeEndStr = toInputDateValue(today);
    this.rangeStartStr = toInputDateValue(addCalendarDays(today, -30));
  }

  ngOnInit(): void {
    this.loading = true;
    this.loadError = null;
    this.sellsSrv
      .getAll()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: raw => {
          this.allSells = this.normalizeListResponse(raw);
          this.applyRange();
        },
        error: () => {
          this.loadError = 'Could not load sales data.';
          this.allSells = [];
          this.applyRange();
        },
      });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    // If the HTTP stream completed before this hook, applyRange skipped chart scheduling.
    if (!this.loading) {
      this.tryRefreshCharts();
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  applyRange(): void {
    const from = parseInputDateValue(this.rangeStartStr);
    const to = parseInputDateValue(this.rangeEndStr);
    if (!from || !to) {
      this.filteredSells = [];
      this.sells = [];
      this.rangeTotal = 0;
      this.lineCount = 0;
      this.tryRefreshCharts();
      return;
    }
    let lo = from;
    let hi = to;
    if (hi < lo) {
      const t = lo;
      lo = hi;
      hi = t;
    }
    this.filteredSells = filterSellsByDateRange(this.allSells, lo, hi);
    this.sells = this.filteredSells;
    this.rangeTotal = sumSellTotals(this.filteredSells);
    this.lineCount = this.filteredSells.length;
    this.tryRefreshCharts();
  }

  setPresetDays(days: number): void {
    const end = new Date();
    const start = addCalendarDays(end, -(days - 1));
    this.rangeEndStr = toInputDateValue(end);
    this.rangeStartStr = toInputDateValue(start);
    this.applyRange();
  }

  setYearToDate(): void {
    const end = new Date();
    const start = new Date(end.getFullYear(), 0, 1);
    this.rangeEndStr = toInputDateValue(end);
    this.rangeStartStr = toInputDateValue(start);
    this.applyRange();
  }

  productName(sell: any): string {
    return sell?.product?.name ?? sell?.Product?.name ?? '—';
  }

  openProducts(): void {
    this.router.navigate(['/rep/products']);
  }

  openCart(): void {
    this.router.navigate(['']);
  }

  private tryRefreshCharts(): void {
    if (!this.viewReady) {
      return;
    }
    // After `@if (!loading)` adds canvases, ViewChild is only reliable on a later turn.
    setTimeout(() => this.refreshCharts(), 0);
  }

  /** Accepts a plain array or common `{ data: [] }` envelope from APIs. */
  private normalizeListResponse(raw: unknown): any[] {
    if (Array.isArray(raw)) {
      return raw;
    }
    if (raw && typeof raw === 'object' && Array.isArray((raw as { data?: unknown }).data)) {
      return (raw as { data: any[] }).data;
    }
    return [];
  }

  private destroyCharts(): void {
    this.chartDaily?.destroy();
    this.chartMonthly?.destroy();
    this.chartDaily = undefined;
    this.chartMonthly = undefined;
  }

  private refreshCharts(): void {
    this.destroyCharts();
    const from = parseInputDateValue(this.rangeStartStr);
    const to = parseInputDateValue(this.rangeEndStr);
    const dEl = this.dailyCanvas?.nativeElement;
    const mEl = this.monthlyCanvas?.nativeElement;
    if (!from || !to || !dEl || !mEl) {
      return;
    }
    let lo = from;
    let hi = to;
    if (hi < lo) {
      const t = lo;
      lo = hi;
      hi = t;
    }

    const daily = buildDailySeries(this.filteredSells, lo, hi);
    const monthly = buildMonthlySeries(this.filteredSells);

    const currencyTick = (value: number | string) =>
      typeof value === 'number' ? `Bs ${value}` : String(value);

    this.chartDaily = new Chart(dEl, {
      type: 'bar',
      data: {
        labels: daily.labels,
        datasets: [
          {
            label: 'Daily total (Bs)',
            data: daily.values,
            backgroundColor: 'rgba(63, 81, 181, 0.55)',
            borderColor: 'rgba(63, 81, 181, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const v = Number(ctx.raw);
                return `Bs ${v.toFixed(2)}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              autoSkip: true,
              maxTicksLimit: 18,
            },
          },
          y: {
            beginAtZero: true,
            ticks: { callback: v => currencyTick(v as number) },
          },
        },
      },
    });

    const mLabels = monthly.labels.length ? monthly.labels : ['No data'];
    const mValues = monthly.values.length ? monthly.values : [0];

    this.chartMonthly = new Chart(mEl, {
      type: 'bar',
      data: {
        labels: mLabels,
        datasets: [
          {
            label: 'Monthly total (Bs)',
            data: mValues,
            backgroundColor: 'rgba(233, 30, 99, 0.5)',
            borderColor: 'rgba(194, 24, 91, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => {
                const v = Number(ctx.raw);
                return `Bs ${v.toFixed(2)}`;
              },
            },
          },
        },
        scales: {
          x: { ticks: { maxRotation: 0 } },
          y: {
            beginAtZero: true,
            ticks: { callback: v => currencyTick(v as number) },
          },
        },
      },
    });
  }
}
