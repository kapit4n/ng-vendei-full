import { Injectable } from '@angular/core';
import { Observable, map, switchMap } from 'rxjs';

import { API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';
import { AngExam, AngExamResult } from '../../utils/ang-models';

@Injectable({ providedIn: 'root' })
export class AngExamService {
  constructor(private readonly api: ApiClientService) {}

  getExams(): Observable<AngExam[]> {
    return this.api.get<any[]>(API_PATHS.angExams).pipe(
      map(rows => rows.map((r: any) => ({
        id: String(r.id),
        title: r.title,
        questionIds: r.questionIds || [],
        createdAt: r.createdAt,
      }))),
    );
  }

  getExamById(id: string): Observable<AngExam | undefined> {
    return this.api.get<any>(`${API_PATHS.angExams}/${id}`).pipe(
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
      return this.api.put<any>(`${API_PATHS.angExams}/${exam.id}`, body).pipe(
        map(r => ({ id: String(r.id), title: r.title, questionIds: r.questionIds || [], createdAt: r.createdAt })),
      );
    }
    return this.api.post<any>(API_PATHS.angExams, body).pipe(
      map(r => ({ id: String(r.id), title: r.title, questionIds: r.questionIds || [], createdAt: r.createdAt })),
    );
  }

  removeExam(id: string): Observable<void> {
    return this.api.delete<void>(`${API_PATHS.angExams}/${id}`);
  }

  getResults(): Observable<AngExamResult[]> {
    return this.api.get<any[]>(API_PATHS.angResults).pipe(
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
    return this.api.get<any>(`${API_PATHS.angResults}/${id}`).pipe(
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
    return this.api.post<any>(API_PATHS.angResults, body).pipe(
      switchMap(() => this.api.get<any[]>(API_PATHS.angResults)),
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
