import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureOffboarding } from './feature-offboarding';

describe('FeatureOffboarding', () => {
  let component: FeatureOffboarding;
  let fixture: ComponentFixture<FeatureOffboarding>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeatureOffboarding],
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureOffboarding);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
