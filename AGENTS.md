# AGENTS.md

This file contains repository-wide instructions for coding agents and their
sub-agents. Follow it for every task in this repository unless a more specific
`AGENTS.md` exists in a descendant directory.

## Product authority

Read `vision.md` before making architectural, product, data-model, or UX
decisions. It is the product source of truth.

Use this priority when instructions appear to conflict:

1. The user's current request
2. The nearest applicable `AGENTS.md`
3. `vision.md`
4. Existing repository conventions
5. Reasonable implementation defaults

Do not silently weaken a requirement from `vision.md`. If a requested change
conflicts with the vision, identify the conflict and ask for direction when it
would materially change the product.

## Core constraints

Preserve these invariants:

- The application is a static, client-side Angular application.
- Do not add a backend, database, authentication, or server-side rendering
  unless the user explicitly changes the product direction.
- Build-critical state must be deterministic and reconstructable from the URL.
- Game content and changeable rules belong in versioned static data, not in UI
  components or scattered conditionals.
- Filtering and analysis must run in the browser and remain fast enough to feel
  immediate.
- Users may make core selections in any order.
- Preserve selections that remain valid. Never silently clear several user
  choices to resolve a conflict.
- Incompatible choices should remain explainable. Prefer disabled options with
  reasons over silently hiding them.
- The interface must work on mobile, with a keyboard, with screen readers, and
  with reduced motion enabled.
- Unverified or subjective information must never be presented as confirmed
  game mechanics.

## Before changing code

1. Read `vision.md` and the relevant existing files.
2. Inspect `package.json`, scripts, framework versions, and local conventions.
   Do not assume the planned stack has already been installed.
3. Check the working tree and preserve unrelated user changes.
4. Identify the smallest complete change that satisfies the request.
5. Decide what verification is proportionate before implementation.

If the repository has not yet been scaffolded, distinguish clearly between
planned commands or structure and commands or structure that actually exist.

## Architecture

Favor the following dependency direction:

```text
static data -> validation/parsing -> domain rules -> canonical state
            -> computed selectors -> feature UI -> URL/share output
```

### Domain and state

- Keep one canonical application state for selections, filters, level, earned
  AA points, purchased AA ranks, and material analysis preferences.
- Derive compatible options, conflicts, scores, AA availability, capabilities,
  summaries, and share output from canonical state.
- Use Angular Signals and `computed` values for derived UI state. Do not
  manually synchronize duplicate state between components.
- Keep compatibility, filtering, scoring, analysis, AA eligibility, and URL
  serialization functions pure whenever practical.
- Pure domain logic should not depend on Angular or browser globals. This keeps
  rules independently testable.
- Model invalid, incomplete, and unknown states explicitly instead of relying
  on falsy values or thrown exceptions during normal interaction.
- Return structured reason codes and source information from rule evaluation;
  do not make components reconstruct explanations from booleans.
- Keep state transitions predictable. When a new choice creates a conflict,
  preserve user intent and expose a targeted resolution.

### Angular

- Use the installed Angular major and the matching Angular Material major.
- Prefer standalone components, strict TypeScript, signals, modern template
  control flow, and lazy-loaded feature boundaries where useful.
- Prefer `ChangeDetectionStrategy.OnPush` for components.
- Keep components focused on presentation and interaction orchestration.
- Put reusable rules and state in `core`; feature-specific UI in `features`;
  genuinely reusable presentational elements in `shared`.
- Avoid `any`, unsafe type assertions, non-null assertions, and broad mutable
  service state. If an escape hatch is unavoidable, contain and document it.
- Do not subscribe in components merely to copy values into other state.
- Keep templates declarative and move nontrivial calculations into named,
  tested functions or computed values.
- Use Angular Material components when they improve semantics and consistency,
  but do not let Material defaults replace accessibility verification.

### Data

- Use stable kebab-case IDs independent of display names or array positions.
- URLs, relationships, prerequisites, and stored state must reference IDs.
- Keep data files easy to review and produce clear diffs.
- Each game-data set must support schema version, game-data version, source,
  last-verification date, and verification status.
- Represent exceptions explicitly in data. Do not hard-code current beta rules
  as permanent truths.
- Discord emote names belong in data. Fall back to readable text when an emote
  is unavailable.
- Validate data at runtime and in CI. Validation must catch, where applicable:
  duplicate or missing IDs, broken references, invalid slugs, invalid levels,
  negative AA costs, unsupported effect types, missing source metadata,
  circular AA prerequisites, and orphaned compatibility entries.
- Reject malformed data with actionable diagnostics that include the file,
  entity, field, and reason.

### URL and sharing

- Treat URL serialization as a public, versioned data format.
- Use the hash-based routing/state approach required for GitHub Pages.
- Serialization must be deterministic, canonical, order-independent, and safe
  for browsers and chat clients.
- Parsing must tolerate incomplete state and support explicit migrations when a
  schema changes.
- Never store share-critical state only in local storage.
- Do not produce a share URL for a build that is known to be invalid.
- Add round-trip tests for every change to shareable state:
  `state -> URL -> state`.

## UX and accessibility

Every interaction should help the user understand:

1. What can still be chosen?
2. Why is an option compatible or incompatible?
3. What does the choice add or leave missing?

For user-facing work:

- Support full keyboard operation and logical focus order.
- Use semantic HTML, accessible names, instructions, and error relationships.
- Announce material filtering changes and conflicts to screen readers without
  producing excessive announcements.
- Never communicate status, strength, or warnings through color alone.
- Maintain visible focus styles and sufficient contrast.
- Use touch-friendly targets and do not depend on hover.
- Respect `prefers-reduced-motion`.
- Verify layouts at representative narrow mobile and desktop widths.
- Prefer concise, specific conflict and lock explanations.
- Show provenance for important analysis conclusions.
- Clearly distinguish factual mechanics from subjective assessments such as
  “meta” or “beginner-friendly.”

## Performance

- Keep filtering and analysis synchronous and local after static data loads.
- Avoid repeated full-data scans in templates.
- Normalize or index data at load time when it simplifies repeated lookups.
- Preserve referential stability where it prevents unnecessary rendering.
- Measure before adding complex optimization, but protect interactive paths
  with realistic tests or benchmarks when data size makes regression likely.

## Testing requirements

Add or update tests alongside behavior. At minimum:

- Unit-test pure compatibility, filtering, tag matching, conflict, analysis,
  AA, and URL functions.
- Cover positive, negative, boundary, incomplete, unknown, and contradictory
  cases.
- Test selection order independence and preservation of still-valid choices.
- Test duplicate-class restrictions and secondary/tertiary exceptions.
- Test `Require` and `Prefer / Non-contrary` tag behavior.
- Test level gates, prerequisites, point limits, refunds, and automatic AAs.
- Test URL round trips, canonical ordering, old schema migrations, malformed
  input, and invalid-build sharing prevention.
- Add component tests for interaction and accessible output where valuable.
- Use Playwright for critical user journeys: creating a build in different
  orders, resolving conflicts, reloading a shared URL, copying share output,
  and purchasing/refunding AAs.
- Add regression tests when fixing a bug.

Use the repository's actual scripts. Before handing off a change, run the
smallest relevant checks and, when practical, the full validation suite:

1. Formatting or format check
2. Lint
3. Type check
4. Unit tests
5. Static-data validation
6. Production build
7. Relevant Playwright tests

If a check cannot run, report the exact command and reason. Never claim a check
passed if it was not run.

## Research and game-data changes

Game rules are time-sensitive. Do not add factual mechanics from memory.

Use this source priority:

1. Official EverQuest documentation or patch notes
2. Current, reproducible in-game behavior
3. Developer statements
4. Reputable community-maintained references
5. Clearly labeled community reports

Record the source, verification status, and verification date with the data.
When sources disagree, preserve the uncertainty and surface it to users rather
than choosing silently. Do not update `lastVerified` unless the underlying
claim was actually checked.

Do not add copyrighted game artwork or extracted assets without a compatible
license or explicit permission. Prefer original, licensed, or text-based
representations.

## README maintenance

`README.md` is part of every feature's definition of done. Review it before
finishing any change that affects setup, architecture, behavior, commands,
configuration, repository structure, roadmap status, deployment, data
contribution, or supported workflows.

Update the README in the same change when:

- A command, dependency, prerequisite, or environment requirement changes.
- A planned feature becomes usable, changes behavior, or is removed.
- The project structure or architectural approach materially changes.
- Configuration, URL format, hosting, or deployment changes.
- Contributors gain a new data format, validation rule, or workflow.
- The implementation status or roadmap description is no longer accurate.

README rules:

- Describe the repository as it exists now, not only the intended future.
- Keep setup instructions copy-pasteable and verify commands before documenting
  them.
- Separate implemented features from planned features.
- Do not mark roadmap work complete until it is usable and tested.
- Link to `vision.md` for detailed product intent rather than duplicating it.
- Keep the unofficial-project disclaimer and licensing status accurate.
- Avoid claims about current game rules unless the supporting data is sourced.

If no README change is needed, explicitly confirm during handoff that it was
reviewed and remains accurate.

## Working with multiple agents

When delegating work:

- Give each sub-agent a bounded task, clear file ownership, acceptance criteria,
  and required checks.
- Tell sub-agents to read this file and the relevant sections of `vision.md`.
- Avoid assigning overlapping edits. All agents share the same working tree.
- Keep architecture and cross-cutting state decisions with one owner.
- Have sub-agents report files changed, decisions made, tests run, and any
  README impact.
- Review and integrate sub-agent output; do not assume completion from a summary
  alone.

## Definition of done

A change is complete only when:

- It satisfies the request and preserves the product invariants above.
- The implementation is typed, readable, and placed in the correct layer.
- Relevant data is validated and sourced.
- Relevant automated tests exist and pass.
- Accessibility and responsive behavior were considered for UI changes.
- Determinism and URL compatibility were considered for state changes.
- No unrelated user work was overwritten.
- `README.md` was updated when needed and remains truthful.
- The handoff lists changed files, verification performed, and any known
  limitations or follow-up work.
