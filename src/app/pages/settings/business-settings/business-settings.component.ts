import { Component, ChangeDetectorRef, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { VStoreProfileService, StoreProfile } from 'src/app/services/vendei/v-store-profile.service';

@Component({
  selector: 'app-business-settings',
  templateUrl: './business-settings.component.html',
  styleUrls: ['./business-settings.component.css'],
  standalone: false,
})
export class BusinessSettingsComponent implements OnInit, OnDestroy {
  profiles: StoreProfile[] = [];
  selectedProfileId: number | null = null;
  loading = true;
  loadFailed = false;
  saving = false;
  savedMessage = '';
  errorMessage = '';

  private subs = new Subscription();

  constructor(
    private profileSvc: VStoreProfileService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  get currentDefault(): StoreProfile | null {
    return this.profileSvc.getDefaultProfile(this.profiles);
  }

  private load(): void {
    this.loading = true;
    this.loadFailed = false;
    this.subs.add(
      this.profileSvc.getProfiles().subscribe((profiles) => {
        this.loading = false;
        this.profiles = profiles;
        if (profiles.length === 0) {
          this.loadFailed = true;
          this.errorMessage = 'No business profiles are available.';
          this.cdr.detectChanges();
          return;
        }
        const def = this.profileSvc.getDefaultProfile(profiles);
        this.selectedProfileId = def ? def.id : profiles[0].id;
        this.cdr.detectChanges();
      })
    );
  }

  retry(): void {
    this.errorMessage = '';
    this.load();
  }

  onSelectionChange(value: number): void {
    this.selectedProfileId = value;
    this.savedMessage = '';
    this.errorMessage = '';
  }

  save(): void {
    const target = this.profiles.find((p) => p.id === this.selectedProfileId);
    if (!target) return;
    this.saving = true;
    this.savedMessage = '';
    this.errorMessage = '';
    this.subs.add(
      this.profileSvc.setDefaultProfile(target).subscribe({
        next: (updated) => {
          this.saving = false;
          this.profiles = this.profiles.map((p) => ({
            ...p,
            defaultProfile: p.id === updated.id,
          }));
          this.savedMessage =
            `"Default Business Type" saved. The POS will open with ${this.displayName(updated)} on its next start.`;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.saving = false;
          this.errorMessage =
            'Could not save the default business type. ' + (err?.message || 'Please try again.');
          this.cdr.detectChanges();
        },
      })
    );
  }

  displayName(profile: StoreProfile): string {
    return profile.businessName || profile.name;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}