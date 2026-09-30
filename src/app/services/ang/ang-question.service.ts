import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_PATHS } from '../../core/api/api-paths';
import { ApiClientService } from '../../core/api/api-client.service';
import { AngQuestion } from '../../utils/ang-models';

function mapRow(r: any): AngQuestion {
  return {
    id: String(r.id),
    text: r.text,
    options: r.options,
    complexity: r.complexity,
    explanation: r.explanation || '',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

@Injectable({ providedIn: 'root' })
export class AngQuestionService {
  constructor(private readonly api: ApiClientService) {}

  getAll(): Observable<AngQuestion[]> {
    return this.api.get<any[]>(API_PATHS.angQuestions).pipe(map(rows => rows.map(mapRow)));
  }

  getById(id: string): Observable<AngQuestion | undefined> {
    return this.api.get<any>(`${API_PATHS.angQuestions}/${id}`).pipe(map(r => r ? mapRow(r) : undefined));
  }

  save(question: AngQuestion): Observable<AngQuestion> {
    const body = {
      text: question.text,
      options: question.options,
      complexity: question.complexity,
      explanation: question.explanation,
    };
    const id = question.id;
    if (id && !id.startsWith('seed-') && !id.startsWith('new-')) {
      return this.api.put<any>(`${API_PATHS.angQuestions}/${id}`, body).pipe(map(mapRow));
    }
    return this.api.post<any>(API_PATHS.angQuestions, body).pipe(map(mapRow));
  }

  remove(id: string): Observable<void> {
    return this.api.delete<void>(`${API_PATHS.angQuestions}/${id}`);
  }

  seed(): Observable<number> {
    return this.api.get<any[]>(API_PATHS.angQuestions).pipe(map(rows => rows.length));
  }

  dedup(): Observable<{ removed: number }> {
    return this.api.post<{ removed: number }>(`${API_PATHS.angQuestions}/dedup`, {});
  }

  hasSeedData(): Observable<boolean> {
    return this.api.get<any[]>(API_PATHS.angQuestions).pipe(map(rows => rows.length > 0));
  }

  getCount(): Observable<number> {
    return this.api.get<any[]>(API_PATHS.angQuestions).pipe(map(rows => rows.length));
  }
}
