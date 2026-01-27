# Splato — Architecture

This document describes the technical architecture of Splato's rendering and viewport systems.

For project context, coding guidelines, and design philosophy, see [CLAUDE.md](./CLAUDE.md).

---

## Overview

Splato is a camera rail editor for Gaussian Splatting scenes. The architecture supports two distinct views:

1. **Editor View** — Free camera navigation with OrbitControls, grid helper, for building and editing camera rails
2. **Player View** — Rail-driven camera controlled by a normalized parameter `t ∈ [0, 1]`, for previewing the final result

Each view has its **own scene and splat instance** to avoid WebGL state conflicts. They share the **camera rail system** for synchronized positioning.

---

## Directory Structure

```text
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts and metadata
│   ├── page.tsx            # Main entry point, orchestrates views
│   └── globals.css         # Tailwind + CSS variables
│
├── components/
│   ├── EditorView.tsx      # React component for editor viewport
│   ├── PlayerView.tsx      # React component for player preview
│   ├── RailEditor.tsx      # Control points list panel
│   ├── SplatLoader.tsx     # URL input for loading splats
│   ├── Toolbar.tsx         # Mode selection toolbar
│   └── ui/                 # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       └── input.tsx
│
├── systems/
│   ├── scene.ts            # Scene management
│   ├── viewport.ts         # Base viewport (renderer + camera)
│   ├── editor-viewport.ts  # Editor viewport with OrbitControls + grid
│   ├── player-viewport.ts  # Player viewport with rail-driven camera
│   ├── camera-rail.ts      # Camera rail system (control points + interpolation)
│   └── control-point-helper.ts  # 3D visualization of control points
│
└── lib/
    └── utils.ts            # Utility functions (cn for classnames)
```

---

## Systems Architecture

### Scene System (`src/systems/scene.ts`)

The scene system owns a `THREE.Scene` instance. Each view creates its own scene to avoid WebGL state conflicts with SplatMesh.

```typescript
interface SceneSystem {
  scene: THREE.Scene;
  add: (object: THREE.Object3D) => void;
  remove: (object: THREE.Object3D) => void;
  dispose: () => void;
}
```

**Key principle**: Editor and Player have **isolated scenes** with separate splat instances. This prevents renderer-specific WebGL state from bleeding between viewports.

---

### Viewport System (`src/systems/viewport.ts`)

The base viewport manages a renderer, camera, and animation loop. It takes an external scene reference — it does not own the scene.

```typescript
interface Viewport {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  container: HTMLElement;
  start: () => void;
  stop: () => void;
  dispose: () => void;
  resize: () => void;
}

interface ViewportOptions {
  container: HTMLElement;
  scene: THREE.Scene;      // External scene reference
  fov?: number;
  near?: number;
  far?: number;
  onFrame?: (time: number) => void;
}
```

**Key principle**: Viewports are composable. The base viewport provides the foundation; specialized viewports extend it with additional features.

---

### Editor Viewport (`src/systems/editor-viewport.ts`)

Extends the base viewport with editor-specific features:

- **OrbitControls** — Smooth camera navigation with damping
- **GridHelper** — 20×20 Unity-style grid centered at origin
- **Camera position** — Starts at `(5, 5, 5)` looking at origin

```typescript
interface EditorViewport extends Viewport {
  controls: OrbitControls;
  gridHelper: THREE.GridHelper;
}
```

---

### Player Viewport (`src/systems/player-viewport.ts`)

Extends the base viewport with rail-driven camera:

- **Rail camera** — Position and rotation interpolated along the camera rail
- **Parameter `t`** — Normalized progress `[0, 1]` along the rail
- **No user camera controls** — Camera is fully deterministic

```typescript
interface PlayerViewport extends Viewport {
  setProgress: (t: number) => void;
  getProgress: () => number;
}
```

---

### Camera Rail System (`src/systems/camera-rail.ts`)

The camera rail manages control points that define the camera path. It maps `t ∈ [0, 1]` to a camera pose.

```typescript
interface ControlPoint {
  id: string;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

interface CameraPose {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

interface CameraRailSystem {
  controlPoints: ControlPoint[];

  // Control point management
  addPoint: (position: THREE.Vector3, quaternion?: THREE.Quaternion) => ControlPoint;
  removePoint: (id: string) => void;
  updatePoint: (id: string, position?: THREE.Vector3, quaternion?: THREE.Quaternion) => void;
  getPoint: (id: string) => ControlPoint | undefined;
  reorderPoint: (id: string, newIndex: number) => void;

  // Rail interpolation
  getPose: (t: number) => CameraPose | null;

  // Serialization
  toJSON: () => ControlPointData[];
  fromJSON: (data: ControlPointData[]) => void;

  dispose: () => void;
}
```

**Key principle**: The rail maps `t → camera pose`. It knows nothing about scroll, UI, or React. This enables:

- Scroll-driven playback (scroll position → t → camera pose)
- UI scrubbing (slider value → t → camera pose)
- Animation export (keyframes at regular t intervals)

**Interpolation**: Currently uses linear position lerp + quaternion SLERP between adjacent control points. Future: Catmull-Rom spline for smoother paths.

---

## Data Flow

```text
┌─────────────────────────────────────────────────────────────────────┐
│                          React Layer                                 │
│                                                                      │
│  ┌──────────────┐                                                    │
│  │   page.tsx   │ ─── manages state: splatUrl, editorMode, rail     │
│  └──────┬───────┘                                                    │
│         │                                                            │
│         ├────────────────────┬───────────────────────┐               │
│         ▼                    ▼                       ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐       │
│  │ EditorView   │    │ PlayerView   │    │ UI Panels        │       │
│  │   .tsx       │    │   .tsx       │    │ (RailEditor,     │       │
│  │              │    │              │    │  SplatLoader,    │       │
│  │              │    │              │    │  Toolbar)        │       │
│  └──────┬───────┘    └──────┬───────┘    └──────────────────┘       │
│         │                   │                                        │
└─────────│───────────────────│────────────────────────────────────────┘
          │                   │
          ▼                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Systems Layer                                 │
│                                                                      │
│  ┌──────────────────┐              ┌──────────────────┐             │
│  │  Editor Scene    │              │  Player Scene    │             │
│  │  • SplatMesh     │              │  • SplatMesh     │             │
│  │  • GridHelper    │              │  (own instance)  │             │
│  │  • ControlPoint  │              │                  │             │
│  │    helpers       │              │                  │             │
│  └────────┬─────────┘              └────────┬─────────┘             │
│           │                                 │                        │
│           ▼                                 ▼                        │
│  ┌──────────────────┐              ┌──────────────────┐             │
│  │ EditorViewport   │              │ PlayerViewport   │             │
│  │ • OrbitControls  │              │ • setProgress(t) │             │
│  │ • GridHelper     │              │ • Rail-driven    │             │
│  └──────────────────┘              └──────────────────┘             │
│                                                                      │
│                    ┌──────────────────────┐                         │
│                    │   CameraRailSystem   │ ◄─── SHARED             │
│                    │   • controlPoints[]  │                         │
│                    │   • getPose(t)       │                         │
│                    └──────────────────────┘                         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

**Key insight**: The camera rail is the only shared system between Editor and Player. Each has its own scene, splat, and renderer to avoid WebGL conflicts.

---

## React Integration

React is used for **lifecycle orchestration only**. Three.js objects are stored in refs, never in state (except for objects needed for conditional rendering).

```typescript
// EditorView.tsx pattern
const sceneRef = useRef<SceneSystem | null>(null);
const viewportRef = useRef<EditorViewport | null>(null);
const splatRef = useRef<SplatMesh | null>(null);

useEffect(() => {
  // Initialize systems once
  const sceneSystem = createSceneSystem();
  const viewport = createEditorViewport({ container, scene: sceneSystem.scene });
  // ...
  return () => {
    viewport.dispose();
    sceneSystem.dispose();
  };
}, []);
```

**Exception**: The `CameraRailSystem` is stored in React state at the page level because PlayerView's rendering depends on its presence.

---

## PlayerView Architecture

PlayerView is a self-contained preview component:

- **Card UI** at bottom-left with aspect-ratio viewport
- **Scroll-bound animation**: scroll within the card maps to `t ∈ [0, 1]`
- **Fullscreen mode**: expands to fill screen, scroll controls playback
- **Own scene + splat**: isolated from editor to prevent WebGL conflicts

```typescript
interface PlayerViewProps {
  splatUrl: string;           // Loads own splat instance
  rail: CameraRailSystem;     // Shared rail for camera positioning
}
```

---

## Gaussian Splatting Integration

Splats are loaded via Spark.js as first-class Three.js objects:

```typescript
import { SplatMesh } from "@sparkjsdev/spark";

const splat = new SplatMesh({ url: "/model.spz" });
splat.position.set(0, 0, 0);
splat.quaternion.set(1, 0, 0, 0);
sceneSystem.add(splat);
```

Spark.js is an **implementation detail**. The architecture does not depend on it — splats behave like any other `THREE.Object3D`.

**Important**: SplatMesh has renderer-specific WebGL state. Multiple renderers cannot share the same SplatMesh instance. Each viewport that needs to display a splat must load its own instance.

Supported formats: `.spz`, `.splat`, `.ply`

---

## Export Strategy

Splato's export is designed for **scroll-driven storytelling on websites** (landing pages, portfolios, etc.).

### The Core Question: JSON Config vs. Scene Bundle?

The PlayerView forms what looks like a complete, exportable scene — splat + camera rail + scroll binding. Why not bundle and export the whole thing?

**The scene isn't actually portable.**

What looks like "the scene" is really: Spark.js + Three.js + specific WebGL state + render loop timing. Export that as a bundle and consumers are locked to exact dependency versions. When Spark.js ships a breaking change, exported bundles break.

**Shaders and lighting make bundling worse, not better.**

Future features like GLSL shaders and lighting *strengthen* the case for JSON. A shader is uniforms + source code. Lighting is parameters. These are **data**, not implementations. Export them as config, and the consumer's player interprets them — maybe they use a different shader compiler, maybe they're on WebGPU.

**The real product isn't the scene — it's the camera path.**

What Splato creates that's *actually valuable* is the camera rail. The splat already exists elsewhere (hosted asset). The consumer already has Three.js. What they *don't* have is a good way to author scroll-driven camera animation. That's the export.

**The right mental model: Figma → CSS, not Figma → static image.**

Figma doesn't export a "rendered website." It exports design tokens, specs, and code snippets that developers integrate. Splato should do the same: export the *creative intent* (rail, timing, splat reference), let the consumer handle rendering.

---

### Export Format: JSON Configuration

```typescript
interface SplatoExport {
  version: string;
  splat: {
    url: string;              // Splat asset URL (hosted separately)
    position?: [number, number, number];
    rotation?: [number, number, number, number];
  };
  rail: {
    controlPoints: ControlPointData[];
    interpolation?: "linear" | "catmull-rom";
  };
  // Future extensions:
  // camera?: { fov?: number; near?: number; far?: number; };
  // shaders?: { ... };
  // lighting?: { ... };
}
```

### Why JSON over Scene Bundle?

1. **Separation of data vs. implementation**: The rail is pure data. The rendering implementation (Three.js version, Spark.js version, custom shaders) is the consumer's choice.

2. **Future-proofing**: Adding shaders, lighting, post-processing — these are config options, not bundled code. The consumer's player can interpret them.

3. **Size**: Splat files can be 10-100MB+. They should be hosted as assets, not bundled in exports.

4. **Flexibility**: Consumers can customize playback behavior, add their own effects, or use different splat libraries.

5. **Longevity**: JSON configs remain valid across library upgrades. Bundled WebGL code doesn't.

---

### What Gets Shipped

```text
Export: splato-config.json (~5KB)
├── rail: control points, interpolation mode
├── splat: { url: "https://cdn.../model.spz", transform: {...} }
└── meta: { version, createdAt }

+ @splato/player (tree-shakeable, ~30KB gzipped)
    └── drop-in scroll-driven splat player
```

The consumer either uses the player package, or reads the JSON and rolls their own. Either way, they're not locked to Splato's implementation choices.

---

### Embeddable Player (Future)

A lightweight `@splato/player` package that consumes the JSON config:

```html
<script type="module">
  import { SplatoPlayer } from '@splato/player';

  const player = new SplatoPlayer({
    container: document.getElementById('hero'),
    config: '/path/to/export.json',
    scrollContainer: window,  // or a specific element
  });
</script>
```

This keeps Splato (the editor) separate from the runtime (the player), enabling independent evolution of both.

---

## Future Roadmap

1. **Rail Interpolation**
   - Catmull-Rom spline for smoother camera paths
   - Easing functions per segment

2. **Export System**
   - JSON config export
   - Embeddable player library

3. **Enhanced Rail Editor**
   - Timeline/progress scrubber
   - Keyframe easing controls
   - Path preview visualization

4. **Scene Enhancements**
   - Multiple splats
   - Basic lighting controls
   - GLSL shader presets
