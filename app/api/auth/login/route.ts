import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { login_id, password } = body;

    if (!login_id || !password) {
      return NextResponse.json(
        { error: '로그인 ID와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // funeral_homes 테이블에서 login_id로 조회
    const { data: funeralHome, error: queryError } = await supabase
      .from('funeral_homes')
      .select('id, name, login_id, password_hash, status')
      .eq('login_id', login_id)
      .eq('status', 'active')
      .single();

    if (queryError || !funeralHome) {
      return NextResponse.json(
        { error: '존재하지 않는 장례식장입니다.' },
        { status: 401 }
      );
    }

    // 비밀번호 확인
    const passwordMatch = await bcrypt.compare(password, funeralHome.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: '비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 응답 생성
    const response = NextResponse.json({
      success: true,
      data: {
        funeral_home_id: funeralHome.id,
        funeral_home_name: funeralHome.name,
      }
    });

    // 쿠키 설정 (7일 유효)
    response.cookies.set('funeral_authenticated', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    response.cookies.set('funeral_home_id', funeralHome.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    response.cookies.set('funeral_home_name', funeralHome.name, {
      httpOnly: false, // 클라이언트에서 읽을 수 있도록
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
