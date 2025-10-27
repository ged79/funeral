import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });

  // 모든 인증 쿠키 삭제
  response.cookies.delete('funeral_authenticated');
  response.cookies.delete('funeral_home_id');
  response.cookies.delete('funeral_home_name');

  return response;
}
