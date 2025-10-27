'use client';

import React from 'react';

interface StatusBoardProps {
  room: string;
  floor: string;
  deceasedName: string;
  deceasedHanja?: string;
  religion?: string;
  religionTitle?: string;
  age?: string;
  gender?: string;
  photo?: string;
  familyMembers?: Array<{
    relation: string;
    name: string;
  }>;
  casketTime?: string;
  funeralTime?: string;
  burialLocation?: string;
}

export default function StatusBoard({
  room,
  floor,
  deceasedName,
  deceasedHanja,
  religion,
  religionTitle,
  age,
  gender,
  photo,
  familyMembers = [],
  casketTime,
  funeralTime,
  burialLocation
}: StatusBoardProps) {
  
  // Format date/time for display
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dayOfWeek = dayNames[date.getDay()];
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      const period = hours < 12 ? '오전' : '오후';
      const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      
      return `${month}월 ${day}일 (${dayOfWeek}) ${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Group family members by relation
  const groupFamilyByRelation = () => {
    const groups: { [key: string]: string[] } = {};
    familyMembers.forEach(member => {
      if (!groups[member.relation]) {
        groups[member.relation] = [];
      }
      groups[member.relation].push(member.name);
    });
    return groups;
  };

  const familyGroups = groupFamilyByRelation();

  return (
    <div className="w-full h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="w-full max-w-7xl bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-blue-600 text-white px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-sm">의료법인 조은의료재단</span>
              <h1 className="text-3xl font-bold">영동병원장례식장</h1>
            </div>
            <div className="text-right">
              <div className="text-xl">{formatDateTime(new Date().toISOString()).split(' ').slice(0, 3).join(' ')}</div>
            </div>
          </div>
        </div>

        {/* Room Info Bar */}
        <div className="bg-blue-700 text-white px-8 py-3 flex items-center justify-between">
          <div className="text-2xl font-bold">
            {room} ({floor})
          </div>
          <div className="text-xl flex items-center gap-4">
            <span className="text-red-300">✝</span>
            <span className="font-bold">
              故 {deceasedName}
              {deceasedHanja && ` (${deceasedHanja})`}
              {religionTitle && ` (${religionTitle})`}
              {age && gender && ` (${gender}/${age}세)`}
            </span>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex" style={{ minHeight: '400px' }}>
          {/* Photo Section */}
          <div className="w-1/3 bg-gray-50 p-8 flex items-center justify-center">
            <div className="text-center">
              {photo ? (
                <div className="w-48 h-60 mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
                  <img src={photo} alt="영정사진" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-48 h-60 mx-auto bg-gray-200 rounded-lg flex items-center justify-center">
                  <span className="text-gray-400 text-lg">영정사진</span>
                </div>
              )}
            </div>
          </div>

          {/* Family Info Section */}
          <div className="flex-1 p-8">
            <div className="space-y-4">
              {Object.entries(familyGroups).map(([relation, names]) => (
                <div key={relation} className="flex items-start text-2xl">
                  <span className="font-bold min-w-[150px]">{relation}</span>
                  <span className="text-3xl mx-4">:</span>
                  <span className="font-medium">{names.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Schedule Info */}
        <div className="border-t-4 border-blue-600">
          <div className="flex">
            {casketTime && (
              <div className="flex-1 border-r-2 border-gray-300">
                <div className="bg-blue-600 text-white text-center py-3 text-xl font-bold">
                  입 관
                </div>
                <div className="text-center py-4 text-xl">
                  {formatDateTime(casketTime)}
                </div>
              </div>
            )}
            {funeralTime && (
              <div className="flex-1 border-r-2 border-gray-300">
                <div className="bg-blue-600 text-white text-center py-3 text-xl font-bold">
                  발 인
                </div>
                <div className="text-center py-4 text-xl">
                  {formatDateTime(funeralTime)}
                </div>
              </div>
            )}
            {burialLocation && (
              <div className="flex-1">
                <div className="bg-blue-600 text-white text-center py-3 text-xl font-bold">
                  장 지
                </div>
                <div className="text-center py-4 text-xl">
                  {burialLocation}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-200 px-8 py-3 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            최근 조의메세지(07시) # 황현진 : 상가 고인의 명복을 빕니다.
          </div>
          <div className="text-sm text-gray-600">
            영동병원장례식장: 충청북도 영동군 영동읍 대학로 106 (설계리, 영동병원), 043-743-4493,
          </div>
        </div>
      </div>
    </div>
  );
}
