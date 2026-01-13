'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { MapPin, Phone, Share2, Heart, Flower } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCondolenceMessages, addCondolenceMessage } from '../../lib/condolenceApi';
import { createBrowserClient } from '@supabase/ssr';

// Kakao TypeScript declaration
declare global {
  interface Window {
    kakao: any;
    Kakao: any;
  }
}

function MinimalObituaryContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCondolence, setShowCondolence] = useState(false);
  const [showFlower, setShowFlower] = useState(false);
  const [showDonation, setShowDonation] = useState(false);
  const [obituaryData, setObituaryData] = useState<any>(null);
  const [condolenceMessages, setCondolenceMessages] = useState<any[]>([]);
  const [flowerSenders, setFlowerSenders] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState({ name: '', relation: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const loadFuneralData = async () => {
      // Get funeral_id from URL parameter
      const funeralId = searchParams.get('id');

      
      if (funeralId) {
        // Fetch from database
        try {
          const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          );
          
          const { data, error } = await supabase
            .from('funerals')
            .select('*')
            .eq('id', funeralId)
            .single();


if (error) throw error;
          
          if (error) throw error;
          
          if (data) {
            // Transform database format to obituary format
            const transformed = {
              deceasedName: data.deceased_name,
              deceasedNameHanja: data.deceased_hanja,
              deceasedAge: data.age,
              gender: data.gender,
              religion: data.religion,
              religionTitle: data.religion_title,
              placementTime: data.placement_time,
              casketTime: data.casket_time,
              shroudTime: data.shroud_time,
              funeralTime: data.funeral_time,
              deathTime: data.death_time,
              room: `${data.room_number}빈소`,
              floor: data.floor || '',
              familyMembers: data.family_members || [],
              chiefMessage: data.chief_message,
              burialType: data.burial_type,
              burialLocation: data.burial_location,
              photo: data.use_photo_in_obituary ? data.photo_url : null,
              bankAccounts: data.bank_accounts || [],
              funeralHomeId: data.funeral_home_id,
              roomNumber: data.room_number
            };
            
            setObituaryData(transformed);
            
            // Load condolence messages using fetched data
            if (data.funeral_home_id && data.room_number) {
              try {
                const messages = await getCondolenceMessages(data.funeral_home_id, data.room_number);
                setCondolenceMessages(messages);
              } catch (err) {
                console.error('Failed to load condolence messages:', err);
              }
            }
            
            // Load flower senders using funeral_id
            try {
              console.log('[DEBUG] Fetching flower senders for:', funeralId);
              const { data: orders, error: ordersError } = await supabase
                .from('customer_orders')
                .select('customer_name, status')
                .eq('funeral_id', funeralId)
                .eq('status', 'completed')
                .order('created_at', { ascending: false });
              
              console.log('[DEBUG] Flower orders:', orders, 'Error:', ordersError);
              
              if (!ordersError && orders) {
                // 중복 제거
                const uniqueSenders = orders.reduce((acc: any[], order: any) => {
                  if (!acc.find(s => s.customer_name === order.customer_name)) {
                    acc.push(order);
                  }
                  return acc;
                }, []);
                setFlowerSenders(uniqueSenders);
              }
            } catch (err) {
              console.error('Failed to load flower senders:', err);
            }
          }
        } catch (error) {
          console.error('Failed to load funeral data:', error);
        } finally {
          setLoading(false);
        }
      } else {
        // Fallback to SessionStorage (for admin preview only)
        const savedData = sessionStorage.getItem('obituaryPreview');
        if (savedData) {
          setObituaryData(JSON.parse(savedData));
        }
        setLoading(false);
      }
    };
    
    loadFuneralData();

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

          const markerPosition = new window.kakao.maps.LatLng(36.1853424, 127.7809592);
          const marker = new window.kakao.maps.Marker({ position: markerPosition });
          marker.setMap(map);
        }
      });
    };

    // Load Kakao Share SDK
    const kakaoScript = document.createElement('script');
    kakaoScript.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.5.0/kakao.min.js';
    kakaoScript.integrity = 'sha384-kYPsUbBPlktXsY6/oNHSUDZoTX6+YI51f63jCPEIPFP09ttByAdxd2mEjKuhdqn4';
    kakaoScript.crossOrigin = 'anonymous';
    kakaoScript.async = true;
    document.head.appendChild(kakaoScript);

    kakaoScript.onload = () => {
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init('a4838806d2f40c58ade5eea4f3ae6a26');
      }
    };
  }, [searchParams]);

  const handleSubmitMessage = async () => {
    if (!newMessage.name || !newMessage.message) {
      alert('이름과 메시지를 입력해주세요.');
      return;
    }

    if (!obituaryData?.funeralHomeId || !obituaryData?.roomNumber) {
      alert('조문 메시지를 등록할 수 없습니다.');
      return;
    }

    try {
      await addCondolenceMessage({
        funeral_home_id: obituaryData.funeralHomeId,
        room_number: obituaryData.roomNumber,
        sender_name: newMessage.name,
        sender_relation: newMessage.relation,
        message: newMessage.message
      });
      
      setNewMessage({ name: '', relation: '', message: '' });
      setShowCondolence(false);
      
      // Reload messages
      const messages = await getCondolenceMessages(obituaryData.funeralHomeId, obituaryData.roomNumber);
      setCondolenceMessages(messages);
      alert('조문 메시지가 등록되었습니다.');
    } catch (error) {
      console.error('메시지 등록 실패:', error);
      alert('메시지 등록에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-xl">부고장을 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!obituaryData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-xl mb-4">부고 정보를 찾을 수 없습니다</div>
          <p className="text-gray-500 text-sm">링크가 올바른지 확인해주세요</p>
        </div>
      </div>
    );
  }

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
  const photo = obituaryData?.photo || null;
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
    <>
      <style jsx global>{`
        * {
          font-family: "Noto Serif KR", "Nanum Myeongjo", serif !important;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 relative">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-[#1a252f] via-[#2c3e50] to-[#1a252f] border-b-2 border-[#9A7B4F]/40 relative z-50 sticky top-0 shadow-sm overflow-hidden py-2">
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
        {/* 영정 및 고인정보 - 히어로 섹션 */}
        <div className="relative py-8 -mx-6">
          {/* 배경 이미지 - 흑백 */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(/장례식.jpg)`,
              filter: 'grayscale(100%)',
              opacity: 0.3
            }}
          />
          
          {/* 흰색 배경 */}
          <div className="absolute inset-0 bg-white" style={{ zIndex: -1 }} />
          
          {/* 컨텐츠 */}
          <div className="relative z-10 px-6">
            <div className="flex justify-center mb-6">
              <div className="w-48 h-56 bg-slate-700 border-4 border-slate-700 overflow-hidden flex items-center justify-center relative shadow-2xl">
                {photo ? (
                  <img src={photo} alt="영정사진" className="w-full h-full object-cover" />
                ) : (
                  <div 
                    className="w-full h-full bg-cover bg-center"
                    style={{
                      backgroundImage: `url(/코스모스.jpg)`,
                      filter: 'grayscale(100%) brightness(1.2)'
                    }}
                  />
                )}
              </div>
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-4xl font-bold text-slate-700" style={{ fontFamily: '"Noto Serif KR", "Nanum Myeongjo", serif' }}>故 {deceasedName}</h2>
              {(deceasedAge || gender) && (
                <p className="text-slate-500 text-lg" style={{ fontFamily: '"Noto Serif KR", "Nanum Myeongjo", serif' }}>({gender}{deceasedAge && `/${deceasedAge}세`})</p>
              )}
            </div>
          </div>
        </div>

        {/* 상주 정보 */}
        {familyMembers.length > 0 && (
          <div className="py-4 border-b border-slate-200">
            <h3 className="text-sm text-[#9A7B4F] mb-3 font-bold flex items-center gap-2">
              <span>⚪</span> 유가족
            </h3>
            <div className="space-y-1">
              {familyMembers.map((member: any, idx: number) => (
                <div key={idx} className="grid grid-cols-[80px_1fr] gap-4 text-sm py-1">
                  <span className="text-slate-600">{member.relation}</span>
                  <span className="text-slate-900">{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

{/* 일정 정보 */}
        <div className="py-4 border-b border-slate-200">
          <h3 className="text-sm text-[#9A7B4F] mb-3 font-bold flex items-center gap-2">
            <span>⚪</span> 장례일정
          </h3>
          <div className="space-y-2">
            {deathTime && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-600">별세</span>
                <span className="text-slate-900">{formatDateTime(deathTime)}</span>
              </div>
            )}
            {casketTime && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-600">입관</span>
                <span className="text-slate-900">{formatDateTime(casketTime)}</span>
              </div>
            )}
            {funeralTime && (
              <div className="flex justify-between text-sm py-1">
                <span className="text-slate-600">발인</span>
                <span className="text-slate-900">{formatDateTime(funeralTime)}</span>
              </div>
            )}
            {burialLocation && (
  <div className="flex justify-between text-sm py-1">
    <span className="text-slate-600">장지</span>
    <span className="text-slate-900">{burialLocation}</span>
  </div>
)}
{burialType === 'cremation' && !burialLocation && (
  <div className="flex justify-between text-sm py-1">
    <span className="text-slate-600">장지</span>
    <span className="text-slate-900">화장</span>
  </div>
)}
          </div>
        </div>

        {/* 장례식장 */}
        <div className="py-4 border-b border-slate-200">
        <h3 className="text-sm text-[#9A7B4F] mb-3 font-bold flex items-center gap-2">
          <span>⚪</span> 오시는 길
        </h3>
          <div className="space-y-5">
            <div className="flex items-center justify-between">
  <p className="text-slate-900 text-lg font-bold">영동병원 장례식장</p>
  {room && obituaryData.floor && (
    <p className="text-slate-900 text-lg font-bold">{room} ({obituaryData.floor})</p>
  )}
  {room && !obituaryData.floor && (
    <p className="text-slate-900 text-lg font-bold">{room}</p>
  )}
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
                    className="ml-2 px-3 py-1 text-xs bg-[#9A7B4F] text-white hover:bg-[#7A5F3F] transition-colors rounded"
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
                  className="py-3 bg-[#9A7B4F] text-white text-sm font-medium hover:bg-[#7A5F3F] transition-colors rounded"
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
            <h3 className="text-sm text-[#9A7B4F] mb-3 font-bold flex items-center gap-2">
              <span>⚪</span> 마음 전하실 곳
            </h3>
            <div className="space-y-2">
              {bankAccounts.map((account: any, idx: number) => (
                account.bankName && (
                  <div key={idx} className="text-sm space-y-2 py-4 bg-slate-50 px-4 rounded">
                    <div className="flex justify-between">
                      <span className="text-slate-600">은행</span>
                      <span className="text-slate-900 font-bold">{account.bankName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">계좌번호</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900 font-mono font-medium">{account.accountNumber}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(account.accountNumber);
                            alert('계좌번호가 복사되었습니다.');
                          }}
                          className="px-2 py-1 text-xs bg-[#9A7B4F] text-white hover:bg-[#7A5F3F] transition-colors rounded"
                        >
                          복사
                        </button>
                      </div>
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
            <h3 className="text-sm text-[#9A7B4F] mb-3 font-bold flex items-center gap-2">
              <span>⚪</span> MESSAGE
            </h3>
            <p className="text-slate-800 leading-relaxed whitespace-pre-wrap text-sm">
              {chiefMessage}
            </p>
          </div>
        )}

        {/* 근조화환 보내신 분들 */}
        <div className="py-4 border-b border-slate-200">
          <h3 className="text-sm text-[#9A7B4F] mb-3 font-bold flex items-center gap-2">
            <span>⚪</span> 근조화환 보내신 분들 ({flowerSenders.length})
          </h3>
          {flowerSenders.length === 0 ? (
            <div className="text-sm text-slate-600 text-center py-8">
              아직 화환이 접수되지 않았습니다
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {flowerSenders.map((sender, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-200 text-center">
                  <span className="text-slate-900 font-medium">{sender.customer_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 조문 메시지 */}
        <div className="py-4 border-b border-slate-200">
          <h3 className="text-sm text-[#9A7B4F] mb-3 font-bold flex items-center gap-2">
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
            className="w-full mt-4 py-3 bg-[#9A7B4F] hover:bg-[#7A5F3F] text-white rounded font-medium transition-colors"
          >
            조문 메시지 남기기
          </button>
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#1a252f] via-[#2c3e50] to-[#1a252f] border-t border-[#9A7B4F]/40 z-[60] shadow-lg py-2">
        <div className="max-w-xl mx-auto grid grid-cols-3 divide-x divide-slate-600">
          <button 
            onClick={() => setShowDonation(true)}
            className="flex flex-col items-center gap-1 py-2 hover:bg-slate-700 transition-colors text-white"
          >
            <span className="text-xl font-bold">조의금</span>
          </button>
          <button 
            onClick={() => {
              const funeralId = searchParams.get('id')
              if (funeralId) {
                router.push(`/obituary/flower?id=${funeralId}`)
              } else {
                router.push('/obituary/flower')
              }
            }}
            className="flex flex-col items-center gap-1 py-2 hover:bg-slate-700 transition-colors text-white"
          >
            <span className="text-xl font-bold">근조화환</span>
          </button>
          <button
            onClick={() => setShowShareModal(true)}
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
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600">계좌번호</span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-900 font-mono font-medium">{account.accountNumber}</span>
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(account.accountNumber);
                                alert('계좌번호가 복사되었습니다.');
                              }}
                              className="px-2 py-1 text-xs bg-[#9A7B4F] text-white hover:bg-[#7A5F3F] transition-colors rounded"
                            >
                              복사
                            </button>
                          </div>
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
              className="w-full bg-[#9A7B4F] text-white py-3 text-sm font-bold hover:bg-[#7A5F3F] mt-6 rounded"
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
              className="w-full bg-[#9A7B4F] text-white py-3 text-sm font-bold hover:bg-[#7A5F3F] mt-6 rounded"
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
                className="flex-1 bg-[#9A7B4F] text-white py-3 text-sm font-bold hover:bg-[#7A5F3F] rounded"
              >
                등록
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 부고전달 모달 */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-[70]">
          <div className="bg-white max-w-md w-full p-8 shadow-2xl rounded">
            <h3 className="text-lg mb-6 text-slate-900 font-bold pb-4 border-b-2 border-slate-300">부고 전달하기</h3>
            <div className="space-y-3">
              {/* 카카오톡 공유 - 링크만 복사 (OG 미리보기용) */}
              <button
                onClick={() => {
                  const shareUrl = window.location.href;
                  navigator.clipboard.writeText(shareUrl);

                  if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                    alert('부고장 링크가 복사되었습니다.\n카카오톡에서 붙여넣기 하세요.\n\n※ 링크를 붙여넣으면 고인 정보와 사진이 미리보기로 표시됩니다.');
                    window.location.href = 'kakaotalk://launch';
                  } else {
                    alert('부고장 링크가 복사되었습니다.\n카카오톡에서 붙여넣기 하세요.\n\n※ 링크를 붙여넣으면 고인 정보와 사진이 미리보기로 표시됩니다.');
                  }
                  setShowShareModal(false);
                }}
                className="w-full py-4 bg-yellow-400 text-gray-900 font-bold rounded hover:bg-yellow-500 transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.72 6.67-.18.63-.66 2.27-.76 2.63-.12.44.16.43.34.31.14-.09 2.23-1.5 3.13-2.11.51.08 1.04.12 1.57.12 5.52 0 10-3.58 10-8S17.52 3 12 3z"/>
                </svg>
                카카오톡으로 공유
              </button>

              {/* 문자 공유 */}
              <button
                onClick={() => {
                  const message = `[부고]\n\n故 ${deceasedName}\n\n빈소: 영동병원장례식장 ${obituaryData?.room || ''} ${obituaryData?.floor || ''}\n\n부고장 보기:\n${window.location.href}`;
                  const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
                  window.location.href = smsUrl;
                  setShowShareModal(false);
                }}
                className="w-full py-4 bg-green-500 text-white font-bold rounded hover:bg-green-600 transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                문자로 공유
              </button>

              {/* 링크 복사 */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('링크가 복사되었습니다.\n카카오톡, 문자 등에 붙여넣기 하세요.');
                  setShowShareModal(false);
                }}
                className="w-full py-4 bg-slate-600 text-white font-bold rounded hover:bg-slate-700 transition-colors flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                링크 복사
              </button>
            </div>
            <button
              onClick={() => setShowShareModal(false)}
              className="w-full bg-slate-200 text-slate-700 py-3 text-sm font-bold hover:bg-slate-300 mt-6 rounded"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
    </>
  );
}

export default function ObituaryClientContent() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-400 text-xl">부고장을 불러오는 중...</div>
        </div>
      </div>
    }>
      <MinimalObituaryContent />
    </Suspense>
  );
}
