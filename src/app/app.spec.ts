import { TestBed } from '@angular/core/testing';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Plan your multiclass build');
  });

  it('should render every core build control', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const labels = Array.from(compiled.querySelectorAll('mat-label')).map((label) =>
      label.textContent?.trim(),
    );

    expect(labels).toEqual(
      expect.arrayContaining([
        'Race',
        'Deity',
        'Primary class',
        'Secondary class',
        'Tertiary class',
        'Level',
      ]),
    );
    expect(compiled.querySelector('#aa-input')).toBeTruthy();
  });

  it('should increment earned AA points', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const increaseButton = compiled.querySelector(
      'button[aria-label="Increase earned AA points"]',
    ) as HTMLButtonElement;

    increaseButton.click();
    fixture.detectChanges();

    expect((compiled.querySelector('#aa-input') as HTMLInputElement).value).toBe('1');
  });
});
