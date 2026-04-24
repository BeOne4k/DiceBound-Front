import { TestBed } from '@angular/core/testing';

import { Combat } from './combat';

describe('Combat', () => {
  let service: Combat;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Combat);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
