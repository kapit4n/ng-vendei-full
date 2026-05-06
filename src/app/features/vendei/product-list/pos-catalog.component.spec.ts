import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PosCatalogComponent } from './pos-catalog.component';
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { provideHttpClient, withInterceptorsFromDi } from "@angular/common/http"; 
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

describe('PosCatalogComponent', () => {
  let component: PosCatalogComponent;
  let fixture: ComponentFixture<PosCatalogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
    declarations: [PosCatalogComponent],
    imports: [MatIconModule,
        MatInputModule,
        BrowserAnimationsModule],
    providers: [provideHttpClient(withInterceptorsFromDi())]
}).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PosCatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
