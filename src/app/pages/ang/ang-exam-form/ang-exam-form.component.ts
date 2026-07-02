import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngQuestionService } from '../../../services/ang/ang-question.service';
import { AngExamService } from '../../../services/ang/ang-exam.service';
import { AngQuestion, AngExam, Complexity } from '../../../utils/ang-models';

@Component({
  selector: 'app-ang-exam-form',
  templateUrl: './ang-exam-form.component.html',
  styleUrls: ['./ang-exam-form.component.css'],
  standalone: false,
})
export class AngExamFormComponent implements OnInit {
  form: FormGroup;
  allQuestions: AngQuestion[] = [];
  selectedQuestions: AngQuestion[] = [];
  formError = '';

  readonly complexities: (Complexity | 'all')[] = ['all', 'basic', 'intermediate', 'advanced'];

  constructor(
    private fb: FormBuilder,
    private questionSvc: AngQuestionService,
    private examSvc: AngExamService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({
      title: ['', Validators.required],
      complexity: ['all'],
      questionCount: [10, [Validators.required, Validators.min(1)]],
    });
  }

  ngOnInit(): void {
    this.questionSvc.getAll().subscribe(list => {
      this.allQuestions = list;
      this.cdr.detectChanges();
    });
  }

  get maxQuestions(): number {
    const complexity = this.form.get('complexity')?.value;
    let pool = this.allQuestions;
    if (complexity && complexity !== 'all') {
      pool = pool.filter(q => q.complexity === complexity);
    }
    return pool.length;
  }

  generatePreview(): void {
    this.formError = '';
    const complexity = this.form.get('complexity')?.value;
    const count = Number(this.form.get('questionCount')?.value) || 0;

    let pool = this.allQuestions;
    if (complexity && complexity !== 'all') {
      pool = pool.filter(q => q.complexity === complexity);
    }

    if (!pool.length) {
      this.formError = 'No questions available for the selected complexity. Add questions first.';
      this.selectedQuestions = [];
      this.cdr.detectChanges();
      return;
    }

    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    this.selectedQuestions = shuffled.slice(0, Math.min(count, shuffled.length));
    this.cdr.detectChanges();
  }

  save(): void {
    this.formError = '';
    if (this.form.invalid) {
      this.formError = 'Please fill in the title.';
      return;
    }
    if (!this.selectedQuestions.length) {
      this.formError = 'Generate the question selection first.';
      return;
    }

    const exam: AngExam = {
      id: 'new-' + Date.now(),
      title: (this.form.get('title')?.value || '').trim(),
      questionIds: this.selectedQuestions.map(q => q.id),
      createdAt: new Date().toISOString(),
    };

    this.examSvc.saveExam(exam).subscribe(() => {
      this.router.navigate(['/angular/exams']);
    });
  }

  cancel(): void {
    this.router.navigate(['/angular/exams']);
  }
}
