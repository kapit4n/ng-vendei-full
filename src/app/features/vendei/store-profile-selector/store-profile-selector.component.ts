import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MatDialog } from '@angular/material/dialog';
import {
  VStoreProfileService,
  StoreProfile,
} from '../../../services/vendei/v-store-profile.service';

@Component({
  selector: 'app-store-profile-selector',
  templateUrl: './store-profile-selector.component.html',
  styleUrls: ['./store-profile-selector.component.css'],
  standalone: false,
})
export class StoreProfileSelectorComponent implements OnInit, OnDestroy {
  @Output() profileChanged = new EventEmitter<StoreProfile>();

  profiles: StoreProfile[] = [];
  activeProfileId: number | null = null;
  loading = true;

  private destroy$ = new Subject<void>();

  constructor(
    private profileSvc: VStoreProfileService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.profileSvc.getProfiles().pipe(takeUntil(this.destroy$)).subscribe((profiles) => {
      this.profiles = profiles;
      this.loading = false;
    });

    this.profileSvc.getActiveProfileId$().pipe(takeUntil(this.destroy$)).subscribe((id) => {
      this.activeProfileId = id;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get activeProfile(): StoreProfile | null {
    return this.profiles.find((p) => p.id === this.activeProfileId) || null;
  }

  onSelectionChange(profileId: number): void {
    const profile = this.profiles.find((p) => p.id === profileId);
    if (!profile || profile.id === this.activeProfileId) return;
    this.profileSvc.setActiveProfile(profile);
    this.profileChanged.emit(profile);
  }
}
