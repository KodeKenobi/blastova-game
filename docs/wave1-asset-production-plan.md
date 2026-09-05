# Wave 1 Asset Production Plan

Scope: Complete visual asset list for a shippable Wave 1 build aligned to the approved art direction style guide.

Legend:

- Priority: `P0` required for Wave 1, `P1` important enhancement, `P2` polish.
- Layer: `L0` sky/far background, `L1` terrain base, `L2` path/water, `L3` structures/props, `L4` actors, `L5` projectiles/combat, `L6` particles/lighting overlays, `L7` non-HUD UI.
- Reuse potential: `High`, `Medium`, `Low`.

## 1) Terrain Base and Ground Tiles

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| Grass 01 | Primary meadow tile | 128x128 | None | Static | L1 | P0 | High |
| Grass 02 | Secondary hue variation | 128x128 | None | Static | L1 | P0 | High |
| Grass 03 | Worn grass variation | 128x128 | None | Static | L1 | P0 | High |
| Dirt 01 | Bare earth tile | 128x128 | None | Static | L1 | P0 | High |
| Dirt 02 | Compacted earth variation | 128x128 | None | Static | L1 | P0 | High |
| Dirt 03 | Rocky dirt variation | 128x128 | None | Static | L1 | P1 | High |
| Mud Patch 01 | Damp ground transition | 128x128 | None | Static | L1 | P1 | Medium |
| Ground Transition Grass-Dirt A | Blend edge tile | 128x128 | None | Static | L1 | P0 | High |
| Ground Transition Grass-Dirt B | Blend edge tile alt | 128x128 | None | Static | L1 | P0 | High |
| Ground AO Decal Small | Contact darkening decal | 64x64 | None | Static | L6 | P1 | High |
| Ground AO Decal Medium | Contact darkening decal | 128x128 | None | Static | L6 | P1 | High |
| Ground Detail Pebbles | Low-frequency detail | 64x64 | None | Static | L3 | P2 | High |

## 2) Path, Roads, and Route Readability

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| Road Straight 01 | Main route segment | 128x128 | None | Static | L2 | P0 | High |
| Road Straight 02 | Variation for repetition break | 128x128 | None | Static | L2 | P0 | High |
| Road Corner Inner 01 | Route turning tile | 128x128 | None | Static | L2 | P0 | High |
| Road Corner Outer 01 | Route turning tile | 128x128 | None | Static | L2 | P0 | High |
| Road Taper Entry | Spawn lane visual intro | 128x128 | None | Static | L2 | P0 | Medium |
| Road Taper Exit | Core lane visual finish | 128x128 | None | Static | L2 | P0 | Medium |
| Road Edge Dust Decal 01 | Soft lane border breakup | 128x128 | None | Static | L2 | P1 | High |
| Wheel Rut Decal 01 | Directional wear | 128x128 | None | Static | L2 | P1 | High |
| Route Marker Rune Friendly | Optional route accent marker | 64x64 | Pulse 6-frame optional | Animated | L6 | P2 | Medium |
| Spline Bend Detail Pack A | Natural curve edge breakup decals | 128x128 set | None | Static | L2 | P0 | High |
| Spline Bend Detail Pack B | Secondary curve breakup decals | 128x128 set | None | Static | L2 | P1 | High |
| Road Narrowing Transition | Organic width contraction segment | 128x128 | None | Static | L2 | P0 | High |
| Road Widening Transition | Organic width expansion segment | 128x128 | None | Static | L2 | P0 | High |
| Choke Point Ground Decal | Shared merge readability marker | 128x128 | None | Static | L2 | P0 | Medium |

Path authorship deliverables (mandatory for Wave 1):

- Hand-authored road paintover sheet (single flattened concept pass).
- Navigation spline trace overlay (separate guide image).
- Branch merge readability pass (annotated top-down image).
- Coverage intent sketch showing overlapping tower arcs at key loops.

## 3) Rivers, Cliffs, and Bridges

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| River Straight | Water channel body | 128x128 | 6-frame flow loop | Animated | L2 | P0 | High |
| River Corner | Water turn segment | 128x128 | 6-frame flow loop | Animated | L2 | P0 | High |
| River Bank Grass Side A | Shore transition | 128x128 | None | Static | L2 | P0 | High |
| River Bank Dirt Side B | Shore transition variation | 128x128 | None | Static | L2 | P0 | High |
| River Foam Edge Decal | Shore impact foam | 128x128 | 8-frame soft loop | Animated | L6 | P1 | High |
| Cliff Top 01 | Plateau top tile | 128x128 | None | Static | L1 | P1 | High |
| Cliff Face 01 | Vertical rock face | 128x128 | None | Static | L3 | P1 | High |
| Cliff Corner Convex | Cliff shape control | 128x128 | None | Static | L3 | P1 | Medium |
| Cliff Corner Concave | Cliff shape control | 128x128 | None | Static | L3 | P1 | Medium |
| Bridge Straight | Path crossing river | 128x128 | None | Static | L3 | P0 | High |
| Bridge Corner | Stylized diagonal bend bridge | 128x128 | None | Static | L3 | P1 | Medium |
| Bridge Pillar Shadow Decal | Depth cue under bridge | 128x64 | None | Static | L6 | P1 | High |

## 4) Vegetation and Natural Props

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| Large Tree | Landmark foliage mass | 192x256 | Subtle 4-frame sway | Animated | L3 | P0 | High |
| Dead Tree | Silhouette contrast prop | 128x192 | None | Static | L3 | P1 | Medium |
| Bush | Mid-size filler vegetation | 96x64 | Optional 4-frame sway | Animated | L3 | P0 | High |
| Flower Patch | Color accent ground prop | 64x64 | None | Static | L3 | P1 | High |
| Tall Grass Clump A | Edge framing | 64x96 | 4-frame sway | Animated | L3 | P1 | High |
| Tall Grass Clump B | Variation | 64x96 | 4-frame sway | Animated | L3 | P1 | High |
| Rock Cluster Small | Pathside texture breakup | 64x64 | None | Static | L3 | P1 | High |
| Rock Cluster Large | Blocking silhouette prop | 128x96 | None | Static | L3 | P1 | Medium |
| Fallen Log | Organic obstacle visual | 128x64 | None | Static | L3 | P2 | Medium |
| Root Tangle | Ground narrative detail | 96x64 | None | Static | L3 | P2 | Medium |

## 5) Architecture and Objective Set

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| Castle Wall | Defended perimeter module | 128x128 | None | Static | L3 | P0 | High |
| Castle Wall Damaged | Wear variation | 128x128 | None | Static | L3 | P1 | Medium |
| Castle Gate | Main objective entrance | 192x192 | Gate glow pulse 6-frame | Animated | L3 | P0 | Medium |
| Core Crystal Housing | Wave objective focal point | 192x192 | 8-frame emissive pulse | Animated | L3 | P0 | Low |
| Watchtower Prop | Non-playable scenic structure | 128x192 | None | Static | L3 | P1 | Medium |
| Barricade Wooden | Combat read prop | 96x64 | None | Static | L3 | P1 | High |
| Banner Friendly | Faction readability | 64x128 | 6-frame cloth flutter | Animated | L3 | P1 | Medium |
| Lamp Post | Local warm lighting anchor | 64x128 | 4-frame flame flicker | Animated | L3 | P1 | High |

## 5.1) Enemy Entrance Storytelling Set (Multi-Branch)

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| Cave Entrance A | Branch entrance landmark | 256x256 | Optional ambient dust 8-frame | Animated | L3 | P0 | Medium |
| Abandoned Mine Entrance | Branch entrance landmark | 256x256 | Lantern flicker 6-frame | Animated | L3 | P0 | Medium |
| Ruined Gate Entrance | Branch entrance landmark | 256x256 | None | Static | L3 | P0 | Medium |
| Forest Trail Entrance Arch | Branch entrance landmark | 256x256 | Leaf drift loop 8-frame | Animated | L3 | P0 | Medium |
| Mountain Tunnel Entrance | Branch entrance landmark | 256x256 | Fog pulse 8-frame | Animated | L3 | P0 | Medium |
| Entrance Signpost Variants | Distinct branch identity props | 128x128 each | None | Static | L3 | P1 | High |
| Entrance Ground Wear Set | Unique branch-specific wear decals | 128x128 set | None | Static | L2 | P1 | High |
| Entrance Ambient FX Pack | Dust/fog/embers per entrance type | 64x64 and 128x128 | 8-12 frame loops | Animated | L6 | P1 | High |

## 6) Build Pads and Placement Readability

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| Build Pad Base | Default placement marker | 96x96 | None | Static | L3 | P0 | High |
| Build Pad Selected Ring | Hover/selection state | 96x96 | 8-frame pulse | Animated | L6 | P0 | High |
| Build Pad Blocked Overlay | Invalid placement feedback | 96x96 | 4-frame shimmer | Animated | L6 | P0 | High |
| Build Pad Occupied Cap | Occupied state clarity | 96x96 | None | Static | L3 | P0 | High |
| Range Circle Friendly | Placement preview | 256x256 | Alpha pulse 6-frame | Animated | L6 | P0 | High |

## 7) Tower Asset Set (Wave 1 Gameplay Set)

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| Tower Archer T1 Base | Core single-target tower | 128x128 | Idle 4-frame | Animated | L4 | P0 | High |
| Tower Archer T1 Fire | Attack state | 128x128 | Fire 6-frame | Animated | L5 | P0 | High |
| Tower Cannon T1 Base | AoE splash tower | 128x128 | Idle 4-frame | Animated | L4 | P0 | High |
| Tower Cannon T1 Fire | Cannon recoil/fire | 128x128 | Fire 6-frame | Animated | L5 | P0 | High |
| Tower Arcane T1 Base | Magic beam tower | 128x128 | Idle emissive 6-frame | Animated | L4 | P0 | High |
| Tower Arcane T1 Fire | Cast cycle | 128x128 | Cast 8-frame | Animated | L5 | P0 | High |
| Tower Foundation Stone | Shared grounding plate | 128x128 | None | Static | L3 | P0 | High |
| Tower Shadow Generic | Contact/readability shadow | 96x48 | None | Static | L3 | P0 | High |
| Tower HP Bar Frame | In-world tower health | 48x8 | None | Static | L6 | P0 | High |
| Tower Upgrade Flash FX | Upgrade feedback | 64x64 | 10-frame burst | Animated | L6 | P1 | High |

## 8) Enemy Asset Set (Wave 1)

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| Enemy Runner T1 | Fast low-HP unit | 96x96 | Run 8-frame, Hit 4-frame, Death 8-frame | Animated | L4 | P0 | High |
| Enemy Grunt T1 | Baseline unit | 96x96 | Run 8-frame, Attack 6-frame, Death 8-frame | Animated | L4 | P0 | High |
| Enemy Brute T1 | High-HP slow unit | 128x128 | Run 6-frame, Attack 6-frame, Death 10-frame | Animated | L4 | P0 | High |
| Enemy Shieldbearer T1 | Armor role | 96x96 | Run 8-frame, Block 4-frame, Death 8-frame | Animated | L4 | P1 | Medium |
| Enemy Scout Variant A | Visual diversity skin | 96x96 | Reuse runner anim set | Animated | L4 | P1 | High |
| Enemy Scout Variant B | Visual diversity skin | 96x96 | Reuse runner anim set | Animated | L4 | P1 | High |
| Enemy Shadow Generic | Ground anchoring | 64x32 | None | Static | L3 | P0 | High |
| Enemy HP Bar Frame | In-world enemy health | 40x6 | None | Static | L6 | P0 | High |
| Enemy Spawn Puff | Spawn readability | 64x64 | 8-frame puff | Animated | L6 | P1 | High |
| Enemy Death Burst Grounded | Death readability | 96x96 | 10-frame burst | Animated | L6 | P0 | High |

## 9) Projectiles and Impact Set

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| Arrow Projectile | Archer shot | 32x32 | Spin optional 4-frame | Animated | L5 | P0 | High |
| Cannon Shell Projectile | Cannon shot | 32x32 | None | Static | L5 | P0 | High |
| Arcane Bolt Projectile | Magic shot | 48x48 | 6-frame emissive loop | Animated | L5 | P0 | High |
| Arcane Beam Segment | Beam weapon body | 64x16 | 6-frame flow | Animated | L5 | P1 | Medium |
| Arrow Impact FX | Small hit feedback | 64x64 | 6-frame burst | Animated | L6 | P0 | High |
| Cannon Impact FX | Heavy hit feedback | 128x128 | 10-frame explosion | Animated | L6 | P0 | High |
| Arcane Impact FX | Magic hit feedback | 96x96 | 8-frame pulse | Animated | L6 | P0 | High |
| Splash Ring Decal | AoE boundary cue | 96x96 | 8-frame fade ring | Animated | L6 | P1 | High |
| Projectile Trail Dust | Ballistic movement cue | 32x32 | 6-frame trail | Animated | L6 | P1 | High |
| Projectile Trail Energy | Magic movement cue | 48x48 | 6-frame trail | Animated | L6 | P1 | High |

## 10) Particles, Atmospherics, and Combat Feedback

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| Dust Puff Small | Movement/impact support | 32x32 | 6-frame | Animated | L6 | P1 | High |
| Dust Puff Medium | Heavier impacts | 64x64 | 8-frame | Animated | L6 | P1 | High |
| Spark Burst Warm | Physical hit sparkle | 64x64 | 6-frame | Animated | L6 | P1 | High |
| Spark Burst Cool | Energy hit sparkle | 64x64 | 6-frame | Animated | L6 | P1 | High |
| Smoke Wisp Loop A | Ambient depth | 128x128 | 12-frame loop | Animated | L6 | P2 | High |
| Smoke Wisp Loop B | Ambient variation | 128x128 | 12-frame loop | Animated | L6 | P2 | High |
| Leaf Drift Particle | Environment life | 32x32 | 8-frame loop | Animated | L6 | P2 | Medium |
| Hit Flash White | Universal contact flash | 32x32 | 4-frame | Animated | L6 | P0 | High |
| Gold Pickup Burst | Reward feedback | 64x64 | 8-frame burst | Animated | L6 | P0 | High |
| Wave Start Pulse | Start-of-wave signal | 256x256 | 10-frame pulse | Animated | L6 | P1 | Medium |

## 11) Lighting and Shadow Overlays

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| Global Vignette | Focus center playfield | 2048x1024 | None | Static | L6 | P1 | High |
| Sunlight Gradient Overlay | Directional lighting mood | 2048x1024 | None | Static | L6 | P1 | Medium |
| Warm Rim Highlight Decal | Architecture edge boost | 128x128 | None | Static | L6 | P2 | Medium |
| Contact Shadow Soft Small | Grounding small units | 64x32 | None | Static | L3 | P0 | High |
| Contact Shadow Soft Medium | Grounding large units | 96x48 | None | Static | L3 | P0 | High |
| Core Glow Aura | Objective emphasis | 256x256 | 8-frame pulse | Animated | L6 | P0 | Medium |
| Torch Light Blob | Local warm light | 128x128 | 6-frame flicker | Animated | L6 | P1 | High |

## 12) Non-HUD UI Visual Assets (Allowed Scope)

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| Modal Panel Frame | Pause/settings/wave popups | 1024x512 | None | Static | L7 | P1 | High |
| Modal Panel Fill Texture | Shared panel interior | 512x512 | None | Static | L7 | P1 | High |
| Button Primary Idle | Main call-to-action button | 256x64 | None | Static | L7 | P1 | High |
| Button Primary Hover | Hover state | 256x64 | 4-frame glow pulse optional | Animated | L7 | P1 | High |
| Button Secondary Idle | Secondary action button | 256x64 | None | Static | L7 | P1 | High |
| Tooltip Frame | Context hints | 320x96 | None | Static | L7 | P2 | High |
| Divider Line Ornate | Section separation | 512x16 | None | Static | L7 | P2 | High |
| Icon Warning | Danger/warning indicator | 64x64 | 6-frame pulse optional | Animated | L7 | P1 | High |
| Icon Confirm | Success/confirm indicator | 64x64 | None | Static | L7 | P1 | High |
| Loading Crest | Scene transition mark | 128x128 | 12-frame rotation/pulse | Animated | L7 | P2 | Medium |

## 13) Typography and Marking Assets

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| World Label Plate | Location name backing | 512x96 | None | Static | L7 | P1 | High |
| Objective Marker Friendly | Defend-point icon | 64x64 | 8-frame pulse | Animated | L6 | P0 | High |
| Spawn Marker Enemy | Entry warning icon | 64x64 | 8-frame pulse | Animated | L6 | P0 | High |
| Damage Number Atlas | Combat feedback numerals | 512x256 atlas | 6-frame float style variants | Animated | L6 | P1 | High |
| Wave Banner Backplate | Wave start/end text frame | 1024x192 | None | Static | L7 | P1 | Medium |
| Branch Entrance Marker Set | Optional branch IDs for debug/readability | 64x64 | 6-frame pulse optional | Animated | L6 | P1 | High |
| Choke Point Marker Set | Shared merge marker family | 64x64 | 6-frame pulse optional | Animated | L6 | P1 | High |

## 14) Atlas and Packaging Deliverables (Production Assets)

| Name | Purpose | Approximate Size | Animation Requirements | Static or Animated | Layer | Priority | Reuse Potential |
|---|---|---:|---|---|---|---|---|
| Terrain Atlas A | Ground + transitions | 2048x2048 | N/A | Mixed | L1-L2 | P0 | High |
| Structures Atlas A | Walls, gates, props | 2048x2048 | N/A | Mixed | L3 | P0 | High |
| Towers Atlas A | Tower bases and states | 2048x2048 | N/A | Mixed | L4-L5 | P0 | High |
| Enemies Atlas A | Enemy sheets | 2048x2048 | N/A | Mixed | L4 | P0 | High |
| VFX Atlas A | Particles and impacts | 2048x2048 | N/A | Mixed | L6 | P0 | High |
| UI Atlas A (Non-HUD) | Menus/modals/buttons/icons | 2048x2048 | N/A | Mixed | L7 | P1 | High |

## Wave 1 Minimum Ship Set

If you need immediate sequencing, build all `P0` assets first, then `P1`, then `P2`.
This list is complete for a cohesive Wave 1 visual production pipeline aligned to the approved style direction, including all environment, gameplay, feedback, and non-HUD interface visuals.

Additional Wave 1 gate criteria:

- At least three independent entrances must be visually complete and production-ready.
- Branches must merge into one or more shared choke points with dedicated terrain read assets.
- Road segments must pass hand-authored spline review (no grid-like corner cadence).
- A terrain-first composition review must be approved before navigation spline lock.