export interface EntropyState {
  value: number
  phase: EntropyPhase
  phaseName: string
  phaseProgress: number
}

export type EntropyPhase = 'civilization' | 'weathering' | 'pixelation' | 'glitch' | 'void'

const ENTROPY_DISTANCE = 500

const PHASES: { name: EntropyPhase; label: string; start: number; end: number }[] = [
  { name: 'civilization', label: '文明', start: 0.0, end: 0.2 },
  { name: 'weathering', label: '风化', start: 0.2, end: 0.4 },
  { name: 'pixelation', label: '像素化', start: 0.4, end: 0.6 },
  { name: 'glitch', label: '乱码', start: 0.6, end: 0.8 },
  { name: 'void', label: '虚空', start: 0.8, end: 1.0 },
]

export function calculateEntropy(playerZ: number): EntropyState {
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
