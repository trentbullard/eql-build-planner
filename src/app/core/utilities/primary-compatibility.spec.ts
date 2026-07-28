import { describe, expect, it } from 'vitest';
import { PrimaryCompatibilityOption } from '../models/compatibility';
import {
  buildPrimaryCompatibilityIndex,
  evaluatePrimaryCompatibility,
} from './primary-compatibility';

const OPTIONS: readonly PrimaryCompatibilityOption[] = [
  {
    raceId: 'kerran',
    classId: 'shaman',
    deityIds: ['agnostic'],
  },
  {
    raceId: 'ogre',
    classId: 'shaman',
    deityIds: ['rallos-zek'],
  },
  {
    raceId: 'ogre',
    classId: 'warrior',
    deityIds: ['agnostic', 'cazic-thule', 'rallos-zek'],
  },
];

describe('primary compatibility', () => {
  it('builds forward and reverse indexes once from exact join rows', () => {
    const index = buildPrimaryCompatibilityIndex(OPTIONS);

    expect(index.classIdsByRaceId.get('ogre')).toEqual(new Set(['shaman', 'warrior']));
    expect(index.raceIdsByClassId.get('shaman')).toEqual(new Set(['kerran', 'ogre']));
    expect(index.deityIdsByRaceId.get('ogre')).toEqual(
      new Set(['rallos-zek', 'agnostic', 'cazic-thule']),
    );
    expect(index.raceIdsByDeityId.get('agnostic')).toEqual(new Set(['kerran', 'ogre']));
  });

  it('accepts an exact supported race, primary class, and deity combination', () => {
    const result = evaluatePrimaryCompatibility(buildPrimaryCompatibilityIndex(OPTIONS), {
      raceId: 'ogre',
      classId: 'shaman',
      deityId: 'rallos-zek',
    });

    expect(result).toEqual({ compatible: true, reasonCodes: [] });
  });

  it('rejects the pairwise false positive that the join disambiguates', () => {
    const index = buildPrimaryCompatibilityIndex(OPTIONS);

    expect(
      evaluatePrimaryCompatibility(index, {
        raceId: 'ogre',
        classId: null,
        deityId: 'agnostic',
      }).compatible,
    ).toBe(true);
    expect(
      evaluatePrimaryCompatibility(index, {
        raceId: null,
        classId: 'shaman',
        deityId: 'agnostic',
      }).compatible,
    ).toBe(true);
    expect(
      evaluatePrimaryCompatibility(index, {
        raceId: 'ogre',
        classId: 'shaman',
        deityId: 'agnostic',
      }),
    ).toEqual({
      compatible: false,
      reasonCodes: ['race-class-deity-incompatible'],
    });
  });

  it('supports incomplete selections in any order', () => {
    const index = buildPrimaryCompatibilityIndex(OPTIONS);

    expect(
      evaluatePrimaryCompatibility(index, {
        raceId: 'ogre',
        classId: 'warrior',
        deityId: null,
      }).compatible,
    ).toBe(true);
    expect(
      evaluatePrimaryCompatibility(index, {
        raceId: 'kerran',
        classId: null,
        deityId: 'rallos-zek',
      }),
    ).toEqual({
      compatible: false,
      reasonCodes: ['race-deity-incompatible'],
    });
  });

  it('rejects malformed duplicate join rows with an actionable location', () => {
    expect(() => buildPrimaryCompatibilityIndex([...OPTIONS, OPTIONS[0]])).toThrowError(
      'compatibility.json: primaryOptions[3]: duplicate race/class join for "kerran"/"shaman"',
    );
  });
});
