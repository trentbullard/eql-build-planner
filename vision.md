# EverQuest Legends Build Planner — Project Source Document

## 1. Project Vision

Build a fast, open-source, browser-based character and Alternate Advancement (AA) planner for the **EverQuest Legends** multiclass server.

The application should let players experiment with combinations of:

1. Race
2. Primary class
3. Secondary class
4. Tertiary class
5. Deity
6. Character level
7. Earned and spent AA points

Every selection should immediately update all compatible choices, build strengths, weaknesses, capabilities, and available AA options.

The application should require no backend or user account. All game data and compatibility rules should be stored in version-controlled static files and evaluated in the browser. A completed build must be reproducible from its URL so players can share it directly.

---

## 2. Core Product Goals

The application should be:

- **Fast:** Filtering and build analysis happen entirely in the browser.
- **Simple:** A user can begin choosing options in any order without learning a complicated workflow.
- **Deterministic:** The same URL always reconstructs the same build and AA allocation.
- **Shareable:** Users can copy a build URL or a Discord-emote representation with one action.
- **Data-driven:** Game rules, tags, descriptions, compatibility, and AA values are maintained outside application logic.
- **Responsive:** The experience works well on desktop and mobile.
- **Accessible:** Controls are keyboard-friendly, clearly labeled, and compatible with screen readers.
- **Open source:** Players can inspect the data, report inaccuracies, submit corrections, or host private forks.

---

## 3. Technical Direction

### Recommended stack

- **Angular 22.0.8**, initialized on 2026-07-28
- **Angular Material 22.0.6** and CDK 22.0.6
- Standalone components
- Strict TypeScript
- Angular Signals and computed state for reactive filtering and analysis
- Signal Forms or typed reactive forms, depending on production readiness and project preference
- Angular Router for application navigation
- Static JSON data files loaded from `public/data`
- **Vitest 4.1.10** through the Angular unit-test builder
- Playwright for important end-to-end workflows
- ESLint and **Prettier 3.9.6**
- GitHub Actions for validation, build, and deployment
- GitHub Pages for initial hosting, with optional custom domain and HTTPS

This should be a static single-page application. It must not require a database, API server, authentication service, or server-side rendering.

### Initialized toolchain

The initial application scaffold uses:

- Node.js 24.15.0, pinned by Volta in `package.json`
- npm 11.12.1, pinned by Volta in `package.json`
- Angular framework and CLI/build tools 22.0.8
- Angular Material and CDK 22.0.6
- TypeScript 6.0.3
- RxJS 7.8.2
- Vitest 4.1.10 with jsdom 28.1.0
- Prettier 3.9.6

The lockfile is the authority for exact installed package versions. See `README.md` for installation, development, testing, formatting, and production-build commands.

### Suggested repository structure

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
      general.json
      archetypes.json
      classes/
        bard.json
        cleric.json
        ...
    rules/
      build-analysis.json
      contradictions.json
      unlocks.json
```

The precise file split may change, but the principle should remain: **game data belongs in data files; reusable evaluation behavior belongs in typed application code.**

---

## 4. Legends Rules Assumed by the Planner

The planner is intended for the EverQuest Legends three-class system.

Initial research indicates that:

- A character can combine a primary, secondary, and tertiary class.
- The primary class follows race compatibility restrictions.
- Secondary and tertiary classes are substantially less restricted, although the application must support exceptions.
- Race, primary class, and deity compatibility are interconnected.
- Character level controls when classes, abilities, and AAs become available.
- General, archetype, and class-specific AAs may all contribute to one build.
- Some AAs are granted automatically or become available at specific levels.

These rules must be represented as editable data rather than hard-coded assumptions. Beta or launch rules may change, so every data file should support provenance and version metadata.

Example:

```json
{
  "schemaVersion": 1,
  "gameDataVersion": "2026-07-28",
  "source": "official, verified community, or in-game testing",
  "lastVerified": "2026-07-28"
}
```

Where a rule is uncertain, the UI should be able to display a small **Unverified**, **Beta**, or **Community Reported** indicator.

---

## 5. Main User Experience

### 5.1 Build selectors

The primary build area contains selectors for:

- Race
- Primary class
- Secondary class
- Tertiary class
- Deity
- Character level
- Earned AA points

All selectors remain enabled. The user may begin with any field.

Selections must filter other fields bidirectionally:

- Selecting **Rogue** as primary filters Race to races that can use Rogue as a primary.
- Selecting **Ogre** filters Primary Class to classes available to Ogres.
- Selecting a deity filters incompatible races and primary classes.
- Selecting race or primary class filters incompatible deity choices.
- Selecting a secondary or tertiary class prevents duplicate class selection.
- Any documented secondary or tertiary exceptions are applied from compatibility data.
- Changing an earlier selection should preserve every still-valid selection and clear only choices that have become impossible.

An option should preferably remain visible when filtered out but appear disabled with a short explanation, such as:

> Ogre cannot select Druid as a primary class.

This is more educational than silently removing choices. A compact “show only compatible options” preference may be added later.

### 5.2 No dead-end state

The filter engine should avoid trapping the user in a state with no valid completion.

When tag constraints or selections produce zero results:

- Preserve the user’s existing choices.
- Clearly identify the conflicting selections or tags.
- Offer a one-action way to clear the newest conflict or all filters.
- Never silently modify several user decisions in an unpredictable way.

### 5.3 Selection presentation

Desktop layout may use five adjacent selector cards or columns. Mobile layout should stack them vertically.

Each selector card should contain:

- Current selection
- Searchable select or autocomplete
- Tag filters for that slot
- Option tags or compact capability indicators
- Compatibility or conflict explanation
- Clear-selection control

---

## 6. Tag-Based Filtering

Tags are user-facing capabilities, roles, properties, or strategic characteristics.

Potential tags include:

### Combat and role

- Melee
- Caster
- Hybrid
- Tanking
- Burst damage
- Sustained damage
- Area damage
- Damage over time
- Pet
- Crowd control
- Pulling
- Debuffing
- Buffing
- Haste
- Slow

### Survival and recovery

- Healing
- Self-healing
- Group healing
- Sustain
- Regeneration
- Lifetap
- Damage mitigation
- Avoidance
- Feign death
- Escape
- Resurrection

### Utility and movement

- Mobility
- Movement speed
- Ports
- Evacuation
- Tracking
- Night vision
- Invisibility
- Rogue invisibility
- Lull or pacify
- Root
- Snare
- Charm
- Mez

### Build characterization

- Solo-friendly
- Group-friendly
- Beginner-friendly
- High complexity
- Low actions per minute
- Gear dependent
- Meta
- Off-meta
- Experimental

Tags must be definable per race, class, deity, ability, and AA.

Each tag assignment should support:

- Strength or confidence value
- Optional level range
- Source or verification status
- Positive, neutral, or contrary relationship
- Explanation text

Example:

```json
{
  "tagId": "mobility",
  "weight": 0.8,
  "relationship": "positive",
  "minLevel": 5,
  "reason": "Receives movement-speed abilities."
}
```

### 6.1 Per-column tag filters

Each race/class/deity selector should have its own tag filters.

Examples:

- Applying **Crowd Control** to Primary filters primary-class candidates.
- Applying **Mobility** to Secondary filters secondary-class candidates.
- Applying **Night Vision** to Race filters racial candidates.

Per-column filters must also cascade through compatibility. Filtering Primary to crowd-control classes consequently changes which races and deities remain valid.

### 6.2 Tag matching modes

Support at least two modes:

- **Require:** The option must possess every selected tag.
- **Prefer / Non-contrary:** Options lacking the tag may remain, but options explicitly contrary to it are excluded and stronger matches sort first.

A future scoring mode may rank complete builds by weighted priorities rather than applying strict inclusion filters.

---

## 7. Build Analysis Panel

The build analysis panel updates immediately after every selection, tag change, level change, or AA purchase.

It should summarize the combined build rather than merely repeating class descriptions.

### Required sections

#### Identity

- Race
- Primary, secondary, and tertiary classes
- Deity
- Level
- AA points earned, spent, and remaining

#### Strengths

Examples:

- Frontal stun immunity
- Strong night vision
- Excellent mobility
- Ports and evacuation
- Reliable crowd control
- Rogue invisibility
- Lull or pacify tools
- Strong self-healing
- Strong sustained damage
- Multiple pets
- High armor access

#### Weaknesses and gaps

Examples:

- No meaningful healing
- Weak mana recovery
- No reliable escape
- Limited crowd control
- Gear dependent
- Redundant capabilities
- Conflicting resource demands
- Low mobility
- No snare or root
- Pet-management complexity

#### Capability matrix

Display common capabilities in a compact, scannable format:

- Strong
- Moderate
- Limited
- Missing
- Unknown

Suggested capability categories:

- Damage
- Tanking
- Healing
- Sustain
- Crowd control
- Pulling
- Mobility
- Escape
- Buffing
- Debuffing
- Pets
- Stealth
- Travel
- Complexity

#### Sources

Important conclusions should be expandable to show which race, class, ability, or AA created them.

Example:

> **Escape: Strong**  
> Druid evacuation + Rogue escape AA.

### Analysis rules

Combined-build analysis should use explicit, testable rules stored in data where practical. It should support:

- Additive capability scores
- Highest-source-wins properties
- Unique binary capabilities
- Redundancy bonuses or diminishing returns
- Synergy rules
- Contradictions
- Level gates
- AA modifications
- Automatically granted abilities

The UI must distinguish factual mechanics from subjective assessments such as “meta” or “beginner-friendly.”

---

## 8. AA Builder

The AA builder must react to the active build and character level.

### AA categories

- General AAs
- Archetype AAs
- Primary class AAs
- Secondary class AAs
- Tertiary class AAs
- Automatically granted or free AAs
- Future AAs not yet available at the selected level

### AA data requirements

Each AA should support:

```json
{
  "id": "example-aa",
  "name": "Example AA",
  "category": "class",
  "classIds": ["druid"],
  "archetypeIds": [],
  "ranks": [
    {
      "rank": 1,
      "cost": 3,
      "minLevel": 20,
      "effects": [
        {
          "type": "capability",
          "target": "escape",
          "operation": "set",
          "value": "strong"
        }
      ]
    }
  ],
  "autoGrantedAtLevel": null,
  "description": "Escapes the group to the zone succor point.",
  "activation": "active",
  "reuseSeconds": 900,
  "verification": "verified"
}
```

### AA interactions

The user can:

- Increase or decrease character level.
- Enter or increment earned AA points.
- Purchase eligible AA ranks.
- Refund purchased ranks.
- See spent and remaining points.
- See available, locked, purchased, automatically granted, and future AAs.
- View prerequisites and level gates.
- See exactly why an AA is unavailable.
- Reset all AA spending without resetting the base build.

AA purchases must update the build analysis in real time.

Numerical effects should be aggregated into calculated statistics where data permits, including:

- Critical-hit chance
- Spell critical chance
- Hit points
- Mana
- Endurance
- Regeneration
- Avoidance
- Mitigation
- Casting or reuse modifiers
- Pet bonuses

Abstract effects must appear as capabilities or features rather than being forced into numeric statistics.

Example:

> **Instant group evacuation:** Granted by Escape Rank 1.

Automatically granted AAs do not consume earned AA points but must appear in the selected build at the correct level.

---

## 9. URL State and Sharing

The full build must be encoded in the URL.

Use the URL fragment/hash so GitHub Pages can host the application without server-side route configuration.

Example:

```text
/#/build?r=wood-elf&p=paladin&s=shaman&t=monk&d=tunare&lvl=50&aa=...
```

The exact format may use compact keys or a versioned encoded state object, but it must be:

- Deterministic
- Human-debuggable where practical
- Stable across reloads
- Backward-compatible through a state-schema version
- Order-independent
- Safe for browser and chat sharing

The URL state should include:

- Race
- Primary class
- Secondary class
- Tertiary class
- Deity
- Level
- Earned AA points
- Purchased AA ranks
- Tag filters
- Matching modes
- Any build-analysis preferences that materially change the result

Do not store share-critical state only in local storage.

Local storage may remember nonessential preferences such as theme, collapsed panels, or “show disabled choices.”

### Share actions

#### Copy Build URL

Copies the canonical parameterized URL to the clipboard and displays a confirmation snackbar.

#### Share in Discord

Copies the chosen race and classes using EverQuest Legends Discord custom-emote syntax.

Example:

```text
:woodelf: :paladin: :shaman: :monk:
```

The Discord representation should optionally include deity, level, or a short URL in a future enhancement. Emote values must come from data files because server emote names may not exactly match display names.

If a choice lacks a known emote, fall back to readable plain text rather than copying invalid syntax.

---

## 10. Static Data Architecture

All game content should be stored as typed, versioned, static files.

### Core entity files

- `races.json`
- `classes.json`
- `deities.json`
- `tags.json`
- `abilities.json`
- `compatibility.json`
- `unlocks.json`
- General, archetype, and class AA files

### Stable identifiers

Every entity must use a stable slug independent of display text.

Examples:

- `wood-elf`
- `shadow-knight`
- `cazic-thule`
- `frontal-stun-immunity`

URLs, relationships, and saved builds should use IDs, not array positions or display names.

### Compatibility representation

Compatibility should be expressed positively where possible and support explicit exceptions.

Example:

```json
{
  "primaryClassByRace": {
    "ogre": ["warrior", "shadow-knight", "shaman", "beastlord"]
  },
  "deitiesByRaceAndPrimary": [
    {
      "raceId": "wood-elf",
      "primaryClassId": "druid",
      "deityIds": ["tunare", "agnostic"]
    }
  ],
  "secondaryTertiaryExclusions": []
}
```

The actual format should prioritize maintainability, validation, and clear pull-request diffs.

### Validation

Create automated validation that fails the build when:

- An ID reference does not exist.
- Duplicate IDs are present.
- A URL/emote slug is invalid.
- An AA prerequisite is circular.
- An AA cost is negative.
- An unlock level is invalid.
- Compatibility data produces impossible or orphaned options.
- A selected effect type is unsupported.
- Required source metadata is missing.

JSON Schema, Zod, or an equivalent runtime validation layer should validate all loaded data.

---

## 11. State and Filtering Logic

Use one canonical application state containing selections, filters, level, and AA spending.

Derive all displayed values through computed selectors/signals:

- Compatible races
- Compatible primary classes
- Compatible secondary classes
- Compatible tertiary classes
- Compatible deities
- Matching tag scores
- Conflicts
- Available AAs
- Purchased and automatic AAs
- Effective build capabilities
- Strengths
- Weaknesses
- Canonical share URL
- Discord share string

Avoid manually synchronizing duplicate state across components.

The filtering engine should evaluate the intersection of:

1. Game compatibility
2. Existing selections
3. Per-column tag constraints
4. Duplicate-class restrictions
5. Level-based availability
6. Special exceptions

Filtering should be pure and covered by unit tests.

---

## 12. Responsive and Accessible Design

### Desktop

- Selector row near the top
- Build analysis directly beneath it
- AA builder beneath or beside the analysis
- Sticky summary/share controls where useful

### Mobile

- Stacked selector cards
- Compact sticky build summary
- Expandable analysis sections
- Touch-friendly chips and controls
- No dependence on hover

### Accessibility requirements

- Full keyboard navigation
- Visible focus states
- Semantic headings
- Proper Material labels and descriptions
- Accessible error/conflict messages
- Sufficient contrast
- Screen-reader announcement when filtering materially changes available choices
- Reduced-motion support
- No color-only strength or warning indicators

---

## 13. Hosting and Open-Source Model

### Recommended hosting

Use **GitHub Pages**, not “GitHub Spaces,” for the first public deployment.

Benefits:

- Static hosting
- Recognizable HTTPS URL
- Direct integration with a public repository
- GitHub Actions deployment
- Optional verified custom domain
- Easy forks and private deployments

### Repository expectations

Include:

- Clear README
- Local setup and build instructions
- Contribution guide
- Data-source and verification policy
- Issue templates for incorrect data and feature requests
- Pull-request template
- Open-source license
- Code of conduct
- Disclaimer that the project is unofficial and not affiliated with Daybreak Game Company
- Trademark acknowledgement where appropriate

A permissive license such as MIT is suitable for code. Game-derived data, names, icons, and imagery should be reviewed separately for trademark and copyright considerations.

Do not redistribute copyrighted game assets unless permission or an applicable license is established. Prefer original icons, text labels, or community-provided assets with explicit licenses.

---

## 14. Suggested Delivery Phases

### Phase 1 — Core build explorer

- Static data loader and validation
- Race, primary, secondary, tertiary, and deity selectors
- Bidirectional compatibility filtering
- Tag filters
- URL state
- Copy URL
- Discord-emote copy
- Basic strengths and weaknesses

### Phase 2 — Detailed build analysis

- Capability matrix
- Level-gated abilities
- Synergy and redundancy rules
- Expandable explanation sources
- Mobile refinement
- Accessibility testing

### Phase 3 — AA builder

- General, archetype, and class AA data
- Level and earned-AA controls
- Purchase and refund behavior
- Automatic AAs
- Stat aggregation
- Abstract capability effects
- AA state in shared URLs

### Phase 4 — Community hardening

- Contribution workflow
- Data provenance tools
- Build-data validation reports
- Community feedback links
- Custom domain
- Import/export of human-readable build definitions
- Optional comparison of multiple builds

---

## 15. Initial Acceptance Criteria

The first useful public release is complete when:

1. A user can make all five core character selections in any order.
2. Every selection filters incompatible values in all other relevant selectors.
3. Secondary and tertiary classes cannot duplicate another active class.
4. Per-column tag filters alter available options and cascade through compatibility.
5. Invalid combinations cannot be shared as if they were valid.
6. Every valid build reloads exactly from its URL.
7. Copy URL and Discord-emote sharing work on supported browsers.
8. Build strengths, weaknesses, and missing capabilities update immediately.
9. The application works without a backend after the static files are loaded.
10. Data files are validated automatically in CI.
11. The production site deploys automatically to GitHub Pages.
12. The interface is usable on common desktop and mobile widths.
13. Core selection and URL workflows have automated tests.
14. The repository documents how contributors can correct or extend game data.

---

## 16. Product Principle

The application should feel less like filling out a character-creation form and more like manipulating a live possibility space.

Every action should answer three questions immediately:

1. **What can I still choose?**
2. **Why is that option compatible or incompatible?**
3. **What does this choice actually give—or leave missing—from the build?**

That fast, transparent feedback loop is the central experience of the project.

---

## 17. Research Notes and Verification

This document intentionally treats changing Legends mechanics as data rather than permanent application logic.

At the time this document was prepared and the application was initialized:

- Angular 22 was the current stable Angular major; the project uses Angular 22.0.8 and Angular Material 22.0.6.
- GitHub Pages supported static sites, HTTPS, and optional custom domains.
- Community documentation described Legends as a three-class system with classic-style restrictions focused primarily on race, primary class, and deity.

Before populating production data, verify every game rule against this priority order:

1. Official EverQuest documentation or patch notes
2. Current in-game behavior
3. Developer statements
4. Reputable community-maintained references
5. Clearly labeled community reports

Useful starting references:

- Angular v22: https://angular.dev/events/v22
- Angular Material: https://material.angular.dev/
- GitHub Pages custom domains: https://docs.github.com/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages
- EverQuest official site: https://www.everquest.com/
- Community trio-system overview: https://eqltools.com/learn/trio

The data version shown by the application should be visible to users so they can tell when the rules were last verified.
