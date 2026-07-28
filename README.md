# EverQuest Legends Build Planner

A fast, browser-based character and Alternate Advancement (AA) planner for the
EverQuest Legends multiclass server.

> [!NOTE]
> This project is in its initial planning and setup stage. The application is
> not yet available for use.

See [vision.md](vision.md) for the detailed product requirements, design
principles, delivery phases, and initial acceptance criteria.

## Overview

The planner will let players experiment with a complete build:

- Race
- Primary, secondary, and tertiary classes
- Deity
- Character level
- Earned and spent AA points

Selections will update compatible choices, available AAs, strengths,
weaknesses, and capabilities immediately. Builds will be encoded in the URL so
they can be reloaded and shared without an account or backend service.

The goal is to make character planning feel like exploring a live possibility
space. After every choice, the application should make it clear:

1. What can still be selected?
2. Why is an option compatible or incompatible?
3. What does the choice add to—or leave missing from—the build?

## Planned Features

### Build explorer

- Choose character options in any order
- Bidirectional race, class, and deity compatibility filtering
- Prevent duplicate class selections
- Explain why incompatible options are disabled
- Filter each selector using capability and playstyle tags
- Preserve valid choices when another selection changes
- Identify conflicts without silently resetting the build

### Build analysis

- Summarize the combined build rather than individual class descriptions
- Identify strengths, weaknesses, gaps, synergies, and redundancies
- Rate common capabilities such as damage, healing, crowd control, mobility,
  escape, and sustain
- Explain which race, class, ability, or AA produced each conclusion
- Distinguish verified mechanics from subjective or community-reported guidance

### AA builder

- Show general, archetype, and class-specific AAs
- Apply level gates, prerequisites, and automatic grants
- Purchase and refund ranks
- Track earned, spent, and remaining points
- Aggregate numerical and capability-based AA effects
- Explain why an AA is locked or unavailable

### Sharing

- Reconstruct the full build from a deterministic URL
- Copy a canonical build URL
- Copy race and class selections using Discord custom-emote syntax
- Fall back to readable text when an emote is unknown

## Technical Direction

The planned application is a static single-page application built with:

- Angular and Angular Material
- Standalone components and strict TypeScript
- Angular Signals and computed state
- Static, versioned JSON game data
- Runtime data validation
- Unit tests and Playwright end-to-end tests
- ESLint and Prettier
- GitHub Actions and GitHub Pages

The application will not require a database, API server, authentication, or
server-side rendering. Game rules and content will live in maintainable data
files rather than being hard-coded into UI components.

## Planned Project Structure

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
  assets/
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

The exact structure may evolve as the project is implemented.

## Data and Verification

All game content should use stable IDs and include provenance, verification
status, and version metadata where practical. Changing or uncertain Legends
mechanics should be represented as data so corrections do not require rewriting
application logic.

Research should prioritize:

1. Official EverQuest documentation and patch notes
2. Current in-game behavior
3. Developer statements
4. Reputable community-maintained references
5. Clearly labeled community reports

Uncertain information should be visibly labeled as **Unverified**, **Beta**, or
**Community Reported** in the application.

## Development

Development commands will be documented here after the Angular workspace and
package scripts are initialized. The intended workflow will include commands
for:

- Starting the local development server
- Formatting and linting
- Running unit and end-to-end tests
- Validating static game data
- Creating a production build

## Roadmap

1. **Core build explorer** — data loading, selectors, compatibility filtering,
   tag filters, basic analysis, and URL sharing
2. **Detailed build analysis** — capabilities, level-gated abilities,
   synergies, source explanations, accessibility, and mobile refinement
3. **AA builder** — AA data, purchasing, refunds, automatic grants, effects,
   and shared AA state
4. **Community hardening** — contribution workflows, validation reports,
   feedback tools, comparison features, and production hosting

## Contributing

Contributions will be welcome once the initial application and data schemas are
in place. Useful contributions will include:

- Correcting inaccurate game data
- Adding reliable sources and verification details
- Improving compatibility and analysis rules
- Fixing accessibility or responsive-design issues
- Expanding automated tests

Please keep game mechanics in data files whenever possible and include a source
for factual corrections. A dedicated contribution guide and issue templates
will be added as the repository matures.

## License

A license has not yet been added. The project intends to use a permissive
open-source license for original source code. Game-derived names, data, icons,
and imagery may be subject to separate copyright or trademark considerations
and must be reviewed before redistribution.

## Disclaimer

This is an unofficial community project. It is not affiliated with, endorsed
by, or sponsored by Daybreak Game Company LLC. EverQuest and related names and
marks are the property of their respective owners.
