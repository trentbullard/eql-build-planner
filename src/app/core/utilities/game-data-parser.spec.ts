import { describe, expect, it } from 'vitest';
import type { RawGameDataDocuments } from './game-data-parser';
import { parseGameDataDocuments } from './game-data-parser';

describe('game data parser', () => {
  it('parses matching entity documents and builds the compatibility index', () => {
    const snapshot = parseGameDataDocuments(validDocuments());

    expect(snapshot.gameDataVersion).toBe('test');
    expect(snapshot.verificationStatus).toBe('community-reported');
    expect(snapshot.races.map((race) => race.id)).toEqual(['ogre']);
    expect(snapshot.primaryCompatibilityIndex.classIdsByRaceId.get('ogre')).toEqual(
      new Set(['shaman']),
    );
  });

  it('rejects broken compatibility references with an actionable diagnostic', () => {
    const documents = validDocuments();
    const compatibility = {
      ...validCompatibilityDocument(),
      primaryOptions: [
        {
          raceId: 'ogre',
          classId: 'missing-class',
          deityIds: ['rallos-zek'],
        },
      ],
    };

    expect(() => parseGameDataDocuments({ ...documents, compatibility })).toThrowError(
      'compatibility.json: primaryOptions[0].classId: references missing entity "missing-class"',
    );
  });

  it('rejects mismatched game-data versions', () => {
    const documents = validDocuments();
    const deities = { ...validDeitiesDocument(), gameDataVersion: 'other-version' };

    expect(() => parseGameDataDocuments({ ...documents, deities })).toThrowError(
      'public/data: documents.gameDataVersion: all files must share one version',
    );
  });
});

function validDocuments(): RawGameDataDocuments {
  return {
    races: {
      ...metadata(),
      races: [
        {
          id: 'ogre',
          name: 'Ogre',
          abbreviation: 'OGR',
          discordEmote: null,
          sourceIds: ['test-source'],
        },
      ],
    },
    classes: {
      ...metadata(),
      classes: [
        {
          id: 'shaman',
          name: 'Shaman',
          abbreviation: 'SHM',
          discordEmote: null,
          sourceIds: ['test-source'],
        },
      ],
    },
    deities: validDeitiesDocument(),
    compatibility: validCompatibilityDocument(),
  };
}

function validDeitiesDocument() {
  return {
    ...metadata(),
    deities: [
      {
        id: 'rallos-zek',
        name: 'Rallos Zek',
        discordEmote: null,
        sourceIds: ['test-source'],
      },
    ],
  };
}

function validCompatibilityDocument() {
  return {
    ...metadata(),
    scope: 'initial-primary-selection',
    primaryOptions: [
      {
        raceId: 'ogre',
        classId: 'shaman',
        deityIds: ['rallos-zek'],
      },
    ],
  };
}

function metadata() {
  return {
    schemaVersion: 1,
    gameDataVersion: 'test',
    datasetStatus: 'complete',
    verificationStatus: 'community-reported',
    sources: [{ id: 'test-source' }],
  };
}
