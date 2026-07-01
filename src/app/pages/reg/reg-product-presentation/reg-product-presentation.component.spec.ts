import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';

import { RegProductPresentationComponent } from './reg-product-presentation.component';

describe('RegProductPresentationComponent', () => {
  let component: RegProductPresentationComponent;
  let fixture: ComponentFixture<RegProductPresentationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RegProductPresentationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RegProductPresentationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
