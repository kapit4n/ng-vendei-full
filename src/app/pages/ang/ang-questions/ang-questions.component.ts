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

  constructor(
    public questionSvc: AngQuestionService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.loadError = '';
    this.seedMessage = '';
    this.questions = this.questionSvc.getAll();
    this.applyFilters();
    this.cdr.detectChanges();
  }

  seedData(): void {
    const count = this.questionSvc.seed();
    this.seedMessage = `${count} sample questions added.`;
    this.loadQuestions();
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
    this.questionSvc.remove(q.id);
    this.loadQuestions();
  }

  complexityClass(c: Complexity): string {
    return `badge--${c}`;
  }

  trackById(index: number, q: AngQuestion): string {
    return q.id;
  }
}
