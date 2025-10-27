'use client'

export const dynamic = 'force-dynamic'

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function ObituaryContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const roomId = searchParams.get('room');

  useEffect(() => {
    const storedData = sessionStorage.getItem('obituaryData');
    
    if (storedData) {
      const data = JSON.parse(storedData);
      sessionStorage.setItem('obituaryPreview', JSON.stringify(convertToElegantFormat(data)));
    } else if (roomId) {
      const funerals = localStorage.getItem('funerals');
      if (funerals) {
        const allFunerals = JSON.parse(funerals);
        const funeral = allFunerals.find((f: any) => f.room_id === roomId);
        if (funeral) {
          sessionStorage.setItem('obituaryPreview', JSON.stringify(convertToElegantFormat(funeral)));
        }
      }
    }

    const params = new URLSearchParams();
    if (roomId) params.set('room', roomId);
    router.push(`/obituary/elegant${params.toString() ? '?' + params.toString() : ''}`);
  }, [roomId, router]);

  const convertToElegantFormat = (data: any) => {
    return {
      deceasedName: data.deceased_name || '',
      deceasedNameHanja: data.deceased_hanja || '',
      deceasedAge: data.age?.toString() || '',
      religion: data.religion || '',
      religionTitle: data.religion_title || '',
      placementTime: data.placement_time || '',
      casketTime: data.casket_time || '',
      funeralTime: data.funeral_time || '',
      deathTime: data.death_date || data.death_time || '',
      room: data.room_name || '1빈소',
      chiefMessage: data.chief_mourner_message || '삼가 고인의 명복을 빕니다.',
      familyMembers: data.family_members || [],
      bankAccounts: data.bank_accounts || [],
      burialLocation: data.burial_location || '',
      photo: data.photo_url || null
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500">부고장을 불러오는 중...</p>
      </div>
    </div>
  );
}

export default function ObituaryPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ObituaryContent />
    </Suspense>
  );
}