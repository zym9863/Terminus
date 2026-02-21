# Terminus Horizon Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an interactive WebGL experience where users traverse a procedurally generated 3D world that progressively degrades from clarity to void, with placeable message beacons that decay over time.

**Architecture:** Svelte 5 + Vite app with Three.js for 3D rendering. The world is chunk-based along the Z axis, with entropy-driven shader effects. Supabase provides real-time beacon persistence. UI overlays are Svelte components.

**Tech Stack:** Svelte 5, Vite, Three.js, GLSL Shaders, Supabase (PostgreSQL + Realtime), TypeScript

---

### Task 1: Scaffold Svelte 5 + Vite Project

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `svelte.config.js`
- Create: `src/main.ts`, `src/App.svelte`, `src/app.css`
- Create: `index.html`

**Step 1: Initialize Svelte 5 project with Vite**

Run:
```bash
cd D:/github/Terminus
npm create vite@latest . -- --template svelte-ts
```

If prompted about non-empty directory, confirm overwrite.

**Step 2: Install core dependencies**

Run:
```bash
npm install three @types/three @supabase/supabase-js simplex-noise
npm install -D @sveltejs/vite-plugin-svelte
```

**Step 3: Verify project builds**

Run: `npm run dev`
Expected: Vite dev server starts, opens browser with default Svelte page.

**Step 4: Clean default template content**

Replace `src/App.svelte` with:
```svelte
<script lang="ts">
</script>

<main>
  <canvas id="terminus-canvas"></canvas>
</main>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    background: #000;
  }

  main {
    width: 100vw;
    height: 100vh;
    position: relative;
  }

  #terminus-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
```

Replace `src/app.css` with:
```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
```

Replace `src/main.ts` with:
```typescript
import './app.css'
import { mount } from 'svelte'
import App from './App.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
```

**Step 5: Verify clean build**

Run: `npm run dev`
Expected: Black page with a canvas element filling the viewport.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: scaffold Svelte 5 + Vite project with Three.js dependencies"
```

---

### Task 2: Three.js Engine Core

**Files:**
- Create: `src/lib/engine/renderer.ts`
- Create: `src/lib/engine/scene.ts`
- Create: `src/lib/engine/camera.ts`
- Create: `src/lib/engine/loop.ts`
- Modify: `src/App.svelte`

**Step 1: Create the renderer module**

Create `src/lib/engine/renderer.ts`:
```typescript
import * as THREE from 'three'

export function createRenderer(canvas: HTMLCanvasElement): THREE.WebGLRenderer {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0x000000, 1)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  return renderer
}
```

**Step 2: Create the camera module**

Create `src/lib/engine/camera.ts`:
```typescript
import * as THREE from 'three'

export function createCamera(): THREE.PerspectiveCamera {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(0, 1.6, 0) // eye height
  return camera
}

export function handleResize(camera: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer) {
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onResize)
  return () => window.removeEventListener('resize', onResize)
}
```

**Step 3: Create the scene module**

Create `src/lib/engine/scene.ts`:
```typescript
import * as THREE from 'three'

export function createScene(): THREE.Scene {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0a0a12)
  scene.fog = new THREE.FogExp2(0x0a0a12, 0.015)

  // Ambient light — dim, like dying starlight
  const ambient = new THREE.AmbientLight(0x1a1a2e, 0.3)
  scene.add(ambient)

  // Directional light — cold, distant
  const directional = new THREE.DirectionalLight(0x4a4a8a, 0.8)
  directional.position.set(0, 50, -100)
  scene.add(directional)

  return scene
}
```

**Step 4: Create the render loop**

Create `src/lib/engine/loop.ts`:
```typescript
import * as THREE from 'three'

export type UpdateCallback = (delta: number, elapsed: number) => void

export function createRenderLoop(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) {
  const clock = new THREE.Clock()
  const callbacks: UpdateCallback[] = []

  function onUpdate(cb: UpdateCallback) {
    callbacks.push(cb)
    return () => {
      const idx = callbacks.indexOf(cb)
      if (idx !== -1) callbacks.splice(idx, 1)
    }
  }

  function animate() {
    const delta = clock.getDelta()
    const elapsed = clock.getElapsedTime()
    for (const cb of callbacks) {
      cb(delta, elapsed)
    }
    renderer.render(scene, camera)
  }

  renderer.setAnimationLoop(animate)

  function dispose() {
    renderer.setAnimationLoop(null)
  }

  return { onUpdate, dispose }
}
```

**Step 5: Wire everything in App.svelte**

Replace `src/App.svelte`:
```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { createRenderer } from './lib/engine/renderer'
  import { createCamera, handleResize } from './lib/engine/camera'
  import { createScene } from './lib/engine/scene'
  import { createRenderLoop } from './lib/engine/loop'

  let canvas: HTMLCanvasElement

  onMount(() => {
    const renderer = createRenderer(canvas)
    const camera = createCamera()
    const scene = createScene()
    const { onUpdate, dispose } = createRenderLoop(renderer, scene, camera)
    const cleanupResize = handleResize(camera, renderer)

    // Test: add a simple cube to verify rendering
    const geo = new THREE.BoxGeometry(1, 1, 1)
    const mat = new THREE.MeshStandardMaterial({ color: 0x4488ff })
    const cube = new THREE.Mesh(geo, mat)
    cube.position.set(0, 1, -5)
    scene.add(cube)

    import('three').then(THREE => {
      // Already imported above via modules
    })

    onUpdate((delta, elapsed) => {
      cube.rotation.y += delta * 0.5
    })

    return () => {
      cleanupResize()
      dispose()
    }
  })
</script>

<main>
  <canvas bind:this={canvas} id="terminus-canvas"></canvas>
</main>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    background: #000;
  }

  main {
    width: 100vw;
    height: 100vh;
    position: relative;
  }

  #terminus-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
```

**Step 6: Verify 3D rendering works**

Run: `npm run dev`
Expected: A blue rotating cube on a dark background with fog.

**Step 7: Remove test cube, commit**

Remove the test cube code from App.svelte (the `geo`, `mat`, `cube`, and `onUpdate` rotation lines).

```bash
git add -A
git commit -m "feat: add Three.js engine core (renderer, camera, scene, render loop)"
```

---

### Task 3: First-Person Controls

**Files:**
- Create: `src/lib/controls/first-person.ts`
- Modify: `src/App.svelte`

**Step 1: Create first-person controller**

Create `src/lib/controls/first-person.ts`:
```typescript
import * as THREE from 'three'
import type { UpdateCallback } from '../engine/loop'

export interface FirstPersonControls {
  enable(): void
  disable(): void
  isLocked(): boolean
  getPosition(): THREE.Vector3
  getDirection(): THREE.Vector3
  update: UpdateCallback
  dispose(): void
}

export function createFirstPersonControls(
  camera: THREE.PerspectiveCamera,
  canvas: HTMLCanvasElement
): FirstPersonControls {
  const euler = new THREE.Euler(0, 0, 0, 'YXZ')
  const velocity = new THREE.Vector3()
  const direction = new THREE.Vector3()
  const moveForward = new THREE.Vector3()
  const moveSide = new THREE.Vector3()

  let locked = false
  const keys: Record<string, boolean> = {}

  const SPEED = 8.0
  const MOUSE_SENSITIVITY = 0.002
  const DAMPING = 8.0

  function onMouseMove(e: MouseEvent) {
    if (!locked) return
    euler.setFromQuaternion(camera.quaternion)
    euler.y -= e.movementX * MOUSE_SENSITIVITY
    euler.x -= e.movementY * MOUSE_SENSITIVITY
    euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, euler.x))
    camera.quaternion.setFromEuler(euler)
  }

  function onKeyDown(e: KeyboardEvent) {
    keys[e.code] = true
  }

  function onKeyUp(e: KeyboardEvent) {
    keys[e.code] = false
  }

  function onPointerLockChange() {
    locked = document.pointerLockElement === canvas
  }

  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('keydown', onKeyDown)
  document.addEventListener('keyup', onKeyUp)
  document.addEventListener('pointerlockchange', onPointerLockChange)

  const update: UpdateCallback = (delta) => {
    if (!locked) return

    // Calculate movement direction
    direction.set(0, 0, 0)
    camera.getWorldDirection(moveForward)
    moveForward.y = 0
    moveForward.normalize()
    moveSide.crossVectors(camera.up, moveForward).normalize()

    if (keys['KeyW'] || keys['ArrowUp']) direction.add(moveForward)
    if (keys['KeyS'] || keys['ArrowDown']) direction.sub(moveForward)
    if (keys['KeyA'] || keys['ArrowLeft']) direction.add(moveSide)
    if (keys['KeyD'] || keys['ArrowRight']) direction.sub(moveSide)

    if (direction.length() > 0) direction.normalize()

    // Apply acceleration & damping
    const targetVelocity = direction.multiplyScalar(SPEED)
    velocity.lerp(targetVelocity, 1.0 - Math.exp(-DAMPING * delta))

    camera.position.add(velocity.clone().multiplyScalar(delta))
    camera.position.y = 1.6 // Lock to eye height
  }

  return {
    enable() {
      canvas.requestPointerLock()
    },
    disable() {
      document.exitPointerLock()
    },
    isLocked: () => locked,
    getPosition: () => camera.position.clone(),
    getDirection: () => {
      const dir = new THREE.Vector3()
      camera.getWorldDirection(dir)
      return dir
    },
    update,
    dispose() {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('keyup', onKeyUp)
      document.removeEventListener('pointerlockchange', onPointerLockChange)
    },
  }
}
```

**Step 2: Integrate controls in App.svelte**

Add to `<script>` in App.svelte after scene creation:
```typescript
import { createFirstPersonControls } from './lib/controls/first-person'

// Inside onMount, after createRenderLoop:
const controls = createFirstPersonControls(camera, canvas)
onUpdate(controls.update)

// Click to lock pointer
canvas.addEventListener('click', () => {
  if (!controls.isLocked()) controls.enable()
})

// In cleanup:
// controls.dispose()
```

**Step 3: Verify first-person movement**

Run: `npm run dev`
Expected: Click canvas to lock pointer. WASD moves, mouse looks around. Smooth movement with damping.

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add first-person controls with pointer lock and WASD movement"
```

---

### Task 4: Entropy System Core

**Files:**
- Create: `src/lib/entropy/entropy-system.ts`

**Step 1: Create entropy system**

Create `src/lib/entropy/entropy-system.ts`:
```typescript
/**
 * Maps player Z position to an entropy value (0.0 = civilization, 1.0 = void).
 * The transition zone spans from Z=0 to Z=-500 (player walks into negative Z).
 */

export interface EntropyState {
  value: number        // 0.0 ~ 1.0
  phase: EntropyPhase
  phaseName: string
  phaseProgress: number // progress within current phase (0~1)
}

export type EntropyPhase = 'civilization' | 'weathering' | 'pixelation' | 'glitch' | 'void'

const ENTROPY_DISTANCE = 500 // units of Z travel for full entropy

const PHASES: { name: EntropyPhase; label: string; start: number; end: number }[] = [
  { name: 'civilization', label: '文明', start: 0.0, end: 0.2 },
  { name: 'weathering', label: '风化', start: 0.2, end: 0.4 },
  { name: 'pixelation', label: '像素化', start: 0.4, end: 0.6 },
  { name: 'glitch', label: '乱码', start: 0.6, end: 0.8 },
  { name: 'void', label: '虚空', start: 0.8, end: 1.0 },
]

export function calculateEntropy(playerZ: number): EntropyState {
  // Player walks into negative Z
  const distance = Math.abs(Math.min(playerZ, 0))
  const value = Math.min(1.0, distance / ENTROPY_DISTANCE)

  let phase = PHASES[0]
  for (const p of PHASES) {
    if (value >= p.start && value < p.end) {
      phase = p
      break
    }
    if (value >= 1.0) {
      phase = PHASES[PHASES.length - 1]
    }
  }

  const phaseProgress = (value - phase.start) / (phase.end - phase.start)

  return {
    value,
    phase: phase.name,
    phaseName: phase.label,
    phaseProgress: Math.min(1.0, Math.max(0.0, phaseProgress)),
  }
}

export function getEntropyColor(value: number): { r: number; g: number; b: number } {
  // Blue (0.0) -> Cyan (0.3) -> Yellow (0.6) -> Red (0.8) -> Dark Red (1.0)
  if (value < 0.3) {
    const t = value / 0.3
    return { r: t * 0.2, g: 0.4 + t * 0.6, b: 1.0 - t * 0.3 }
  } else if (value < 0.6) {
    const t = (value - 0.3) / 0.3
    return { r: 0.2 + t * 0.8, g: 1.0 - t * 0.2, b: 0.7 - t * 0.7 }
  } else {
    const t = (value - 0.6) / 0.4
    return { r: 1.0 - t * 0.5, g: 0.8 - t * 0.8, b: t * 0.1 }
  }
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add entropy system with phase calculation and color mapping"
```

---

### Task 5: GLSL Shaders — Entropy-Driven Material

**Files:**
- Create: `src/lib/shaders/entropy-vertex.glsl`
- Create: `src/lib/shaders/entropy-fragment.glsl`
- Create: `src/lib/shaders/entropy-material.ts`

**Step 1: Configure Vite for GLSL imports**

Install vite-plugin-glsl:
```bash
npm install -D vite-plugin-glsl
```

Update `vite.config.ts`:
```typescript
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import glsl from 'vite-plugin-glsl'

export default defineConfig({
  plugins: [svelte(), glsl()],
})
```

**Step 2: Create vertex shader**

Create `src/lib/shaders/entropy-vertex.glsl`:
```glsl
uniform float uEntropy;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vEntropy;

// Simplex noise helper (2D)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                     -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v -   i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
         + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
               dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vUv = uv;
  vNormal = normalMatrix * normal;
  vEntropy = uEntropy;

  vec3 pos = position;

  // Vertex displacement increases with entropy
  if (uEntropy > 0.3) {
    float displaceStrength = smoothstep(0.3, 0.8, uEntropy) * 2.0;
    float noise = snoise(pos.xz * 0.5 + uTime * 0.3);
    pos += normal * noise * displaceStrength;
  }

  // Quantize positions at high entropy (pixelation effect on geometry)
  if (uEntropy > 0.5) {
    float gridSize = mix(1.0, 4.0, smoothstep(0.5, 0.9, uEntropy));
    pos = floor(pos * gridSize + 0.5) / gridSize;
  }

  vec4 worldPos = modelMatrix * vec4(pos, 1.0);
  vWorldPosition = worldPos.xyz;

  gl_Position = projectionMatrix * viewMatrix * worldPos;
}
```

**Step 3: Create fragment shader**

Create `src/lib/shaders/entropy-fragment.glsl`:
```glsl
uniform float uEntropy;
uniform float uTime;
uniform vec3 uBaseColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying float vEntropy;

float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec3 color = uBaseColor;
  vec3 lightDir = normalize(vec3(0.3, 1.0, -0.5));
  float diffuse = max(dot(normalize(vNormal), lightDir), 0.0);
  color *= 0.3 + 0.7 * diffuse;

  // Phase 1: Weathering — desaturation and noise
  if (uEntropy > 0.2) {
    float weathering = smoothstep(0.2, 0.4, uEntropy);
    float gray = dot(color, vec3(0.299, 0.587, 0.114));
    color = mix(color, vec3(gray), weathering * 0.7);

    float noise = random(vUv * 100.0 + uTime) * 0.15 * weathering;
    color += noise;
  }

  // Phase 2: Color channel separation (chromatic aberration)
  if (uEntropy > 0.4) {
    float glitchStrength = smoothstep(0.4, 0.8, uEntropy);
    float offset = glitchStrength * 0.05;
    color.r = color.r + random(vUv + uTime * 0.1) * offset;
    color.b = color.b - random(vUv - uTime * 0.1) * offset;
  }

  // Phase 3: Glitch bands
  if (uEntropy > 0.6) {
    float glitchBand = step(0.97, random(vec2(floor(vWorldPosition.y * 10.0), uTime * 5.0)));
    color = mix(color, vec3(random(vUv + uTime), 0.0, random(vUv - uTime)), glitchBand * smoothstep(0.6, 0.8, uEntropy));
  }

  // Phase 4: Dissolve to void
  if (uEntropy > 0.8) {
    float dissolve = smoothstep(0.8, 1.0, uEntropy);
    float noise = random(vUv * 50.0 + uTime * 2.0);
    if (noise < dissolve * 0.8) discard;
    color *= 1.0 - dissolve * 0.9;
  }

  gl_FragColor = vec4(color, 1.0);
}
```

**Step 4: Create entropy material factory**

Create `src/lib/shaders/entropy-material.ts`:
```typescript
import * as THREE from 'three'
import entropyVertex from './entropy-vertex.glsl'
import entropyFragment from './entropy-fragment.glsl'

export function createEntropyMaterial(baseColor: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uEntropy: { value: 0.0 },
      uTime: { value: 0.0 },
      uBaseColor: { value: baseColor },
    },
    vertexShader: entropyVertex,
    fragmentShader: entropyFragment,
    side: THREE.DoubleSide,
  })
}

export function updateEntropyMaterials(
  materials: THREE.ShaderMaterial[],
  entropy: number,
  time: number
) {
  for (const mat of materials) {
    mat.uniforms.uEntropy.value = entropy
    mat.uniforms.uTime.value = time
  }
}
```

**Step 5: Add GLSL type declaration**

Create `src/glsl.d.ts`:
```typescript
declare module '*.glsl' {
  const value: string
  export default value
}
```

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add entropy-driven GLSL shaders with displacement, glitch, and dissolve effects"
```

---

### Task 6: Chunk-Based Procedural World Generation

**Files:**
- Create: `src/lib/world/chunk.ts`
- Create: `src/lib/world/chunk-manager.ts`
- Create: `src/lib/world/procedural.ts`

**Step 1: Create procedural generation utilities**

Create `src/lib/world/procedural.ts`:
```typescript
import { createNoise2D, createNoise3D } from 'simplex-noise'
import seedrandom from 'seedrandom'

// Note: we'll use simplex-noise which provides createNoise2D/3D
// If seedrandom is not available, use a simple seed-based approach

export function createSeededNoise(seed: number) {
  // simplex-noise createNoise2D accepts a PRNG function
  const rng = () => {
    seed = (seed * 16807 + 0) % 2147483647
    return (seed - 1) / 2147483646
  }
  return {
    noise2D: createNoise2D(rng),
    noise3D: createNoise3D(rng),
  }
}

export interface ChunkContent {
  pillars: { x: number; y: number; z: number; height: number; radius: number }[]
  fragments: { x: number; y: number; z: number; scale: number }[]
  floaters: { x: number; y: number; z: number; size: number }[]
}

export function generateChunkContent(chunkIndex: number, chunkSize: number): ChunkContent {
  const seed = chunkIndex * 73856093
  const { noise2D, noise3D } = createSeededNoise(seed)
  const baseZ = chunkIndex * chunkSize

  const pillars: ChunkContent['pillars'] = []
  const fragments: ChunkContent['fragments'] = []
  const floaters: ChunkContent['floaters'] = []

  // Generate pillars (large structures)
  const pillarCount = 3 + Math.floor(Math.abs(noise2D(chunkIndex * 0.1, 0)) * 5)
  for (let i = 0; i < pillarCount; i++) {
    const x = noise2D(i * 1.7, chunkIndex * 0.3) * chunkSize * 0.4
    const z = baseZ + (noise2D(i * 2.3, chunkIndex * 0.7) + 1) * 0.5 * chunkSize
    const height = 2 + Math.abs(noise2D(i * 0.5, chunkIndex)) * 8
    const radius = 0.3 + Math.abs(noise2D(i * 1.1, chunkIndex * 0.2)) * 1.2
    pillars.push({ x, y: height / 2, z: -z, height, radius })
  }

  // Generate fragments (medium debris)
  const fragCount = 8 + Math.floor(Math.abs(noise2D(chunkIndex * 0.2, 1)) * 12)
  for (let i = 0; i < fragCount; i++) {
    const x = noise2D(i * 0.9, chunkIndex * 0.5 + 100) * chunkSize * 0.45
    const z = baseZ + (noise2D(i * 1.5, chunkIndex * 0.8 + 100) + 1) * 0.5 * chunkSize
    const y = 0.2 + Math.abs(noise2D(i * 0.7, chunkIndex + 100)) * 3
    const scale = 0.2 + Math.abs(noise2D(i * 1.3, chunkIndex * 0.4 + 100)) * 0.8
    fragments.push({ x, y, z: -z, scale })
  }

  // Generate floating objects (small, ethereal)
  const floatCount = 5 + Math.floor(Math.abs(noise2D(chunkIndex * 0.3, 2)) * 10)
  for (let i = 0; i < floatCount; i++) {
    const x = noise2D(i * 1.2, chunkIndex * 0.6 + 200) * chunkSize * 0.35
    const z = baseZ + (noise2D(i * 0.8, chunkIndex * 0.9 + 200) + 1) * 0.5 * chunkSize
    const y = 3 + Math.abs(noise2D(i * 0.4, chunkIndex + 200)) * 6
    const size = 0.1 + Math.abs(noise2D(i * 1.6, chunkIndex * 0.3 + 200)) * 0.4
    floaters.push({ x, y, z: -z, size })
  }

  return { pillars, fragments, floaters }
}
```

**Step 2: Create Chunk class**

Create `src/lib/world/chunk.ts`:
```typescript
import * as THREE from 'three'
import { createEntropyMaterial } from '../shaders/entropy-material'
import { generateChunkContent, type ChunkContent } from './procedural'

export const CHUNK_SIZE = 30

// Color palette for structures
const COLORS = [
  new THREE.Color(0x4a6fa5), // steel blue
  new THREE.Color(0x7b8ea0), // gray blue
  new THREE.Color(0x5c7a99), // slate
  new THREE.Color(0x8896a7), // silver
  new THREE.Color(0x3d5a80), // deep blue
]

export class Chunk {
  readonly index: number
  readonly group: THREE.Group
  readonly materials: THREE.ShaderMaterial[] = []
  private disposed = false

  constructor(index: number) {
    this.index = index
    this.group = new THREE.Group()
    this.group.name = `chunk-${index}`
    this.buildGeometry()
  }

  private buildGeometry() {
    const content = generateChunkContent(this.index, CHUNK_SIZE)

    // Pillars — tall cylindrical structures
    for (const p of content.pillars) {
      const geo = new THREE.CylinderGeometry(p.radius, p.radius * 1.2, p.height, 6)
      const color = COLORS[Math.floor(Math.abs(p.x * 100) % COLORS.length)]
      const mat = createEntropyMaterial(color)
      this.materials.push(mat)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(p.x, p.y, p.z)
      this.group.add(mesh)
    }

    // Fragments — rotated boxes (debris)
    for (const f of content.fragments) {
      const geo = new THREE.BoxGeometry(f.scale, f.scale * 0.6, f.scale * 0.8)
      const color = COLORS[Math.floor(Math.abs(f.z * 50) % COLORS.length)]
      const mat = createEntropyMaterial(color)
      this.materials.push(mat)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(f.x, f.y, f.z)
      mesh.rotation.set(f.x * 0.5, f.z * 0.3, f.y * 0.7)
      this.group.add(mesh)
    }

    // Floaters — small icosahedrons (ethereal particles)
    for (const fl of content.floaters) {
      const geo = new THREE.IcosahedronGeometry(fl.size, 0)
      const color = new THREE.Color(0x6688cc)
      const mat = createEntropyMaterial(color)
      mat.transparent = true
      mat.uniforms.uBaseColor.value = color
      this.materials.push(mat)
      const mesh = new THREE.Mesh(geo, mat)
      mesh.position.set(fl.x, fl.y, fl.z)
      this.group.add(mesh)
    }
  }

  updateEntropy(entropy: number, time: number) {
    for (const mat of this.materials) {
      mat.uniforms.uEntropy.value = entropy
      mat.uniforms.uTime.value = time
    }
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.group.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        if (obj.material instanceof THREE.ShaderMaterial) {
          obj.material.dispose()
        }
      }
    })
  }
}
```

**Step 3: Create ChunkManager**

Create `src/lib/world/chunk-manager.ts`:
```typescript
import * as THREE from 'three'
import { Chunk, CHUNK_SIZE } from './chunk'
import { calculateEntropy, type EntropyState } from '../entropy/entropy-system'

const CHUNKS_AHEAD = 5
const CHUNKS_BEHIND = 2

export class ChunkManager {
  private chunks = new Map<number, Chunk>()
  private scene: THREE.Scene
  private currentEntropy: EntropyState

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.currentEntropy = calculateEntropy(0)
  }

  update(playerZ: number, time: number): EntropyState {
    this.currentEntropy = calculateEntropy(playerZ)
    const currentChunkIndex = Math.floor(Math.abs(Math.min(playerZ, 0)) / CHUNK_SIZE)

    const minChunk = Math.max(0, currentChunkIndex - CHUNKS_BEHIND)
    const maxChunk = currentChunkIndex + CHUNKS_AHEAD

    // Load new chunks
    for (let i = minChunk; i <= maxChunk; i++) {
      if (!this.chunks.has(i)) {
        const chunk = new Chunk(i)
        this.chunks.set(i, chunk)
        this.scene.add(chunk.group)
      }
    }

    // Unload distant chunks
    for (const [index, chunk] of this.chunks) {
      if (index < minChunk || index > maxChunk) {
        this.scene.remove(chunk.group)
        chunk.dispose()
        this.chunks.delete(index)
      }
    }

    // Update entropy on all active chunks
    for (const [index, chunk] of this.chunks) {
      // Each chunk has its own local entropy based on its position
      const chunkZ = -(index * CHUNK_SIZE + CHUNK_SIZE / 2)
      const chunkEntropy = calculateEntropy(chunkZ)
      chunk.updateEntropy(chunkEntropy.value, time)
    }

    return this.currentEntropy
  }

  getEntropy(): EntropyState {
    return this.currentEntropy
  }

  dispose() {
    for (const [, chunk] of this.chunks) {
      this.scene.remove(chunk.group)
      chunk.dispose()
    }
    this.chunks.clear()
  }
}
```

**Step 4: Add ground plane**

Add to `src/lib/world/chunk.ts` in `buildGeometry()` at the beginning:
```typescript
// Add ground plane for this chunk
const groundGeo = new THREE.PlaneGeometry(CHUNK_SIZE, CHUNK_SIZE)
const groundColor = new THREE.Color(0x1a1a2e)
const groundMat = createEntropyMaterial(groundColor)
this.materials.push(groundMat)
const ground = new THREE.Mesh(groundGeo, groundMat)
ground.rotation.x = -Math.PI / 2
ground.position.set(0, 0, -(this.index * CHUNK_SIZE + CHUNK_SIZE / 2))
this.group.add(ground)
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add chunk-based procedural world generation with entropy-driven materials"
```

---

### Task 7: Post-Processing Pipeline

**Files:**
- Create: `src/lib/shaders/post-processing.ts`
- Create: `src/lib/shaders/pixelate-shader.glsl`
- Create: `src/lib/shaders/scanline-shader.glsl`
- Modify: `src/lib/engine/loop.ts` (to use EffectComposer)

**Step 1: Create pixelation post-processing shader**

Create `src/lib/shaders/pixelate-shader.glsl`:
```glsl
uniform sampler2D tDiffuse;
uniform float uEntropy;
uniform vec2 uResolution;

varying vec2 vUv;

void main() {
  float entropy = uEntropy;

  if (entropy < 0.35) {
    gl_FragColor = texture2D(tDiffuse, vUv);
    return;
  }

  // Pixelation strength increases with entropy
  float pixelStrength = smoothstep(0.35, 0.7, entropy);
  float pixelSize = mix(1.0, 16.0, pixelStrength);
  vec2 pixelatedUv = floor(vUv * uResolution / pixelSize) * pixelSize / uResolution;

  vec4 color = texture2D(tDiffuse, pixelatedUv);

  // Chromatic aberration
  if (entropy > 0.5) {
    float aberration = smoothstep(0.5, 0.9, entropy) * 0.008;
    color.r = texture2D(tDiffuse, pixelatedUv + vec2(aberration, 0.0)).r;
    color.b = texture2D(tDiffuse, pixelatedUv - vec2(aberration, 0.0)).b;
  }

  // Vignette darkening at high entropy
  if (entropy > 0.7) {
    float vignette = smoothstep(0.7, 1.0, entropy);
    float dist = distance(vUv, vec2(0.5));
    color.rgb *= 1.0 - dist * vignette * 1.5;
  }

  gl_FragColor = color;
}
```

**Step 2: Create scanline post-processing shader**

Create `src/lib/shaders/scanline-shader.glsl`:
```glsl
uniform sampler2D tDiffuse;
uniform float uEntropy;
uniform float uTime;
uniform vec2 uResolution;

varying vec2 vUv;

float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec4 color = texture2D(tDiffuse, vUv);

  if (uEntropy < 0.25) {
    gl_FragColor = color;
    return;
  }

  float strength = smoothstep(0.25, 0.7, uEntropy);

  // Scanlines
  float scanline = sin(vUv.y * uResolution.y * 1.5) * 0.5 + 0.5;
  scanline = pow(scanline, 2.0 - strength);
  color.rgb *= 1.0 - scanline * 0.15 * strength;

  // Static noise
  float noise = random(vUv + uTime) * 0.1 * strength;
  color.rgb += noise;

  // Random horizontal displacement (glitch lines)
  if (uEntropy > 0.55) {
    float glitchStrength = smoothstep(0.55, 0.85, uEntropy);
    float lineRand = random(vec2(floor(vUv.y * 80.0), floor(uTime * 10.0)));
    if (lineRand > 0.97) {
      float shift = (random(vec2(floor(uTime * 30.0), floor(vUv.y * 50.0))) - 0.5) * 0.05 * glitchStrength;
      color = texture2D(tDiffuse, vUv + vec2(shift, 0.0));
    }
  }

  // Fade to black at maximum entropy
  if (uEntropy > 0.85) {
    float fade = smoothstep(0.85, 1.0, uEntropy);
    color.rgb *= 1.0 - fade;
  }

  gl_FragColor = color;
}
```

**Step 3: Create post-processing pipeline**

Create `src/lib/shaders/post-processing.ts`:
```typescript
import * as THREE from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import pixelateFragment from './pixelate-shader.glsl'
import scanlineFragment from './scanline-shader.glsl'

const POST_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export function createPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera
) {
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  // Pixelation pass
  const pixelatePass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uEntropy: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    },
    vertexShader: POST_VERTEX,
    fragmentShader: pixelateFragment,
  })
  composer.addPass(pixelatePass)

  // Scanline + glitch pass
  const scanlinePass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null },
      uEntropy: { value: 0.0 },
      uTime: { value: 0.0 },
      uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    },
    vertexShader: POST_VERTEX,
    fragmentShader: scanlineFragment,
  })
  composer.addPass(scanlinePass)

  function updateEntropy(entropy: number, time: number) {
    pixelatePass.uniforms.uEntropy.value = entropy
    scanlinePass.uniforms.uEntropy.value = entropy
    scanlinePass.uniforms.uTime.value = time
  }

  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    composer.setSize(w, h)
    pixelatePass.uniforms.uResolution.value.set(w, h)
    scanlinePass.uniforms.uResolution.value.set(w, h)
  }

  window.addEventListener('resize', resize)

  return {
    composer,
    updateEntropy,
    dispose() {
      window.removeEventListener('resize', resize)
    },
  }
}
```

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add post-processing pipeline with pixelation, scanlines, and glitch effects"
```

---

### Task 8: Integrate Engine + World + Entropy in App.svelte

**Files:**
- Modify: `src/App.svelte`

**Step 1: Full integration**

Replace `src/App.svelte`:
```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import * as THREE from 'three'
  import { createRenderer } from './lib/engine/renderer'
  import { createCamera, handleResize } from './lib/engine/camera'
  import { createScene } from './lib/engine/scene'
  import { createRenderLoop } from './lib/engine/loop'
  import { createFirstPersonControls } from './lib/controls/first-person'
  import { ChunkManager } from './lib/world/chunk-manager'
  import { createPostProcessing } from './lib/shaders/post-processing'
  import type { EntropyState } from './lib/entropy/entropy-system'

  let canvas: HTMLCanvasElement
  let entropyState: EntropyState | null = $state(null)
  let isLocked = $state(false)

  onMount(() => {
    const renderer = createRenderer(canvas)
    const camera = createCamera()
    const scene = createScene()
    const { onUpdate, dispose: disposeLoop } = createRenderLoop(renderer, scene, camera)
    const cleanupResize = handleResize(camera, renderer)
    const controls = createFirstPersonControls(camera, canvas)
    const chunkManager = new ChunkManager(scene)
    const postProcessing = createPostProcessing(renderer, scene, camera)

    // Override render loop to use composer
    renderer.setAnimationLoop(null)
    const clock = new THREE.Clock()
    const callbacks: ((delta: number, elapsed: number) => void)[] = []

    onUpdate((delta, elapsed) => {
      controls.update(delta, elapsed)
      const pos = controls.getPosition()
      entropyState = chunkManager.update(pos.z, elapsed)
      postProcessing.updateEntropy(entropyState.value, elapsed)
      isLocked = controls.isLocked()
    })

    // Use composer for rendering instead of raw renderer
    function animate() {
      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()
      // Manually run callbacks from createRenderLoop
      controls.update(delta, elapsed)
      const pos = controls.getPosition()
      entropyState = chunkManager.update(pos.z, elapsed)
      postProcessing.updateEntropy(entropyState.value, elapsed)
      isLocked = controls.isLocked()
      postProcessing.composer.render(delta)
    }
    renderer.setAnimationLoop(animate)

    canvas.addEventListener('click', () => {
      if (!controls.isLocked()) controls.enable()
    })

    return () => {
      cleanupResize()
      controls.dispose()
      chunkManager.dispose()
      postProcessing.dispose()
      renderer.setAnimationLoop(null)
    }
  })
</script>

<main>
  <canvas bind:this={canvas} id="terminus-canvas"></canvas>

  {#if !isLocked}
    <div class="overlay">
      <h1 class="title">终焉视界</h1>
      <p class="subtitle">TERMINUS HORIZON</p>
      <p class="hint">点击进入</p>
    </div>
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    overflow: hidden;
    background: #000;
    font-family: 'Courier New', monospace;
  }

  main {
    width: 100vw;
    height: 100vh;
    position: relative;
  }

  #terminus-canvas {
    width: 100%;
    height: 100%;
    display: block;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.7);
    color: #8899bb;
    cursor: pointer;
    z-index: 10;
  }

  .title {
    font-size: 4rem;
    font-weight: 100;
    letter-spacing: 1.5rem;
    margin-bottom: 0.5rem;
    color: #aabbdd;
    text-shadow: 0 0 20px rgba(100, 150, 220, 0.3);
  }

  .subtitle {
    font-size: 1rem;
    letter-spacing: 0.8rem;
    opacity: 0.5;
    margin-bottom: 3rem;
  }

  .hint {
    font-size: 0.9rem;
    opacity: 0.4;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.7; }
  }
</style>
```

**Step 2: Verify full integration**

Run: `npm run dev`
Expected: Title screen shows, click to enter first-person mode. Walk forward (into negative Z) and see the world progressively degrade.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: integrate engine, world generation, entropy system, and post-processing"
```

---

### Task 9: HUD Component

**Files:**
- Create: `src/components/HUD.svelte`
- Modify: `src/App.svelte`

**Step 1: Create HUD component**

Create `src/components/HUD.svelte`:
```svelte
<script lang="ts">
  import type { EntropyState } from '../lib/entropy/entropy-system'
  import { getEntropyColor } from '../lib/entropy/entropy-system'

  interface Props {
    entropy: EntropyState | null
    position: { x: number; y: number; z: number }
    nearbyBeacons: number
    showInteractHint: string | null
  }

  let { entropy, position, nearbyBeacons, showInteractHint }: Props = $props()

  let entropyColorStyle = $derived(() => {
    if (!entropy) return 'rgb(100, 150, 220)'
    const c = getEntropyColor(entropy.value)
    return `rgb(${Math.floor(c.r * 255)}, ${Math.floor(c.g * 255)}, ${Math.floor(c.b * 255)})`
  })

  let entropyPercent = $derived(() => {
    return entropy ? Math.floor(entropy.value * 100) : 0
  })

  // Crosshair jitter based on entropy
  let jitterX = $state(0)
  let jitterY = $state(0)

  $effect(() => {
    if (!entropy || entropy.value < 0.3) {
      jitterX = 0
      jitterY = 0
      return
    }
    const interval = setInterval(() => {
      const strength = entropy!.value * 3
      jitterX = (Math.random() - 0.5) * strength
      jitterY = (Math.random() - 0.5) * strength
    }, 50)
    return () => clearInterval(interval)
  })
</script>

<!-- Crosshair -->
<div class="crosshair" style="transform: translate({jitterX}px, {jitterY}px)">
  <div class="cross-h"></div>
  <div class="cross-v"></div>
</div>

<!-- Bottom-left: coordinates + entropy -->
<div class="hud-bottom-left">
  <div class="coords">
    X:{position.x.toFixed(1)} Y:{position.y.toFixed(1)} Z:{position.z.toFixed(1)}
  </div>
  <div class="entropy-bar">
    <div class="entropy-label">
      熵 {entropyPercent()}% — {entropy?.phaseName ?? '---'}
    </div>
    <div class="entropy-track">
      <div
        class="entropy-fill"
        style="width: {entropyPercent()}%; background: {entropyColorStyle()}"
      ></div>
    </div>
  </div>
</div>

<!-- Top-right: beacon count -->
<div class="hud-top-right">
  <span class="beacon-icon">◈</span> {nearbyBeacons}
</div>

<!-- Interaction hint -->
{#if showInteractHint}
  <div class="interact-hint">
    {showInteractHint}
  </div>
{/if}

<style>
  .crosshair {
    position: fixed;
    top: 50%;
    left: 50%;
    transform-origin: center;
    pointer-events: none;
    z-index: 20;
  }

  .cross-h, .cross-v {
    position: absolute;
    background: rgba(200, 220, 255, 0.5);
  }

  .cross-h {
    width: 16px;
    height: 1px;
    top: 0;
    left: -8px;
  }

  .cross-v {
    width: 1px;
    height: 16px;
    top: -8px;
    left: 0;
  }

  .hud-bottom-left {
    position: fixed;
    bottom: 2rem;
    left: 2rem;
    color: rgba(150, 180, 220, 0.7);
    font-family: 'Courier New', monospace;
    font-size: 0.75rem;
    pointer-events: none;
    z-index: 20;
  }

  .coords {
    margin-bottom: 0.5rem;
    opacity: 0.6;
  }

  .entropy-label {
    margin-bottom: 0.3rem;
  }

  .entropy-track {
    width: 200px;
    height: 3px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .entropy-fill {
    height: 100%;
    transition: width 0.3s ease, background 0.3s ease;
    border-radius: 2px;
  }

  .hud-top-right {
    position: fixed;
    top: 2rem;
    right: 2rem;
    color: rgba(150, 180, 220, 0.6);
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    pointer-events: none;
    z-index: 20;
  }

  .beacon-icon {
    color: rgba(100, 200, 255, 0.8);
  }

  .interact-hint {
    position: fixed;
    bottom: 6rem;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(180, 200, 230, 0.6);
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    pointer-events: none;
    z-index: 20;
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
</style>
```

**Step 2: Integrate HUD in App.svelte**

Add import and state, then include in template (after canvas):
```svelte
import HUD from './components/HUD.svelte'

// In template, after canvas, inside {#if isLocked}:
{#if isLocked && entropyState}
  <HUD
    entropy={entropyState}
    position={playerPosition}
    nearbyBeacons={0}
    showInteractHint="按 E 放置信标"
  />
{/if}
```

Add `playerPosition` state that updates in the animation loop.

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add HUD component with entropy bar, coordinates, and crosshair"
```

---

### Task 10: Supabase Setup & Beacon Data Layer

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/beacons.ts`
- Create: `.env.example`

**Step 1: Create Supabase client**

Create `src/lib/supabase/client.ts`:
```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Beacons will be disabled.')
}

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
```

**Step 2: Create beacon data operations**

Create `src/lib/supabase/beacons.ts`:
```typescript
import { supabase } from './client'

export interface BeaconData {
  id: string
  position_x: number
  position_y: number
  position_z: number
  message: string
  author: string | null
  created_at: string
  view_count: number
  noise_level: number
}

export function calculateEffectiveNoise(beacon: BeaconData): number {
  const now = Date.now()
  const created = new Date(beacon.created_at).getTime()
  const hoursSinceCreation = (now - created) / (1000 * 60 * 60)
  const daysSinceCreation = hoursSinceCreation / 24

  const timeDecay = daysSinceCreation * 0.05  // +0.05 per day
  const viewDecay = beacon.view_count * 0.02   // +0.02 per view

  return Math.min(1.0, beacon.noise_level + timeDecay + viewDecay)
}

export async function fetchBeaconsInRange(
  minZ: number,
  maxZ: number
): Promise<BeaconData[]> {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('beacons')
    .select('*')
    .gte('position_z', minZ)
    .lte('position_z', maxZ)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch beacons:', error.message)
    return []
  }
  return data ?? []
}

export async function placeBeacon(
  position: { x: number; y: number; z: number },
  message: string,
  author?: string
): Promise<BeaconData | null> {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('beacons')
    .insert({
      position_x: position.x,
      position_y: position.y,
      position_z: position.z,
      message,
      author: author || null,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to place beacon:', error.message)
    return null
  }
  return data
}

export async function incrementBeaconViewCount(id: string): Promise<void> {
  if (!supabase) return

  const { error } = await supabase.rpc('increment_beacon_views', { beacon_id: id })
  if (error) {
    // Fallback: manual increment
    const { data } = await supabase
      .from('beacons')
      .select('view_count')
      .eq('id', id)
      .single()
    if (data) {
      await supabase
        .from('beacons')
        .update({ view_count: data.view_count + 1 })
        .eq('id', id)
    }
  }
}

export function subscribeToBeacons(
  onInsert: (beacon: BeaconData) => void
) {
  if (!supabase) return () => {}

  const channel = supabase
    .channel('beacons-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'beacons' },
      (payload) => {
        onInsert(payload.new as BeaconData)
      }
    )
    .subscribe()

  return () => {
    supabase!.removeChannel(channel)
  }
}
```

**Step 3: Create .env.example**

Create `.env.example`:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

**Step 4: Setup Supabase database schema**

This will be done via Supabase MCP tool. The SQL migration:
```sql
CREATE TABLE beacons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  position_z FLOAT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 280),
  author TEXT CHECK (author IS NULL OR char_length(author) <= 30),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  view_count INT NOT NULL DEFAULT 0,
  noise_level FLOAT NOT NULL DEFAULT 0 CHECK (noise_level >= 0 AND noise_level <= 1)
);

-- RLS policies
ALTER TABLE beacons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read beacons" ON beacons
  FOR SELECT USING (true);

CREATE POLICY "Anyone can insert beacons" ON beacons
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update view_count" ON beacons
  FOR UPDATE USING (true) WITH CHECK (true);

-- RPC for atomic view count increment
CREATE OR REPLACE FUNCTION increment_beacon_views(beacon_id UUID)
RETURNS void AS $$
  UPDATE beacons SET view_count = view_count + 1 WHERE id = beacon_id;
$$ LANGUAGE sql;

-- Index for spatial queries
CREATE INDEX idx_beacons_position_z ON beacons (position_z);
```

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add Supabase client and beacon data layer with CRUD operations"
```

---

### Task 11: Beacon 3D Rendering

**Files:**
- Create: `src/lib/beacons/beacon-renderer.ts`
- Create: `src/lib/shaders/beacon-vertex.glsl`
- Create: `src/lib/shaders/beacon-fragment.glsl`

**Step 1: Create beacon shaders**

Create `src/lib/shaders/beacon-vertex.glsl`:
```glsl
uniform float uTime;
uniform float uNoise;

varying vec2 vUv;
varying float vNoise;

void main() {
  vUv = uv;
  vNoise = uNoise;

  vec3 pos = position;

  // Slight sway animation
  float sway = sin(uTime * 2.0 + pos.y * 0.5) * 0.05 * (1.0 - uNoise);
  pos.x += sway;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
```

Create `src/lib/shaders/beacon-fragment.glsl`:
```glsl
uniform float uTime;
uniform float uNoise;
uniform vec3 uColor;

varying vec2 vUv;
varying float vNoise;

float random(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
  vec3 color = uColor;

  // Glow intensity decreases with noise
  float glow = 1.0 - uNoise * 0.8;

  // Flickering at medium noise
  if (uNoise > 0.3) {
    float flicker = sin(uTime * 15.0 + vUv.y * 20.0) * 0.5 + 0.5;
    glow *= mix(1.0, flicker, smoothstep(0.3, 0.7, uNoise));
  }

  // Static noise at high noise
  if (uNoise > 0.5) {
    float noise = random(vUv + uTime * 0.5) * smoothstep(0.5, 1.0, uNoise);
    color = mix(color, vec3(noise), smoothstep(0.5, 0.9, uNoise) * 0.5);
  }

  // Vertical gradient (brighter at center)
  float centerDist = abs(vUv.x - 0.5) * 2.0;
  float beam = 1.0 - centerDist * centerDist;
  glow *= beam;

  // Almost invisible at very high noise
  if (uNoise > 0.9) {
    glow *= 1.0 - smoothstep(0.9, 1.0, uNoise);
  }

  gl_FragColor = vec4(color * glow, glow * 0.8);
}
```

**Step 2: Create beacon renderer**

Create `src/lib/beacons/beacon-renderer.ts`:
```typescript
import * as THREE from 'three'
import beaconVertex from '../shaders/beacon-vertex.glsl'
import beaconFragment from '../shaders/beacon-fragment.glsl'
import type { BeaconData } from '../supabase/beacons'
import { calculateEffectiveNoise } from '../supabase/beacons'

const BEACON_HEIGHT = 8
const BEACON_WIDTH = 0.15
const INTERACTION_DISTANCE = 5

export interface BeaconMesh {
  data: BeaconData
  mesh: THREE.Mesh
  material: THREE.ShaderMaterial
  effectiveNoise: number
}

export class BeaconRenderer {
  private scene: THREE.Scene
  private beacons = new Map<string, BeaconMesh>()

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  addBeacon(beacon: BeaconData) {
    if (this.beacons.has(beacon.id)) return

    const effectiveNoise = calculateEffectiveNoise(beacon)
    if (effectiveNoise >= 1.0) return // Fully decayed

    const geometry = new THREE.PlaneGeometry(BEACON_WIDTH, BEACON_HEIGHT)
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uNoise: { value: effectiveNoise },
        uColor: { value: new THREE.Color(0x44aaff) },
      },
      vertexShader: beaconVertex,
      fragmentShader: beaconFragment,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    })

    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(beacon.position_x, BEACON_HEIGHT / 2, beacon.position_z)

    // Add a second plane rotated 90 degrees for cross-shaped beam
    const mesh2 = mesh.clone()
    mesh2.rotation.y = Math.PI / 2

    const group = new THREE.Group()
    group.add(mesh)
    group.add(mesh2)
    group.position.set(beacon.position_x, BEACON_HEIGHT / 2, beacon.position_z)
    mesh.position.set(0, 0, 0)
    mesh2.position.set(0, 0, 0)

    this.scene.add(group)

    this.beacons.set(beacon.id, {
      data: beacon,
      mesh: group as any,
      material,
      effectiveNoise,
    })
  }

  removeBeacon(id: string) {
    const beacon = this.beacons.get(id)
    if (!beacon) return
    this.scene.remove(beacon.mesh)
    beacon.mesh.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose()
        ;(obj.material as THREE.ShaderMaterial).dispose()
      }
    })
    this.beacons.delete(id)
  }

  update(time: number) {
    for (const [id, beacon] of this.beacons) {
      beacon.effectiveNoise = calculateEffectiveNoise(beacon.data)
      if (beacon.effectiveNoise >= 1.0) {
        this.removeBeacon(id)
        continue
      }
      beacon.material.uniforms.uTime.value = time
      beacon.material.uniforms.uNoise.value = beacon.effectiveNoise
    }
  }

  getClosestBeacon(
    position: THREE.Vector3
  ): { beacon: BeaconData; distance: number } | null {
    let closest: { beacon: BeaconData; distance: number } | null = null

    for (const [, b] of this.beacons) {
      const beaconPos = new THREE.Vector3(
        b.data.position_x,
        b.data.position_y,
        b.data.position_z
      )
      const dist = position.distanceTo(beaconPos)
      if (dist < INTERACTION_DISTANCE) {
        if (!closest || dist < closest.distance) {
          closest = { beacon: b.data, distance: dist }
        }
      }
    }

    return closest
  }

  getBeaconCount(): number {
    return this.beacons.size
  }

  dispose() {
    for (const [id] of this.beacons) {
      this.removeBeacon(id)
    }
  }
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add beacon 3D renderer with decay-driven shader effects"
```

---

### Task 12: Beacon UI Components (Place & View)

**Files:**
- Create: `src/components/BeaconEditor.svelte`
- Create: `src/components/BeaconViewer.svelte`

**Step 1: Create beacon editor component**

Create `src/components/BeaconEditor.svelte`:
```svelte
<script lang="ts">
  interface Props {
    onPlace: (message: string, author: string) => void
    onCancel: () => void
  }

  let { onPlace, onCancel }: Props = $props()

  let message = $state('')
  let author = $state('')

  function handleSubmit() {
    if (message.trim().length === 0) return
    onPlace(message.trim(), author.trim())
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onCancel()
    if (e.key === 'Enter' && e.ctrlKey) handleSubmit()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="backdrop" onclick={onCancel} role="presentation">
  <div class="editor" onclick|stopPropagation role="dialog">
    <h2>放置回声信标</h2>
    <p class="desc">你的消息将逐渐被时间吞噬</p>

    <label>
      <span>消息</span>
      <textarea
        bind:value={message}
        maxlength={280}
        placeholder="在此刻留下一句话..."
        rows={3}
      ></textarea>
      <span class="counter">{message.length}/280</span>
    </label>

    <label>
      <span>署名 (可选)</span>
      <input
        bind:value={author}
        maxlength={30}
        placeholder="匿名"
      />
    </label>

    <div class="actions">
      <button class="cancel" onclick={onCancel}>取消</button>
      <button class="submit" onclick={handleSubmit} disabled={message.trim().length === 0}>
        封存 (Ctrl+Enter)
      </button>
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }

  .editor {
    background: rgba(15, 15, 25, 0.95);
    border: 1px solid rgba(100, 150, 220, 0.2);
    border-radius: 8px;
    padding: 2rem;
    width: 400px;
    max-width: 90vw;
    color: #aabbdd;
    font-family: 'Courier New', monospace;
  }

  h2 {
    font-size: 1.1rem;
    font-weight: 400;
    margin-bottom: 0.3rem;
    color: #ccddff;
  }

  .desc {
    font-size: 0.75rem;
    opacity: 0.5;
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    margin-bottom: 1rem;
  }

  label span {
    display: block;
    font-size: 0.75rem;
    opacity: 0.6;
    margin-bottom: 0.3rem;
  }

  textarea, input {
    width: 100%;
    background: rgba(20, 20, 35, 0.8);
    border: 1px solid rgba(100, 150, 220, 0.15);
    border-radius: 4px;
    color: #ccddff;
    font-family: 'Courier New', monospace;
    font-size: 0.85rem;
    padding: 0.6rem;
    resize: none;
  }

  textarea:focus, input:focus {
    outline: none;
    border-color: rgba(100, 150, 220, 0.4);
  }

  .counter {
    text-align: right;
    display: block;
    font-size: 0.65rem;
    opacity: 0.4;
    margin-top: 0.2rem;
  }

  .actions {
    display: flex;
    gap: 1rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }

  button {
    font-family: 'Courier New', monospace;
    font-size: 0.8rem;
    padding: 0.5rem 1.2rem;
    border-radius: 4px;
    cursor: pointer;
    border: 1px solid rgba(100, 150, 220, 0.3);
    transition: all 0.2s;
  }

  .cancel {
    background: transparent;
    color: #8899bb;
  }

  .submit {
    background: rgba(60, 100, 180, 0.3);
    color: #aaccff;
  }

  .submit:hover:not(:disabled) {
    background: rgba(60, 100, 180, 0.5);
  }

  .submit:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
</style>
```

**Step 2: Create beacon viewer component**

Create `src/components/BeaconViewer.svelte`:
```svelte
<script lang="ts">
  import type { BeaconData } from '../lib/supabase/beacons'
  import { calculateEffectiveNoise } from '../lib/supabase/beacons'

  interface Props {
    beacon: BeaconData
    onClose: () => void
  }

  let { beacon, onClose }: Props = $props()

  const GLITCH_CHARS = '█▓░▒╳╬◼◻◾◽■□▪▫☐☑⬛⬜'.split('')

  let noise = $derived(calculateEffectiveNoise(beacon))

  let corruptedMessage = $derived(() => {
    const chars = beacon.message.split('')
    return chars.map((char) => {
      if (char === ' ') return ' '
      if (Math.random() < noise * 0.8) {
        return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
      }
      return char
    }).join('')
  })

  let timeAgo = $derived(() => {
    const now = Date.now()
    const created = new Date(beacon.created_at).getTime()
    const hours = Math.floor((now - created) / (1000 * 60 * 60))
    if (hours < 1) return '刚刚'
    if (hours < 24) return `${hours} 小时前`
    const days = Math.floor(hours / 24)
    return `${days} 天前`
  })

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' || e.key === 'f' || e.key === 'F') onClose()
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="backdrop" onclick={onClose} role="presentation">
  <div class="viewer" onclick|stopPropagation role="dialog">
    <div class="noise-indicator" style="opacity: {noise}">
      衰减: {Math.floor(noise * 100)}%
    </div>

    <div class="message" style="opacity: {1 - noise * 0.5}">
      {corruptedMessage()}
    </div>

    <div class="meta">
      <span>{beacon.author || '匿名'}</span>
      <span>·</span>
      <span>{timeAgo()}</span>
      <span>·</span>
      <span>被查看 {beacon.view_count} 次</span>
    </div>

    <div class="close-hint">按 F 或 Esc 关闭</div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 100;
    backdrop-filter: blur(2px);
  }

  .viewer {
    background: rgba(10, 10, 20, 0.95);
    border: 1px solid rgba(80, 140, 220, 0.15);
    border-radius: 8px;
    padding: 2rem;
    width: 420px;
    max-width: 90vw;
    color: #aabbdd;
    font-family: 'Courier New', monospace;
  }

  .noise-indicator {
    font-size: 0.65rem;
    color: #ff6644;
    margin-bottom: 1rem;
  }

  .message {
    font-size: 1rem;
    line-height: 1.6;
    margin-bottom: 1.5rem;
    word-break: break-word;
    min-height: 3rem;
  }

  .meta {
    font-size: 0.7rem;
    opacity: 0.4;
    display: flex;
    gap: 0.5rem;
  }

  .close-hint {
    margin-top: 1.5rem;
    font-size: 0.65rem;
    opacity: 0.3;
    text-align: center;
  }
</style>
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add beacon editor and viewer UI components with decay visualization"
```

---

### Task 13: Full App Integration — Wire Everything Together

**Files:**
- Modify: `src/App.svelte`

**Step 1: Final App.svelte with all systems integrated**

This step replaces App.svelte with the final version that:
- Initializes Three.js engine + post-processing
- Manages first-person controls
- Runs chunk manager + entropy system
- Loads/renders beacons from Supabase
- Handles E (place beacon) and F (view beacon) interactions
- Shows HUD, beacon editor, and beacon viewer

The full code will be a comprehensive integration of all modules above.

Key wiring logic:
```typescript
// Keyboard handlers
function onKeyDown(e: KeyboardEvent) {
  if (e.code === 'KeyE' && controls.isLocked() && !showEditor && !showViewer) {
    showEditor = true
    controls.disable()
  }
  if (e.code === 'KeyF' && controls.isLocked() && closestBeacon && !showEditor && !showViewer) {
    showViewer = true
    viewingBeacon = closestBeacon
    controls.disable()
    incrementBeaconViewCount(closestBeacon.id)
  }
}

// Beacon placement
async function handlePlaceBeacon(message: string, author: string) {
  const pos = controls.getPosition()
  const beacon = await placeBeacon(
    { x: pos.x, y: 0.5, z: pos.z },
    message,
    author || undefined
  )
  if (beacon) beaconRenderer.addBeacon(beacon)
  showEditor = false
  controls.enable()
}

// Load beacons for visible chunk range
async function loadBeaconsForRange(minZ: number, maxZ: number) {
  const beacons = await fetchBeaconsInRange(minZ, maxZ)
  for (const b of beacons) beaconRenderer.addBeacon(b)
}
```

**Step 2: Verify full experience**

Run: `npm run dev`
Expected:
1. Title screen → click to enter
2. WASD navigation through procedurally generated world
3. Visual degradation as you walk forward
4. Press E → beacon editor overlay
5. Place beacon → glowing light beam in 3D space
6. Walk near beacon → press F to view (with corruption based on noise)
7. HUD shows entropy, coords, beacon count

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: integrate all systems — complete Terminus Horizon experience"
```

---

### Task 14: Supabase Database Migration

**Files:** None (database operation)

**Step 1: Apply migration via Supabase MCP**

Use the Supabase MCP tool to apply the migration from Task 10 Step 4 to the user's Supabase project.

**Step 2: Verify beacon CRUD works**

Insert a test beacon, fetch it, increment view count, verify all operations succeed.

**Step 3: Configure .env file**

Create `.env` with the user's actual Supabase credentials (obtained from Supabase project).

**Step 4: Commit .env.example (not .env)**

Ensure `.gitignore` includes `.env`.

```bash
echo ".env" >> .gitignore
git add .gitignore .env.example
git commit -m "chore: add .gitignore and .env.example for Supabase config"
```

---

### Task 15: Polish & Final Touches

**Files:**
- Modify: `src/App.svelte` (loading animation)
- Create: `src/components/LoadingScreen.svelte`

**Step 1: Create loading screen with fade-in title**

Create `src/components/LoadingScreen.svelte`:
```svelte
<script lang="ts">
  interface Props {
    onEnter: () => void
  }

  let { onEnter }: Props = $props()
  let visible = $state(true)
  let titleVisible = $state(false)
  let subtitleVisible = $state(false)
  let hintVisible = $state(false)

  import { onMount } from 'svelte'

  onMount(() => {
    setTimeout(() => titleVisible = true, 500)
    setTimeout(() => subtitleVisible = true, 1500)
    setTimeout(() => hintVisible = true, 2500)
  })

  function handleClick() {
    visible = false
    setTimeout(onEnter, 500)
  }
</script>

{#if visible}
  <div class="loading" onclick={handleClick} role="button" tabindex="0">
    <h1 class:visible={titleVisible}>终焉视界</h1>
    <p class="subtitle" class:visible={subtitleVisible}>TERMINUS HORIZON</p>
    <div class="controls" class:visible={hintVisible}>
      <p>WASD — 移动 &nbsp; 鼠标 — 视角</p>
      <p>E — 放置信标 &nbsp; F — 查看信标</p>
      <p class="enter">[ 点击进入 ]</p>
    </div>
  </div>
{/if}

<style>
  .loading {
    position: fixed;
    inset: 0;
    background: #000;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 200;
    cursor: pointer;
    font-family: 'Courier New', monospace;
    color: #aabbdd;
    transition: opacity 0.5s;
  }

  h1 {
    font-size: 4rem;
    font-weight: 100;
    letter-spacing: 1.5rem;
    opacity: 0;
    transform: translateY(20px);
    transition: all 1s ease;
    color: #ccddff;
    text-shadow: 0 0 30px rgba(100, 150, 220, 0.2);
  }

  .subtitle {
    font-size: 1rem;
    letter-spacing: 0.8rem;
    opacity: 0;
    transform: translateY(10px);
    transition: all 1s ease;
    color: #667799;
    margin-top: 0.5rem;
  }

  .controls {
    margin-top: 4rem;
    opacity: 0;
    transform: translateY(10px);
    transition: all 1s ease;
    text-align: center;
    font-size: 0.75rem;
    line-height: 2;
    color: #556677;
  }

  .enter {
    margin-top: 2rem;
    color: #8899bb;
    animation: pulse 2s ease-in-out infinite;
  }

  :global(.visible) {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.9; }
  }
</style>
```

**Step 2: Verify final polish**

Run: `npm run dev`
Expected: Cinematic loading screen with staggered fade-in, then full experience.

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: add cinematic loading screen with staggered animations"
```

---

## Summary

| Task | Description | Est. Complexity |
|------|-------------|----------------|
| 1 | Scaffold Svelte 5 + Vite | Low |
| 2 | Three.js Engine Core | Medium |
| 3 | First-Person Controls | Medium |
| 4 | Entropy System Core | Low |
| 5 | GLSL Shaders | High |
| 6 | Chunk-Based World Gen | High |
| 7 | Post-Processing Pipeline | Medium |
| 8 | Full Engine Integration | Medium |
| 9 | HUD Component | Low |
| 10 | Supabase + Beacon Data Layer | Medium |
| 11 | Beacon 3D Rendering | Medium |
| 12 | Beacon UI Components | Medium |
| 13 | Full App Integration | High |
| 14 | Supabase DB Migration | Low |
| 15 | Loading Screen Polish | Low |
