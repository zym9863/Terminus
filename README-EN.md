[中文](README.md)

# Terminus Horizon

An interactive WebGL-based web experience. Users explore a procedurally generated 3D world from a first-person perspective. As they move forward, nearby visuals gradually undergo "digital weathering"—degrading from sharp high-definition renders to pixel blocks and glitches, ultimately dissolving into void. Players can also place "echo beacons" in the world to store messages, which decay over time and with each viewing.

## Features

### The Entropy Gallery

- **Procedural world generation**: The world extends infinitely along the Z axis, with a chunk system dynamically loading and unloading content.
- **Entropy system**: The farther from the origin, the higher the entropy and the more severe the visual decay.
  - Civilization phase (0.0–0.2): Clear rendering with normal lighting
  - Weathered phase (0.2–0.4): Faded colors, edge noise
  - Pixelated phase (0.4–0.6): Lowered resolution, simplified geometry
  - Glitch phase (0.6–0.8): Vertex displacement, chromatic aberration
  - Void phase (0.8–1.0): Geometry dissolves into darkness

### Echo Beacons

- Place persistent message beacons in the world
- Beacons decay over time and with view counts
- View beacons left by other players

## Technology Stack

| Layer | Technology |
|------|------|
| Frontend framework | Svelte 5 + Vite |
| 3D rendering | Three.js + custom GLSL shaders |
| Backend/database | Supabase (PostgreSQL + Realtime) |
| Language | TypeScript |

## Project Structure

```
terminus/
├── src/
│   ├── lib/
│   │   ├── engine/         # Three.js scene, camera, render loop
│   │   ├── world/          # Chunk generation, procedural content
│   │   ├── shaders/        # GLSL vertex/fragment shaders
│   │   ├── entropy/        # Entropy system, decay effects
│   │   ├── beacons/        # Beacon system (placement, decay, rendering)
│   │   ├── controls/       # First-person controller
│   │   └── supabase/       # Supabase client, data operations
│   ├── components/         # Svelte UI components (HUD, beacon editor)
│   ├── App.svelte
│   └── main.ts
├── public/
├── docs/
│   └── plans/              # design documents
├── package.json
└── vite.config.ts
```

## Quick Start

### Requirements

- Node.js 18+
- pnpm (recommended) or npm

### Install dependencies

```bash
pnpm install
```

### Environment configuration

Copy `.env.example` to `.env` and fill in your Supabase settings:

```bash
cp .env.example .env
```

Set the following variables:
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon key

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Preview production build

```bash
pnpm preview
```

## Controls

| Key | Action |
|------|------|
| WASD | Move |
| Mouse | Look around |
| E | Place beacon |
| F | Inspect beacon |
| ESC | Exit / unlock cursor |

## Development Resources

- [Design document](docs/plans/2026-02-21-terminus-horizon-design.md)
- [Implementation plan](docs/plans/2026-02-21-terminus-horizon-implementation.md)

## IDE recommendations

[VS Code](https://code.visualstudio.com/) + [Svelte extension](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)

## License

MIT
