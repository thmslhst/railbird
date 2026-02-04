# Railbird — Project Context & Coding Guidelines

You are working on **Railbird**, a focused **creative prototyping tool for camera rails**.

Railbird is **not a throwaway demo**.
It is a small but solid foundation for designing **scroll-driven camera animations** through any Three.js scene — whether that's Gaussian Splats, glTF models, OBJ meshes, or custom geometry.

For now, Railbird intentionally focuses on:
- **a single camera**
- **a single scrollable camera rail**
- no multi-camera system

---

## Tech Stack

- **Next.js** (App Router)
- **TypeScript**
- **Three.js**
- **Spark.js** (Gaussian Splatting support)
- **Tailwind CSS**
- **shadcn/ui**

---

## Supported Asset Formats

Railbird is **model-agnostic**. The camera rail system works with any Three.js-compatible content:

**Gaussian Splats:**

- `.spz` (Spark compressed)
- `.splat`
- `.ply`

**3D Models (future):**

- `.glb` / `.gltf`
- `.obj`
- `.fbx`

File loading logic should remain format-agnostic at the system level.

---

## Core Intent

Railbird is built around **camera rail creation and scene composition**. The rail system is the product — not any specific 3D format.

**The camera rail is the first-class citizen.**

Any 3D content (splats, meshes, models) must be treated as **first-class Three.js objects** that the rail system animates through, not as a renderer or viewer that owns the scene.

The architecture must remain flexible enough to evolve into:
- a more advanced camera rail editor
- timeline-based storytelling
- multi-format scene composition
- richer interaction tooling

…but without prematurely supporting multi-camera setups.

---

## Key Architectural Principles

### Scene Content

- All 3D content must exist at the **mesh / Object3D level**.
- Format-specific loaders (Spark.js, GLTFLoader, etc.) are **implementation details**, not core architectural pillars.
- Avoid viewer-style abstractions that control:
  - the render loop
  - the camera
  - the scene
- All content must behave like standard Three.js objects:
  - positionable
  - rotatable
  - animatable
  - swappable

---

### Camera System

- Railbird uses **a single camera**.
- The camera is a **first-class system**, not a side effect of scroll or UI.

The camera must never depend directly on:
- scroll position
- UI events
- DOM measurements

All camera motion must go through a **normalized parameter**: t ∈ [0, 1]

This parameter represents progression along the camera rail and enables:
- scroll-driven camera motion
- scrubbing via UI controls
- deterministic camera paths
- future animation export

Even though there is only one camera, its control logic must be **decoupled and explicit**.

---

### Camera Rail

- The camera rail represents a **single continuous path**.
- It is responsible for mapping `t → camera pose`.
- It should be implemented as a pure, deterministic system.

**The rail is the core product.** It must be:

- independent of scene content
- serializable to JSON
- importable into any Three.js project

The rail must not know:
- about scroll
- about UI
- about React
- about what content is in the scene

---

### Separation of Concerns

Keep systems clearly separated:

- **Scene system**
  (Three.js scene, content loading, meshes, helpers)

- **Camera system**
  (camera rig, camera rail, interpolation)

- **Rendering system**
  (renderer, animation loop, resize handling)

- **UI / Editor system**
  (controls, panels, overlays — Tailwind + shadcn)

Avoid monolithic abstractions that blur these responsibilities.

---

## React / Next.js Guidelines

- React is used for **orchestration and lifecycle**, not per-frame logic.
- Do NOT store Three.js objects (scene, camera, renderer) in React state.
- Avoid React-driven render loops.
- Prefer explicit imperative logic for WebGL systems.
- Three.js should live outside React render cycles whenever possible.

---

## Tailwind & shadcn Guidelines

- Tailwind CSS is used for layout, spacing, and visual structure.
- shadcn/ui is used for:
  - panels
  - sliders
  - buttons
  - editor-like UI components

UI components must:
- remain decoupled from Three.js internals
- communicate with systems via explicit parameters (e.g. normalized `t`)
- never directly manipulate Three.js objects

---

## What to Avoid

- ❌ Viewer abstractions that own:
  - the render loop
  - the camera
  - the scene
- ❌ Multi-camera assumptions or abstractions
- ❌ Tight coupling between format-specific loaders and React components
- ❌ Clever React abstractions that obscure Three.js state
- ❌ Camera logic directly tied to scroll or UI events
- ❌ Over-engineering before editor features exist
- ❌ Treating any 3D format as more important than the rail system

---

## Coding Style

- Type-safe and explicit
- Readable and debuggable
- Minimal magic
- Favor clarity over premature optimization
- Prefer small, composable modules over large classes

---

## Design Philosophy

Railbird should feel like:
- a **creative tool**
- a **focused experiment**
- a **camera-first playground**

When making design decisions:
- Think in terms of **systems**, not components.
- Prefer patterns that scale toward an **editor**, even if unused initially.
- If a choice makes future camera rail editing harder, choose another approach.
- The rail system should work with any scene content — don't over-couple to any format.

---

## When Writing Code

- Explain non-obvious architectural decisions briefly.
- Default to explicit, boring solutions over clever ones.
- Optimize for **hackability** and **iteration speed**.

Railbird is meant to be explored, bent, and extended — starting with a single camera and a single scrollable rail that works with any Three.js content.
