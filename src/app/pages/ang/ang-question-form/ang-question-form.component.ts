import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AngQuestionService } from '../../../services/ang/ang-question.service';
import { AngQuestion, AngQuestionOption, Complexity } from '../../../utils/ang-models';

@Component({
  selector: 'app-ang-question-form',
  templateUrl: './ang-question-form.component.html',
  styleUrls: ['./ang-question-form.component.css'],
  standalone: false,
})
export class AngQuestionFormComponent implements OnInit {
  form: FormGroup;
  isNew = true;
  saveError = '';
  loadError = '';

  readonly complexities: Complexity[] = ['basic', 'intermediate', 'advanced'];

  constructor(
    private fb: FormBuilder,
    private questionSvc: AngQuestionService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.buildForm();
  }

  private buildForm(): FormGroup {
    return this.fb.group({
      text: ['', Validators.required],
      complexity: ['basic', Validators.required],
      explanation: [''],
      options: this.fb.array([this.createOptionGroup(), this.createOptionGroup()]),
    });
  }

  private createOptionGroup(): FormGroup {
    return this.fb.group({
      text: ['', Validators.required],
      correct: [false],
    });
  }

  get options(): FormArray {
    return this.form.get('options') as FormArray;
  }

  get pageTitle(): string {
    return this.isNew ? 'New question' : 'Edit question';
  }

  addOption(): void {
    this.options.push(this.createOptionGroup());
  }

  removeOption(index: number): void {
    if (this.options.length <= 2) {
      return;
    }
    this.options.removeAt(index);
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }
    this.isNew = false;
    this.questionSvc.getById(id).subscribe(question => {
      if (!question) {
        this.loadError = 'Question not found.';
        this.cdr.detectChanges();
        return;
      }
      this.form.patchValue({
        text: question.text,
        complexity: question.complexity,
        explanation: question.explanation,
      });
      while (this.options.length) {
        this.options.removeAt(0);
      }
      for (const opt of question.options) {
        this.options.push(this.fb.group({
          text: [opt.text, Validators.required],
          correct: [opt.correct],
        }));
      }
      this.cdr.detectChanges();
    });
  }

  save(): void {
    this.saveError = '';
    if (this.form.invalid) {
      this.saveError = 'Please fill in all required fields.';
      return;
    }

    const formVal = this.form.value;
    const options: AngQuestionOption[] = (formVal.options || []).map(
      (o: { text: string; correct: boolean }) => ({
        text: (o.text || '').trim(),
        correct: !!o.correct,
      }),
    );

    if (options.length < 2) {
      this.saveError = 'At least 2 options are required.';
      return;
    }

    const hasBlank = options.some(o => !o.text);
    if (hasBlank) {
      this.saveError = 'All options must have text.';
      return;
    }

    const hasCorrect = options.some(o => o.correct);
    if (!hasCorrect) {
      this.saveError = 'At least one option must be marked as correct.';
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    const now = new Date().toISOString();
    const question: AngQuestion = {
      id: id || 'new-' + Date.now(),
      text: (formVal.text || '').trim(),
      complexity: formVal.complexity,
      explanation: (formVal.explanation || '').trim(),
      options,
      createdAt: now,
      updatedAt: now,
    };

    this.questionSvc.save(question).subscribe(() => {
      this.router.navigate(['/angular/questions']);
    });
  }

  cancel(): void {
    this.router.navigate(['/angular/questions']);
  }
}
