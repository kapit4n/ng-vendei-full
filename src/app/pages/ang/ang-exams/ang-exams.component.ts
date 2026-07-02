import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngExamService } from '../../../services/ang/ang-exam.service';
import { AngExam, AngExamResult } from '../../../utils/ang-models';

@Component({
  selector: 'app-ang-exams',
  templateUrl: './ang-exams.component.html',
  styleUrls: ['./ang-exams.component.css'],
  standalone: false,
})
export class AngExamsComponent implements OnInit {
  exams: AngExam[] = [];
  results: AngExamResult[] = [];

  constructor(
    private examSvc: AngExamService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.exams = this.examSvc.getExams().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    this.results = this.examSvc.getResults().sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    this.cdr.detectChanges();
  }

  newExam(): void {
    this.router.navigate(['/angular/exams/new']);
  }

  takeExam(id: string): void {
    this.router.navigate(['/angular/exams/take', id]);
  }

  viewResult(id: string): void {
    this.router.navigate(['/angular/exams/result', id]);
  }

  removeExam(exam: AngExam): void {
    if (!confirm(`Delete exam "${exam.title}"?`)) {
      return;
    }
    this.examSvc.removeExam(exam.id);
    this.loadData();
  }

  percent(result: AngExamResult): number {
    return result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  }

  trackExam(index: number, e: AngExam): string {
    return e.id;
  }

  trackResult(index: number, r: AngExamResult): string {
    return r.id;
  }
}
