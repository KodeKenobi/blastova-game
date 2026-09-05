# Art Direction Document

## Project One - Visual Identity Bible

Version 1.0

## 1. Creative North Star

This game's visual identity is Stylized Tactical Fantasy: painterly surfaces, readable silhouettes, dramatic battlefield lighting, and grounded material logic.
It should feel premium, not noisy, and maintain instant gameplay readability at all times.

Design intent:

- Heroic and tactical, not grimdark.
- Stylized realism, not cartoon flatness.
- High contrast gameplay read, with cinematic atmosphere.
- Cohesive brush and shape language across all assets.

Non-negotiable identity traits:

- Broad, clear silhouettes first.
- Controlled color palette with warm-vs-cool contrast.
- Directional light with visible shadow logic.
- Surface detail that supports form, never visual clutter.

## 2. Art Style

Primary style:

- Hand-painted stylized 3D look, delivered through 2D sprites/tiles.
- Medium detail density.
- Slightly exaggerated proportions for readability.
- Soft edge breakup and selective hard accents.

Shape language:

- Friendly structures: rounded rectangles, chamfered edges, stable bases.
- Enemy forms: sharper angles, asymmetry, forward lean.
- Nature forms: clustered, layered, organic arcs.

Texture language:

- Brush-driven gradients and edge highlights.
- Subtle micro-noise only in midtones.
- Avoid photo textures, procedural grunge spam, and high-frequency detail floods.

## 3. Camera Angle and Perspective

Camera framing:

- Fixed oblique battlefield camera.
- Pitch: 48 degrees downward.
- Yaw: 12 degrees from cardinal alignment, facing upper-right battlefield depth.
- No free rotation in core gameplay.

Perspective model:

- Hybrid perspective.
- Mostly orthographic readability with slight perspective compression.
- Far-plane scale reduction target: 8 percent smaller than near-plane for large props.

Composition constraints:

- Playfield occupies center and upper-middle.
- Top and bottom zones reserved for readability and UI coexistence.
- Horizon is implied through value and fog, not literal skybox dominance.

## 4. Color Palette

Global palette behavior:

- Terrain and architecture stay mid-saturation.
- Gameplay actors and effects carry higher local contrast.
- Warm highlights against cooler shadow families.

Core swatches:

- Grass Base: #4F7D46
- Grass Highlight: #74A661
- Earth Base: #6D5236
- Road Dust: #8A6B47
- Stone Base: #6C727A
- Stone Highlight: #99A2AD
- Water Base: #2B5F73
- Water Highlight: #4FA1B7
- Cliff Shadow: #3B342D
- Foliage Deep: #2F5D39
- Foliage Accent: #5EA76B
- Neutral Shadow: #1E2430
- Warm Rim Light: #E7C57A
- Enemy Primary: #A84E3D
- Enemy Accent: #D77C5B
- Friendly Accent: #4EA3D9
- Friendly Energy: #8CD7FF

Value ladder targets:

- Background terrain: 35 to 55 percent value.
- Interactive structures: 45 to 70 percent value.
- Enemies and projectiles: 60 to 90 percent local contrast against immediate backdrop.
- Critical effects and impact frames: brief spikes to 95 percent.

## 5. Terrain Style

Terrain identity:

- Layered painterly ground with broad directional strokes.
- Macro variation in hue and value every 4 to 8 tiles.
- Clear separation between traversable path, non-path ground, and blocking features.

Ground material families:

- Meadow turf.
- Packed dirt.
- Worn battlefield earth.
- Rocky outcrop plates.

Terrain detail density:

- Low at gameplay center lanes.
- Medium at periphery.
- Never obscure path readability.

## 6. Vegetation Style

Vegetation treatment:

- Clustered, wind-swept forms.
- Leaf masses simplified into 3 to 5 value groups.
- Trunks and branches use tapered, calligraphic silhouettes.

Placement rules:

- Keep core path edges visually clean.
- Use vegetation to frame combat channels.
- Avoid bright green saturation spikes near enemy readability zones.

## 7. Architecture Style

World architecture language:

- Frontier fortress fantasy with stone-and-timber hybrid construction.
- Reinforced parapets, iron fasteners, carved braces.
- Geometric motifs: arches, buttresses, angular trims.

Material breakup:

- Stone as primary mass.
- Timber as structural rhythm.
- Metal accents for focal points and mechanical detail.

## 8. Roads

Road identity:

- Compacted earth and gravel lanes, slightly crowned center.
- Edge erosion and track wear indicate travel direction.
- Soft, dusty transitions into surrounding terrain.

Path doctrine (mandatory):

- The path is the single most important element of the level.
- Path layout is hand-authored, never generated.
- Do not use grid assumptions when composing road flow.
- Do not use Manhattan pathing.
- Do not use right-angle turns.
- Do not use 90-degree corner logic.
- Do not use simple snake patterns.
- Roads are drawn as smooth spline-like curves with natural curvature.
- Curve radii should vary and feel terrain-driven, not mathematically uniform.
- Road width should vary slightly along the route to feel organic.
- The player should visually track enemy flow without abrupt heading changes.
- The road must look hand-painted, not algorithmically constructed.

Readability rules:

- Road width must remain consistent in gameplay scale.
- Path outline readable at a glance from full camera height.
- Intersections and bends receive brighter rim and directional wear.

Topology rules:

- Wave 1 must include multiple enemy entrances.
- Entrances must be independent branches with distinct silhouettes and themes.
- Branches merge into shared choke points before the castle.
- Branches must not be duplicated copies of one another.
- Branch spacing should create different tower coverage opportunities.
- Path should loop back near itself in at least one region to enable overlapping tower arcs.
- Long straight road segments are prohibited.

## 9. Rivers

River style:

- Painterly water planes with directional flow bands.
- Bright specular ribbons only on lit side.
- Subsurface depth shift from teal to deep blue-green.

Water movement language:

- Slow pulse loops and shear highlights.
- Foam only near obstructions and shore impacts.
- Never over-animate broad river surfaces.

## 10. Cliffs

Cliff visual grammar:

- Large readable planes first, cracks second.
- Strata direction follows world composition flow.
- Top edges receive warm rim and sparse grass overhangs.

Contrast control:

- Cliff faces darker than plateau by default.
- Strong occlusion in crevices.
- Do not over-outline cliff silhouettes.

## 11. Bridges

Bridge style:

- Stone abutments with timber deck or carved stone spans.
- Reinforcement beams visible in silhouette.
- Slight warping and wear, but structurally believable.

Gameplay integration:

- Bridges are strong path readability anchors.
- Entry and exit ramps receive brighter material transition.

## 12. Towers

Tower identity:

- Distinct family silhouettes before detail.
- Base, midsection, crown, weapon head must read separately.
- Friendly faction color accents integrated at 10 to 15 percent surface area.

Tower tiers:

- Tier 1: compact and pragmatic.
- Tier 2: extended silhouette and reinforced core.
- Tier 3: signature silhouette break and animated focal element.

Material mix:

- Stone mass.
- Metal joints.
- Arcane or mechanical emissive accents based on class.

## 13. Enemies

Enemy direction:

- Silhouette-first class readability by role.
- Forward momentum pose in idle and locomotion.
- Warm hostile palette with selective cool reflections.

Role readability by shape:

- Fast units: narrow, angled, low mass.
- Tank units: broad, heavy, blocky.
- Specialist units: unique top silhouette marker.

Damage readability:

- Hit flashes are short and additive.
- Armor zones visibly denser and less saturated.
- Death state silhouette collapses quickly and clearly.

## 14. Particles and VFX

VFX style:

- Painterly sparks, smoke cards, dust puffs, and energy wisps.
- Layered timing rather than excessive count.
- Effects should reinforce impact and trajectory.

VFX color behavior:

- Physical impacts: warm dust, orange embers, gray smoke.
- Energy impacts: cyan-white core with desaturated fringe.
- Enemy destruction: warm core burst, dark debris falloff.

Density rules:

- Keep center-lane combat readable.
- Effects peak under 300 ms for hit events.
- Persistent loops remain low-alpha and low-frequency.

## 15. Lighting

Lighting model:

- Single dominant sun direction from upper-left.
- Ambient fill from cool sky bounce.
- Local emissives for towers, projectiles, and key VFX.

Key ratios:

- Key to fill ratio target: 1.8 to 1.
- Emissive bloom used sparingly on interactive elements only.
- Avoid full-scene haze washout.

## 16. Shadows

Shadow principles:

- Consistent angle and length by time-of-day lock.
- Contact shadows under all grounded entities.
- Soft penumbra on terrain, harder edges on architecture anchors.

Shadow value:

- Base shadow tint leans cool neutral.
- Do not use pure black shadows.
- Shadow alpha range remains controlled for readability.

## 17. UI Style (Excluding Existing HUD)

Scope:

- Menus, world selection, settings overlays, modals, transitions, tooltips.

UI visual direction:

- Tactical-fantasy command interface.
- Brushed metal frames with luminous inlay lines.
- Accent motion from scanline sweeps and directional reveals.

Typography:

- Primary display: geometric techno-serif for headings.
- Secondary body: clean humanist sans for legibility.
- Numeric and stat readouts use monospaced variant only where needed.

UI color behavior:

- Dark base panels with cool cyan accents.
- Warm warning/action accents for confirmation and danger.
- Use glow only on active focus and confirm actions.

## 18. Animation Style

Motion language:

- Intentional, weight-aware, and snappy.
- Combat actions favor anticipation + quick release.
- Environmental loops are subtle and asynchronous.

Timing ranges:

- UI micro transitions: 120 to 220 ms.
- Unit locomotion cycles: 6 to 10 frames at readable cadence.
- Impact effects: 80 to 220 ms.
- Death resolves: 180 to 420 ms depending on class.

Easing behavior:

- Out-curve for response.
- In-out only for decorative transitions.
- Avoid floaty elastic motion in combat-critical actions.

## 19. Asset Dimensions and Technical Art Standards

Master art resolution standard:

- Design at 2x target display scale, downsample in engine for crisp readability.

Tile and environment standards:

- Primary terrain tile: 128 x 128.
- Secondary transition tile: 128 x 128.
- Cliff and bridge modules: multiples of 64 px grid.

Sprite standards:

- Basic enemy body frame target box: 96 x 96.
- Heavy enemy/tank frame target box: 128 x 128 to 192 x 192.
- Tower frame target box: 128 x 128.
- Projectile frame target box: 24 x 24 to 48 x 48.
- Impact VFX atlas cells: 64 x 64 and 128 x 128 families.

Pivot conventions:

- Grounded entities pivot near foot or contact center.
- Flying entities pivot geometric center with separate shadow anchor.
- Towers pivot base center.

## 20. Sprite Scale and In-Scene Proportions

Relative scene scale:

- Base infantry height reads as 1.0 unit.
- Fast infantry: 0.9 to 1.0.
- Elite infantry: 1.1 to 1.25.
- Tank bodies: 1.5 to 2.1.
- Standard towers: 1.2 to 1.8 relative height.

Range indicator and gameplay overlays:

- Overlay opacity and line thickness must not overpower unit silhouettes.
- Combat readability beats decorative flourish at all times.

## 21. Visual Hierarchy Rules

Priority stack:

1. Threats and targetable enemies.
2. Player towers and active attacks.
3. Path and objective markers.
4. Environment context.
5. Ambient decoration.

Hierarchy implementation:

- Highest priority gets strongest contrast and sharpest edges.
- Mid priority gets moderate saturation and controlled glow.
- Low priority gets softened contrast and reduced detail frequency.

Readability checks:

- 3-second glance test must reveal path, threat cluster, and player placement options.
- Grayscale test must preserve gameplay hierarchy without color reliance.

## 22. Consistency Enforcement

Every asset must pass this checklist before acceptance:

- Matches silhouette language for its class.
- Uses approved material and palette behavior.
- Honors lighting direction and shadow logic.
- Fits designated scale tier.
- Preserves gameplay readability in combat context.
- Blends with existing assets without style drift.

Rejection triggers:

- Overly realistic photo detail.
- Cartoon exaggeration outside style bounds.
- Inconsistent light source.
- Saturation spikes outside role accents.
- Unclear silhouette at gameplay camera.

## 23. Art Production Rule for Future Batches

For all future assets, include with delivery:

- Role tag.
- Size category.
- Palette family used.
- Lighting notes.
- Intended scale tier.
- Animation timing notes if animated.

This ensures assets created months apart still align as one coherent game world.

## 24. Level Design and Navigation Pipeline (Mandatory)

Workflow order:

1. Compose the environment first as a finished landscape painting.
2. Place cliffs, rivers, forests, hills, and architecture landmarks.
3. Author roads by tracing natural routes through that landscape.
4. Author the navigation spline only after the final road shape is approved.
5. Adapt gameplay and tower opportunities to the authored level shape.

Hard constraints:

- Terrain determines road placement.
- Roads must weave around environmental features.
- The level must never be adapted to a simplistic path generator.
- The navigation path must never drive environment composition.

Entrance storytelling requirements:

- Each entrance must communicate different origin stories, such as cave mouth, abandoned mine, ruined gate, forest trail, or mountain tunnel.
- Entrance props, material wear, and lighting should distinguish each branch at a glance.