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

  const timeDecay = daysSinceCreation * 0.05
  const viewDecay = beacon.view_count * 0.02

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
