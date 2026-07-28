import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';

type SelectionField = 'race' | 'deity' | 'primaryClass' | 'secondaryClass' | 'tertiaryClass';
type NumberField = 'level' | 'earnedAa';

interface BuildDraft {
  race: string | null;
  deity: string | null;
  primaryClass: string | null;
  secondaryClass: string | null;
  tertiaryClass: string | null;
  level: number;
  earnedAa: number;
}

interface SelectOption {
  readonly id: string;
  readonly label: string;
}

const INITIAL_BUILD: BuildDraft = {
  race: null,
  deity: null,
  primaryClass: null,
  secondaryClass: null,
  tertiaryClass: null,
  level: 1,
  earnedAa: 0,
};

@Component({
  selector: 'app-root',
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSliderModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly build = signal<BuildDraft>(INITIAL_BUILD);

  protected readonly races: readonly SelectOption[] = [
    { id: 'human', label: 'Human' },
    { id: 'barbarian', label: 'Barbarian' },
    { id: 'dark-elf', label: 'Dark Elf' },
    { id: 'dwarf', label: 'Dwarf' },
    { id: 'wood-elf', label: 'Wood Elf' },
  ];

  protected readonly deities: readonly SelectOption[] = [
    { id: 'agnostic', label: 'Agnostic' },
    { id: 'brell-serilis', label: 'Brell Serilis' },
    { id: 'cazic-thule', label: 'Cazic-Thule' },
    { id: 'innoruuk', label: 'Innoruuk' },
    { id: 'tunare', label: 'Tunare' },
  ];

  protected readonly classes: readonly SelectOption[] = [
    { id: 'bard', label: 'Bard' },
    { id: 'cleric', label: 'Cleric' },
    { id: 'druid', label: 'Druid' },
    { id: 'monk', label: 'Monk' },
    { id: 'rogue', label: 'Rogue' },
    { id: 'warrior', label: 'Warrior' },
    { id: 'wizard', label: 'Wizard' },
  ];

  protected setSelection(field: SelectionField, change: MatSelectChange): void {
    const value = typeof change.value === 'string' ? change.value : null;
    this.build.update((current) => ({ ...current, [field]: value }));
  }

  protected setLevel(value: number): void {
    this.setNumber('level', value);
  }

  protected onNumberInput(field: NumberField, event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.setNumber(field, Number(target.value));
  }

  protected adjust(field: NumberField, amount: number): void {
    this.setNumber(field, this.build()[field] + amount);
  }

  protected resetBuild(): void {
    this.build.set(INITIAL_BUILD);
  }

  private setNumber(field: NumberField, value: number): void {
    const limits = field === 'level' ? { min: 1, max: 60 } : { min: 0, max: 9999 };
    const safeValue = Number.isFinite(value)
      ? Math.min(limits.max, Math.max(limits.min, Math.round(value)))
      : limits.min;

    this.build.update((current) => ({ ...current, [field]: safeValue }));
  }
}
