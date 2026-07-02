import { Injectable } from '@angular/core';
import { AngQuestion } from '../../utils/ang-models';
import { SEED_QUESTIONS } from '../../utils/ang-seed-data';

const STORAGE_KEY = 'ang_questions';

@Injectable({ providedIn: 'root' })
export class AngQuestionService {
  getAll(): AngQuestion[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AngQuestion[]) : [];
  }

  getById(id: string): AngQuestion | undefined {
    return this.getAll().find(q => q.id === id);
  }

  save(question: AngQuestion): void {
    const list = this.getAll();
    const idx = list.findIndex(q => q.id === question.id);
    if (idx >= 0) {
      list[idx] = { ...question, updatedAt: new Date().toISOString() };
    } else {
      list.push(question);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  remove(id: string): void {
    const list = this.getAll().filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  seed(): number {
    const existing = this.getAll();
    const existingIds = new Set(existing.map(q => q.id));
    const now = new Date().toISOString();
    const newQuestions = SEED_QUESTIONS.map((q, i) => ({
      ...q,
      id: `seed-${i}`,
      createdAt: now,
      updatedAt: now,
    }));
    const toAdd = newQuestions.filter(q => !existingIds.has(q.id));
    const updated = [...existing, ...toAdd];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return toAdd.length;
  }

  hasSeedData(): boolean {
    const existing = this.getAll();
    return existing.some(q => q.id.startsWith('seed-'));
  }
}
