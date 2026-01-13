// Enshrined API - Supabase CRUD functions for temporarily held bodies
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Interface
export interface EnshrinedData {
  id?: string
  funeral_home_id: string
  deceased_name?: string
  enshrinement_time?: string
  contact_name?: string
  contact_phone?: string
  contact_relation?: string
  notes?: string
  status?: 'waiting' | 'info_gathering' | 'ready'
  created_at?: string
  updated_at?: string
}

// 1. Add enshrined body
export async function addEnshrined(data: EnshrinedData) {
  const { data: result, error } = await supabase
    .from('enshrined')
    .insert([data])
    .select()
    .single()

  if (error) throw error
  return result
}

// 2. Get all enshrined bodies for a funeral home
export async function getEnshrinedList(funeralHomeId: string) {
  const { data, error } = await supabase
    .from('enshrined')
    .select('*')
    .eq('funeral_home_id', funeralHomeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// 3. Get single enshrined body
export async function getEnshrined(id: string) {
  const { data, error } = await supabase
    .from('enshrined')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

// 4. Update enshrined body
export async function updateEnshrined(id: string, data: Partial<EnshrinedData>) {
  const { data: result, error } = await supabase
    .from('enshrined')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return result
}

// 5. Delete enshrined body (when moved to 빈소)
export async function deleteEnshrined(id: string) {
  const { error } = await supabase
    .from('enshrined')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// 6. Real-time subscription (optional - for live updates)
export function subscribeEnshrinedChanges(
  funeralHomeId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel('enshrined-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'enshrined',
        filter: `funeral_home_id=eq.${funeralHomeId}`
      },
      callback
    )
    .subscribe()
}
