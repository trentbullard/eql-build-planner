# EverQuest Legends Build Planner

A fast, browser-based character and Alternate Advancement (AA) planner for the
EverQuest Legends multiclass server.

> [!IMPORTANT]
> The first UI prototype is implemented with interactive build and progression
> controls. Compatibility behavior and production game data are not implemented yet.

See [vision.md](vision.md) for the detailed product requirements, design
principles, delivery phases, and acceptance criteria. Coding agents should also
follow [AGENTS.md](AGENTS.md).

## What the planner will do

The finished planner will let players experiment with:

- Race
- Primary, secondary, and tertiary classes
- Deity
- Character level
- Earned and spent AA points

Selections will update compatible choices, available AAs, strengths,
weaknesses, and capabilities immediately. A complete build will be encoded in
the URL so it can be reloaded and shared without an account or backend.

The central product questions are:

1. What can I still choose?
2. Why is an option compatible or incompatible?
3. What does this choice add to—or leave missing from—the build?

## Current status

Implemented:

- Angular 22 standalone application scaffold
- Strict TypeScript and strict Angular template checking
- Angular Router using hash-based URLs for GitHub Pages compatibility
- Angular Material 3 theming with the Azure and blue palettes
- SCSS styles
- Vitest unit-test configuration
- Prettier configuration
- Responsive, accessible application header and main build form
- Data-backed race, deity, primary, secondary, tertiary, level, and earned-AA controls
- Complete race, class, and deity entity files for the current sourced snapshot
- Exact race/primary-class/deity compatibility joins with indexed pure lookup logic
- Bidirectional option disabling with compatibility and duplicate-class explanations
- Runtime parsing with visible loading and data-error states
- Static-data validation locally and in CI
- Dark-mode interface enabled by default
- GitHub Actions validation and deployment to GitHub Pages from `master`

The selectors load the complete sourced files under `public/data`. Race,
primary-class, and deity availability is evaluated bidirectionally from the
exact join, and duplicate classes are disabled across the three class slots.
Incompatible options remain visible with an explanation. Existing selections
are preserved if later choices create a conflict.

Planned application features:

- Per-selector capability and playstyle tags
- One-action targeted conflict resolution
- Combined-build strengths, weaknesses, and capability analysis
- Level-aware AA purchasing, refunds, prerequisites, and automatic grants
- Deterministic URL state and Discord-emote sharing
- Runtime and CI validation for static game data
- Playwright end-to-end tests

## Technology versions

The initial lockfile was generated with the following toolchain:

| Tool                    | Version           |
| ----------------------- | ----------------- |
| Node.js                 | 24.15.0 via Volta |
| npm                     | 11.12.1 via Volta |
| Angular framework       | 22.0.8            |
| Angular CLI/build tools | 22.0.8            |
| Angular Material/CDK    | 22.0.6            |
| TypeScript              | 6.0.3             |
| RxJS                    | 7.8.2             |
| Vitest                  | 4.1.10            |
| Prettier                | 3.9.6             |

Angular 22.0.8 supports Node.js `^22.22.3`, `^24.15.0`, or `>=26.0.0`. This
repository uses the `volta` section of `package.json` to select Node.js 24.15.0
and npm 11.12.1 automatically. The `package-lock.json` file is the authority
for exact installed dependency versions.

## Prerequisites

Install:

- [Volta](https://volta.sh/)
- Git

Volta reads the pinned versions from `package.json` whenever a command runs in
this repository. To install the same versions as your global defaults:

```bash
volta install node@24.15.0
volta install npm@11.12.1
```

Confirm that Volta selected the project tools:

```bash
node --version
npm --version
volta which node
volta which npm
```

## Install

From the repository root:

```bash
npm install
```

For a clean, lockfile-exact installation, such as in CI:

```bash
npm ci
```

Do not commit `node_modules/`; dependencies are reproduced from
`package.json` and `package-lock.json`.

## Run locally

Start the Angular development server:

```bash
npm start
```

Open <http://localhost:4200/>. The server watches source files and reloads the
page as changes are saved. Stop it with `Ctrl+C`.

To pass Angular CLI options through npm, add `--`:

```bash
npm start -- --port 4300
```

## Build

Create an optimized production build:

```bash
npm run build
```

Angular writes deployable files beneath `dist/eql-build-planner/browser/`.

To continuously create development builds:

```bash
npm run watch
```

The application uses hash-based routing, so routes are compatible with static
hosting and do not require server-side rewrite rules.

## Deploy

Pushes to `master` run `.github/workflows/webpack.yml`, which installs the
lockfile-exact dependencies, checks formatting, validates static game data,
runs unit tests, builds with the `/eql-build-planner/` base path, and deploys
the browser output to GitHub Pages. Pull requests run the same validation
without deploying.

In the repository's GitHub **Settings → Pages**, set **Source** to **GitHub
Actions**. The deployed project site is:

<https://trentbullard.github.io/eql-build-planner/>

## Test

Run the unit tests once:

```bash
npm test
```

Run tests in watch mode while developing:

```bash
npm run test:watch
```

Tests use Angular's unit-test builder with Vitest and jsdom. Place tests beside
the code they cover using the `*.spec.ts` suffix.

Playwright is part of the planned test strategy but is not installed yet.

Validate the static entity and compatibility files:

```bash
npm run validate:data
```

## Format

Check formatting without changing files:

```bash
npm run format:check
```

Format supported files:

```bash
npm run format
```

ESLint is planned but is not configured yet; there is currently no lint script.

## Modify the application

The current application entry points are:

| Path                    | Purpose                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `src/main.ts`           | Bootstraps the Angular application                         |
| `src/app/app.ts`        | Root standalone component                                  |
| `src/app/app.html`      | Root component template                                    |
| `src/app/app.scss`      | Root component styles                                      |
| `src/app/app.config.ts` | Global providers and hash-based router setup               |
| `src/app/app.routes.ts` | Application route definitions                              |
| `src/styles.scss`       | Global styles and Angular Material theme                   |
| `public/`               | Static files copied into the build                         |
| `public/data/`          | Versioned static entities and compatibility joins          |
| `angular.json`          | Angular build, serve, test, style, and asset configuration |
| `tsconfig.json`         | Shared strict TypeScript and Angular compiler options      |

Generate a standalone component with the local CLI:

```bash
npm exec ng generate component features/build-selector
```

Generate a service:

```bash
npm exec ng generate service core/services/game-data
```

Use the planned structure as features are implemented:

```text
src/
  app/
    core/
      models/
      services/
      state/
      utilities/
    features/
      build-selector/
      build-summary/
      aa-builder/
      share-build/
    shared/
      components/
      pipes/
public/
  data/
    manifest.json
    races.json
    classes.json
    deities.json
    tags.json
    compatibility.json
    abilities.json
    aa/
    rules/
```

The exact split may evolve, but keep these boundaries:

- Game facts and changeable compatibility rules belong in versioned data.
- Validation and reusable rule evaluation belong in typed core code.
- Canonical state should be the only mutable source of build truth.
- Components should present state and dispatch user intent rather than
  duplicating domain logic.
- Share-critical state must round-trip through a canonical URL.

Before submitting a change, run the relevant checks:

```bash
npm run format:check
npm test
npm run build
```

Update this README in the same change whenever commands, versions, setup,
behavior, structure, or implementation status changes.

## Data and verification

All game content should use stable IDs and include provenance, verification
status, and version metadata where practical. Changing or uncertain Legends
mechanics must be represented as data so corrections do not require rewriting
application logic.

The proposed file responsibilities and client-side indexing strategy are
documented in [`public/data/README.md`](public/data/README.md). Files marked
with `"datasetStatus": "complete"` contain full coverage of their cited
snapshot, but their verification status must still be presented accurately.

Research priority:

1. Official EverQuest documentation and patch notes
2. Current, reproducible in-game behavior
3. Developer statements
4. Reputable community-maintained references
5. Clearly labeled community reports

Uncertain information should be visibly labeled as **Unverified**, **Beta**, or
**Community Reported** in the application.

## Roadmap

1. **Foundation — initialized:** Angular, Angular Material, routing, strict
   compilation, unit tests, formatting, and base documentation
2. **Core build explorer:** data loading and validation, selectors,
   compatibility filtering, tags, basic analysis, and URL sharing
3. **Detailed build analysis:** capability matrix, level-gated abilities,
   synergies, source explanations, accessibility, and mobile refinement
4. **AA builder:** AA data, purchasing, refunds, automatic grants, effects, and
   shared AA state
5. **Community hardening:** contributor workflows, validation reports,
   end-to-end tests, feedback tools, comparison features, and deployment

## Contributing

Contributions will be welcome as the application and data schemas take shape.
Please follow [AGENTS.md](AGENTS.md) for engineering expectations. In
particular:

- Keep game mechanics in data files whenever possible.
- Include sources and verification metadata for factual corrections.
- Add or update tests with behavior changes.
- Preserve keyboard, screen-reader, mobile, and reduced-motion support.
- Keep this README accurate.

A dedicated contribution guide and issue templates are still planned.

## License

A license has not yet been added. The project intends to use a permissive
open-source license for original source code. Game-derived names, data, icons,
and imagery may have separate copyright or trademark considerations and must be
reviewed before redistribution.

## Disclaimer

This is an unofficial community project. It is not affiliated with, endorsed
by, or sponsored by Daybreak Game Company LLC. EverQuest and related names and
marks are the property of their respective owners.
