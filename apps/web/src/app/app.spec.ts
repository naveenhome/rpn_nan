import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { App } from './app';

describe('App', () => {
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('renders the title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('RPN Calculator');
  });

  it('evaluates an expression and shows the result', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance['expression'].setValue('3 4 +');
    fixture.componentInstance['evaluate']();

    http.expectOne('/api/v1/calculate').flush({
      id: 0,
      expression: '3 4 +',
      result: 7,
      createdAt: new Date().toISOString(),
      saved: false,
    });

    await fixture.whenStable();
    fixture.detectChanges();
    const result = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="result"]',
    );
    expect(result?.textContent).toContain('= 7');
  });

  it('shows a friendly error on failure', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.componentInstance['expression'].setValue('3 +');
    fixture.componentInstance['evaluate']();

    http.expectOne('/api/v1/calculate').flush(
      {
        statusCode: 422,
        error: 'Unprocessable Entity',
        message: 'Operator "+" needs two operands.',
        code: 'UNDERFLOW',
      },
      { status: 422, statusText: 'Unprocessable Entity' },
    );

    await fixture.whenStable();
    fixture.detectChanges();
    const err = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-testid="error"]',
    );
    expect(err?.textContent).toContain('aren’t enough numbers');
  });
});
