import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import type { CompatibilityResult, PrimarySelection } from './core/models/compatibility';
import type { GameEntity } from './core/models/game-data';
import { GameDataService } from './core/services/game-data';
import { evaluatePrimaryCompatibility } from './core/utilities/primary-compatibility';

type SelectionField = 'race' | 'deity' | 'primaryClass' | 'secondaryClass' | 'tertiaryClass';
type ClassSelectionField = 'primaryClass' | 'secondaryClass' | 'tertiaryClass';
type NumberField = 'level' | 'earnedAa';

interface BuildDraft {
  readonly race: string | null;
  readonly deity: string | null;
  readonly primaryClass: string | null;
  readonly secondaryClass: string | null;
  readonly tertiaryClass: string | null;
  readonly level: number;
  readonly earnedAa: number;
}

interface SelectOptionState {
  readonly id: string;
  readonly label: string;
  readonly enabled: boolean;
  readonly reason: string | null;
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

const CLASS_FIELDS: readonly {
  readonly field: ClassSelectionField;
  readonly label: string;
}[] = [
  { field: 'primaryClass', label: 'primary class' },
  { field: 'secondaryClass', label: 'secondary class' },
  { field: 'tertiaryClass', label: 'tertiary class' },
];

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
export class App implements OnInit {
  private readonly gameData = inject(GameDataService);

  protected readonly build = signal<BuildDraft>(INITIAL_BUILD);
  protected readonly dataStatus = this.gameData.status;
  protected readonly dataError = this.gameData.error;
  protected readonly dataVersion = computed(
    () => this.gameData.snapshot()?.gameDataVersion ?? null,
  );
  protected readonly dataVerificationLabel = computed(() => {
    const status = this.gameData.snapshot()?.verificationStatus;
    return status === 'community-reported' ? 'Community-reported data' : (status ?? null);
  });

  private readonly raceNameById = computed(
    () => new Map(this.gameData.snapshot()?.races.map((race) => [race.id, race.name]) ?? []),
  );
  private readonly classNameById = computed(
    () =>
      new Map(
        this.gameData
          .snapshot()
          ?.classes.map((characterClass) => [characterClass.id, characterClass.name]) ?? [],
      ),
  );
  private readonly deityNameById = computed(
    () => new Map(this.gameData.snapshot()?.deities.map((deity) => [deity.id, deity.name]) ?? []),
  );

  protected readonly raceOptions = computed(() =>
    this.sortedEntities(this.gameData.snapshot()?.races ?? []).map((race) =>
      this.toCompatibilityOption(race, {
        raceId: race.id,
        classId: this.build().primaryClass,
        deityId: this.build().deity,
      }),
    ),
  );

  protected readonly deityOptions = computed(() =>
    this.sortedEntities(this.gameData.snapshot()?.deities ?? []).map((deity) =>
      this.toCompatibilityOption(deity, {
        raceId: this.build().race,
        classId: this.build().primaryClass,
        deityId: deity.id,
      }),
    ),
  );

  protected readonly primaryClassOptions = computed(() =>
    this.sortedEntities(this.gameData.snapshot()?.classes ?? []).map((characterClass) =>
      this.toClassOption('primaryClass', characterClass),
    ),
  );

  protected readonly secondaryClassOptions = computed(() =>
    this.sortedEntities(this.gameData.snapshot()?.classes ?? []).map((characterClass) =>
      this.toClassOption('secondaryClass', characterClass),
    ),
  );

  protected readonly tertiaryClassOptions = computed(() =>
    this.sortedEntities(this.gameData.snapshot()?.classes ?? []).map((characterClass) =>
      this.toClassOption('tertiaryClass', characterClass),
    ),
  );

  protected readonly conflictMessages = computed(() => {
    const snapshot = this.gameData.snapshot();
    if (snapshot === null) {
      return [];
    }

    const messages: string[] = [];
    const build = this.build();
    const compatibility = evaluatePrimaryCompatibility(snapshot.primaryCompatibilityIndex, {
      raceId: build.race,
      classId: build.primaryClass,
      deityId: build.deity,
    });
    const compatibilityMessage = this.compatibilityMessage(compatibility, {
      raceId: build.race,
      classId: build.primaryClass,
      deityId: build.deity,
    });
    if (compatibilityMessage !== null) {
      messages.push(compatibilityMessage);
    }

    CLASS_FIELDS.forEach((selection, index) => {
      const selectedId = build[selection.field];
      if (selectedId === null) {
        return;
      }

      CLASS_FIELDS.slice(index + 1).forEach((otherSelection) => {
        if (build[otherSelection.field] === selectedId) {
          messages.push(
            `${this.className(selectedId)} is selected as both ${selection.label} and ${otherSelection.label}.`,
          );
        }
      });
    });

    return messages;
  });

  ngOnInit(): void {
    void this.gameData.load();
  }

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

  private toCompatibilityOption(
    entity: GameEntity,
    selection: PrimarySelection,
  ): SelectOptionState {
    const index = this.gameData.snapshot()?.primaryCompatibilityIndex;
    if (index === undefined) {
      return { id: entity.id, label: entity.name, enabled: false, reason: null };
    }

    const result = evaluatePrimaryCompatibility(index, selection);
    return {
      id: entity.id,
      label: entity.name,
      enabled: result.compatible,
      reason: this.compatibilityMessage(result, selection),
    };
  }

  private toClassOption(field: ClassSelectionField, entity: GameEntity): SelectOptionState {
    const duplicateReason = this.duplicateClassReason(field, entity.id);
    if (duplicateReason !== null) {
      return {
        id: entity.id,
        label: entity.name,
        enabled: false,
        reason: duplicateReason,
      };
    }

    if (field !== 'primaryClass') {
      return { id: entity.id, label: entity.name, enabled: true, reason: null };
    }

    return this.toCompatibilityOption(entity, {
      raceId: this.build().race,
      classId: entity.id,
      deityId: this.build().deity,
    });
  }

  private duplicateClassReason(field: ClassSelectionField, candidateId: string): string | null {
    const build = this.build();
    for (const selection of CLASS_FIELDS) {
      if (selection.field !== field && build[selection.field] === candidateId) {
        return `${this.className(candidateId)} is already selected as the ${selection.label}.`;
      }
    }
    return null;
  }

  private compatibilityMessage(
    result: CompatibilityResult,
    selection: PrimarySelection,
  ): string | null {
    if (result.compatible) {
      return null;
    }

    for (const reasonCode of result.reasonCodes) {
      switch (reasonCode) {
        case 'race-class-incompatible':
          return `${this.raceName(selection.raceId)} cannot select ${this.className(selection.classId)} as a primary class.`;
        case 'race-deity-incompatible':
          return `${this.raceName(selection.raceId)} cannot select ${this.deityName(selection.deityId)}.`;
        case 'class-deity-incompatible':
          return `${this.className(selection.classId)} cannot select ${this.deityName(selection.deityId)}.`;
        case 'race-class-deity-incompatible':
          return `${this.raceName(selection.raceId)} ${this.className(selection.classId)} cannot select ${this.deityName(selection.deityId)}.`;
      }
    }

    return 'This combination is incompatible.';
  }

  private raceName(id: string | null): string {
    return id === null ? 'The selected race' : (this.raceNameById().get(id) ?? id);
  }

  private className(id: string | null): string {
    return id === null ? 'The selected class' : (this.classNameById().get(id) ?? id);
  }

  private deityName(id: string | null): string {
    return id === null ? 'the selected deity' : (this.deityNameById().get(id) ?? id);
  }

  private sortedEntities(entities: readonly GameEntity[]): readonly GameEntity[] {
    return [...entities].sort((left, right) => left.name.localeCompare(right.name));
  }

  private setNumber(field: NumberField, value: number): void {
    const limits = field === 'level' ? { min: 1, max: 60 } : { min: 0, max: 9999 };
    const safeValue = Number.isFinite(value)
      ? Math.min(limits.max, Math.max(limits.min, Math.round(value)))
      : limits.min;

    this.build.update((current) => ({ ...current, [field]: safeValue }));
  }
}
