import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngExamService } from '../../../services/ang/ang-exam.service';
import { AngQuestionService } from '../../../services/ang/ang-question.service';
import { AngExamResult, AngQuestion } from '../../../utils/ang-models';

@Component({
  selector: 'app-ang-exam-result',
  templateUrl: './ang-exam-result.component.html',
  styleUrls: ['./ang-exam-result.component.css'],
  standalone: false,
})
export class AngExamResultComponent implements OnInit {
  result: AngExamResult | null = null;
  questions: Map<string, AngQuestion> = new Map();
  loadError = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private examSvc: AngExamService,
    private questionSvc: AngQuestionService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loadError = 'Result not found.';
      return;
    }

    this.result = this.examSvc.getResultById(id) || null;
    if (!this.result) {
      this.loadError = 'Result not found.';
      return;
    }

    for (const q of this.questionSvc.getAll()) {
      this.questions.set(q.id, q);
    }
    this.cdr.detectChanges();
  }

  get percent(): number {
    if (!this.result || this.result.total === 0) {
      return 0;
    }
    return Math.round((this.result.score / this.result.total) * 100);
  }

  get gradeClass(): string {
    if (this.percent >= 70) {
      return 'grade--good';
    }
    if (this.percent >= 40) {
      return 'grade--ok';
    }
    return 'grade--bad';
  }

  get gradeLabel(): string {
    if (this.percent >= 70) {
      return 'Great!';
    }
    if (this.percent >= 40) {
      return 'Keep practicing';
    }
    return 'Needs work';
  }

  isOptionCorrect(answer: { correctOptions: number[] }, optIdx: number): boolean {
    return answer.correctOptions.includes(optIdx);
  }

  isOptionSelected(answer: { selectedOptions: number[] }, optIdx: number): boolean {
    return answer.selectedOptions.includes(optIdx);
  }

  optionClass(answer: { selectedOptions: number[]; correctOptions: number[] }, optIdx: number): string {
    const selected = this.isOptionSelected(answer, optIdx);
    const correct = this.isOptionCorrect(answer, optIdx);
    if (correct && selected) {
      return 'option--correct-selected';
    }
    if (correct && !selected) {
      return 'option--correct-missed';
    }
    if (!correct && selected) {
      return 'option--wrong-selected';
    }
    return '';
  }

  backToExams(): void {
    this.router.navigate(['/angular/exams']);
  }
}
