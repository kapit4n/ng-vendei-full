import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RepConfigService } from '../rep/rep-config.service';
import { Observable, map, switchMap } from 'rxjs';
import { AngExam, AngExamResult } from '../../utils/ang-models';

@Injectable({ providedIn: 'root' })
export class AngExamService {
  private examsBase: string;
  private resultsBase: string;

  constructor(private http: HttpClient, private config: RepConfigService) {
    const base = config.baseUrl;
    this.examsBase = base + '/ang-exams';
    this.resultsBase = base + '/ang-results';
  }

  getExams(): Observable<AngExam[]> {
    return this.http.get<any[]>(this.examsBase).pipe(
      map(rows => rows.map((r: any) => ({
        id: String(r.id),
        title: r.title,
        questionIds: r.questionIds || [],
        createdAt: r.createdAt,
      }))),
    );
  }

  getExamById(id: string): Observable<AngExam | undefined> {
    return this.http.get<any>(`${this.examsBase}/${id}`).pipe(
      map(r => r ? {
        id: String(r.id),
        title: r.title,
        questionIds: r.questionIds || [],
        createdAt: r.createdAt,
      } : undefined),
    );
  }

  saveExam(exam: AngExam): Observable<AngExam> {
    const body = {
      title: exam.title,
      questionIds: exam.questionIds,
    };
    if (exam.id && !exam.id.startsWith('new-')) {
      return this.http.put<any>(`${this.examsBase}/${exam.id}`, body).pipe(
        map(r => ({ id: String(r.id), title: r.title, questionIds: r.questionIds || [], createdAt: r.createdAt })),
      );
    }
    return this.http.post<any>(this.examsBase, body).pipe(
      map(r => ({ id: String(r.id), title: r.title, questionIds: r.questionIds || [], createdAt: r.createdAt })),
    );
  }

  removeExam(id: string): Observable<void> {
    return this.http.delete<void>(`${this.examsBase}/${id}`);
  }

  getResults(): Observable<AngExamResult[]> {
    return this.http.get<any[]>(this.resultsBase).pipe(
      map(rows => rows.map((r: any) => ({
        id: String(r.id),
        examId: String(r.examId),
        examTitle: r.examTitle,
        score: r.score,
        total: r.total,
        completedAt: r.completedAt,
        answers: [],
      }))),
    );
  }

  getResultById(id: string): Observable<AngExamResult | undefined> {
    return this.http.get<any>(`${this.resultsBase}/${id}`).pipe(
      map(r => r ? {
        id: String(r.id),
        examId: String(r.examId),
        examTitle: r.examTitle,
        answers: (r.answers || []).map((a: any) => ({
          questionId: String(a.questionId),
          questionText: a.questionText,
          selectedOptions: a.selectedOptions || [],
          correctOptions: a.correctOptions || [],
          isCorrect: a.isCorrect,
        })),
        score: r.score,
        total: r.total,
        completedAt: r.completedAt,
      } : undefined),
    );
  }

  saveResult(result: AngExamResult): Observable<AngExamResult> {
    const body = {
      examId: result.examId ? Number(result.examId) : null,
      examTitle: result.examTitle,
      score: result.score,
      total: result.total,
      completedAt: result.completedAt,
      answers: result.answers.map(a => ({
        questionId: a.questionId ? Number(a.questionId) : null,
        questionText: a.questionText,
        selectedOptions: a.selectedOptions,
        correctOptions: a.correctOptions,
        isCorrect: a.isCorrect,
      })),
    };
    return this.http.post<any>(this.resultsBase, body).pipe(
      switchMap(() => this.http.get<any[]>(this.resultsBase)),
      map((rows: any[]) => {
        const created = rows[rows.length - 1];
        return {
          id: String(created.id),
          examId: String(created.examId),
          examTitle: created.examTitle,
          answers: result.answers,
          score: created.score,
          total: created.total,
          completedAt: created.completedAt,
        };
      }),
    );
  }
}
