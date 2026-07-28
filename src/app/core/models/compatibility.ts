export type RaceId = string;
export type ClassId = string;
export type DeityId = string;

export interface PrimaryCompatibilityOption {
  readonly raceId: RaceId;
  readonly classId: ClassId;
  readonly deityIds: readonly DeityId[];
}

export interface PrimarySelection {
  readonly raceId: RaceId | null;
  readonly classId: ClassId | null;
  readonly deityId: DeityId | null;
}

export type CompatibilityReasonCode =
  | 'race-class-incompatible'
  | 'race-deity-incompatible'
  | 'class-deity-incompatible'
  | 'race-class-deity-incompatible';

export interface CompatibilityResult {
  readonly compatible: boolean;
  readonly reasonCodes: readonly CompatibilityReasonCode[];
}

export interface PrimaryCompatibilityIndex {
  readonly deityIdsByRaceClassKey: ReadonlyMap<string, ReadonlySet<DeityId>>;
  readonly classIdsByRaceId: ReadonlyMap<RaceId, ReadonlySet<ClassId>>;
  readonly raceIdsByClassId: ReadonlyMap<ClassId, ReadonlySet<RaceId>>;
  readonly deityIdsByRaceId: ReadonlyMap<RaceId, ReadonlySet<DeityId>>;
  readonly deityIdsByClassId: ReadonlyMap<ClassId, ReadonlySet<DeityId>>;
  readonly raceIdsByDeityId: ReadonlyMap<DeityId, ReadonlySet<RaceId>>;
  readonly classIdsByDeityId: ReadonlyMap<DeityId, ReadonlySet<ClassId>>;
}
