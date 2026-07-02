import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RepConfigService } from '../rep/rep-config.service';
import { Observable, map } from 'rxjs';
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
  private base: string;

  constructor(private http: HttpClient, private config: RepConfigService) {
    this.base = config.baseUrl + '/ang-questions';
  }

  getAll(): Observable<AngQuestion[]> {
    return this.http.get<any[]>(this.base).pipe(map(rows => rows.map(mapRow)));
  }

  getById(id: string): Observable<AngQuestion | undefined> {
    return this.http.get<any>(`${this.base}/${id}`).pipe(map(r => r ? mapRow(r) : undefined));
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
      return this.http.put<any>(`${this.base}/${id}`, body).pipe(map(mapRow));
    }
    return this.http.post<any>(this.base, body).pipe(map(mapRow));
  }

  remove(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  seed(): Observable<number> {
    return this.http.get<any[]>(this.base).pipe(map(rows => rows.length));
  }

  hasSeedData(): Observable<boolean> {
    return this.http.get<any[]>(this.base).pipe(map(rows => rows.length > 0));
  }

  getCount(): Observable<number> {
    return this.http.get<any[]>(this.base).pipe(map(rows => rows.length));
  }
}
