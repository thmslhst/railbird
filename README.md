# Splato

A focused creative prototyping tool for **Gaussian Splatting**, **Three.js scenes**, and **scroll-driven camera rails**.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to run the app

## Project Structure

```text
splato/
├── CLAUDE.md                    # Project guidelines
├── public/
│   └── butterfly.spz            # Gaussian splat model
├── src/
│   ├── app/
│   │   ├── layout.tsx           # Root layout with Splato metadata
│   │   ├── page.tsx             # Main page with SplatViewer
│   │   └── globals.css          # Tailwind + full viewport styles
│   ├── components/
│   │   └── SplatViewer.tsx      # React component (lifecycle only)
│   ├── systems/
│   │   └── rendering.ts         # Core Three.js rendering system
│   └── lib/
│       └── utils.ts             # shadcn utilities
└── package.json
```

## Tech Stack

- **Next.js 16** (App Router)
- **TypeScript**
- **Three.js** + **@types/three**
- **@sparkjsdev/spark** (Gaussian Splatting)
- **Tailwind CSS v4**
- **shadcn/ui**

## Architecture Notes

- Three.js objects are stored in **refs**, not React state
- Rendering system is **decoupled** from React (`src/systems/rendering.ts`)
- SplatMesh is treated as a **first-class Three.js object**
- React handles **lifecycle only**, not per-frame logic

## Supported Splat Formats

- `.spz`
- `.splat`
- `.ply`
