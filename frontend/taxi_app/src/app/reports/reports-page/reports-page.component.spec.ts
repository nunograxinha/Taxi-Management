import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RelatoriosPageComponent } from './reports-page.component';

describe('RelatoriosPageComponent', () => {
  let component: RelatoriosPageComponent;
  let fixture: ComponentFixture<RelatoriosPageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [RelatoriosPageComponent]
    });
    fixture = TestBed.createComponent(RelatoriosPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
