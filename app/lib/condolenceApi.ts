// Condolence Messages API
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface CondolenceMessage {
  id?: string
  funeral_home_id: string
  room_number: number
  sender_name: string
  sender_relation?: string
  message: string
  created_at?: string
}

export async function getCondolenceMessages(funeralHomeId: string, roomNumber: number) {
  const { data, error } = await supabase
    .from('condolence_messages')
    .select('*')
    .eq('funeral_home_id', funeralHomeId)
    .eq('room_number', roomNumber)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function addCondolenceMessage(message: CondolenceMessage) {
  const { data, error } = await supabase
    .from('condolence_messages')
    .insert([message])
    .select()
    .single()

  if (error) throw error
  return data
}
