import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import type { PrimaryCompatibilityOption } from './core/models/compatibility';
import type { GameDataSnapshot } from './core/models/game-data';
import { GameDataService } from './core/services/game-data';
import { buildPrimaryCompatibilityIndex } from './core/utilities/primary-compatibility';
import { App } from './app';

const PRIMARY_OPTIONS: readonly PrimaryCompatibilityOption[] = [
  { raceId: 'kerran', classId: 'shaman', deityIds: ['agnostic'] },
  { raceId: 'ogre', classId: 'shaman', deityIds: ['rallos-zek'] },
  {
    raceId: 'ogre',
    classId: 'warrior',
    deityIds: ['agnostic', 'cazic-thule', 'rallos-zek'],
  },
];

const SNAPSHOT: GameDataSnapshot = {
  gameDataVersion: 'test',
  verificationStatus: 'community-reported',
  races: [
    {
      id: 'kerran',
      name: 'Kerran',
      abbreviation: 'KER',
      discordEmote: null,
    },
    {
      id: 'ogre',
      name: 'Ogre',
      abbreviation: 'OGR',
      discordEmote: null,
    },
  ],
  classes: [
    {
      id: 'shaman',
      name: 'Shaman',
      abbreviation: 'SHM',
      discordEmote: null,
    },
    {
      id: 'warrior',
      name: 'Warrior',
      abbreviation: 'WAR',
      discordEmote: null,
    },
  ],
  deities: [
    {
      id: 'agnostic',
      name: 'Agnostic',
      abbreviation: null,
      discordEmote: null,
    },
    {
      id: 'cazic-thule',
      name: 'Cazic-Thule',
      abbreviation: null,
      discordEmote: null,
    },
    {
      id: 'rallos-zek',
      name: 'Rallos Zek',
      abbreviation: null,
      discordEmote: null,
    },
  ],
  primaryOptions: PRIMARY_OPTIONS,
  primaryCompatibilityIndex: buildPrimaryCompatibilityIndex(PRIMARY_OPTIONS),
};

describe('App', () => {
  beforeEach(async () => {
    const gameData = {
      snapshot: signal<GameDataSnapshot | null>(SNAPSHOT).asReadonly(),
      status: signal<'ready'>('ready').asReadonly(),
      error: signal<string | null>(null).asReadonly(),
      load: vi.fn().mockResolvedValue(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: GameDataService, useValue: gameData }],
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

  it('loads the sourced race, class, and deity values into the selectors', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const selects = await loader.getAllHarnesses(MatSelectHarness);

    await expectOptionTexts(selects, 0, ['Not selected', 'Kerran', 'Ogre']);
    await expectOptionTexts(selects, 1, ['Not selected', 'Agnostic', 'Cazic-Thule', 'Rallos Zek']);
    await expectOptionTexts(selects, 2, ['Not selected', 'Shaman', 'Warrior']);
    await expectOptionTexts(selects, 3, ['Not selected', 'Shaman', 'Warrior']);
    await expectOptionTexts(selects, 4, ['Not selected', 'Shaman', 'Warrior']);
  });

  it('disables exact incompatibilities and explains them without hiding the option', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    const raceSelect = requireSelect(selects, 0);
    const deitySelect = requireSelect(selects, 1);
    const primarySelect = requireSelect(selects, 2);

    await selectOption(raceSelect, /^Ogre$/);
    await selectOption(primarySelect, /^Shaman$/);

    await deitySelect.open();
    const agnostic = await deitySelect.getOptions({ text: /^Agnostic/ });
    const rallosZek = await deitySelect.getOptions({ text: /^Rallos Zek/ });

    expect(agnostic).toHaveLength(1);
    expect(await agnostic[0].isDisabled()).toBe(true);
    expect(await agnostic[0].getText()).toContain('Ogre Shaman cannot select Agnostic');
    expect(await rallosZek[0].isDisabled()).toBe(false);
  });

  it('prevents duplicate classes across the three class selectors', async () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const selects = await loader.getAllHarnesses(MatSelectHarness);
    const primarySelect = requireSelect(selects, 2);
    const secondarySelect = requireSelect(selects, 3);

    await selectOption(primarySelect, /^Shaman$/);
    await secondarySelect.open();
    const shaman = await secondarySelect.getOptions({ text: /^Shaman/ });

    expect(shaman).toHaveLength(1);
    expect(await shaman[0].isDisabled()).toBe(true);
    expect(await shaman[0].getText()).toContain('already selected as the primary class');
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

async function expectOptionTexts(
  selects: readonly MatSelectHarness[],
  index: number,
  expected: readonly string[],
): Promise<void> {
  const select = requireSelect(selects, index);
  await select.open();
  const options = await select.getOptions();
  expect(await Promise.all(options.map((option) => option.getText()))).toEqual(expected);
  await select.close();
}

function requireSelect(selects: readonly MatSelectHarness[], index: number): MatSelectHarness {
  const select = selects[index];
  if (select === undefined) {
    throw new Error(`Expected select harness at index ${index}`);
  }
  return select;
}

async function selectOption(select: MatSelectHarness, text: RegExp): Promise<void> {
  await select.open();
  const options = await select.getOptions({ text });
  const option = options[0];
  if (option === undefined) {
    throw new Error(`Expected option matching ${text}`);
  }
  await option.click();
}
