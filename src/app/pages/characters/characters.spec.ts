import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Characters } from './characters';

describe('Characters', () => {
  let component: Characters;
  let fixture: ComponentFixture<Characters>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Characters]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Characters);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
