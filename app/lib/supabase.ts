import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Types
export interface Funeral {
  id: string;
  deceased_name: string;
  deceased_hanja?: string;
  age: number;
  gender: string;
  date_of_death: string;
  photo_url?: string;
  religion?: string;
  room_id?: string;
  chief_mourner_name: string;
  chief_mourner_phone: string;
  chief_mourner_message?: string;
  funeral_date: string;
  placement_date: string;
  status: 'active' | 'completed';
  created_at: string;
}

export interface Room {
  id: string;
  name: string;
  floor: string;
  status: 'available' | 'occupied';
  current_funeral_id?: string;
}

export interface FlowerOrder {
  id: string;
  funeral_id: string;
  sender_name: string;
  sender_phone: string;
  flower_type: string;
  amount: number;
  message?: string;
  payment_status: 'pending' | 'completed';
  created_at: string;
}

export interface Donation {
  id: string;
  funeral_id: string;
  sender_name: string;
  sender_phone?: string;
  amount: number;
  message?: string;
  payment_status: 'pending' | 'completed';
  created_at: string;
}
