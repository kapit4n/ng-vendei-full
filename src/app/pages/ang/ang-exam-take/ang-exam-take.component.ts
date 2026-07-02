import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AngQuestionService } from '../../../services/ang/ang-question.service';
import { AngExamService } from '../../../services/ang/ang-exam.service';
import { AngQuestion, AngExamResult, AngExamAnswer } from '../../../utils/ang-models';
import { forkJoin } from 'rxjs';

interface QuestionAnswer {
  question: AngQuestion;
  selected: boolean[];
}

@Component({
  selector: 'app-ang-exam-take',
  templateUrl: './ang-exam-take.component.html',
  styleUrls: ['./ang-exam-take.component.css'],
  standalone: false,
})
export class AngExamTakeComponent implements OnInit {
  examTitle = '';
  questionAnswers: QuestionAnswer[] = [];
  loadError = '';
  submitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private questionSvc: AngQuestionService,
    private examSvc: AngExamService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const examId = this.route.snapshot.paramMap.get('id');
    if (!examId) {
      this.loadError = 'Exam not found.';
      return;
    }

    this.examSvc.getExamById(examId).subscribe(exam => {
      if (!exam) {
        this.loadError = 'Exam not found.';
        this.cdr.detectChanges();
        return;
      }

      this.examTitle = exam.title;

      const obs = exam.questionIds.map(id => this.questionSvc.getById(id));
      forkJoin(obs).subscribe(questions => {
        const valid = questions.filter((q): q is AngQuestion => q != null);
        this.questionAnswers = valid.map(q => ({
          question: q,
          selected: new Array(q.options.length).fill(false),
        }));
        this.cdr.detectChanges();
      });
    });
  }

  isSingleCorrect(options: { correct: boolean }[]): boolean {
    return options.filter(o => o.correct).length === 1;
  }

  onRadioChange(qa: QuestionAnswer, index: number): void {
    if (index < 0) return;
    qa.selected = qa.selected.map((_, i) => i === index);
  }

  submit(): void {
    if (this.submitted) {
      return;
    }
    this.submitted = true;

    const answers: AngExamAnswer[] = this.questionAnswers.map(qa => {
      const correctIndices = qa.question.options
        .map((opt, idx) => (opt.correct ? idx : -1))
        .filter(idx => idx >= 0);

      const selectedIndices = qa.selected
        .map((sel, idx) => (sel ? idx : -1))
        .filter(idx => idx >= 0);

      const isCorrect =
        selectedIndices.length === correctIndices.length &&
        selectedIndices.every(idx => correctIndices.includes(idx));

      return {
        questionId: qa.question.id,
        questionText: qa.question.text,
        selectedOptions: selectedIndices,
        correctOptions: correctIndices,
        isCorrect,
      };
    });

    const score = answers.filter(a => a.isCorrect).length;

    const result: AngExamResult = {
      id: '',
      examId: this.route.snapshot.paramMap.get('id') || '',
      examTitle: this.examTitle,
      answers,
      score,
      total: answers.length,
      completedAt: new Date().toISOString(),
    };

    this.examSvc.saveResult(result).subscribe(saved => {
      this.router.navigate(['/angular/exams/result', saved.id]);
    });
  }

  cancel(): void {
    this.router.navigate(['/angular/exams']);
  }
}
