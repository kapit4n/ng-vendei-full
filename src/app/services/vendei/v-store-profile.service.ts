import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { VConfigService } from './v-config.service';

export interface StoreProfile {
  id: number;
  name: string;
  slug: string;
  description: string;
  active: boolean;
  defaultProfile: boolean;
}

const STORAGE_KEY = 'activeStoreProfileId';

@Injectable({
  providedIn: 'root',
})
export class VStoreProfileService {
  private profiles: StoreProfile[] = [];
  private activeProfileId$ = new BehaviorSubject<number | null>(this.loadFromStorage());

  constructor(private http: HttpClient, private configSvc: VConfigService) {}

  getProfiles(): Observable<StoreProfile[]> {
    return this.http.get<any>(`${this.configSvc.baseUrl}/storeProfiles`).pipe(
      map((body) => {
        if (Array.isArray(body)) return body;
        if (body && typeof body === 'object') {
          const nested = (body as any)['data'] ?? (body as any)['rows'] ?? (body as any)['items'];
          if (Array.isArray(nested)) return nested;
        }
        return [];
      }),
      tap((profiles) => {
        this.profiles = profiles;
        const currentId = this.activeProfileId$.getValue();
        if (currentId === null && profiles.length > 0) {
          const def = profiles.find((p: StoreProfile) => p.defaultProfile) || profiles[0];
          this.setActiveProfile(def);
        } else if (currentId !== null && !profiles.find((p: StoreProfile) => p.id === currentId)) {
          const def = profiles.find((p: StoreProfile) => p.defaultProfile) || profiles[0];
          if (def) this.setActiveProfile(def);
        }
      }),
      catchError((err) => {
        console.error('[VStoreProfileService] getProfiles failed', err);
        return of([]);
      })
    );
  }

  getActiveProfileId(): number | null {
    return this.activeProfileId$.getValue();
  }

  getActiveProfileId$(): Observable<number | null> {
    return this.activeProfileId$.asObservable();
  }

  getActiveProfile(): StoreProfile | null {
    const id = this.activeProfileId$.getValue();
    if (id === null) return null;
    return this.profiles.find((p) => p.id === id) || null;
  }

  setActiveProfile(profile: StoreProfile): void {
    localStorage.setItem(STORAGE_KEY, String(profile.id));
    this.activeProfileId$.next(profile.id);
  }

  private loadFromStorage(): number | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;
      const n = Number(raw);
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  }
}
