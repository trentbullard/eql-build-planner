import type { PrimaryCompatibilityOption } from '../models/compatibility';
import type { GameDataSnapshot, GameEntity } from '../models/game-data';
import { buildPrimaryCompatibilityIndex } from './primary-compatibility';

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface RawGameDataDocuments {
  readonly races: unknown;
  readonly classes: unknown;
  readonly deities: unknown;
  readonly compatibility: unknown;
}

interface ParsedDocument {
  readonly root: Record<string, unknown>;
  readonly gameDataVersion: string;
  readonly verificationStatus: string;
  readonly sourceIds: ReadonlySet<string>;
}

export function parseGameDataDocuments(documents: RawGameDataDocuments): GameDataSnapshot {
  const racesDocument = parseDocument('races.json', documents.races);
  const classesDocument = parseDocument('classes.json', documents.classes);
  const deitiesDocument = parseDocument('deities.json', documents.deities);
  const compatibilityDocument = parseDocument('compatibility.json', documents.compatibility);

  const versions = new Set([
    racesDocument.gameDataVersion,
    classesDocument.gameDataVersion,
    deitiesDocument.gameDataVersion,
    compatibilityDocument.gameDataVersion,
  ]);
  if (versions.size !== 1) {
    fail(
      'public/data',
      'documents',
      'gameDataVersion',
      `all files must share one version; found ${[...versions].join(', ')}`,
    );
  }

  const races = parseEntities('races.json', 'races', racesDocument, true);
  const classes = parseEntities('classes.json', 'classes', classesDocument, true);
  const deities = parseEntities('deities.json', 'deities', deitiesDocument, false);
  const primaryOptions = parsePrimaryOptions(compatibilityDocument, races, classes, deities);

  return {
    gameDataVersion: racesDocument.gameDataVersion,
    verificationStatus: compatibilityDocument.verificationStatus,
    races,
    classes,
    deities,
    primaryOptions,
    primaryCompatibilityIndex: buildPrimaryCompatibilityIndex(primaryOptions),
  };
}

function parseDocument(file: string, value: unknown): ParsedDocument {
  const root = requireRecord(file, 'document', value);
  if (root['schemaVersion'] !== 1) {
    fail(file, 'document', 'schemaVersion', 'must equal 1');
  }
  if (root['datasetStatus'] !== 'complete') {
    fail(file, 'document', 'datasetStatus', 'must equal "complete"');
  }

  const gameDataVersion = requireString(file, 'document', 'gameDataVersion', root);
  const verificationStatus = requireString(file, 'document', 'verificationStatus', root);
  const sources = requireArray(file, 'document', 'sources', root);
  if (sources.length === 0) {
    fail(file, 'document', 'sources', 'must contain at least one source');
  }

  const sourceIds = new Set<string>();
  sources.forEach((source, index) => {
    const sourceRecord = requireRecord(file, `sources[${index}]`, source);
    const sourceId = requireId(file, `sources[${index}]`, 'id', sourceRecord);
    if (sourceIds.has(sourceId)) {
      fail(file, `sources[${index}]`, 'id', `duplicate source ID "${sourceId}"`);
    }
    sourceIds.add(sourceId);
  });

  return { root, gameDataVersion, verificationStatus, sourceIds };
}

function parseEntities(
  file: string,
  collectionName: string,
  document: ParsedDocument,
  requiresAbbreviation: boolean,
): readonly GameEntity[] {
  const entities = requireArray(file, 'document', collectionName, document.root);
  if (entities.length === 0) {
    fail(file, 'document', collectionName, 'must contain at least one entity');
  }

  const entityIds = new Set<string>();
  return entities.map((entity, index) => {
    const context = `${collectionName}[${index}]`;
    const record = requireRecord(file, context, entity);
    const id = requireId(file, context, 'id', record);
    if (entityIds.has(id)) {
      fail(file, context, 'id', `duplicate entity ID "${id}"`);
    }
    entityIds.add(id);

    const sourceIds = requireStringArray(file, context, 'sourceIds', record);
    if (sourceIds.length === 0) {
      fail(file, context, 'sourceIds', 'must contain at least one source ID');
    }
    sourceIds.forEach((sourceId) => {
      if (!document.sourceIds.has(sourceId)) {
        fail(file, context, 'sourceIds', `references missing source "${sourceId}"`);
      }
    });

    return {
      id,
      name: requireString(file, context, 'name', record),
      abbreviation: requiresAbbreviation
        ? requireString(file, context, 'abbreviation', record)
        : null,
      discordEmote: requireNullableString(file, context, 'discordEmote', record),
    };
  });
}

function parsePrimaryOptions(
  document: ParsedDocument,
  races: readonly GameEntity[],
  classes: readonly GameEntity[],
  deities: readonly GameEntity[],
): readonly PrimaryCompatibilityOption[] {
  const file = 'compatibility.json';
  if (document.root['scope'] !== 'initial-primary-selection') {
    fail(file, 'document', 'scope', 'must equal "initial-primary-selection"');
  }

  const validRaceIds = new Set(races.map((race) => race.id));
  const validClassIds = new Set(classes.map((characterClass) => characterClass.id));
  const validDeityIds = new Set(deities.map((deity) => deity.id));
  const options = requireArray(file, 'document', 'primaryOptions', document.root);

  return options.map((option, index) => {
    const context = `primaryOptions[${index}]`;
    const record = requireRecord(file, context, option);
    const raceId = requireReference(file, context, 'raceId', record, validRaceIds);
    const classId = requireReference(file, context, 'classId', record, validClassIds);
    const deityIds = requireStringArray(file, context, 'deityIds', record);
    if (deityIds.length === 0) {
      fail(file, context, 'deityIds', 'must contain at least one deity ID');
    }
    deityIds.forEach((deityId) => {
      if (!validDeityIds.has(deityId)) {
        fail(file, context, 'deityIds', `references missing deity "${deityId}"`);
      }
    });

    return { raceId, classId, deityIds };
  });
}

function requireRecord(file: string, context: string, value: unknown): Record<string, unknown> {
  if (!isRecord(value)) {
    fail(file, context, 'value', 'must be an object');
  }
  return value;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireArray(
  file: string,
  context: string,
  field: string,
  record: Record<string, unknown>,
): readonly unknown[] {
  const value = record[field];
  if (!Array.isArray(value)) {
    fail(file, context, field, 'must be an array');
  }
  return value;
}

function requireString(
  file: string,
  context: string,
  field: string,
  record: Record<string, unknown>,
): string {
  const value = record[field];
  if (typeof value !== 'string' || value.length === 0) {
    fail(file, context, field, 'must be a non-empty string');
  }
  return value;
}

function requireNullableString(
  file: string,
  context: string,
  field: string,
  record: Record<string, unknown>,
): string | null {
  const value = record[field];
  if (value !== null && typeof value !== 'string') {
    fail(file, context, field, 'must be a string or null');
  }
  return value;
}

function requireStringArray(
  file: string,
  context: string,
  field: string,
  record: Record<string, unknown>,
): readonly string[] {
  const values = requireArray(file, context, field, record);
  return values.map((value, index) => {
    if (typeof value !== 'string' || value.length === 0) {
      fail(file, context, `${field}[${index}]`, 'must be a non-empty string');
    }
    return value;
  });
}

function requireId(
  file: string,
  context: string,
  field: string,
  record: Record<string, unknown>,
): string {
  const value = requireString(file, context, field, record);
  if (!ID_PATTERN.test(value)) {
    fail(file, context, field, `must be a stable kebab-case ID; received "${value}"`);
  }
  return value;
}

function requireReference(
  file: string,
  context: string,
  field: string,
  record: Record<string, unknown>,
  validIds: ReadonlySet<string>,
): string {
  const value = requireId(file, context, field, record);
  if (!validIds.has(value)) {
    fail(file, context, field, `references missing entity "${value}"`);
  }
  return value;
}

function fail(file: string, context: string, field: string, reason: string): never {
  throw new Error(`${file}: ${context}.${field}: ${reason}`);
}
