# Splato

**Scroll-driven camera rail editor for your Gaussian splat scenes.**

![Splato Screenshot](public/splato-screenshot.png)

Splato is a creative prototyping tool for designing scroll-driven camera animations through Gaussian Splatting scenes. Build camera rails, preview scroll-bound playback, and export configurations for use in your own projects.

---

## Features

- **Camera Rail Editor** — Define control points to create smooth camera paths through your scene
- **Dual Viewport** — Edit in free-camera mode, preview in scroll-driven player mode
- **Scroll-Driven Playback** — Camera position mapped to scroll progress (`t ∈ [0, 1]`)
- **Export to JSON** — Portable configuration for integration into any Three.js project
- **Multiple Splat Formats** — Supports `.spz`, `.splat`, and `.ply` files

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
git clone https://github.com/your-username/splato.git
cd splato
npm install
```

### Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## How to Use

### 1. Load a Splat

Enter a URL to a Gaussian Splat file (`.spz`, `.splat`, or `.ply`) in the loader panel.

### 2. Build Your Camera Rail

Switch to **Editor Mode** to navigate freely with orbit controls:

- **Left-click + drag** — Rotate camera
- **Right-click + drag** — Pan
- **Scroll** — Zoom

Position your camera and click **Add Control Point** to save that pose to the rail. Add multiple points to define your camera path.

### 3. Preview the Animation

Switch to **Player Mode** to see the scroll-driven preview. Scroll within the player viewport to scrub through the camera rail animation.

### 4. Export

Click **Export** to download a JSON configuration file containing your camera rail and splat reference. Use this with your own Three.js setup or a future `@splato/player` package.

---

## Tech Stack

| Technology | Purpose |
| ---------- | ------- |
| [Next.js](https://nextjs.org) | App framework (App Router) |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Three.js](https://threejs.org) | 3D rendering |
| [Spark.js](https://github.com/sparkjsdev/spark) | Gaussian Splatting |
| [Tailwind CSS](https://tailwindcss.com) | Styling |
| [shadcn/ui](https://ui.shadcn.com) | UI components |

---

## Architecture

Splato separates concerns into distinct systems:

```text
src/
├── app/                    # Next.js pages and layout
├── components/             # React components (UI + view wrappers)
│   ├── EditorView.tsx      # Free-camera editing viewport
│   ├── PlayerView.tsx      # Scroll-driven preview viewport
│   ├── RailEditor.tsx      # Control points panel
│   └── ui/                 # shadcn/ui components
└── systems/                # Pure TypeScript, no React
    ├── scene.ts            # Three.js scene management
    ├── viewport.ts         # Base renderer + camera
    ├── editor-viewport.ts  # OrbitControls + grid
    ├── player-viewport.ts  # Rail-driven camera
    └── camera-rail.ts      # Control points + interpolation
```

**Key principles:**

- Three.js objects live in refs, not React state
- Camera rail is a pure function: `t → camera pose`
- Each viewport has its own scene + splat instance (WebGL isolation)

See [architecture.md](./architecture.md) for detailed technical documentation.

---

## Export Format

Splato exports a portable JSON configuration:

```json
{
  "version": "1.0",
  "splat": {
    "url": "https://example.com/scene.spz"
  },
  "rail": {
    "controlPoints": [
      {
        "id": "cp-1",
        "position": [5, 2, 3],
        "quaternion": [0, 0, 0, 1]
      }
    ]
  }
}
```

This separates your creative work (the camera path) from the rendering implementation, allowing integration with any Three.js setup.

---

## Supported Splat Formats

| Format | Extension |
| ------ | --------- |
| Spark Compressed | `.spz` |
| Standard Splat | `.splat` |
| Point Cloud | `.ply` |

---

## Roadmap

- [ ] Catmull-Rom spline interpolation for smoother paths
- [ ] Timeline scrubber with easing controls
- [ ] `@splato/player` embeddable package
- [ ] Multiple splats per scene
- [ ] Lighting and shader presets

---

## License

MIT
