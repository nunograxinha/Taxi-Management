import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AguardarRespostaComponent } from './waiting-response.component';

describe('AguardarRespostaComponent', () => {
  let component: AguardarRespostaComponent;
  let fixture: ComponentFixture<AguardarRespostaComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [AguardarRespostaComponent]
    });
    fixture = TestBed.createComponent(AguardarRespostaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
