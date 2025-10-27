'use client';

import React, { useState, useEffect } from 'react';
import StatusBoard from '../components/StatusBoard';

export default function StatusBoardPage() {
  const [currentRoomIndex, setCurrentRoomIndex] = useState(0);
  const [roomData, setRoomData] = useState<any[]>([]);
  const [autoRotate, setAutoRotate] = useState(true);

  const rooms = [
    { id: 1, name: '특실 5빈소', floor: '5층' },
    { id: 2, name: '1빈소', floor: '2층' },
    { id: 3, name: '2빈소', floor: '2층' },
    { id: 4, name: '3빈소', floor: '3층' },
    { id: 5, name: '4빈소', floor: '3층' },
  ];

  useEffect(() => {
    // Load funeral data from localStorage
    const loadData = () => {
      try {
        const savedFunerals = localStorage.getItem('funerals');
        if (savedFunerals) {
          const funerals = JSON.parse(savedFunerals);
          const activeRooms = funerals.filter((f: any) => f.room_id && f.deceased_name);
          setRoomData(activeRooms);
        }
      } catch (error) {
        console.error('Failed to load funeral data:', error);
      }
    };

    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!autoRotate || roomData.length === 0) return;
    
    const rotateInterval = setInterval(() => {
      setCurrentRoomIndex(prev => (prev + 1) % roomData.length);
    }, 15000); // Rotate every 15 seconds

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
  const roomInfo = rooms.find(r => `room-${r.id}` === currentFuneral?.room_id);

  return (
    <div className="relative">
      <StatusBoard
        room={roomInfo?.name || '빈소'}
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
      />
      
      {/* Room indicators */}
      {roomData.length > 1 && (
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

      {/* Auto-rotate toggle */}
      <button
        onClick={() => setAutoRotate(!autoRotate)}
        className={`absolute top-4 right-4 px-4 py-2 rounded ${autoRotate ? 'bg-green-600' : 'bg-gray-600'} text-white text-sm`}
      >
        {autoRotate ? '자동 전환 켜짐' : '자동 전환 꺼짐'}
      </button>
    </div>
  );
}
