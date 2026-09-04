# ADR-001: Vector editing engine

- Status: Accepted
- Date: 2026-09-04

## Context

OpenBioFigure requires interactive object transforms, grouping and multi-selection, JSON mapping, SVG import/export, PNG export, viewport control, and a permissive license. Users must not need a commercial key to run the open-source product in production.

## Options reviewed

| Engine                                             | License/current constraint                                | Strengths                                                                                   | Limitation for this product                                                                       |
| -------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [Fabric.js](https://github.com/fabricjs/fabric.js) | MIT                                                       | Mature object model, transforms, grouping, selection, JSON/SVG/PNG capabilities, TypeScript | Canvas-oriented accessibility and browser-specific runtime require an application adapter         |
| [Paper.js](https://github.com/paperjs/paper.js)    | MIT                                                       | Strong vector geometry and SVG import/export                                                | Lower-level interactive editor primitives would require more custom selection/controls work       |
| [Konva](https://github.com/konvajs/konva)          | MIT                                                       | Strong Canvas/React interaction and raster export                                           | No native editable SVG export, a central requirement                                              |
| [tldraw SDK](https://tldraw.dev/community/license) | Source available with production license-key requirements | Polished collaborative canvas framework                                                     | Current production terms do not fit a dependency users can deploy freely without a commercial key |

The evaluation used current official project documentation and repositories. A browser spike confirmed Fabric 7.4 object creation, selection, project mapping, sanitized SVG import, SVG serialization, and PNG generation. A Node-only attempt was intentionally rejected because the selected browser build depends on DOM/canvas APIs.

## Decision

Use Fabric.js 7.4 behind `FabricEditor`. React owns application panels and committed snapshots; Fabric owns high-frequency canvas interaction. Persist only the independent OpenBioFigure model.

## Consequences

- V0.1 obtains reliable transforms and vector export without building an editor engine from scratch.
- Fabric can be upgraded or replaced without declaring its internal JSON the permanent public format.
- Canvas object accessibility needs separate keyboard/list controls and remains a documented limitation.
- Browser E2E is required for engine behavior; Node-only unit tests cover the domain model.
