import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import Chart from 'chart.js/auto';

import { RepProductsService } from '../../../services/rep/rep-products.service';
import { normalizeApiArray } from '../../../utils/api-body';
import {
  buildExecutiveSummary,
  mapProductsToSalesRows,
  pickSlowMovers,
  ProductSalesAnalyticsRow,
  ProductSalesExecutiveSummary,
  sortRowsByRevenueDesc,
  sortRowsForTable,
} from '../../../utils/rep-product-sales-analytics';

@Component({
  selector: 'app-rep-products',
  templateUrl: './rep-products.component.html',
  styleUrls: ['./rep-products.component.css'],
  standalone: false,
})
export class RepProductsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('topProductsCanvas') topProductsCanvas?: ElementRef<HTMLCanvasElement>;

  /** Raw-derived analytics rows (unsorted except shares computed globally). */
  allRows: ProductSalesAnalyticsRow[] = [];
  summary: ProductSalesExecutiveSummary | null = null;
  slowMovers: ProductSalesAnalyticsRow[] = [];
  /** Rows ranked by revenue (for chart + Pareto). */
  private byRevenue: ProductSalesAnalyticsRow[] = [];

  sortKey: 'revenue-desc' | 'units-desc' | 'margin-desc' | 'name-asc' = 'revenue-desc';

  loading = true;
  loadError: string | null = null;

  readonly displayedColumns = [
    'rank',
    'name',
    'code',
    'units',
    'revenue',
    'share',
    'avgPrice',
    'estMargin',
    'stock',
  ];

  private chartTop?: Chart;
  private viewReady = false;

  constructor(
    private readonly productsSrv: RepProductsService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loading = true;
    this.loadError = null;
    this.productsSrv
      .getAll()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
          setTimeout(() => this.tryRefreshChart(), 0);
        })
      )
      .subscribe({
        next: (raw) => {
          const list = normalizeApiArray(raw);
          this.allRows = mapProductsToSalesRows(list);
          this.byRevenue = sortRowsByRevenueDesc(this.allRows);
          this.summary = buildExecutiveSummary(this.allRows, this.byRevenue);
          this.slowMovers = pickSlowMovers(this.allRows, 12);
        },
        error: () => {
          this.loadError = 'Could not load products.';
          this.allRows = [];
          this.byRevenue = [];
          this.summary = null;
          this.slowMovers = [];
        },
      });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (!this.loading) {
      setTimeout(() => this.tryRefreshChart(), 0);
    }
  }

  ngOnDestroy(): void {
    this.chartTop?.destroy();
    this.chartTop = undefined;
  }

  get tableRows(): ProductSalesAnalyticsRow[] {
    return sortRowsForTable(this.allRows, this.sortKey);
  }

  onSortChange(): void {
    this.cdr.detectChanges();
  }

  openSells(): void {
    this.router.navigate(['/rep/sells']);
  }

  openCart(): void {
    this.router.navigate(['']);
  }

  trackRow(_index: number, row: ProductSalesAnalyticsRow): string {
    return row.id;
  }

  tableRank(index: number): number {
    return index + 1;
  }

  private tryRefreshChart(): void {
    if (!this.viewReady || this.loading) {
      return;
    }
    setTimeout(() => this.refreshTopProductsChart(), 0);
  }

  private refreshTopProductsChart(): void {
    const el = this.topProductsCanvas?.nativeElement;
    this.chartTop?.destroy();
    this.chartTop = undefined;
    if (!el || !this.byRevenue.length) {
      return;
    }
    const top = this.byRevenue.filter((r) => r.revenue > 0).slice(0, 10);
    if (!top.length) {
      return;
    }
    const labels = top.map((r) => truncateLabel(r.name, 28));
    const data = top.map((r) => r.revenue);

    this.chartTop = new Chart(el, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Revenue (Bs)',
            data,
            backgroundColor: 'rgba(63, 81, 181, 0.55)',
            borderColor: 'rgba(63, 81, 181, 1)',
            borderWidth: 1,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw;
                const n = typeof v === 'number' ? v : Number(v);
                return `Bs ${Number.isFinite(n) ? n.toFixed(2) : '—'}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              callback: (value) => `Bs ${value}`,
            },
          },
        },
      },
    });
  }
}

function truncateLabel(s: string, max: number): string {
  const t = (s || '').trim();
  if (t.length <= max) {
    return t || '—';
  }
  return `${t.slice(0, max - 1)}…`;
}
