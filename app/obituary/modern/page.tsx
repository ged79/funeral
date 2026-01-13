import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import ObituaryClientContent from './ObituaryContent';

// Supabase client for server-side
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 동적 메타데이터 생성 (고인명, 영정사진 포함)
export async function generateMetadata({
  searchParams,
}: {
  searchParams: { id?: string };
}): Promise<Metadata> {
  const funeralId = searchParams.id;

  // 기본 메타데이터
  const defaultMetadata: Metadata = {
    title: '영동병원장례식장 부고',
    description: '영동병원장례식장에서 알려드립니다. 삼가 고인의 명복을 빕니다.',
    openGraph: {
      title: '영동병원장례식장 부고',
      description: '영동병원장례식장에서 알려드립니다.',
      type: 'website',
      locale: 'ko_KR',
      siteName: '영동병원장례식장',
    },
  };

  if (!funeralId) {
    return defaultMetadata;
  }

  try {
    // 장례 정보 조회
    const { data: funeral, error } = await supabase
      .from('funerals')
      .select('deceased_name, photo_url, room_number, floor, funeral_time, use_photo_in_obituary')
      .eq('id', funeralId)
      .single();

    if (error || !funeral) {
      return defaultMetadata;
    }

    const deceasedName = funeral.deceased_name || '고인';
    const roomInfo = `${funeral.room_number}빈소 ${funeral.floor || ''}`.trim();
    const funeralTimeStr = funeral.funeral_time
      ? new Date(funeral.funeral_time).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
      : '';

    // 동적 메타데이터
    return {
      title: `故 ${deceasedName}님 부고 - 영동병원장례식장`,
      description: `빈소: 영동병원장례식장 ${roomInfo}${funeralTimeStr ? ` | 발인: ${funeralTimeStr}` : ''} | 삼가 고인의 명복을 빕니다.`,
      openGraph: {
        title: `故 ${deceasedName}님 부고`,
        description: `빈소: 영동병원장례식장 ${roomInfo}${funeralTimeStr ? ` | 발인: ${funeralTimeStr}` : ''}`,
        type: 'website',
        locale: 'ko_KR',
        siteName: '영동병원장례식장',
        images: funeral.use_photo_in_obituary && funeral.photo_url
          ? [{ url: funeral.photo_url, width: 800, height: 800, alt: `故 ${deceasedName}님 영정` }]
          : [{ url: '/icon-512x512.png', width: 512, height: 512, alt: '영동병원장례식장' }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `故 ${deceasedName}님 부고`,
        description: `빈소: 영동병원장례식장 ${roomInfo}`,
        images: funeral.use_photo_in_obituary && funeral.photo_url ? [funeral.photo_url] : ['/icon-512x512.png'],
      },
    };
  } catch (error) {
    console.error('메타데이터 생성 실패:', error);
    return defaultMetadata;
  }
}

export default function ModernObituaryPage() {
  return <ObituaryClientContent />;
}
