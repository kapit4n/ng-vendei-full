import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MainScreenshotComponent } from './main-screenshot.component';

describe('MainScreenshotComponent', () => {
  let component: MainScreenshotComponent;
  let fixture: ComponentFixture<MainScreenshotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MainScreenshotComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MainScreenshotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
