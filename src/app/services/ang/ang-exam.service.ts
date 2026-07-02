import { Injectable } from '@angular/core';
import { AngExam, AngExamResult } from '../../utils/ang-models';

const EXAMS_KEY = 'ang_exams';
const RESULTS_KEY = 'ang_exam_results';

@Injectable({ providedIn: 'root' })
export class AngExamService {
  getExams(): AngExam[] {
    const raw = localStorage.getItem(EXAMS_KEY);
    return raw ? (JSON.parse(raw) as AngExam[]) : [];
  }

  getExamById(id: string): AngExam | undefined {
    return this.getExams().find(e => e.id === id);
  }

  saveExam(exam: AngExam): void {
    const list = this.getExams();
    const idx = list.findIndex(e => e.id === exam.id);
    if (idx >= 0) {
      list[idx] = exam;
    } else {
      list.push(exam);
    }
    localStorage.setItem(EXAMS_KEY, JSON.stringify(list));
  }

  removeExam(id: string): void {
    const list = this.getExams().filter(e => e.id !== id);
    localStorage.setItem(EXAMS_KEY, JSON.stringify(list));
  }

  getResults(): AngExamResult[] {
    const raw = localStorage.getItem(RESULTS_KEY);
    return raw ? (JSON.parse(raw) as AngExamResult[]) : [];
  }

  getResultById(id: string): AngExamResult | undefined {
    return this.getResults().find(r => r.id === id);
  }

  saveResult(result: AngExamResult): void {
    const list = this.getResults();
    list.push(result);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(list));
  }
}
