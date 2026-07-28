import { readFile } from 'node:fs/promises';

const DATA_DIRECTORY = new URL('../public/data/', import.meta.url);
const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const entityDefinitions = [
  { file: 'races.json', collection: 'races' },
  { file: 'classes.json', collection: 'classes' },
  { file: 'deities.json', collection: 'deities' },
];

try {
  const entityDocuments = await Promise.all(
    entityDefinitions.map(async (definition) => ({
      ...definition,
      document: await readJson(definition.file),
    })),
  );
  const compatibility = await readJson('compatibility.json');

  const versions = new Set();
  const idsByCollection = new Map();

  for (const { file, collection, document } of entityDocuments) {
    validateDocumentMetadata(file, document);
    versions.add(document.gameDataVersion);
    idsByCollection.set(collection, validateEntities(file, collection, document));
  }

  validateDocumentMetadata('compatibility.json', compatibility);
  versions.add(compatibility.gameDataVersion);
  if (versions.size !== 1) {
    fail(
      'public/data',
      'documents',
      'gameDataVersion',
      `all data documents must share one version; found ${[...versions].join(', ')}`,
    );
  }

  validateCompatibility(compatibility, idsByCollection);
  console.log(
    `Validated ${idsByCollection.get('races').size} races, ` +
      `${idsByCollection.get('classes').size} classes, ` +
      `${idsByCollection.get('deities').size} deities, and ` +
      `${compatibility.primaryOptions.length} primary compatibility rows.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

async function readJson(file) {
  try {
    return JSON.parse(await readFile(new URL(file, DATA_DIRECTORY), 'utf8'));
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    fail(file, 'document', 'JSON', `could not parse: ${reason}`);
  }
}

function validateDocumentMetadata(file, document) {
  if (document.schemaVersion !== 1) {
    fail(file, 'document', 'schemaVersion', 'must equal 1');
  }
  if (typeof document.gameDataVersion !== 'string' || document.gameDataVersion.length === 0) {
    fail(file, 'document', 'gameDataVersion', 'must be a non-empty string');
  }
  if (document.datasetStatus !== 'complete') {
    fail(file, 'document', 'datasetStatus', 'must equal "complete"');
  }
  if (!Array.isArray(document.sources) || document.sources.length === 0) {
    fail(file, 'document', 'sources', 'must contain at least one source');
  }

  const sourceIds = new Set();
  document.sources.forEach((source, index) => {
    validateId(file, `sources[${index}]`, 'id', source.id);
    if (sourceIds.has(source.id)) {
      fail(file, `sources[${index}]`, 'id', `duplicate source ID "${source.id}"`);
    }
    sourceIds.add(source.id);
  });
}

function validateEntities(file, collection, document) {
  if (!Array.isArray(document[collection]) || document[collection].length === 0) {
    fail(file, 'document', collection, 'must contain at least one entity');
  }

  const sourceIds = new Set(document.sources.map((source) => source.id));
  const entityIds = new Set();

  document[collection].forEach((entity, index) => {
    const context = `${collection}[${index}]`;
    validateId(file, context, 'id', entity.id);
    if (entityIds.has(entity.id)) {
      fail(file, context, 'id', `duplicate entity ID "${entity.id}"`);
    }
    entityIds.add(entity.id);

    if (typeof entity.name !== 'string' || entity.name.length === 0) {
      fail(file, context, 'name', 'must be a non-empty string');
    }
    if (!Array.isArray(entity.sourceIds) || entity.sourceIds.length === 0) {
      fail(file, context, 'sourceIds', 'must contain at least one source ID');
    }
    entity.sourceIds.forEach((sourceId) => {
      if (!sourceIds.has(sourceId)) {
        fail(file, context, 'sourceIds', `references missing source "${sourceId}"`);
      }
    });
  });

  return entityIds;
}

function validateCompatibility(document, idsByCollection) {
  if (document.scope !== 'initial-primary-selection') {
    fail('compatibility.json', 'document', 'scope', 'must equal "initial-primary-selection"');
  }
  if (!Array.isArray(document.primaryOptions) || document.primaryOptions.length === 0) {
    fail('compatibility.json', 'document', 'primaryOptions', 'must contain at least one join');
  }

  const raceIds = idsByCollection.get('races');
  const classIds = idsByCollection.get('classes');
  const deityIds = idsByCollection.get('deities');
  const usedRaceIds = new Set();
  const usedClassIds = new Set();
  const usedDeityIds = new Set();
  const joinKeys = new Set();

  document.primaryOptions.forEach((option, index) => {
    const context = `primaryOptions[${index}]`;
    validateReference('compatibility.json', context, 'raceId', option.raceId, raceIds);
    validateReference('compatibility.json', context, 'classId', option.classId, classIds);

    const joinKey = `${option.raceId}\u0000${option.classId}`;
    if (joinKeys.has(joinKey)) {
      fail(
        'compatibility.json',
        context,
        'raceId/classId',
        `duplicate join "${option.raceId}"/"${option.classId}"`,
      );
    }
    joinKeys.add(joinKey);
    usedRaceIds.add(option.raceId);
    usedClassIds.add(option.classId);

    if (!Array.isArray(option.deityIds) || option.deityIds.length === 0) {
      fail('compatibility.json', context, 'deityIds', 'must contain at least one deity ID');
    }
    const rowDeityIds = new Set();
    option.deityIds.forEach((deityId) => {
      validateReference('compatibility.json', context, 'deityIds', deityId, deityIds);
      if (rowDeityIds.has(deityId)) {
        fail('compatibility.json', context, 'deityIds', `contains duplicate "${deityId}"`);
      }
      rowDeityIds.add(deityId);
      usedDeityIds.add(deityId);
    });
  });

  validateCoverage('races', raceIds, usedRaceIds);
  validateCoverage('classes', classIds, usedClassIds);
  validateCoverage('deities', deityIds, usedDeityIds);
}

function validateCoverage(collection, declaredIds, usedIds) {
  for (const id of declaredIds) {
    if (!usedIds.has(id)) {
      fail(
        'compatibility.json',
        collection,
        'primaryOptions',
        `entity "${id}" has no compatibility join`,
      );
    }
  }
}

function validateId(file, entity, field, value) {
  if (typeof value !== 'string' || !ID_PATTERN.test(value)) {
    fail(file, entity, field, `must be a stable kebab-case ID; received "${value}"`);
  }
}

function validateReference(file, entity, field, value, validIds) {
  validateId(file, entity, field, value);
  if (!validIds.has(value)) {
    fail(file, entity, field, `references missing entity "${value}"`);
  }
}

function fail(file, entity, field, reason) {
  throw new Error(`${file}: ${entity}.${field}: ${reason}`);
}
