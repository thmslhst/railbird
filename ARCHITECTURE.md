# Splato — Architecture

This document describes the technical architecture of Splato's rendering and viewport systems.

For project context, coding guidelines, and design philosophy, see [CLAUDE.md](./CLAUDE.md).

---

## Overview

Splato is a camera rail editor for Gaussian Splatting scenes. The architecture supports two distinct views:

1. **Editor View** — Free camera navigation with OrbitControls, grid helper, for building and editing camera rails
2. **Player View** — Rail-driven camera controlled by a normalized parameter `t ∈ [0, 1]`, for previewing the final result

Both views render the **same scene** but with different camera systems and renderers.

---

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with fonts and metadata
│   ├── page.tsx            # Main entry point, renders EditorView
│   └── globals.css         # Tailwind + CSS variables
│
├── components/
│   ├── EditorView.tsx      # React component for editor viewport
│   ├── SplatViewer.tsx     # Legacy viewer (deprecated, kept for reference)
│   ├── UrlInput.tsx        # UI for loading custom splat URLs
│   └── ui/                 # shadcn/ui components
│       ├── button.tsx
│       └── input.tsx
│
├── systems/
│   ├── scene.ts            # Shared scene management
│   ├── viewport.ts         # Base viewport (renderer + camera)
│   ├── editor-viewport.ts  # Editor viewport with OrbitControls + grid
│   └── rendering.ts        # Legacy rendering system (deprecated)
│
└── lib/
    └── utils.ts            # Utility functions (cn for classnames)
```

---

## Systems Architecture

### Scene System (`src/systems/scene.ts`)

The scene system owns the shared `THREE.Scene` instance. It is decoupled from any viewport or renderer.

```typescript
interface SceneSystem {
  scene: THREE.Scene;
  add: (object: THREE.Object3D) => void;
  remove: (object: THREE.Object3D) => void;
  dispose: () => void;
}
```

**Key principle**: The scene is the single source of truth for all 3D objects (splats, meshes, helpers). Multiple viewports can render the same scene simultaneously.

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

### Player Viewport (Future: `src/systems/player-viewport.ts`)

Will extend the base viewport with rail-driven camera:

- **Rail camera** — Position and rotation interpolated along the camera rail
- **Parameter `t`** — Normalized progress `[0, 1]` along the rail
- **No user camera controls** — Camera is fully deterministic

```typescript
// Future interface
interface PlayerViewport extends Viewport {
  rail: CameraRail;
  setProgress: (t: number) => void;
}
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         React Layer                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   page.tsx   │───▶│ EditorView   │    │ PlayerView   │       │
│  │              │    │   .tsx       │    │   .tsx       │       │
│  └──────────────┘    └──────┬───────┘    └──────┬───────┘       │
│         │                   │                   │                │
│         │                   │                   │                │
└─────────│───────────────────│───────────────────│────────────────┘
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Systems Layer                              │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                   SceneSystem                         │       │
│  │  • THREE.Scene (shared)                              │       │
│  │  • SplatMesh, helpers, meshes                        │       │
│  └──────────────────────────────────────────────────────┘       │
│              │                           │                       │
│              ▼                           ▼                       │
│  ┌──────────────────────┐    ┌──────────────────────┐           │
│  │   EditorViewport     │    │   PlayerViewport     │           │
│  │  • WebGLRenderer     │    │  • WebGLRenderer     │           │
│  │  • PerspectiveCamera │    │  • PerspectiveCamera │           │
│  │  • OrbitControls     │    │  • CameraRail        │           │
│  │  • GridHelper        │    │  • t parameter       │           │
│  └──────────────────────┘    └──────────────────────┘           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## React Integration

React is used for **lifecycle orchestration only**. Three.js objects are stored in refs, never in state.

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

---

## Camera Rail System (Planned)

The camera rail will be implemented as a pure, deterministic system:

```typescript
// Future interface
interface CameraRail {
  // Get camera pose at normalized position t
  getPose: (t: number) => { position: THREE.Vector3; quaternion: THREE.Quaternion };

  // Control points for editing
  controlPoints: ControlPoint[];

  // Serialization for export
  toJSON: () => RailConfig;
  fromJSON: (config: RailConfig) => void;
}
```

**Key principle**: The rail maps `t → camera pose`. It knows nothing about scroll, UI, or React. This enables:

- Scroll-driven playback (scroll position → t → camera pose)
- UI scrubbing (slider value → t → camera pose)
- Animation export (keyframes at regular t intervals)

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

Supported formats: `.spz`, `.splat`, `.ply`

---

## Future Roadmap

1. **Camera Rail System**
   - Control point creation and editing
   - Interpolation (Catmull-Rom or similar)
   - Visual rail preview in editor

2. **Player View**
   - Rail-driven camera
   - Scroll binding (`scroll position → t`)
   - Fullscreen preview mode

3. **Rail Editor UI**
   - Control point manipulation
   - Timeline/progress slider
   - Rail visualization overlays

4. **Export**
   - Rail configuration export (JSON)
   - Embeddable player component
