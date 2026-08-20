import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-profile-switch-dialog',
  template: `
    <h2 mat-dialog-title>Cambiar tipo de negocio</h2>
    <mat-dialog-content>
      <p>El carrito tiene productos. Cambiar a <strong>{{ data.profileName }}</strong> limpiará el carrito actual.</p>
      <p class="hint">¿Desea continuar?</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="true">Continuar</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .hint { color: #64748b; margin-top: 8px; }
  `],
  standalone: false,
})
export class ProfileSwitchDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ProfileSwitchDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { profileName: string }
  ) {}
}
