import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AngQuestionService } from '../../../services/ang/ang-question.service';
import { AngQuestion, Complexity } from '../../../utils/ang-models';

@Component({
  selector: 'app-ang-questions',
  templateUrl: './ang-questions.component.html',
  styleUrls: ['./ang-questions.component.css'],
  standalone: false,
})
export class AngQuestionsComponent implements OnInit {
  questions: AngQuestion[] = [];
  filtered: AngQuestion[] = [];
  searchText = '';
  complexityFilter: Complexity | 'all' = 'all';
  loadError = '';
  seedMessage = '';
  hasSeed = true;

  constructor(
    private questionSvc: AngQuestionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.questionSvc.hasSeedData().subscribe(h => {
      this.hasSeed = h;
      this.cdr.detectChanges();
    });
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.loadError = '';
    this.seedMessage = '';
    this.questionSvc.getAll().subscribe({
      next: (list) => {
        this.questions = list;
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadError = 'Failed to load questions from server.';
        this.cdr.detectChanges();
      },
    });
  }

  seedData(): void {
    this.questionSvc.seed().subscribe(count => {
      this.seedMessage = `${count} questions available.`;
      this.hasSeed = true;
      this.loadQuestions();
    });
  }

  applyFilters(): void {
    let list = this.questions;
    if (this.complexityFilter !== 'all') {
      list = list.filter(q => q.complexity === this.complexityFilter);
    }
    if (this.searchText.trim()) {
      const q = this.searchText.trim().toLowerCase();
      list = list.filter(item => item.text.toLowerCase().includes(q));
    }
    this.filtered = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onComplexityChange(value: Complexity | 'all'): void {
    this.complexityFilter = value;
    this.applyFilters();
  }

  newQuestion(): void {
    this.router.navigate(['/angular/questions/new']);
  }

  editQuestion(id: string): void {
    this.router.navigate(['/angular/questions', id]);
  }

  removeQuestion(q: AngQuestion): void {
    if (!confirm(`Delete question "${q.text.substring(0, 60)}..."?`)) {
      return;
    }
    this.questionSvc.remove(q.id).subscribe(() => this.loadQuestions());
  }

  complexityClass(c: Complexity): string {
    return `badge--${c}`;
  }

  trackById(index: number, q: AngQuestion): string {
    return q.id;
  }
}
