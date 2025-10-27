// Funeral API - Supabase CRUD 함수
import { createBrowserClient } from '@supabase/ssr'

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 인터페이스
export interface FuneralData {
  id?: string
  funeral_home_id: string
  room_number: number
  room_name?: string
  deceased_name: string
  deceased_hanja?: string
  age?: number
  gender?: string
  religion?: string
  religion_title?: string
  baptismal_name?: string
  other_title?: string
  placement_time?: string
  placement_date?: string
  death_time?: string
  casket_time?: string
  shroud_time?: string
  funeral_time?: string
  checkout_time?: string
  burial_type?: 'burial' | 'cremation' | ''
  burial_location?: string
  burial_location_2?: string
  death_cause?: string
  death_place?: string
  chemical_treatment?: string
  resident_number?: string
  deceased_address?: string
  deceased_note?: string
  business_note?: string
  funeral_director?: string
  funeral_company?: string
  family_members: Array<{
    id: number
    relation: string
    name: string
    phone: string
  }>
  bank_accounts: Array<{
    id: number
    bankName: string
    accountNumber: string
    accountHolder: string
  }>
  use_photo_in_obituary?: boolean
  chief_message?: string
  photo_url?: string
  status?: 'active' | 'completed'
}

// 1. 빈소 정보 저장
export async function saveFuneral(data: FuneralData) {
  const { data: result, error } = await supabase
    .from('funerals')
    .upsert([data], { 
      onConflict: 'funeral_home_id,room_number',
      ignoreDuplicates: false 
    })
    .select()
    .single()

  if (error) throw error
  return result
}

// 2. 장례식장의 모든 빈소 조회
export async function getFuneralsByHome(funeralHomeId: string) {
  const { data, error } = await supabase
    .from('funerals')
    .select('*')
    .eq('funeral_home_id', funeralHomeId)
    .order('room_number', { ascending: true })

  if (error) throw error
  return data
}

// 3. 특정 빈소 조회
export async function getFuneralByRoom(funeralHomeId: string, roomNumber: number) {
  const { data, error } = await supabase
    .from('funerals')
    .select('*')
    .eq('funeral_home_id', funeralHomeId)
    .eq('room_number', roomNumber)
    .maybeSingle()

  if (error) throw error
  return data
}

// 4. 빈소 정보 업데이트
export async function updateFuneral(id: string, data: Partial<FuneralData>) {
  const { data: result, error } = await supabase
    .from('funerals')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return result
}

// 5. 빈소 삭제 (퇴실 처리)
export async function deleteFuneral(id: string) {
  const { error } = await supabase
    .from('funerals')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// 6. 상태 변경 (active → completed)
export async function completeFuneral(id: string) {
  const { data, error } = await supabase
    .from('funerals')
    .update({ status: 'completed' })
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

// 7. 완료된 장례 목록 조회
export async function getCompletedFunerals(funeralHomeId: string) {
  const { data, error } = await supabase
    .from('funerals')
    .select('*')
    .eq('funeral_home_id', funeralHomeId)
    .eq('status', 'completed')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

// 8. Real-time 구독 (빈소 상태 변경 감지)
export function subscribeFuneralChanges(
  funeralHomeId: string, 
  callback: (payload: any) => void
) {
  return supabase
    .channel('funeral-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'funerals',
        filter: `funeral_home_id=eq.${funeralHomeId}`
      },
      callback
    )
    .subscribe()
}
