import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { funeral_home_id, current_password, new_password } = body;

    if (!funeral_home_id || !current_password || !new_password) {
      return NextResponse.json(
        { error: '모든 필드를 입력해주세요.' },
        { status: 400 }
      );
    }

    if (new_password.length < 8) {
      return NextResponse.json(
        { error: '새 비밀번호는 8자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 현재 비밀번호 확인
    const { data: funeralHome, error: queryError } = await supabase
      .from('funeral_homes')
      .select('password_hash')
      .eq('id', funeral_home_id)
      .single();

    if (queryError || !funeralHome) {
      return NextResponse.json(
        { error: '장례식장 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 현재 비밀번호 검증
    const passwordMatch = await bcrypt.compare(current_password, funeralHome.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: '현재 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // 새 비밀번호 해시
    const newPasswordHash = await bcrypt.hash(new_password, 10);

    // 비밀번호 업데이트
    const { error: updateError } = await supabase
      .from('funeral_homes')
      .update({ password_hash: newPasswordHash })
      .eq('id', funeral_home_id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      message: '비밀번호가 변경되었습니다.'
    });

  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: '비밀번호 변경 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
