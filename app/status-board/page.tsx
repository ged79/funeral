'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import StatusBoard from '../components/StatusBoard';
import { createBrowserClient } from '@supabase/ssr';
import { getCondolenceMessages } from '../lib/condolenceApi';

function StatusBoardContent() {
  const searchParams = useSearchParams();
  const roomParam = searchParams.get('room');
  const funeralHomeIdParam = searchParams.get('funeral_home_id');

  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [roomData, setRoomData] = useState<any[]>([]);
  const [autoRotate, setAutoRotate] = useState(!roomParam);
  const [messagesMap, setMessagesMap] = useState<{ [key: number]: any[] }>({});

  const rooms = [
    { id: 1, name: '1빈소', floor: '2층', roomNumber: 1 },
    { id: 2, name: '2빈소', floor: '2층', roomNumber: 2 },
    { id: 3, name: '3빈소', floor: '3층', roomNumber: 3 },
    { id: 4, name: '4빈소', floor: '3층', roomNumber: 4 },
    { id: 5, name: '특실 5빈소', floor: '5층', roomNumber: 5 },
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        const supabase = createBrowserClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );

        // Get funeral_home_id from URL parameter or session storage
        let funeralHomeId = funeralHomeIdParam || sessionStorage.getItem('funeral_home_id');

        if (!funeralHomeId) {
          console.warn('[전광판] funeral_home_id not found. Please provide it as URL parameter: ?funeral_home_id=YOUR_ID');
          console.warn('[전광판] Or login to AdminDashboard first to set session');
          return;
        }

        console.log('[전광판] Using funeral_home_id:', funeralHomeId);

        // Query funerals from Supabase
        let query = supabase
          .from('funerals')
          .select('*')
          .eq('funeral_home_id', funeralHomeId)
          .neq('status', 'completed') // Only active funerals
          .not('deceased_name', 'is', null);

        // Filter by room if roomParam is provided
        if (roomParam) {
          const roomNumber = parseInt(roomParam.replace('room-', ''));
          if (!isNaN(roomNumber)) {
            query = query.eq('room_number', roomNumber);
          }
        }

        const { data: funerals, error } = await query;

        if (error) {
          console.error('[전광판] Supabase query error:', error);
          console.error('[전광판] Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          return;
        }

        if (funerals && funerals.length > 0) {
          console.log('[전광판] Loaded funerals:', funerals.length);
          setRoomData(funerals);

          // 각 방의 조의 메시지 가져오기
          const newMessagesMap: { [key: number]: any[] } = {};
          for (const funeral of funerals) {
            try {
              const messages = await getCondolenceMessages(funeralHomeId!, funeral.room_number);
              newMessagesMap[funeral.room_number] = messages || [];
            } catch (err) {
              console.error(`[전광판] 조의 메시지 로드 실패 (방 ${funeral.room_number}):`, err);
              newMessagesMap[funeral.room_number] = [];
            }
          }
          setMessagesMap(newMessagesMap);
        } else {
          setRoomData([]);
          setMessagesMap({});
        }
      } catch (error) {
        console.error('[전광판] Failed to load funeral data:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [roomParam, funeralHomeIdParam]);

  useEffect(() => {
    if (!autoRotate || roomData.length === 0) return;
    
    const rotateInterval = setInterval(() => {
      setCurrentRoomIndex(prev => (prev + 1) % roomData.length);
    }, 15000);

    return () => clearInterval(rotateInterval);
  }, [autoRotate, roomData.length]);

  if (roomData.length === 0) {
    return (
      <div className="w-full h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl text-gray-400 mb-4">현재 진행 중인 장례가 없습니다</div>
          <div className="text-xl text-gray-400">영동병원장례식장</div>
        </div>
      </div>
    );
  }

  const currentFuneral = roomData[currentRoomIndex];
  const roomInfo = rooms.find(r => r.roomNumber === currentFuneral?.room_number);
  const currentMessages = currentFuneral ? messagesMap[currentFuneral.room_number] || [] : [];
  const latestMessage = currentMessages.length > 0 ? currentMessages[0] : undefined;

  return (
    <div className="relative">
      <StatusBoard
        room={roomInfo?.name || `${currentFuneral?.room_number}빈소`}
        floor={roomInfo?.floor || ''}
        deceasedName={currentFuneral?.deceased_name || ''}
        deceasedHanja={currentFuneral?.deceased_hanja}
        religion={currentFuneral?.religion}
        religionTitle={currentFuneral?.religion_title}
        age={currentFuneral?.age?.toString()}
        gender={currentFuneral?.gender}
        photo={currentFuneral?.photo_url}
        familyMembers={currentFuneral?.family_members || []}
        casketTime={currentFuneral?.casket_time}
        funeralTime={currentFuneral?.funeral_time}
        burialLocation={currentFuneral?.burial_location}
        burialType={currentFuneral?.burial_type}
        latestMessage={latestMessage}
      />
      
      {!roomParam && roomData.length > 1 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2">
          {roomData.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentRoomIndex(idx);
                setAutoRotate(false);
              }}
              className={`w-3 h-3 rounded-full ${idx === currentRoomIndex ? 'bg-blue-600' : 'bg-gray-400'}`}
            />
          ))}
        </div>
      )}

      {!roomParam && (
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`absolute top-4 right-4 px-4 py-2 rounded ${autoRotate ? 'bg-green-600' : 'bg-gray-600'} text-white text-sm`}
        >
          {autoRotate ? '자동 전환 켜짐' : '자동 전환 꺼짐'}
        </button>
      )}
    </div>
  );
}

export default function StatusBoardPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen bg-gray-100" />}>
      <StatusBoardContent />
    </Suspense>
  );
}
