import {
  CompatibilityReasonCode,
  CompatibilityResult,
  PrimaryCompatibilityIndex,
  PrimaryCompatibilityOption,
  PrimarySelection,
} from '../models/compatibility';

const KEY_SEPARATOR = '\u0000';

export function buildPrimaryCompatibilityIndex(
  options: readonly PrimaryCompatibilityOption[],
): PrimaryCompatibilityIndex {
  const deityIdsByRaceClassKey = new Map<string, ReadonlySet<string>>();
  const classIdsByRaceId = new Map<string, Set<string>>();
  const raceIdsByClassId = new Map<string, Set<string>>();
  const deityIdsByRaceId = new Map<string, Set<string>>();
  const deityIdsByClassId = new Map<string, Set<string>>();
  const raceIdsByDeityId = new Map<string, Set<string>>();
  const classIdsByDeityId = new Map<string, Set<string>>();

  options.forEach((option, optionIndex) => {
    const context = `compatibility.json: primaryOptions[${optionIndex}]`;
    const key = raceClassKey(option.raceId, option.classId);

    if (deityIdsByRaceClassKey.has(key)) {
      throw new Error(
        `${context}: duplicate race/class join for "${option.raceId}"/"${option.classId}"`,
      );
    }

    const deityIds = new Set(option.deityIds);
    if (deityIds.size !== option.deityIds.length) {
      throw new Error(`${context}.deityIds: contains a duplicate deity ID`);
    }

    if (deityIds.size === 0) {
      throw new Error(`${context}.deityIds: must contain at least one deity ID`);
    }

    deityIdsByRaceClassKey.set(key, deityIds);
    addToSet(classIdsByRaceId, option.raceId, option.classId);
    addToSet(raceIdsByClassId, option.classId, option.raceId);

    deityIds.forEach((deityId) => {
      addToSet(deityIdsByRaceId, option.raceId, deityId);
      addToSet(deityIdsByClassId, option.classId, deityId);
      addToSet(raceIdsByDeityId, deityId, option.raceId);
      addToSet(classIdsByDeityId, deityId, option.classId);
    });
  });

  return {
    deityIdsByRaceClassKey,
    classIdsByRaceId,
    raceIdsByClassId,
    deityIdsByRaceId,
    deityIdsByClassId,
    raceIdsByDeityId,
    classIdsByDeityId,
  };
}

export function evaluatePrimaryCompatibility(
  index: PrimaryCompatibilityIndex,
  selection: PrimarySelection,
): CompatibilityResult {
  const { raceId, classId, deityId } = selection;

  if (raceId !== null && classId !== null) {
    const deityIds = index.deityIdsByRaceClassKey.get(raceClassKey(raceId, classId));
    if (deityIds === undefined) {
      return incompatible('race-class-incompatible');
    }

    if (deityId !== null && !deityIds.has(deityId)) {
      return incompatible('race-class-deity-incompatible');
    }

    return compatible();
  }

  if (raceId !== null && deityId !== null && !index.deityIdsByRaceId.get(raceId)?.has(deityId)) {
    return incompatible('race-deity-incompatible');
  }

  if (classId !== null && deityId !== null && !index.deityIdsByClassId.get(classId)?.has(deityId)) {
    return incompatible('class-deity-incompatible');
  }

  return compatible();
}

function raceClassKey(raceId: string, classId: string): string {
  return `${raceId}${KEY_SEPARATOR}${classId}`;
}

function addToSet(map: Map<string, Set<string>>, key: string, value: string): void {
  const values = map.get(key);
  if (values === undefined) {
    map.set(key, new Set([value]));
    return;
  }

  values.add(value);
}

function compatible(): CompatibilityResult {
  return { compatible: true, reasonCodes: [] };
}

function incompatible(reasonCode: CompatibilityReasonCode): CompatibilityResult {
  return { compatible: false, reasonCodes: [reasonCode] };
}
