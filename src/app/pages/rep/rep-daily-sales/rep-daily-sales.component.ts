import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { RepDailySalesService, DailySalesSummary } from '../../../services/rep/rep-daily-sales.service';
import { roundToCents } from 'src/app/utils/money';

@Component({
  selector: 'app-rep-daily-sales',
  templateUrl: './rep-daily-sales.component.html',
  styleUrls: ['./rep-daily-sales.component.css'],
  standalone: false,
})
export class RepDailySalesComponent implements OnInit {
  summary: DailySalesSummary | null = null;
  loading = true;
  loadError: string | null = null;

  constructor(
    private readonly dailySrv: RepDailySalesService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  refresh(): void {
    this.loadData();
  }

  openCart(): void {
    this.router.navigate(['/']);
  }

  openSells(): void {
    this.router.navigate(['/rep/sells']);
  }

  get netCash(): number {
    if (!this.summary) return 0;
    return roundToCents(this.summary.totalCash - this.summary.totalReturn);
  }

  get netTotal(): number {
    if (!this.summary) return 0;
    return roundToCents(this.summary.totalSales - this.summary.totalDiscount);
  }

  get chartLabels(): string[] {
    return ['Cash', 'QR'];
  }

  get chartValues(): number[] {
    if (!this.summary) return [0, 0];
    return [this.summary.totalCash, this.summary.totalQr];
  }

  cashPercent(): number {
    if (!this.summary || (this.summary.totalCash === 0 && this.summary.totalQr === 0)) return 0;
    const total = this.summary.totalCash + this.summary.totalQr;
    if (total <= 0) return 0;
    return Math.round((this.summary.totalCash / total) * 100);
  }

  qrPercent(): number {
    if (!this.summary || (this.summary.totalCash === 0 && this.summary.totalQr === 0)) return 0;
    const total = this.summary.totalCash + this.summary.totalQr;
    if (total <= 0) return 0;
    return Math.round((this.summary.totalQr / total) * 100);
  }

  private loadData(): void {
    this.loading = true;
    this.loadError = null;
    this.dailySrv
      .getTodaySummary()
      .pipe(finalize(() => {
        this.loading = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (data) => {
          this.summary = data;
        },
        error: () => {
          this.loadError = 'Failed to load daily sales summary.';
        },
      });
  }
}
