# Wave 1 Map Redesign Specification

## Status
Mandatory implementation specification for the Wave 1 battlefield redesign.

## Non-Negotiable Scope
The only systems that remain unchanged:
- HUD
- Bottom tower tray

All other gameplay-world map internals are open for redesign and are expected to follow this specification.

## Core Directives
- Delete old Wave 1 map internals and rebuild from an empty world canvas.
- Build Wave 1 manually as a hand-authored battlefield composition, not as a random or grid layout.
- Keep the battlefield as a visual-first, terrain-first layout where roads feel naturally carved through landforms.

## Pathing Architecture (Mandatory)

### Four Entrances
Wave 1 must include exactly four enemy entrance routes:
- Top-left corner
- Top-right corner
- Bottom-left corner
- Bottom-right corner

Each entrance must have:
- A unique route identity
- Different surrounding environment treatment
- Distinct tactical pressure profile for tower coverage

### Path Shape Rules
- No straight Manhattan pathing.
- No right-angle turns.
- No visible square-grid movement language.
- Use smooth organic curvature consistent with hand-drawn spline intent.
- Movement readability must remain high for gameplay clarity.

### Merge Behavior
- Branches from all entrances must merge progressively into a shared primary route.
- Merges must occur over curved transitions, not abrupt joins.
- Merge zones must provide real tactical decision points for player placement.

### Shared Route and Endpoint
- After branch convergence, units travel a primary route toward the defended objective.
- This route should include scenic flow while preserving readability.
- Final approach must clearly telegraph the final defense opportunity before leak.

## Choke Point Design (Mandatory)
Wave 1 must contain exactly three intentional choke points:
- A bridge choke
- A mountain-pass choke
- A final approach/castle gate choke

Each choke must:
- Be visually obvious
- Be mechanically relevant for tower strategy
- Present constrained approach width compared to nearby path sections

## Terrain Coupling
Road topology must be grounded in natural terrain logic:
- Roads follow valleys, contour bends, and believable travel lines
- Roads avoid clipping through obvious obstacles without transitions
- Vertical form, rivers, cliffs, and forests reinforce route decisions

## River Integration (Mandatory)
- Include a winding river that contributes to composition and route logic.
- River trajectory should curve naturally and feel geologically plausible.
- At least one designed bridge crossing should coordinate with a choke opportunity.

## Environmental Storytelling
Entrances and route regions should show identity through themed elements, such as:
- Cave access
- Forest trail opening
- Mine shaft route
- Mountain pass gate

Use landmarks to strengthen orientation and player memory of path flow.

## Camera and Composition Readability
The full Wave 1 composition must satisfy:
- Clear read from default camera framing
- Immediate understanding of where enemies come from and where they converge
- Choke points visible enough for strategic planning
- Visual hierarchy from entrances -> merges -> shared route -> final gate

## Tower Placement Relationship
- Preserve current HUD and bottom tray behavior.
- World-space tower placement logic should honor path clearances.
- Place intentional tower pads/defensive opportunities around merge zones and choke points.
- Avoid random open-field placement patterns that erase route identity.

## Implementation Acceptance Criteria
Wave 1 implementation is accepted only if all items below are true:
- 4 corner entrances exist and are active in live wave spawning
- Curved, non-grid branch roads are present
- Branches merge gradually into a shared route
- 3 choke points are present and identifiable
- River and bridge are integrated into tactical geography
- Visual route identity is distinct per entrance region
- HUD and bottom tray are preserved and unchanged

## Notes
This document defines the required baseline for Wave 1 map internals. Further polish and asset upgrades may iterate on style, but cannot violate the structural rules above.
