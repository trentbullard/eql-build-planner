# Static game-data shape

The data directory contains complete entity coverage and an exact compatibility
snapshot for initial race, primary-class, and deity selection. The application
does not load these files yet.

## File responsibilities

- `races.json`, `classes.json`, and `deities.json` own entity display data.
- `compatibility.json` owns every allowed race/primary-class join and the deity
  IDs allowed for that exact pair.
- Relationships reference stable kebab-case IDs. Entity names are not
  duplicated in compatibility rows.
- `secondaryTertiaryExclusions` is reserved for documented restrictions outside
  initial primary selection. It is currently empty.
- `tagAssignments` is reserved for sourced tag data and is currently empty.
- `null` means a value is unknown or has not been independently verified.

`datasetStatus: "complete"` means every entity and compatibility row in the
cited snapshot has been represented. It does not mean the community source has
been independently verified. The files therefore retain
`verificationStatus: "community-reported"` and `lastVerified: null`.

## Exact join structure

Each `primaryOptions` entry is one exact join:

```json
{
  "raceId": "ogre",
  "classId": "shaman",
  "deityIds": ["rallos-zek"]
}
```

This preserves information that pairwise projections lose. Ogre can select
Agnostic with some primary classes, and Shaman can select Agnostic with some
races, but the exact Ogre/Shaman row correctly excludes Agnostic.

## Front-end indexing

The pure `buildPrimaryCompatibilityIndex` utility converts the rows once into:

```text
deityIdsByRaceClassKey
classIdsByRaceId
raceIdsByClassId
deityIdsByRaceId
deityIdsByClassId
raceIdsByDeityId
classIdsByDeityId
```

Selectors can use the broad reverse indexes while one or two fields are
unselected, then use the exact race/class join when all three IDs are present.
`evaluatePrimaryCompatibility` accepts nullable race, class, and deity IDs, so
selection order does not matter. It returns a boolean plus structured reason
codes suitable for disabled-option explanations.

The indexes belong in a data repository or canonical state layer, not in
components or templates. Components should retain all options and derive
`enabled` and `reasonCodes` rather than hiding incompatible choices.

These restrictions apply to race, primary class, and deity. Secondary and
tertiary classes remain subject to duplicate-class checks and any future
explicit exceptions.

## Sources and scope

The EQL matrix is a snapshot of the EQL Tools Trio Builder data accessed on
2026-07-28. Its metadata identifies the character-creation source snapshot as
`charcreate-379a3c0cf4b0`; EQL Tools describes the race, primary-class, and
deity combinations as client-observed.

The Project 1999 sortable matrix is recorded as a classic baseline. It does not
cover EQL additions such as Kerran, Froglok, Beastlord, or Berserker and is not
used as authority for EQL-only rows.

## Validation

Run:

```bash
npm run validate:data
```

Validation checks document versions, stable IDs, duplicate entities, source
references, broken race/class/deity joins, duplicate joins, empty or duplicate
deity lists, and orphaned entities. Diagnostics identify the file, entity,
field, and reason. CI runs the same command before unit tests.
