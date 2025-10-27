'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Phone, Share2, Heart, Flower } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { getCondolenceMessages, addCondolenceMessage } from '../../lib/condolenceApi';

// Kakao Maps TypeScript declaration
declare global {
  interface Window {
    kakao: any;
  }
}

export default function MinimalObituary() {
  const router = useRouter();
  const [showCondolence, setShowCondolence] = useState(false);
  const [showFlower, setShowFlower] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [obituaryData, setObituaryData] = useState<any>(null);
  const [condolenceMessages, setCondolenceMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState({ name: '', relation: '', message: '' });

  useEffect(() => {
    const savedData = sessionStorage.getItem('obituaryPreview');
    if (savedData) {
      setObituaryData(JSON.parse(savedData));
    }
    loadCondolenceMessages();

    // Load Kakao Map Script
    const script = document.createElement('script');
    script.src = '//dapi.kakao.com/v2/maps/sdk.js?appkey=a4838806d2f40c58ade5eea4f3ae6a26&autoload=false';
    script.async = true;
    document.head.appendChild(script);

    script.onload = () => {
      window.kakao.maps.load(() => {
        const container = document.getElementById('kakao-map');
        if (container) {
          const options = {
            center: new window.kakao.maps.LatLng(36.1853424, 127.7809592),
            level: 3
          };
          const map = new window.kakao.maps.Map(container, options);
          
          // 마커 추가
          const markerPosition = new window.kakao.maps.LatLng(36.1853424, 127.7809592);
          const marker = new window.kakao.maps.Marker({ position: markerPosition });
          marker.setMap(map);
        }
      });
    };
  }, []);

  const loadCondolenceMessages = async () => {
    try {
      const funeralHomeId = sessionStorage.getItem('funeral_home_id');
      const savedData = sessionStorage.getItem('obituaryPreview');
      if (!funeralHomeId || !savedData) return;
      
      const parsed = JSON.parse(savedData);
      const roomMatch = parsed?.room?.match(/(\d+)/);
      const roomNumber = roomMatch ? parseInt(roomMatch[1]) : null;
      
      if (roomNumber) {
        const messages = await getCondolenceMessages(funeralHomeId, roomNumber);
        setCondolenceMessages(messages);
      }
    } catch (error) {
      console.error('조문 메시지 로드 실패:', error);
    }
  };

  const handleSubmitMessage = async () => {
    if (!newMessage.name || !newMessage.message) {
      alert('이름과 메시지를 입력해주세요.');
      return;
    }

    try {
      const funeralHomeId = sessionStorage.getItem('funeral_home_id');
      const savedData = sessionStorage.getItem('obituaryPreview');
      if (!funeralHomeId || !savedData) return;
      
      const parsed = JSON.parse(savedData);
      const roomMatch = parsed?.room?.match(/(\d+)/);
      const roomNumber = roomMatch ? parseInt(roomMatch[1]) : null;
      
      if (roomNumber) {
        await addCondolenceMessage({
          funeral_home_id: funeralHomeId,
          room_number: roomNumber,
          sender_name: newMessage.name,
          sender_relation: newMessage.relation,
          message: newMessage.message
        });
        
        setNewMessage({ name: '', relation: '', message: '' });
        setShowCondolence(false);
        await loadCondolenceMessages();
        alert('조문 메시지가 등록되었습니다.');
      }
    } catch (error) {
      console.error('메시지 등록 실패:', error);
      alert('메시지 등록에 실패했습니다.');
    }
  };

  const deceasedName = obituaryData?.deceasedName || '고인';
  const deceasedNameHanja = obituaryData?.deceasedNameHanja || '';
  const deceasedAge = obituaryData?.deceasedAge || '';
  const gender = obituaryData?.gender || '';
  const religion = obituaryData?.religion || '';
  const religionTitle = obituaryData?.religionTitle || '';
  const placementTime = obituaryData?.placementTime || '';
  const casketTime = obituaryData?.casketTime || '';
  const funeralTime = obituaryData?.funeralTime || '';
  const deathTime = obituaryData?.deathTime || '';
  const shroudTime = obituaryData?.shroudTime || '';
  const room = obituaryData?.room || '빈소';
  const chiefMessage = obituaryData?.chiefMessage || '';
  const burialType = obituaryData?.burialType || '';
  const burialLocation = obituaryData?.burialLocation || '';
  const photo = obituaryData?.photo || '';
  const bankAccounts = obituaryData?.bankAccounts || [];
  
  let familyMembers = obituaryData?.familyMembers || [];
  familyMembers = familyMembers.filter((m: any) => m.name && m.relation);

  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dayOfWeek = dayNames[date.getDay()];
      const hours = date.getHours();
      const minutes = date.getMinutes();
      
      let timeStr = '';
      if (hours !== 0 || minutes !== 0) {
        const period = hours < 12 ? '오전' : '오후';
        const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
        timeStr = ` ${period} ${displayHours}시`;
        if (minutes > 0) timeStr += ` ${minutes}분`;
      }
      
      return `${year}년 ${month}월 ${day}일 (${dayOfWeek})${timeStr}`;
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* 헤더 */}
      <div className="bg-[#2c3e50] border-b-2 border-slate-700 relative z-50 sticky top-0 shadow-sm overflow-hidden py-2">
        <div className="max-w-xl mx-auto">
          <img 
            src="/header.png" 
            alt="영동병원장례식장" 
            className="w-full h-auto transform scale-150"
            style={{ transformOrigin: 'center' }}
          />
        </div>
      </div>

      <div className="max-w-xl mx-auto pb-24 px-6 relative z-10">
        {/* 영정 및 고인정보 */}
        <div className="py-6 border-b border-slate-200">
          <div className="flex justify-center mb-6">
            <div className="w-48 h-56 bg-white border border-slate-200 overflow-hidden flex items-center justify-center relative">
              {photo ? (
                <img src={photo} alt="영정사진" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center px-4">
                  <div className="text-6xl mb-3">🌼</div>
                  <p className="text-xs text-slate-600 leading-relaxed">삼가 고인의<br />명복을 빕니다</p>
                </div>
              )}
            </div>
          </div>

          <div className="text-center space-y-1">
            <h2 className="text-4xl font-bold text-slate-900">故 {deceasedName}</h2>
            {(deceasedAge || gender) && (
              <p className="text-slate-600 text-lg">({gender}{deceasedAge && `/${deceasedAge}세`})</p>
            )}
          </div>
        </div>

        {/* 상주 정보 */}
        {familyMembers.length > 0 && (
          <div className="py-4 border-b border-slate-200">
            <h3 className="text-sm text-amber-600 mb-3 font-bold flex items-center gap-2">
              <span>⚪</span> 유가족
            </h3>
            <div className="space-y-2">
              {familyMembers.map((member: any, idx: number) => (
                <div key={idx} className="grid grid-cols-[80px_1fr] gap-4 text-sm py-2">
                  <span className="text-slate-600">{member.relation}</span>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-900">{member.name}</span>
                    {member.phone && (
                      <a href={`tel:${member.phone}`} className="text-slate-600 text-xs">{member.phone}</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 일정 정보 */}
        <div className="py-4 border-b border-slate-200">
          <h3 className="text-sm text-amber-600 mb-3 font-bold flex items-center gap-2">
            <span>⚪</span> 장례일정
          </h3>
          <div className="space-y-4">
            {deathTime && (
              <div className="flex justify-between text-sm py-2">
                <span className="text-slate-600">별세</span>
                <span className="text-slate-900">{formatDateTime(deathTime)}</span>
              </div>
            )}
            {placementTime && (
              <div className="flex justify-between text-sm py-2">
                <span className="text-slate-600">입실</span>
                <span className="text-slate-900">{formatDateTime(placementTime)}</span>
              </div>
            )}
            {shroudTime && (
              <div className="flex justify-between text-sm py-2">
                <span className="text-slate-600">염습</span>
                <span className="text-slate-900">{formatDateTime(shroudTime)}</span>
              </div>
            )}
            {casketTime && (
              <div className="flex justify-between text-sm py-2">
                <span className="text-slate-600">입관</span>
                <span className="text-slate-900">{formatDateTime(casketTime)}</span>
              </div>
            )}
            {funeralTime && (
              <div className="flex justify-between text-sm pt-3 border-t-2 border-slate-300 py-3 bg-slate-50 px-4 rounded">
                <span className="text-slate-900 font-bold">발인</span>
                <div className="text-right">
                  <div className="text-slate-900 font-bold">{formatDateTime(funeralTime)}</div>
                </div>
              </div>
            )}
            {burialLocation && (
              <div className="flex justify-between text-sm py-2">
                <span className="text-slate-600">장지</span>
                <div className="text-right">
                  <div className="text-slate-900">{burialLocation}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 장례식장 */}
        <div className="py-4 border-b border-slate-200">
        <h3 className="text-sm text-amber-600 mb-3 font-bold flex items-center gap-2">
          <span>⚪</span> 오시는 길
        </h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="text-slate-900 text-lg font-bold">영동병원 장례식장</p>
              {room && <p className="text-slate-700 text-sm font-medium">{room}</p>}
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-slate-500 mt-0.5 shrink-0" />
                <div className="flex-1 flex items-center justify-between">
                  <span className="text-slate-800">충청북도 영동군 영동읍 대학로 106</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('충청북도 영동군 영동읍 대학로 106');
                      alert('주소가 복사되었습니다.');
                    }}
                    className="ml-2 px-3 py-1 text-xs bg-slate-600 text-white hover:bg-slate-700 transition-colors rounded"
                  >
                    복사
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={16} className="text-slate-500 shrink-0" />
                <a href="tel:043-740-1004" className="text-slate-800 hover:text-slate-900 font-medium">043-740-1004</a>
              </div>
            </div>
            {/* Kakao Map */}
            <div className="mt-5">
              <div id="kakao-map" className="w-full h-64 bg-slate-100 border-2 border-slate-300 shadow-md"></div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <button
                  onClick={() => {
                    window.location.href = `kakaomap://route?ep=36.1853424,127.7809592&by=CAR`;
                    setTimeout(() => {
                      window.open(`https://map.kakao.com/link/to/영동병원 장례식장,36.1853424,127.7809592`, '_blank');
                    }, 1000);
                  }}
                  className="py-3 bg-yellow-400 text-gray-900 text-sm font-bold hover:bg-yellow-500 transition-colors rounded"
                >
                  카카오내비
                </button>
                <button
                  onClick={() => {
                    window.open(`https://map.kakao.com/link/to/영동병원 장례식장,36.1853424,127.7809592`, '_blank');
                  }}
                  className="py-3 bg-slate-600 text-white text-sm font-medium hover:bg-slate-700 transition-colors rounded"
                >
                  지도보기
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 부의금 계좌 */}
        {bankAccounts.length > 0 && bankAccounts[0].bankName && (
          <div className="py-4 border-b border-slate-200">
            <h3 className="text-sm text-amber-600 mb-3 font-bold flex items-center gap-2">
              <span>⚪</span> 마음 전하실 곳
            </h3>
            <div className="space-y-4">
              {bankAccounts.map((account: any, idx: number) => (
                account.bankName && (
                  <div key={idx} className="text-sm space-y-2 py-4 bg-slate-50 px-4 rounded">
                    <div className="flex justify-between">
                      <span className="text-slate-600">은행</span>
                      <span className="text-slate-900 font-bold">{account.bankName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">계좌번호</span>
                      <span className="text-slate-900 font-mono font-medium">{account.accountNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">예금주</span>
                      <span className="text-slate-900 font-medium">{account.accountHolder}</span>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>
        )}

        {/* 상주 말씀 */}
        {chiefMessage && (
          <div className="py-4 border-b border-slate-200 bg-slate-50 -mx-6 px-6">
            <h3 className="text-sm text-amber-600 mb-3 font-bold flex items-center gap-2">
              <span>⚪</span> MESSAGE
            </h3>
            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-sm">
              {chiefMessage}
            </p>
          </div>
        )}

        {/* 근조화환 보내신 분들 */}
        <div className="py-4 border-b border-slate-200">
          <h3 className="text-sm text-amber-600 mb-3 font-bold flex items-center gap-2">
            <span>⚪</span> 근조화환 보내신 분들
          </h3>
          <div className="text-sm text-slate-600 text-center py-8">
            아직 화환이 접수되지 않았습니다
          </div>
        </div>

        {/* 조문 메시지 */}
        <div className="py-4 border-b border-slate-200">
          <h3 className="text-sm text-amber-600 mb-3 font-bold flex items-center gap-2">
            <span>⚪</span> 조문 메시지 ({condolenceMessages.length})
          </h3>
          {condolenceMessages.length === 0 ? (
            <div className="text-sm text-slate-600 text-center py-8">
              첫 조문 메시지를 남겨주세요
            </div>
          ) : (
            <div className="space-y-4">
              {condolenceMessages.map((msg) => (
                <div key={msg.id} className="bg-slate-50 p-4 rounded border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-slate-900">{msg.sender_name}</span>
                    {msg.sender_relation && (
                      <span className="text-xs text-slate-500">({msg.sender_relation})</span>
                    )}
                    <span className="text-xs text-slate-400 ml-auto">
                      {new Date(msg.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap">{msg.message}</p>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowCondolence(true)}
            className="w-full mt-4 py-3 bg-slate-700 hover:bg-slate-800 text-white rounded font-medium transition-colors"
          >
            조문 메시지 남기기
          </button>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#2c3e50] border-t border-slate-600 z-[60] shadow-lg py-2">
        <div className="max-w-xl mx-auto grid grid-cols-3 divide-x divide-slate-600">
          <button 
            onClick={() => setShowDonation(true)}
            className="flex flex-col items-center gap-1 py-2 hover:bg-slate-700 transition-colors text-white"
          >
            <span className="text-xl font-bold">조의금</span>
          </button>
          <button 
            onClick={() => router.push('/obituary/flower')}
            className="flex flex-col items-center gap-1 py-2 hover:bg-slate-700 transition-colors text-white"
          >
            <span className="text-xl font-bold">근조화환</span>
          </button>
          <button 
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: `${deceasedName} 부고`, url: window.location.href });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert('링크가 복사되었습니다.');
              }
            }}
            className="flex flex-col items-center gap-1 py-2 hover:bg-slate-700 transition-colors text-white"
          >
            <span className="text-xl font-bold">부고전달</span>
          </button>
        </div>
      </div>

      {/* 부의금 모달 */}
      {showDonation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[70]">
          <div className="bg-white max-w-md w-full p-8 shadow-2xl rounded">
            <h3 className="text-sm mb-6 text-slate-900 font-bold pb-4 border-b-2 border-slate-300">부의금 계좌</h3>
            <div className="space-y-4">
              {bankAccounts.length > 0 && bankAccounts[0].bankName ? (
                bankAccounts.map((account: any, idx: number) => (
                  account.bankName && (
                    <div key={idx} className="bg-slate-50 border-2 border-slate-300 p-6 rounded">
                      <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">은행</span>
                          <span className="text-slate-900 font-bold">{account.bankName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">계좌번호</span>
                          <span className="text-slate-900 font-mono font-medium">{account.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">예금주</span>
                          <span className="text-slate-900 font-medium">{account.accountHolder}</span>
                        </div>
                      </div>
                    </div>
                  )
                ))
              ) : (
                <div className="bg-slate-50 border-2 border-slate-300 p-6 text-center text-slate-600 text-sm rounded">
                  부의금 계좌 정보가 없습니다
                </div>
              )}
            </div>
            <button 
              onClick={() => setShowDonation(false)} 
              className="w-full bg-slate-700 text-white py-3 text-sm font-bold hover:bg-slate-800 mt-6 rounded"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 근조화환 모달 */}
      {showFlower && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[70]">
          <div className="bg-white max-w-md w-full p-8 shadow-2xl rounded">
            <h3 className="text-sm mb-6 text-slate-900 font-bold pb-4 border-b-2 border-slate-300">근조화환 보내기</h3>
            <div className="bg-slate-50 border-2 border-slate-300 p-6 space-y-3 text-sm rounded">
              <div>
                <div className="text-slate-600 mb-1">장례식장</div>
                <div className="text-slate-900 font-bold">영동병원 장례식장</div>
              </div>
              <div>
                <div className="text-slate-600 mb-1">연락처</div>
                <div className="text-slate-900 font-medium">043-740-1004</div>
              </div>
              <div>
                <div className="text-slate-600 mb-1">주소</div>
                <div className="text-slate-900">충청북도 영동군 영동읍 대학로 106</div>
              </div>
            </div>
            <button 
              onClick={() => setShowFlower(false)} 
              className="w-full bg-slate-700 text-white py-3 text-sm font-bold hover:bg-slate-800 mt-6 rounded"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* 조문 메시지 입력 모달 */}
      {showCondolence && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[70]">
          <div className="bg-white max-w-md w-full p-8 shadow-2xl rounded">
            <h3 className="text-sm mb-6 text-slate-900 font-bold pb-4 border-b-2 border-slate-300">조문 메시지 남기기</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-700 mb-2">성함 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newMessage.name}
                  onChange={(e) => setNewMessage({...newMessage, name: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="성함을 입력해주세요"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-2">관계</label>
                <input
                  type="text"
                  value={newMessage.relation}
                  onChange={(e) => setNewMessage({...newMessage, relation: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                  placeholder="예: 친구, 동창, 친인척 등"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-2">메시지 <span className="text-red-500">*</span></label>
                <textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({...newMessage, message: e.target.value})}
                  className="w-full px-4 py-3 border border-slate-300 rounded focus:ring-2 focus:ring-slate-500 focus:border-transparent h-32 resize-none"
                  placeholder="조문 메시지를 입력해주세요"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => {
                  setShowCondolence(false);
                  setNewMessage({ name: '', relation: '', message: '' });
                }} 
                className="flex-1 bg-slate-200 text-slate-700 py-3 text-sm font-bold hover:bg-slate-300 rounded"
              >
                취소
              </button>
              <button 
                onClick={handleSubmitMessage}
                className="flex-1 bg-slate-700 text-white py-3 text-sm font-bold hover:bg-slate-800 rounded"
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
