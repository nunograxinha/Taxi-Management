import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GerirPrecosComponent } from './gerir-precos.component';

describe('GerirPrecosComponent', () => {
  let component: GerirPrecosComponent;
  let fixture: ComponentFixture<GerirPrecosComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [GerirPrecosComponent]
    });
    fixture = TestBed.createComponent(GerirPrecosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
