'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Settings, FileText, Calendar, MapPin } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { saveFuneral, getFuneralsByHome, getFuneralByRoom, deleteFuneral, completeFuneral, getCompletedFunerals, getAllSavedFunerals, updateFuneral, saveFuneralAnnouncement, getFuneralAnnouncements, deleteFuneralAnnouncement } from '../lib/funeralApi';
import { getCondolenceMessages, deleteCondolenceMessagesForRoom, bulkInsertCondolenceMessages } from '../lib/condolenceApi';
import { addEnshrined, getEnshrinedList, deleteEnshrined, updateEnshrined } from '../lib/enshrinedApi';

// Initialize Supabase client for direct queries
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const mockRooms = [
  { id: 1, name: '1빈소', floor: '2층', status: 'available' },
  { id: 2, name: '2빈소', floor: '2층', status: 'available' },
  { id: 3, name: '3빈소', floor: '3층', status: 'available' },
  { id: 4, name: '4빈소', floor: '3층', status: 'available' },
  { id: 5, name: '특실 5빈소', floor: '5층', status: 'available' },
  { id: 6, name: '예비', floor: '', status: 'available' },
];

const getFuneralHomeId = () => {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('funeral_home_id') || '';
  }
  return '';
};

// 전화번호 포맷팅 함수 (010-XXXX-XXXX 또는 010-XXX-XXXX)
const formatPhoneNumber = (value: string) => {
  // 숫자만 추출
  const numbers = value.replace(/[^\d]/g, '');

  // 최대 11자리까지만
  const limited = numbers.slice(0, 11);

  // 포맷 적용
  if (limited.length <= 3) {
    return limited;
  } else if (limited.length <= 7) {
    return `${limited.slice(0, 3)}-${limited.slice(3)}`;
  } else if (limited.length <= 10) {
    return `${limited.slice(0, 3)}-${limited.slice(3, 6)}-${limited.slice(6)}`;
  } else {
    return `${limited.slice(0, 3)}-${limited.slice(3, 7)}-${limited.slice(7)}`;
  }
};

export default function AdminDashboard() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('현황판');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedFuneralForView, setSelectedFuneralForView] = useState<any>(null); // 지난상가 상세보기용
  const [placementTime, setPlacementTime] = useState('2025-10-04 10:19');
  const [funeralTime, setFuneralTime] = useState('');
  const [checkoutTime, setCheckoutTime] = useState('');
  const [casketTime, setCasketTime] = useState('');
  const [shroudTime, setShroudTime] = useState(''); // 염습일시 추가
  const [deathTime, setDeathTime] = useState(''); // 사망일시 추가
  const [religion, setReligion] = useState('');
  const [religionTitle, setReligionTitle] = useState('');
  const [placementDate, setPlacementDate] = useState(''); // 안치일시
  const [rooms, setRooms] = useState(mockRooms);
  const [selectedMoveRoom, setSelectedMoveRoom] = useState('');
  const [familyMembers, setFamilyMembers] = useState([
    { id: 1, relation: '', name: '', phone: '' }
  ]);
  const [deceasedNameHanja, setDeceasedNameHanja] = useState('');
  const [chiefMournerMessage, setChiefMournerMessage] = useState('');
  const [deceasedPhoto, setDeceasedPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [burialType, setBurialType] = useState<'burial' | 'cremation' | ''>('');
  const [deceasedName, setDeceasedName] = useState(''); // 고인이름 추가
  const [deceasedAge, setDeceasedAge] = useState(''); // 고인나이 추가
  const [deceasedGender, setDeceasedGender] = useState(''); // 고인성별 추가
  const [burialLocation, setBurialLocation] = useState(''); // 장지 추가
  const [burialLocation2, setBurialLocation2] = useState(''); // 2차장지 추가
  const [savedFuneralsList, setSavedFuneralsList] = useState<any[]>([]); // 완료된 장례 목록 - funeral_announcements 테이블 (지난상가용)
  const [allSavedFuneralsList, setAllSavedFuneralsList] = useState<any[]>([]); // 진행 중인 장례 목록 - funerals 테이블 (저장된장례정보용)
  const [roomFunerals, setRoomFunerals] = useState<any>({});
  const [deathCause, setDeathCause] = useState(''); // 사망원인
  const [deathPlace, setDeathPlace] = useState(''); // 사망장소
  const [chemicalTreatment, setChemicalTreatment] = useState(''); // 약품처리
  const [deceasedAddress, setDeceasedAddress] = useState(''); // 고인주소
  const [deceasedNote, setDeceasedNote] = useState(''); // 고인비고
  const [residentNumber, setResidentNumber] = useState(''); // 주민번호 (전체 - 저장용)
  const [residentNumberFront, setResidentNumberFront] = useState(''); // 주민번호 앞자리
  const [residentNumberBack, setResidentNumberBack] = useState(''); // 주민번호 뒷자리
  const [baptismalName, setBaptismalName] = useState(''); // 세례명
  const [otherTitle, setOtherTitle] = useState(''); // 기타대우
  const [businessNote, setBusinessNote] = useState(''); // 업무비고
  const [funeralDirector, setFuneralDirector] = useState(''); // 장례지도사
  const [funeralCompany, setFuneralCompany] = useState(''); // 장례주관
  const [bankAccounts, setBankAccounts] = useState([
    { id: 1, bankName: '', accountNumber: '', accountHolder: '' }
  ]);
  const [usePhotoInObituary, setUsePhotoInObituary] = useState(true); // 모바일부고장 사진사용 여부
  const [completedFuneralsSearch, setCompletedFuneralsSearch] = useState(''); // 지난상가 검색어
  const [completedFuneralsSortBy, setCompletedFuneralsSortBy] = useState('funeral_time'); // 정렬 기준
  const [completedFuneralsSortOrder, setCompletedFuneralsSortOrder] = useState<'asc' | 'desc'>('desc'); // 정렬 순서

  // Ref for auto-focus on resident number back field
  const residentNumberBackRef = React.useRef<HTMLInputElement>(null);

  // Enshrined (안치) form state
  const [enshrinedName, setEnshrinedName] = useState('');
  const [enshrinedTime, setEnshrinedTime] = useState('');
  const [enshrinedContactName, setEnshrinedContactName] = useState('');
  const [enshrinedContactPhone, setEnshrinedContactPhone] = useState('');
  const [enshrinedContactRelation, setEnshrinedContactRelation] = useState('');
  const [enshrinedNotes, setEnshrinedNotes] = useState('');
  const [enshrinedList, setEnshrinedList] = useState<any[]>([]);
  const [pendingEnshrinedId, setPendingEnshrinedId] = useState<string | null>(null); // 빈소 저장 시 삭제할 안치 기록 ID

  // 빈소 변경 시 저장된 데이터 불러오기
  useEffect(() => {
    if (currentPage.startsWith('room-')) {
      loadRoomData(currentPage);
    }
    // 저장된 장례 목록도 업데이트
    loadSavedFuneralsList();
    loadAllSavedFuneralsList();
  }, [currentPage]);

  // 초기 로드시 모든 방 데이터 불러오기
  useEffect(() => {
    loadAllRoomsData();
    loadEnshrinedList();
  }, []);

  // 모든 방의 데이터 불러오기
const loadAllRoomsData = async () => {
  try {
    const funeralHomeId = getFuneralHomeId();
    if (!funeralHomeId) return;
    const allFunerals = await getFuneralsByHome(funeralHomeId);
    // 활성 상태인 장례만 필터링 (completed는 지난상가에만 표시)
    const activeFunerals = allFunerals.filter((funeral: any) =>
      funeral.status !== 'completed'
    );
    const roomData: any = {};
    activeFunerals.forEach((funeral: any) => {
      const roomKey = `room-${funeral.room_number}`;
      roomData[roomKey] = funeral;
    });
    setRoomFunerals(roomData);
    const updatedRooms = mockRooms.map(room => {
      const roomKey = `room-${room.id}`;
      const hasData = roomData[roomKey];
      return { ...room, status: hasData ? 'occupied' : 'available' };
    });
    setRooms(updatedRooms);
  } catch (error) {
    console.error('데이터 불러오기 실패:', error);
    alert('데이터를 불러오는데 실패했습니다.');
  }
};

  // 완료된 장례 목록 불러오기 (지난상가용 - funeral_announcements 테이블)
const loadSavedFuneralsList = async () => {
  try {
    const funeralHomeId = getFuneralHomeId();
    if (!funeralHomeId) return;
    // funeral_announcements 테이블에서 모든 완료된 장례 가져오기
    const funerals = await getFuneralAnnouncements(funeralHomeId);
    setSavedFuneralsList(funerals);
  } catch (error) {
    console.error('완료된 장례 목록 불러오기 실패:', error);
  }
};

// 진행 중인 장례 목록 불러오기 (저장된장례정보용 - funerals 테이블)
const loadAllSavedFuneralsList = async () => {
  try {
    const funeralHomeId = getFuneralHomeId();
    if (!funeralHomeId) return;
    // funerals 테이블에서 모든 진행 중인 장례 가져오기
    const funerals = await getAllSavedFunerals(funeralHomeId);
    setAllSavedFuneralsList(funerals);
  } catch (error) {
    console.error('진행 중인 장례 목록 불러오기 실패:', error);
  }
};

  // 빈소 데이터 불러오기
const loadRoomData = async (roomId: string) => {
  try {
    const funeralHomeId = getFuneralHomeId();
    if (!funeralHomeId) return;
    const roomNumber = parseInt(roomId.split('-')[1]);
    const roomData = await getFuneralByRoom(funeralHomeId, roomNumber);
    if (roomData) {
      setDeceasedName(roomData.deceased_name || '');
      setDeceasedNameHanja(roomData.deceased_hanja || '');
      setDeceasedAge(roomData.age?.toString() || '');
      setDeceasedGender(roomData.gender || '');
      setReligion(roomData.religion || '');
      setReligionTitle(roomData.religion_title || '');
      setPlacementTime(roomData.placement_time || '');
      setCasketTime(roomData.casket_time || '');
      setShroudTime(roomData.shroud_time || '');
      setFuneralTime(roomData.funeral_time || '');
      setCheckoutTime(roomData.checkout_time || '');
      setDeathTime(roomData.death_time || '');
      setPlacementDate(roomData.placement_date || '');
      setBurialType(roomData.burial_type || '');
      setBurialLocation(roomData.burial_location || '');
      setBurialLocation2(roomData.burial_location_2 || '');
      setDeathCause(roomData.death_cause || '');
      setDeathPlace(roomData.death_place || '');
      setChemicalTreatment(roomData.chemical_treatment || '');
      setDeceasedAddress(roomData.deceased_address || '');
      setDeceasedNote(roomData.deceased_note || '');

      // 주민번호 분리
      const fullResidentNumber = roomData.resident_number || '';
      setResidentNumber(fullResidentNumber);
      if (fullResidentNumber.includes('-')) {
        const [front, back] = fullResidentNumber.split('-');
        setResidentNumberFront(front || '');
        setResidentNumberBack(back || '');
      } else {
        setResidentNumberFront('');
        setResidentNumberBack('');
      }

      setBaptismalName(roomData.baptismal_name || '');
      setOtherTitle(roomData.other_title || '');
      setBusinessNote(roomData.business_note || '');
      setFuneralDirector(roomData.funeral_director || '');
      setFuneralCompany(roomData.funeral_company || '');
      setBankAccounts(roomData.bank_accounts || [{ id: 1, bankName: '', accountNumber: '', accountHolder: '' }]);
      setUsePhotoInObituary(roomData.use_photo_in_obituary !== undefined ? roomData.use_photo_in_obituary : true);
      setChiefMournerMessage(roomData.chief_message || '');
      setDeceasedPhoto(roomData.photo_url || null);
      if (roomData.family_members && roomData.family_members.length > 0) {
        setFamilyMembers(roomData.family_members);
      }
    } else {
      // 안치관리에서 이동한 경우는 리셋하지 않음 (이미 데이터가 채워져 있음)
      if (!pendingEnshrinedId) {
        resetFormSilently();
      }
    }
  } catch (error) {
    console.error('데이터 불러오기 실패:', error);
  }
};

  // 종교별 심볼 반환 함수
  const getReligionSymbol = (religion: string) => {
    switch(religion) {
      case '기독교':
      case '천주교':
        return '✝';
      case '불교':
        return '卍';
      case '원불교':  
        return '◉';
      case '유교':
        return '⚊';
      case '무교':
      default:
        return '';
    }
  };

  // 날짜 포맷 변환 함수
  const formatScheduleDate = (dateStr: string) => {
    if (!dateStr) return '시간미정';
    
    try {
      const date = new Date(dateStr);
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
        timeStr = ` ${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;
      }
      
      return `${month}월 ${day}일 (${dayOfWeek})${timeStr}`;
    } catch (e) {
      return dateStr;
    }
  };

  // 완료된 장례 목록 (임시 데이터)
  const [completedFunerals, setCompletedFunerals] = useState([
    {
      id: 1,
      deceasedName: '홍길동',
      age: 75,
      room: '1빈소',
      placementDate: '2025-01-15',
      funeralDate: '2025-01-18',
      chiefMourner: '홍철수',
      phone: '010-1234-5678'
    },
    {
      id: 2,
      deceasedName: '김영희',
      age: 82,
      room: '3빈소',
      placementDate: '2025-01-10',
      funeralDate: '2025-01-13',
      chiefMourner: '김민수',
      phone: '010-8765-4321'
    }
  ]);

  // 한국 시간으로 포맷팅 (datetime-local 호환 형식)
  const formatToKST = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // 현재 시간을 입실시간에 설정
  const setCurrentTime = () => {
    const now = new Date();
    const formattedTime = formatToKST(now);
    setPlacementTime(formattedTime);
    setPlacementDate(formattedTime); // 안치일시도 동일하게 설정
  };

  // 종교별 호칭 매핑
  const religionTitles: { [key: string]: string[] } = {
    '불교': ['법명', '법호'],
    '기독교': ['세례명', '성도', '권사', '집사', '장로'],
    '천주교': ['세례명', '영명'],
    '원불교': ['법명'],
    '유교': ['시호'],
    '무교': []
  };

  // 종교별 별세 표현
  const religionDeathTerms: { [key: string]: string } = {
    '불교': '입적',
    '기독교': '소천',
    '천주교': '선종',
    '원불교': '법신귀일',
    '유교': '별세',
    '무교': '별세'
  };

  const handleReligionChange = (selectedReligion: string) => {
    setReligion(selectedReligion);
    setReligionTitle(''); // 종교 변경 시 호칭 초기화
  };

  // 부의금 계좌 추가
  const addBankAccount = () => {
    const newId = Math.max(...bankAccounts.map(a => a.id)) + 1;
    setBankAccounts([...bankAccounts, { id: newId, bankName: '', accountNumber: '', accountHolder: '' }]);
  };

  // 부의금 계좌 삭제
  const removeBankAccount = (id: number) => {
    if (bankAccounts.length > 1) {
      setBankAccounts(bankAccounts.filter(a => a.id !== id));
    }
  };

  // 부의금 계좌 업데이트
  const updateBankAccount = (id: number, field: string, value: string) => {
    setBankAccounts(bankAccounts.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  // 유가족 추가
  const addFamilyMember = () => {
    const newId = Math.max(...familyMembers.map(m => m.id)) + 1;
    setFamilyMembers([...familyMembers, { id: newId, relation: '', name: '', phone: '' }]);
  };

  // 유가족 삭제
  const removeFamilyMember = (id: number) => {
    if (familyMembers.length > 1) {
      setFamilyMembers(familyMembers.filter(m => m.id !== id));
    }
  };

  // 유가족 정보 업데이트
  const updateFamilyMember = (id: number, field: string, value: string) => {
    setFamilyMembers(familyMembers.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  // 가족 서열 정렬 함수
  const getSortedFamilyMembers = () => {
    const relationOrder: { [key: string]: number } = {
      '상주': 1,
      '배우자': 2,
      '아들': 3,
      '며느리': 4,
      '딸': 5,
      '사위': 6,
      '손자': 7,
      '손녀': 8,
      '형제': 9,
      '자매': 10,
    };

    return [...familyMembers].sort((a, b) => {
      const orderA = relationOrder[a.relation] || 999;
      const orderB = relationOrder[b.relation] || 999;
      return orderA - orderB;
    });
  };

  // 빈소 입실 처리
  const handleCheckIn = (roomId: number) => {
    setRooms(prev => prev.map(room => 
      room.id === roomId ? { ...room, status: 'occupied' } : room
    ));
  };

  // 빈소 퇴실 처리
const handleCheckOut = async (roomId: number) => {
  if (confirm('퇴실 처리하시겠습니까? 빈소가 비워지며 장례 정보는 "지난상가"에서 확인하실 수 있습니다.')) {
    let savedAnnouncement = null;
    try {
      const funeralHomeId = getFuneralHomeId();
      if (!funeralHomeId) return;

      // 1. 현재 장례 정보 가져오기
      console.log('[퇴실 1/5] 장례 정보 조회 중...');
      const funeral = await getFuneralByRoom(funeralHomeId, roomId);
      if (!funeral?.id) {
        alert('퇴실할 장례 정보를 찾을 수 없습니다.');
        return;
      }
      console.log('[퇴실 1/5] 완료:', funeral.deceased_name);

      // 2. funeral_announcements 테이블에 저장
      console.log('[퇴실 2/5] funeral_announcements에 저장 중...');
      savedAnnouncement = await saveFuneralAnnouncement(funeral);
      if (!savedAnnouncement?.id) {
        throw new Error('funeral_announcements 저장 실패');
      }
      console.log('[퇴실 2/5] 완료 - 저장된 ID:', savedAnnouncement.id);

      // 3. 조문 메시지 삭제 (Foreign Key Constraint 해결)
      console.log('[퇴실 3/5] 조문 메시지 삭제 중...');
      try {
        const deletedMessages = await deleteCondolenceMessagesForRoom(funeralHomeId, roomId);
        console.log('[퇴실 3/5] 완료 - 삭제된 메시지 수:', deletedMessages?.length || 0);
      } catch (msgError) {
        console.warn('[퇴실 3/5] 조문 메시지 삭제 실패 (없거나 이미 삭제됨):', msgError);
        // 조문 메시지 없을 수도 있으므로 계속 진행
      }

      // 4. funerals 테이블에서 삭제
      console.log('[퇴실 4/5] funerals 테이블에서 삭제 중...', funeral.id);
      await deleteFuneral(funeral.id);
      console.log('[퇴실 4/5] 삭제 완료');

      // 4-1. 삭제 검증 (ID로 직접 확인)
      console.log('[퇴실 4/5] 삭제 검증 중...');
      const { data: verifyData, error: verifyError } = await supabase
        .from('funerals')
        .select('id, deceased_name')
        .eq('id', funeral.id)
        .maybeSingle();

      if (verifyError) {
        console.error('[퇴실 4/5] 검증 쿼리 에러:', verifyError);
      }

      console.log('[퇴실 4/5] 검증 결과:', verifyData);

      if (verifyData) {
        throw new Error(`funerals 테이블에서 삭제 실패 - ID ${funeral.id}가 여전히 존재합니다`);
      }
      console.log('[퇴실 4/5] 삭제 검증 완료');

      // 5. 방 데이터 새로고침
      console.log('[퇴실 5/5] 데이터 새로고침 중...');
      await loadAllRoomsData();
      await loadSavedFuneralsList();
      await loadAllSavedFuneralsList();
      console.log('[퇴실 5/5] 완료');

      // 6. 현황판으로 돌아가기
      setCurrentPage('dashboard');
      setActiveTab('현황판');
      alert('퇴실 처리되었습니다. "지난상가" 탭에서 확인하실 수 있습니다.');
      console.log('[퇴실] ✅ 모든 처리 완료');

    } catch (error) {
      console.error('[퇴실] ❌ 실패:', error);

      // 롤백: funeral_announcements에 저장했지만 funerals 삭제 실패 시
      if (savedAnnouncement?.id) {
        console.log('[퇴실 롤백] funeral_announcements에서 삭제 중...', savedAnnouncement.id);
        try {
          await deleteFuneralAnnouncement(savedAnnouncement.id);
          console.log('[퇴실 롤백] 완료');
          alert('퇴실 처리에 실패했습니다. 데이터가 롤백되었습니다.');
        } catch (rollbackError) {
          console.error('[퇴실 롤백] 실패:', rollbackError);
          alert('퇴실 처리에 실패했습니다. 데이터 불일치가 발생했을 수 있습니다. 관리자에게 문의하세요.');
        }
      } else {
        alert('퇴실 처리에 실패했습니다: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
      }
    }
  }
};

  // Load enshrined list
  const loadEnshrinedList = async () => {
    try {
      const funeralHomeId = getFuneralHomeId();
      if (!funeralHomeId) return;
      const list = await getEnshrinedList(funeralHomeId);
      setEnshrinedList(list);
    } catch (error) {
      console.error('안치 목록 불러오기 실패:', error);
    }
  };

  // Handle adding enshrined body
  const handleAddEnshrined = async () => {
    try {
      const funeralHomeId = getFuneralHomeId();
      if (!funeralHomeId) return;

      if (!enshrinedName && !enshrinedContactName) {
        alert('고인명 또는 연락처명 중 하나는 입력해주세요.');
        return;
      }

      await addEnshrined({
        funeral_home_id: funeralHomeId,
        deceased_name: enshrinedName || '미상',
        enshrinement_time: enshrinedTime || new Date().toISOString(),
        contact_name: enshrinedContactName,
        contact_phone: formatPhoneNumber(enshrinedContactPhone),
        contact_relation: enshrinedContactRelation,
        notes: enshrinedNotes,
        status: 'waiting'
      });

      // Clear form
      setEnshrinedName('');
      setEnshrinedTime('');
      setEnshrinedContactName('');
      setEnshrinedContactPhone('');
      setEnshrinedContactRelation('');
      setEnshrinedNotes('');

      alert('안치 등록되었습니다. "안치" 메뉴에서 확인하실 수 있습니다.');
      loadEnshrinedList();
    } catch (error) {
      console.error('안치 등록 실패:', error);
      alert('안치 등록에 실패했습니다.');
    }
  };

  // Move enshrined to room
  const handleMoveToRoom = async (enshrinedItem: any) => {
    const roomNumber = prompt('이동할 빈소 번호를 입력하세요 (1-5):', '1');

    if (!roomNumber) return;

    const roomNum = parseInt(roomNumber);
    if (isNaN(roomNum) || roomNum < 1 || roomNum > 5) {
      alert('1-5 사이의 번호를 입력해주세요.');
      return;
    }

    // 해당 빈소가 이용중인지 확인
    const funeralHomeId = getFuneralHomeId();
    if (funeralHomeId) {
      const existingFuneral = await getFuneralByRoom(funeralHomeId, roomNum);
      if (existingFuneral) {
        alert(`${roomNum}빈소는 현재 이용중입니다. 다른 빈소를 선택해주세요.`);
        // 다시 빈소 선택 prompt 호출
        handleMoveToRoom(enshrinedItem);
        return;
      }
    }

    if (confirm(`${enshrinedItem.deceased_name || '미상'}을(를) ${roomNum}빈소로 이동하시겠습니까?`)) {
      try {
        // Pre-fill basic info
        setDeceasedName(enshrinedItem.deceased_name || '');
        setPlacementDate(enshrinedItem.enshrinement_time || '');

        // Add contact as family member
        if (enshrinedItem.contact_name) {
          setFamilyMembers([{
            id: 1,
            relation: enshrinedItem.contact_relation || '연락처',
            name: enshrinedItem.contact_name,
            phone: enshrinedItem.contact_phone || ''
          }]);
        }

        // 안치 기록 ID를 저장 (빈소 저장 시 삭제됨)
        setPendingEnshrinedId(enshrinedItem.id);

        // Navigate to room
        setCurrentPage(`room-${roomNum}`);
        setActiveTab('현황판');

        alert(`${roomNum}빈소로 이동되었습니다. 정보를 확인/입력 후 저장 버튼을 눌러주세요.`);
      } catch (error) {
        console.error('이동 실패:', error);
        alert('이동에 실패했습니다.');
      }
    }
  };

  // 빈소 이동 처리
const handleMoveRoom = async (currentRoomId: number) => {
  if (!selectedMoveRoom) {
    alert('이동할 빈소를 선택해주세요.');
    return;
  }
  const funeralHomeId = getFuneralHomeId();
  if (!funeralHomeId) {
    alert('로그인이 필요합니다.');
    return;
  }
  try {
    console.log('[빈소이동] 시작 - 현재 빈소:', currentRoomId, '목표 빈소:', selectedMoveRoom);
    const targetRoomId = parseInt(selectedMoveRoom);
    const targetRoom = rooms.find(r => r.id === targetRoomId);

    console.log('[빈소이동] 목표 빈소 확인 중...');
    const targetFuneral = await getFuneralByRoom(funeralHomeId, targetRoomId);
    if (targetFuneral) {
      console.log('[빈소이동] 실패 - 목표 빈소가 사용중:', targetFuneral);
      alert('해당 빈소는 이미 사용중입니다.');
      return;
    }

    console.log('[빈소이동] 현재 장례 정보 조회 중...');
    const currentFuneral = await getFuneralByRoom(funeralHomeId, currentRoomId);
    if (!currentFuneral) {
      console.log('[빈소이동] 실패 - 현재 장례 정보 없음');
      alert('이동할 장례 정보를 찾을 수 없습니다.');
      return;
    }

    console.log('[빈소이동] 현재 장례 정보:', currentFuneral);
    if (!currentFuneral.id) {
      console.log('[빈소이동] 실패 - 장례 정보 ID 없음');
      alert('장례 정보 ID를 찾을 수 없습니다.');
      return;
    }

    console.log('[빈소이동] 조문 메시지 백업 중...');
    // 외래 키 제약 조건 때문에 조문 메시지를 임시로 백업하고 삭제
    const existingMessages = await getCondolenceMessages(funeralHomeId, currentRoomId);
    console.log('[빈소이동] 백업된 조문 메시지:', existingMessages.length, '개');

    if (existingMessages.length > 0) {
      console.log('[빈소이동] 기존 조문 메시지 삭제 중...');
      await deleteCondolenceMessagesForRoom(funeralHomeId, currentRoomId);
    }

    console.log('[빈소이동] 장례 정보 업데이트 시도 - ID:', currentFuneral.id, '새 방 번호:', targetRoomId);
    await updateFuneral(currentFuneral.id, { room_number: targetRoomId });

    if (existingMessages.length > 0) {
      console.log('[빈소이동] 조문 메시지 복원 중...');
      // 조문 메시지를 새 방 번호로 복원
      const messagesToRestore = existingMessages.map(msg => ({
        funeral_home_id: funeralHomeId,
        room_number: targetRoomId,
        sender_name: msg.sender_name,
        sender_relation: msg.sender_relation,
        message: msg.message,
        created_at: msg.created_at
      }));
      await bulkInsertCondolenceMessages(messagesToRestore);
      console.log('[빈소이동] 조문 메시지 복원 완료');
    }

    console.log('[빈소이동] 업데이트 성공, 데이터 새로고침 중...');
    await loadAllRoomsData();

    console.log('[빈소이동] 페이지 전환:', `room-${targetRoomId}`);
    setCurrentPage(`room-${targetRoomId}`);
    setSelectedMoveRoom('');
    alert(`${targetRoom?.name}으로 이동했습니다.`);
    console.log('[빈소이동] 완료');
  } catch (error) {
    console.error('[빈소이동] 오류 발생:', error);
    alert(`빈소 이동에 실패했습니다. 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
};

  // 빈소 정보 저장
const handleSaveRoomInfo = async () => {
  if (!deceasedName) {
    alert('고인 이름은 필수 입력 항목입니다.');
    return;
  }
  const funeralHomeId = getFuneralHomeId();
  if (!funeralHomeId) {
    alert('로그인이 필요합니다.');
    return;
  }
  try {
    const roomNumber = parseInt(currentPage.split('-')[1]);
    const room = rooms.find(r => r.id === roomNumber);
    const funeralData = {
      funeral_home_id: funeralHomeId,
      room_number: roomNumber,
      floor: room?.floor || '',
      deceased_name: deceasedName,
      deceased_hanja: deceasedNameHanja,
      age: deceasedAge ? parseInt(deceasedAge) : null,
      gender: deceasedGender,
      religion: religion,
      religion_title: religionTitle,
      placement_time: placementTime || null,
      casket_time: casketTime || null,
      shroud_time: shroudTime || null,
      funeral_time: funeralTime || null,
      checkout_time: checkoutTime || null,
      death_time: deathTime || null,
      placement_date: placementDate || null,
      burial_type: burialType,
      burial_location: burialLocation,
      burial_location_2: burialLocation2,
      death_cause: deathCause,
      death_place: deathPlace,
      chemical_treatment: chemicalTreatment,
      deceased_address: deceasedAddress,
      deceased_note: deceasedNote,
      resident_number: residentNumberFront && residentNumberBack
        ? `${residentNumberFront}-${residentNumberBack}`
        : residentNumber,
      baptismal_name: baptismalName,
      other_title: otherTitle,
      business_note: businessNote,
      funeral_director: funeralDirector,
      funeral_company: funeralCompany,
      bank_accounts: bankAccounts.filter(a => a.bankName || a.accountNumber || a.accountHolder),
      use_photo_in_obituary: usePhotoInObituary,
      chief_message: chiefMournerMessage,
      photo_url: deceasedPhoto,
      family_members: familyMembers,
      status: 'active' as const
    };
    await saveFuneral(funeralData);

    // 안치관리에서 이동한 경우, 안치 기록 삭제
    if (pendingEnshrinedId) {
      try {
        await deleteEnshrined(pendingEnshrinedId);
        setPendingEnshrinedId(null);
        await loadEnshrinedList(); // 안치 목록 새로고침
      } catch (error) {
        console.error('안치 기록 삭제 실패:', error);
        // 저장은 성공했으므로 알림만 표시
      }
    }

    alert('저장되었습니다.');
    await loadAllRoomsData();
  } catch (error) {
    console.error('저장 실패:', error);
    alert('저장에 실패했습니다. 다시 시도해주세요.');
  }
};
  // 사진 업로드 핸들러
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    console.log('[사진업로드] 파일 선택됨:', file?.name, file?.type, file?.size);

    if (!file) {
      console.log('[사진업로드] 파일이 선택되지 않음');
      return;
    }

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      console.log('[사진업로드] 잘못된 파일 형식:', file.type);
      alert('이미지 파일만 업로드 가능합니다.\n허용 형식: JPG, PNG, GIF, WebP\n\n선택한 파일 형식: ' + (file.type || '알 수 없음'));
      event.target.value = ''; // Reset input
      return;
    }

    // 파일 크기 체크 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      console.log('[사진업로드] 파일 크기 초과:', file.size);
      alert(`파일 크기는 5MB 이하여야 합니다.\n현재 파일 크기: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      event.target.value = ''; // Reset input
      return;
    }

    console.log('[사진업로드] 검증 통과, 파일 읽기 시작');
    setPhotoFile(file);

    // 미리보기를 위한 FileReader
    const reader = new FileReader();
    reader.onloadend = () => {
      console.log('[사진업로드] 파일 읽기 완료');
      setDeceasedPhoto(reader.result as string);
    };
    reader.onerror = () => {
      console.error('[사진업로드] 파일 읽기 실패');
      alert('파일을 읽는 중 오류가 발생했습니다.');
      event.target.value = ''; // Reset input
    };
    reader.readAsDataURL(file);
  };

  // 사진 삭제 핸들러
  const handlePhotoRemove = () => {
    if (confirm('사진을 삭제하시겠습니까?')) {
      setDeceasedPhoto(null);
      setPhotoFile(null);
    }
  };

  // 폼 초기화 (확인 없이)
  const resetFormSilently = () => {
    setPlacementTime('');
    setFuneralTime('');
    setCasketTime('');
    setDeathTime('');
    setReligion('');
    setReligionTitle('');
    setFamilyMembers([{ id: 1, relation: '', name: '', phone: '' }]);
    setDeceasedNameHanja('');
    setChiefMournerMessage('');
    setDeceasedPhoto(null);
    setPhotoFile(null);
    setCheckoutTime('');
    setBurialType('');
    setShroudTime('');
    setDeceasedName('');
    setDeceasedAge('');
    setDeceasedGender('');
    setBurialLocation('');
    setBurialLocation2('');
    setDeathCause('');
    setDeathPlace('');
    setChemicalTreatment('');
    setDeceasedAddress('');
    setDeceasedNote('');
    setResidentNumber('');
    setResidentNumberFront('');
    setResidentNumberBack('');
    setBaptismalName('');
    setOtherTitle('');
    setBusinessNote('');
    setFuneralDirector('');
    setFuneralCompany('');
    setBankAccounts([{ id: 1, bankName: '', accountNumber: '', accountHolder: '' }]);
    setUsePhotoInObituary(true);
  };

  // 초기화 (확인 포함)
  const handleReset = () => {
    if (confirm('모든 입력 내용을 초기화하시겠습니까?')) {
      setPlacementTime('');
      setFuneralTime('');
      setCasketTime('');
      setDeathTime('');
      setReligion('');
      setReligionTitle('');
      setFamilyMembers([{ id: 1, relation: '', name: '', phone: '' }]);
      setDeceasedNameHanja('');
      setChiefMournerMessage('');
      setDeceasedPhoto(null);
      setPhotoFile(null);
      setCheckoutTime('');
      setBurialType('');
      setShroudTime('');
      setDeceasedName('');
      setDeceasedAge('');
      setDeceasedGender('');
      setBurialLocation('');
      setBurialLocation2('');
      setDeathCause('');
      setDeathPlace('');
      setChemicalTreatment('');
      setDeceasedAddress('');
      setDeceasedNote('');
      setResidentNumber('');
      setResidentNumberFront('');
      setResidentNumberBack('');
      setBaptismalName('');
      setOtherTitle('');
      setBusinessNote('');
      setFuneralDirector('');
      setFuneralCompany('');
      setBankAccounts([{ id: 1, bankName: '', accountNumber: '', accountHolder: '' }]);
      setUsePhotoInObituary(true);
    }
  };

  const tabs = ['현황판', '지난상가', '공지사항', '화장예약'];
  const roomMenuItems = [
    { id: 'room-1', label: '1빈소 (2층)' },
    { id: 'room-2', label: '2빈소 (2층)' },
    { id: 'room-3', label: '3빈소 (3층)' },
    { id: 'room-4', label: '4빈소 (3층)' },
    { id: 'room-5', label: '특실 5빈소 (5층)' },
  ];

  const calculateFuneralDate = (days: number) => {
    // 사망일시가 없으면 입실시간을 기준으로 사용
    const baseTime = deathTime || placementTime;
    if (!baseTime) return;
    
    const date = new Date(baseTime);
    date.setDate(date.getDate() + days); // 사망일 + n일
    date.setHours(7, 0, 0, 0);
    const formattedFuneralTime = formatToKST(date);
    setFuneralTime(formattedFuneralTime);
    setCheckoutTime(formattedFuneralTime); // 퇴실시간도 동일하게 설정
    
    // 입관시간 자동 계산 (발인 전날 오후 2시)
    const casketDate = new Date(date);
    casketDate.setDate(casketDate.getDate() - 1);
    casketDate.setHours(14, 0, 0, 0);
    const formattedCasketTime = formatToKST(casketDate);
    setCasketTime(formattedCasketTime);
    
    // 염습시간 자동 계산 (입관 3시간 전, 오전 11시)
    const shroudDate = new Date(casketDate);
    shroudDate.setHours(11, 0, 0, 0);
    setShroudTime(formatToKST(shroudDate));
  };

  const renderTabHeader = () => (
    <div className="bg-white border-b">
      <div className="flex">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              if (tab === '화장예약') {
                window.open('https://15774129.go.kr/', '_blank');
              } else {
                setActiveTab(tab);
                setCurrentPage('dashboard'); // 대시보드로 라우팅
              }
            }}
            className={`px-6 py-3 font-semibold ${activeTab === tab ? 'text-purple-700 border-b-2 border-purple-700' : 'text-gray-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );

  const renderSavedFunerals = () => (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">저장된 장례 정보 (진행 중)</h2>
        <button
          onClick={() => loadAllSavedFuneralsList()}
          className="bg-slate-600 text-white px-4 py-2 rounded text-sm hover:bg-slate-700"
        >
          새로고침
        </button>
      </div>

      {allSavedFuneralsList.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          진행 중인 장례 정보가 없습니다.
        </div>
      ) : (
        <div className="grid gap-4">
          {allSavedFuneralsList.map((funeral, index) => (
            <div key={funeral.id || index} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex gap-6">
                  {/* 사진 */}
                  {funeral.photo_url && (
                    <div className="w-24 h-32 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                      <img src={funeral.photo_url} alt="영정사진" className="w-full h-full object-cover" />
                    </div>
                  )}
                  
                  {/* 정보 */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-2xl font-bold text-gray-800">{funeral.deceased_name || '이름 없음'}</h3>
                      {funeral.deceased_hanja && (
                        <span className="text-gray-500">({funeral.deceased_hanja})</span>
                      )}
                      {funeral.age && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">향년 {funeral.age}세</span>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {funeral.religion && (
                        <div>
                          <span className="text-gray-500">종교:</span>
                          <span className="ml-2 font-medium">{funeral.religion} {funeral.religion_title}</span>
                        </div>
                      )}
                      {funeral.room_id && (
                        <div>
                          <span className="text-gray-500">빈소:</span>
                          <span className="ml-2 font-medium">{funeral.room_id.replace('room-', '') + '빈소'}</span>
                        </div>
                      )}
                      {funeral.placement_time && (
                        <div>
                          <span className="text-gray-500">입실:</span>
                          <span className="ml-2 font-medium">{funeral.placement_time}</span>
                        </div>
                      )}
                      {funeral.funeral_time && (
                        <div>
                          <span className="text-gray-500">발인:</span>
                          <span className="ml-2 font-medium text-red-600">{funeral.funeral_time}</span>
                        </div>
                      )}
                      {funeral.burial_type && (
                        <div>
                          <span className="text-gray-500">장례:</span>
                          <span className="ml-2 font-medium">{funeral.burial_type === 'burial' ? '매장' : '화장'}</span>
                        </div>
                      )}
                      {funeral.family_members && funeral.family_members.length > 0 && (
                        <div>
                          <span className="text-gray-500">상주:</span>
                          <span className="ml-2 font-medium">{funeral.family_members[0]?.name || '-'}</span>
                          {funeral.family_members[0]?.phone && (
                            <span className="ml-2 text-gray-400">({funeral.family_members[0].phone})</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {funeral.created_at && (
                      <div className="mt-3 text-xs text-gray-400">
                        저장일시: {new Date(funeral.created_at).toLocaleString('ko-KR')}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* 액션 버튼 */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      if (funeral.room_id) {
                        setCurrentPage(funeral.room_id);
                        setActiveTab('현황판');
                      }
                    }}
                    className="bg-slate-600 text-white px-4 py-2 rounded text-sm hover:bg-slate-700 whitespace-nowrap"
                  >
                    보기
                  </button>
                  <button
onClick={async () => {
  if (confirm('이 장례 정보를 삭제하시겠습니까?\n(완료된 장례는 지난상가에 저장되지 않습니다)')) {
    try {
      if (funeral.id) {
        await deleteFuneral(funeral.id);
        await loadAllSavedFuneralsList();
        await loadAllRoomsData();
        alert('삭제되었습니다.');
      }
    } catch (error) {
      console.error('삭제 실패:', error);
      alert('삭제에 실패했습니다.');
    }
  }
}}
                    className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 whitespace-nowrap"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderCompletedFunerals = () => {
    // 필터링 및 정렬
    let filteredFunerals = [...savedFuneralsList];

    // 검색 필터링
    if (completedFuneralsSearch.trim()) {
      const searchLower = completedFuneralsSearch.toLowerCase().trim();
      filteredFunerals = filteredFunerals.filter(funeral => {
        const chiefMourner = funeral.family_members?.find((m: any) => m.relation === '상주');
        return (
          funeral.deceased_name?.toLowerCase().includes(searchLower) ||
          funeral.deceased_hanja?.toLowerCase().includes(searchLower) ||
          funeral.burial_location?.toLowerCase().includes(searchLower) ||
          chiefMourner?.name?.toLowerCase().includes(searchLower) ||
          chiefMourner?.phone?.includes(searchLower)
        );
      });
    }

    // 정렬
    filteredFunerals.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (completedFuneralsSortBy) {
        case 'deceased_name':
          aValue = a.deceased_name || '';
          bValue = b.deceased_name || '';
          break;
        case 'funeral_time':
          aValue = a.funeral_time ? new Date(a.funeral_time).getTime() : 0;
          bValue = b.funeral_time ? new Date(b.funeral_time).getTime() : 0;
          break;
        case 'placement_time':
          aValue = a.placement_time ? new Date(a.placement_time).getTime() : 0;
          bValue = b.placement_time ? new Date(b.placement_time).getTime() : 0;
          break;
        case 'age':
          aValue = a.age || 0;
          bValue = b.age || 0;
          break;
        default:
          aValue = a.funeral_time ? new Date(a.funeral_time).getTime() : 0;
          bValue = b.funeral_time ? new Date(b.funeral_time).getTime() : 0;
      }

      if (completedFuneralsSortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    const allFunerals = filteredFunerals;

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">지난상가</h2>
          <div className="flex gap-2">
            <button
              onClick={() => loadSavedFuneralsList()}
              className="bg-slate-600 text-white px-4 py-2 rounded text-sm hover:bg-slate-700"
            >
              새로고침
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700"
              onClick={() => {
                alert('엑셀 다운로드 기능은 추후 구현 예정입니다.');
              }}
            >
              엑셀 다운로드
            </button>
          </div>
        </div>

        {/* 검색 및 정렬 컨트롤 */}
        <div className="mb-4 bg-white rounded-lg shadow p-4">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                placeholder="고인명, 한자명, 장지, 상주, 연락처로 검색..."
                value={completedFuneralsSearch}
                onChange={(e) => setCompletedFuneralsSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-gray-600">정렬:</span>
              <select
                value={completedFuneralsSortBy}
                onChange={(e) => setCompletedFuneralsSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
              >
                <option value="funeral_time">발인일시</option>
                <option value="placement_time">입실일시</option>
                <option value="deceased_name">고인명</option>
                <option value="age">나이</option>
              </select>
              <button
                onClick={() => setCompletedFuneralsSortOrder(completedFuneralsSortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium"
                title={completedFuneralsSortOrder === 'asc' ? '오름차순' : '내림차순'}
              >
                {completedFuneralsSortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {allFunerals.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {completedFuneralsSearch.trim() ? (
              <>
                <p className="mb-2">검색 결과가 없습니다.</p>
                <button
                  onClick={() => setCompletedFuneralsSearch('')}
                  className="text-purple-600 hover:underline text-sm"
                >
                  검색 초기화
                </button>
              </>
            ) : (
              '저장된 장례 정보가 없습니다.'
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">고인명</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">한자명</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">나이</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">성별</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">종교</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">빈소</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">입실일시</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">발인일시</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">장지</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">상주</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">연락처</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">액션</th>
                </tr>
              </thead>
              <tbody>
                {allFunerals.map((funeral, index) => {
                  const chiefMourner = funeral.family_members?.find((m: any) => m.relation === '상주');
                  const roomName = funeral.room_id ? funeral.room_id.replace('room-', '') + '빈소' : '-';
                  
                  return (
                    <tr key={funeral.id || index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                      <td className="px-4 py-3 text-sm font-medium">{funeral.deceased_name || '-'}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{funeral.deceased_hanja || '-'}</td>
                      <td className="px-4 py-3 text-sm">{funeral.age ? `${funeral.age}세` : '-'}</td>
                      <td className="px-4 py-3 text-sm text-center">{funeral.gender || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        {funeral.religion ? (
                          <span>
                            {getReligionSymbol(funeral.religion)} {funeral.religion}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">{roomName}</td>
                      <td className="px-4 py-3 text-sm text-xs">
                        {funeral.placement_time ? new Date(funeral.placement_time).toLocaleString('ko-KR', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-xs text-red-600 font-medium">
                        {funeral.funeral_time ? new Date(funeral.funeral_time).toLocaleString('ko-KR', {
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm">{funeral.burial_location || '-'}</td>
                      <td className="px-4 py-3 text-sm">{chiefMourner?.name || '-'}</td>
                      <td className="px-4 py-3 text-sm">{chiefMourner?.phone || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-2 justify-center">
                          <button
                            onClick={() => {
                              setSelectedFuneralForView(funeral);
                            }}
                            className="bg-slate-600 text-white px-3 py-1 rounded text-xs hover:bg-slate-700"
                          >
                            상세보기
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('이 장례 기록을 영구 삭제하시겠습니까?')) {
                                try {
                                  if (funeral.id) {
                                    await deleteFuneralAnnouncement(funeral.id);
                                    await loadSavedFuneralsList();
                                    alert('삭제되었습니다.');
                                  }
                                } catch (error) {
                                  console.error('삭제 실패:', error);
                                  alert('삭제에 실패했습니다.');
                                }
                              }
                            }}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            <div className="bg-gray-50 px-6 py-3 border-t">
              <p className="text-sm text-gray-600">
                {completedFuneralsSearch.trim() ? (
                  <>
                    검색 결과: <span className="font-bold text-blue-600">{allFunerals.length}</span>건
                    {' '}/ 전체: <span className="font-bold text-gray-600">{savedFuneralsList.length}</span>건
                  </>
                ) : (
                  <>
                    총 <span className="font-bold text-blue-600">{allFunerals.length}</span>건의 장례 기록
                  </>
                )}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 지난상가 상세보기 모달
  const renderFuneralViewModal = () => {
    if (!selectedFuneralForView) return null;

    const funeral = selectedFuneralForView;
    const chiefMourner = funeral.family_members?.find((m: any) => m.relation === '상주');

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg w-[900px] max-h-[90vh] overflow-y-auto">
          <div className="bg-slate-700 p-4 flex justify-between items-center sticky top-0">
            <h3 className="text-white font-bold text-xl">장례 정보 상세보기</h3>
            <button onClick={() => setSelectedFuneralForView(null)} className="text-white hover:bg-slate-600 p-1 rounded">
              <X size={24} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* 고인 정보 */}
            <div className="border rounded-lg p-4">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <FileText size={20} />
                고인 정보
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600 text-sm">고인명:</span>
                  <p className="font-medium text-lg">{funeral.deceased_name || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">한자명:</span>
                  <p className="font-medium">{funeral.deceased_hanja || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">나이:</span>
                  <p className="font-medium">{funeral.age ? `${funeral.age}세` : '-'}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">성별:</span>
                  <p className="font-medium">{funeral.gender || '-'}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">종교:</span>
                  <p className="font-medium">{funeral.religion ? `${funeral.religion} ${funeral.religion_title || ''}` : '-'}</p>
                </div>
                {funeral.baptismal_name && (
                  <div>
                    <span className="text-gray-600 text-sm">세례명:</span>
                    <p className="font-medium">{funeral.baptismal_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 일정 정보 */}
            <div className="border rounded-lg p-4">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Calendar size={20} />
                일정 정보
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600 text-sm">입실일시:</span>
                  <p className="font-medium">{funeral.placement_time ? new Date(funeral.placement_time).toLocaleString('ko-KR') : '-'}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">발인일시:</span>
                  <p className="font-medium text-red-600">{funeral.funeral_time ? new Date(funeral.funeral_time).toLocaleString('ko-KR') : '-'}</p>
                </div>
                {funeral.shroud_time && (
                  <div>
                    <span className="text-gray-600 text-sm">염습일시:</span>
                    <p className="font-medium">{new Date(funeral.shroud_time).toLocaleString('ko-KR')}</p>
                  </div>
                )}
                {funeral.casket_time && (
                  <div>
                    <span className="text-gray-600 text-sm">입관일시:</span>
                    <p className="font-medium">{new Date(funeral.casket_time).toLocaleString('ko-KR')}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 장례 정보 */}
            <div className="border rounded-lg p-4">
              <h4 className="font-bold text-lg mb-4 flex items-center gap-2">
                <MapPin size={20} />
                장례 정보
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-600 text-sm">장례 형태:</span>
                  <p className="font-medium">{funeral.burial_type === 'burial' ? '매장' : funeral.burial_type === 'cremation' ? '화장' : '-'}</p>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">장지:</span>
                  <p className="font-medium">{funeral.burial_location || '-'}</p>
                </div>
                {funeral.burial_location_2 && (
                  <div>
                    <span className="text-gray-600 text-sm">2차 장지:</span>
                    <p className="font-medium">{funeral.burial_location_2}</p>
                  </div>
                )}
                {funeral.death_cause && (
                  <div>
                    <span className="text-gray-600 text-sm">사망 원인:</span>
                    <p className="font-medium">{funeral.death_cause}</p>
                  </div>
                )}
                {funeral.death_place && (
                  <div>
                    <span className="text-gray-600 text-sm">사망 장소:</span>
                    <p className="font-medium">{funeral.death_place}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 유족 정보 */}
            {funeral.family_members && funeral.family_members.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-lg mb-4">유족 정보</h4>
                <div className="space-y-2">
                  {funeral.family_members.map((member: any, index: number) => (
                    <div key={index} className="flex gap-4 p-2 bg-gray-50 rounded">
                      <span className="font-medium w-20">{member.relation}</span>
                      <span>{member.name}</span>
                      <span className="text-gray-600">{member.phone}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 계좌 정보 */}
            {funeral.bank_accounts && funeral.bank_accounts.length > 0 && (
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-lg mb-4">계좌 정보</h4>
                <div className="space-y-2">
                  {funeral.bank_accounts.map((account: any, index: number) => (
                    <div key={index} className="flex gap-4 p-2 bg-gray-50 rounded">
                      <span className="font-medium">{account.bankName}</span>
                      <span>{account.accountNumber}</span>
                      <span className="text-gray-600">{account.accountHolder}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 기타 정보 */}
            {(funeral.funeral_director || funeral.funeral_company || funeral.deceased_note || funeral.business_note) && (
              <div className="border rounded-lg p-4">
                <h4 className="font-bold text-lg mb-4">기타 정보</h4>
                <div className="grid grid-cols-2 gap-4">
                  {funeral.funeral_director && (
                    <div>
                      <span className="text-gray-600 text-sm">장례지도사:</span>
                      <p className="font-medium">{funeral.funeral_director}</p>
                    </div>
                  )}
                  {funeral.funeral_company && (
                    <div>
                      <span className="text-gray-600 text-sm">장례주관:</span>
                      <p className="font-medium">{funeral.funeral_company}</p>
                    </div>
                  )}
                  {funeral.deceased_note && (
                    <div className="col-span-2">
                      <span className="text-gray-600 text-sm">고인 비고:</span>
                      <p className="font-medium whitespace-pre-wrap">{funeral.deceased_note}</p>
                    </div>
                  )}
                  {funeral.business_note && (
                    <div className="col-span-2">
                      <span className="text-gray-600 text-sm">업무 비고:</span>
                      <p className="font-medium whitespace-pre-wrap">{funeral.business_note}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t bg-gray-50 flex justify-end sticky bottom-0">
            <button
              onClick={() => setSelectedFuneralForView(null)}
              className="bg-slate-600 text-white px-6 py-2 rounded hover:bg-slate-700"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHygiene = () => (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm">기간</span>
          <label className="flex items-center gap-1">
            <input type="radio" name="period" defaultChecked />
            <span className="text-sm">발인</span>
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" name="period" />
            <span className="text-sm">입실</span>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">기간</span>
          <input type="date" defaultValue="2025-10-01" className="border rounded px-2 py-1 text-sm" />
          <span className="text-sm">부터</span>
          <input type="date" defaultValue="2025-10-04" className="border rounded px-2 py-1 text-sm" />
          <span className="text-sm">까지</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm">발인</span>
          <select className="border rounded px-2 py-1 text-sm">
            <option>전체</option>
          </select>
        </div>
        <button className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700">엑셀다운로드</button>
      </div>
      <div className="bg-white rounded shadow overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-blue-900 text-white">
            <tr>
              <th className="px-2 py-2 border border-gray-300">NO</th>
              <th className="px-2 py-2 border border-gray-300">처리일자</th>
              <th className="px-2 py-2 border border-gray-300">빈소</th>
              <th className="px-2 py-2 border border-gray-300">성명</th>
              <th className="px-2 py-2 border border-gray-300">성별</th>
              <th className="px-2 py-2 border border-gray-300">주민등록번호</th>
              <th className="px-2 py-2 border border-gray-300">사망일자</th>
              <th className="px-2 py-2 border border-gray-300">사망원인</th>
              <th className="px-2 py-2 border border-gray-300">사망장소</th>
              <th className="px-2 py-2 border border-gray-300">안치일자</th>
              <th className="px-2 py-2 border border-gray-300">약품처리</th>
              <th className="px-2 py-2 border border-gray-300">염습</th>
              <th className="px-2 py-2 border border-gray-300">장례주관</th>
              <th className="px-2 py-2 border border-gray-300">매장/화장</th>
              <th className="px-2 py-2 border border-gray-300">장지</th>
              <th className="px-2 py-2 border border-gray-300">상주이름</th>
              <th className="px-2 py-2 border border-gray-300">상주연락처</th>
              <th className="px-2 py-2 border border-gray-300">상주주소</th>
            </tr>
          </thead>
          <tbody>
            <tr className="bg-pink-100">
              <td className="px-2 py-2 border border-gray-300 text-center">1</td>
              <td className="px-2 py-2 border border-gray-300">2025-10-01</td>
              <td className="px-2 py-2 border border-gray-300">2빈소 (2층)</td>
              <td className="px-2 py-2 border border-gray-300">김상대</td>
              <td className="px-2 py-2 border border-gray-300 text-center">남</td>
              <td className="px-2 py-2 border border-gray-300">650101-1234567</td>
              <td className="px-2 py-2 border border-gray-300">2025-09-29</td>
              <td className="px-2 py-2 border border-gray-300">질병</td>
              <td className="px-2 py-2 border border-gray-300">자택</td>
              <td className="px-2 py-2 border border-gray-300">2025-09-30</td>
              <td className="px-2 py-2 border border-gray-300 text-center">O</td>
              <td className="px-2 py-2 border border-gray-300 text-center">O</td>
              <td className="px-2 py-2 border border-gray-300">삼성장례식장</td>
              <td className="px-2 py-2 border border-gray-300">화장</td>
              <td className="px-2 py-2 border border-gray-300">수원화장장</td>
              <td className="px-2 py-2 border border-gray-300">김철수</td>
              <td className="px-2 py-2 border border-gray-300">010-1234-5678</td>
              <td className="px-2 py-2 border border-gray-300">서울시 강남구</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderDetailModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-[800px] max-h-[90vh] overflow-y-auto">
        <div className="bg-slate-700 p-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">고인정보상세입력</h3>
          <button onClick={() => setShowDetailModal(false)} className="text-white"><X size={24} /></button>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-bold">■ 고인</h4>
              <div className="grid grid-cols-2 gap-2">
                <div><label className="text-sm block mb-1">고인이름</label><input type="text" className="w-full border rounded px-2 py-1 text-sm" /></div>
                <div><label className="text-sm block mb-1">주민번호</label><input type="text" className="w-full border rounded px-2 py-1 text-sm" /></div>
              </div>
            </div>
            <div className="space-y-3">
              <h4 className="font-bold">■ 상주정보</h4>
              <div><label className="text-sm block mb-1">상주이름</label><input type="text" className="w-full border rounded px-2 py-1 text-sm" /></div>
            </div>
          </div>
          <button onClick={() => setShowDetailModal(false)} className="w-full bg-slate-600 text-white py-3 rounded-lg mt-6">저장</button>
        </div>
      </div>
    </div>
  );

  // Render Reserve (예비) Page
  const renderReservePage = () => {
    return (
      <div className="bg-gray-50 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold">예비 - 임시 안치 등록</h2>
          <p className="text-sm text-gray-600 mt-1">
            정보가 불완전한 경우 임시로 등록합니다. 등록 후 "안치" 메뉴에서 관리할 수 있습니다.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h3 className="font-bold text-lg border-b pb-2">임시 안치 등록</h3>

          <div className="space-y-3">
            <div className="flex gap-2">
              <label className="text-sm w-32">고인명</label>
              <input
                type="text"
                value={enshrinedName}
                onChange={(e) => setEnshrinedName(e.target.value)}
                className="flex-1 border rounded px-2 py-1 text-sm"
                placeholder="미상인 경우 비워두세요"
              />
            </div>

            <div className="flex gap-2">
              <label className="text-sm w-32">안치일시</label>
              <input
                type="datetime-local"
                value={enshrinedTime}
                onChange={(e) => setEnshrinedTime(e.target.value)}
                className="flex-1 border rounded px-2 py-1 text-sm"
              />
            </div>

            <div className="border-t pt-3 mt-3">
              <h4 className="font-semibold text-sm mb-2">연락처 정보</h4>

              <div className="flex gap-2 mb-2">
                <label className="text-sm w-32">연락처명</label>
                <input
                  type="text"
                  value={enshrinedContactName}
                  onChange={(e) => setEnshrinedContactName(e.target.value)}
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  placeholder="담당자 이름"
                />
              </div>

              <div className="flex gap-2 mb-2">
                <label className="text-sm w-32">전화번호</label>
                <input
                  type="text"
                  value={enshrinedContactPhone}
                  onChange={(e) => setEnshrinedContactPhone(formatPhoneNumber(e.target.value))}
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  placeholder="010-0000-0000"
                />
              </div>

              <div className="flex gap-2">
                <label className="text-sm w-32">관계</label>
                <input
                  type="text"
                  value={enshrinedContactRelation}
                  onChange={(e) => setEnshrinedContactRelation(e.target.value)}
                  className="flex-1 border rounded px-2 py-1 text-sm"
                  placeholder="예: 아들, 친척"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <label className="text-sm w-32">비고</label>
              <textarea
                value={enshrinedNotes}
                onChange={(e) => setEnshrinedNotes(e.target.value)}
                className="flex-1 border rounded px-2 py-1 text-sm"
                rows={3}
                placeholder="특이사항, 대기 이유 등"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <button
              onClick={handleAddEnshrined}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              안치 등록
            </button>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg">최근 등록 목록</h3>
            <button
              onClick={loadEnshrinedList}
              className="text-sm text-blue-600 hover:underline"
            >
              새로고침
            </button>
          </div>

          {enshrinedList.length === 0 ? (
            <p className="text-gray-500 text-center py-4">등록된 안치가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {enshrinedList.slice(0, 5).map((item) => (
                <div key={item.id} className="border rounded p-3 hover:bg-gray-50">
                  <div className="flex justify-between">
                    <div>
                      <span className="font-semibold">{item.deceased_name || '미상'}</span>
                      <span className="text-sm text-gray-500 ml-2">
                        {new Date(item.created_at).toLocaleString('ko-KR')}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setCurrentPage('enshrined');
                        setActiveTab('안치');
                      }}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      전체보기 →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render Enshrined (안치) Page
  const renderEnshrinedPage = () => {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">안치 관리</h2>
            <p className="text-sm text-gray-600 mt-1">
              정보 수집 대기 중인 안치 목록
            </p>
          </div>
          <button
            onClick={loadEnshrinedList}
            className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-700"
          >
            새로고침
          </button>
        </div>

        {enshrinedList.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            안치 중인 고인이 없습니다.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">고인명</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">안치일시</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">연락처</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">전화번호</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">관계</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">비고</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold">액션</th>
                </tr>
              </thead>
              <tbody>
                {enshrinedList.map((item, index) => (
                  <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-4 py-3 text-sm font-medium">
                      {item.deceased_name || '미상'}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {item.enshrinement_time
                        ? new Date(item.enshrinement_time).toLocaleString('ko-KR')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm">{item.contact_name || '-'}</td>
                    <td className="px-4 py-3 text-sm">{item.contact_phone || '-'}</td>
                    <td className="px-4 py-3 text-sm">{item.contact_relation || '-'}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="max-w-xs truncate" title={item.notes}>
                        {item.notes || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleMoveToRoom(item)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          빈소로 이동
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('이 안치 정보를 삭제하시겠습니까?')) {
                              try {
                                await deleteEnshrined(item.id);
                                loadEnshrinedList();
                                alert('삭제되었습니다.');
                              } catch (error) {
                                console.error('삭제 실패:', error);
                                alert('삭제에 실패했습니다.');
                              }
                            }
                          }}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700"
                        >
                          삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderRoomDetail = (roomId: number) => {
    // Special handling for 예비 (Reserve room)
    if (roomId === 6) {
      return renderReservePage();
    }

    const room = rooms[roomId - 1];
    return (
      <div className="bg-gray-50 p-6">
        <div className="mb-4 flex items-center gap-2">
          <h2 className="text-xl font-bold">{room.name} {room.floor && `(${room.floor})`}</h2>
          <button onClick={() => setShowDetailModal(true)} className="bg-slate-600 text-white px-4 py-1 rounded text-sm hover:bg-slate-700">고인정보상세입력</button>
          <button 
            onClick={async (e) => {
              e.preventDefault();
              
              console.log('[부고장] 1. 시작');
              
              if (!deceasedName) {
                alert('고인 이름을 먼저 입력해주세요.');
                return;
              }
              
              const funeralHomeId = getFuneralHomeId();
              console.log('[부고장] 2. funeralHomeId:', funeralHomeId);
              
              if (!funeralHomeId) {
                alert('로그인이 필요합니다.');
                return;
              }
              
              try {
                const roomNumber = parseInt(currentPage.split('-')[1]);
                console.log('[부고장] 3. roomNumber:', roomNumber);
                
                const funeralData = {
                  funeral_home_id: funeralHomeId,
                  room_number: roomNumber,
                  deceased_name: deceasedName,
                  deceased_hanja: deceasedNameHanja,
                  age: deceasedAge ? parseInt(deceasedAge) : null,
                  gender: deceasedGender,
                  religion: religion,
                  religion_title: religionTitle,
                  placement_time: placementTime || null,
                  casket_time: casketTime || null,
                  shroud_time: shroudTime || null,
                  funeral_time: funeralTime || null,
                  checkout_time: checkoutTime || null,
                  death_time: deathTime || null,
                  placement_date: placementDate || null,
                  burial_type: burialType,
                  burial_location: burialLocation,
                  burial_location_2: burialLocation2,
                  death_cause: deathCause,
                  death_place: deathPlace,
                  chemical_treatment: chemicalTreatment,
                  deceased_address: deceasedAddress,
                  deceased_note: deceasedNote,
                  resident_number: residentNumberFront && residentNumberBack
                    ? `${residentNumberFront}-${residentNumberBack}`
                    : residentNumber,
                  baptismal_name: baptismalName,
                  other_title: otherTitle,
                  business_note: businessNote,
                  funeral_director: funeralDirector,
                  funeral_company: funeralCompany,
                  bank_accounts: bankAccounts.filter(a => a.bankName || a.accountNumber || a.accountHolder),
                  use_photo_in_obituary: usePhotoInObituary,
                  chief_message: chiefMournerMessage,
                  photo_url: deceasedPhoto,
                  family_members: familyMembers,
                  status: 'active' as const
                };
                
                console.log('[부고장] 4. 저장 시도');
                const saved = await saveFuneral(funeralData);
                console.log('[부고장] 5. 저장 결과:', saved);
                
                if (saved?.id) {
                  const url = `/obituary/modern?id=${saved.id}`;
                  console.log('[부고장] 6. 열 URL:', url);
                  const newWindow = window.open(url, '_blank');
                  if (!newWindow) {
                    alert('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
                  }
                } else {
                  console.error('[부고장] 7. ID 없음:', saved);
                  alert('저장은 되었으나 ID를 받지 못했습니다. 다시 시도해주세요.');
                }
              } catch (error) {
                console.error('[부고장] ERROR:', error);
                alert('부고장을 열 수 없습니다: ' + (error as Error).message);
              }
            }} 
            className="bg-purple-700 text-white px-4 py-1 rounded text-sm hover:bg-purple-800"
            type="button"
          >
            부고장미리보기
          </button>
          {room.status === 'available' ? (
            <button onClick={() => handleCheckIn(roomId)} className="bg-green-600 text-white px-4 py-1 rounded text-sm hover:bg-green-700">입실</button>
          ) : (
            <button onClick={() => handleCheckOut(roomId)} className="bg-orange-600 text-white px-4 py-1 rounded text-sm hover:bg-orange-700">퇴실</button>
          )}
          <select 
            value={selectedMoveRoom} 
            onChange={(e) => setSelectedMoveRoom(e.target.value)}
            className="border rounded px-3 py-1 text-sm ml-auto"
          >
            <option value="">이동할 빈소를 선택해주세요</option>
            {rooms.filter(r => r.id !== roomId && r.id <= 5).map(r => (
              <option key={r.id} value={r.id}>
                {r.name} {r.floor && `(${r.floor})`} {r.status === 'occupied' ? '- 사용중' : ''}
              </option>
            ))}
          </select>
          <button 
            onClick={() => handleMoveRoom(roomId)}
            className="bg-slate-600 text-white px-4 py-1 rounded text-sm hover:bg-slate-700"
          >
            빈소이동
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="font-bold">■ 고인</div>
            <div className="flex gap-2 items-center">
              <label className="text-sm w-24">입실시간</label>
              <input type="datetime-local" value={placementTime} 
                onChange={(e) => {
                  setPlacementTime(e.target.value);
                  setPlacementDate(e.target.value);
                }} 
                className="flex-1 border rounded px-2 py-1 text-sm" 
              />
              <button onClick={setCurrentTime} className="px-3 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300 whitespace-nowrap">현재시간</button>
              <button onClick={() => calculateFuneralDate(3)} className="px-3 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">3일장</button>
              <button onClick={() => calculateFuneralDate(4)} className="px-3 py-1 bg-gray-200 rounded text-xs hover:bg-gray-300">4일장</button>
            </div>
            <div className="flex gap-2"><label className="text-sm w-24">고인이름 *</label><input type="text" value={deceasedName} onChange={(e) => setDeceasedName(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
            <div className="flex gap-2"><label className="text-sm w-24">한자명</label><input type="text" value={deceasedNameHanja} onChange={(e) => setDeceasedNameHanja(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
            <div className="flex gap-2"><label className="text-sm w-24">세례명 외</label><input type="text" value={baptismalName} onChange={(e) => setBaptismalName(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
            <div className="flex gap-2"><label className="text-sm w-24">고인나이</label><input type="text" value={deceasedAge} onChange={(e) => setDeceasedAge(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" placeholder="예: 75" /></div>
            <div className="flex gap-2">
              <label className="text-sm w-24">고인성별</label>
              <select 
                value={deceasedGender} 
                onChange={(e) => setDeceasedGender(e.target.value)} 
                className="flex-1 border rounded px-2 py-1 text-sm"
              >
                <option value="">--선택--</option>
                <option value="남">남</option>
                <option value="여">여</option>
              </select>
            </div>
            <div className="flex gap-2">
              <label className="text-sm w-24">종교</label>
              <select 
                value={religion} 
                onChange={(e) => handleReligionChange(e.target.value)} 
                className="border rounded px-2 py-1 text-sm mr-2"
              >
                <option value="">종교선택</option>
                <option value="불교">불교</option>
                <option value="기독교">기독교</option>
                <option value="천주교">천주교</option>
                <option value="원불교">원불교</option>
                <option value="유교">유교</option>
                <option value="무교">무교</option>
              </select>
              <select 
                value={religionTitle} 
                onChange={(e) => setReligionTitle(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
                disabled={!religion || religionTitles[religion]?.length === 0}
              >
                <option value="">{religion ? religionDeathTerms[religion] : '별세'}</option>
                {religion && religionTitles[religion]?.map((title) => (
                  <option key={title} value={title}>{title}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2"><label className="text-sm w-24">기타대우</label><input type="text" value={otherTitle} onChange={(e) => setOtherTitle(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
            <div className="flex gap-2"><label className="text-sm w-24">염습시간</label><input type="datetime-local" value={shroudTime} onChange={(e) => setShroudTime(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
            <div className="flex gap-2"><label className="text-sm w-24">입관시간</label><input type="datetime-local" value={casketTime} onChange={(e) => setCasketTime(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
            <div className="flex gap-2"><label className="text-sm w-24">발인시간</label><input type="datetime-local" value={funeralTime} onChange={(e) => {setFuneralTime(e.target.value); setCheckoutTime(e.target.value);}} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
            <div className="flex gap-2"><label className="text-sm w-24">퇴실시간</label><input type="datetime-local" value={checkoutTime} onChange={(e) => setCheckoutTime(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm text-gray-500" /></div>
            <div className="flex gap-2">
              <label className="text-sm w-24">1차장지</label>
              <input 
                type="text" 
                value={burialLocation} 
                onChange={(e) => setBurialLocation(e.target.value)} 
                className="flex-1 border rounded px-2 py-1 text-sm" 
                placeholder="예: 원주시 문막 선영"
              />
            </div>
            <div className="flex gap-2">
              <label className="text-sm w-24">2차장지</label>
              <input 
                type="text" 
                value={burialLocation2} 
                onChange={(e) => setBurialLocation2(e.target.value)} 
                className="flex-1 border rounded px-2 py-1 text-sm" 
                placeholder="예: 영동 화장장"
              />
            </div>
            <div>
              <label className="text-sm block mb-1">고인 사진</label>
              <input
                type="file"
                id="photo-upload"
                key={deceasedPhoto || 'photo-upload-key'}
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <label 
                htmlFor="photo-upload" 
                className="inline-block bg-slate-700 text-white px-4 py-2 rounded text-sm mb-2 cursor-pointer hover:bg-slate-600"
              >
                사진 등록
              </label>
              {deceasedPhoto && (
                <button 
                  onClick={handlePhotoRemove}
                  className="ml-2 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                >
                  사진 삭제
                </button>
              )}
              <div className="w-32 h-40 border rounded bg-gray-100 overflow-hidden mt-2">
                {deceasedPhoto ? (
                  <img 
                    src={deceasedPhoto} 
                    alt="고인 사진" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    사진 없음
                  </div>
                )}
              </div>
            </div>
            <div className="pt-4 border-t space-y-3">
              <div className="flex gap-2 items-center">
                <label className="text-sm w-24">주민번호</label>
                <input
                  type="text"
                  value={residentNumberFront}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
                    setResidentNumberFront(value);
                    // Auto-focus to next field when 6 digits entered
                    if (value.length === 6) {
                      residentNumberBackRef.current?.focus();
                    }
                  }}
                  className="border rounded px-2 py-1 text-sm w-24"
                  placeholder="950101"
                  maxLength={6}
                />
                <span className="text-gray-500">-</span>
                <input
                  ref={residentNumberBackRef}
                  type="text"
                  value={residentNumberBack}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, '').slice(0, 7);
                    setResidentNumberBack(value);
                  }}
                  className="border rounded px-2 py-1 text-sm w-28"
                  placeholder="1234567"
                  maxLength={7}
                />
              </div>
              <div className="flex gap-2"><label className="text-sm w-24">안치일시</label><input type="datetime-local" value={placementDate} onChange={(e) => setPlacementDate(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
              <div className="flex gap-2"><label className="text-sm w-24">사망일시</label><input type="datetime-local" value={deathTime} onChange={(e) => setDeathTime(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
              <div className="flex gap-2"><label className="text-sm w-24">사망원인</label><input type="text" value={deathCause} onChange={(e) => setDeathCause(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" placeholder="예: 노환, 질병" /></div>
              <div className="flex gap-2"><label className="text-sm w-24">사망장소</label><input type="text" value={deathPlace} onChange={(e) => setDeathPlace(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" placeholder="예: 자택, 병원" /></div>
              <div>
                <label className="text-sm block mb-1">매장/화장</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="burial" 
                      value="burial"
                      checked={burialType === 'burial'}
                      onChange={() => setBurialType('burial')}
                      className="w-4 h-4"
                    /> 
                    <span>매장</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="burial" 
                      value="cremation"
                      checked={burialType === 'cremation'}
                      onChange={() => setBurialType('cremation')}
                      className="w-4 h-4"
                    /> 
                    <span>화장</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-sm block mb-1">약품처리</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="chemical" 
                      value="yes"
                      checked={chemicalTreatment === 'yes'}
                      onChange={() => setChemicalTreatment('yes')}
                      className="w-4 h-4"
                    /> 
                    <span>화인</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="radio" 
                      name="chemical" 
                      value="no"
                      checked={chemicalTreatment === 'no'}
                      onChange={() => setChemicalTreatment('no')}
                      className="w-4 h-4"
                    /> 
                    <span>미처리</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-2"><label className="text-sm w-24">고인주소</label><input type="text" value={deceasedAddress} onChange={(e) => setDeceasedAddress(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" /></div>
              <div className="flex gap-2"><label className="text-sm w-24">고인비고</label><textarea value={deceasedNote} onChange={(e) => setDeceasedNote(e.target.value)} className="flex-1 border rounded px-2 py-1 text-sm" rows={3}></textarea></div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold">■ 유가족</div>
                <div className="flex gap-2 text-sm">
                  <button onClick={addFamilyMember} className="text-blue-600 hover:text-blue-800">+ 추가</button>
                </div>
              </div>
              <div className="space-y-2">
                {getSortedFamilyMembers().map((member) => (
                  <div key={member.id} className="flex items-center gap-2">
                    <select 
                      value={member.relation} 
                      onChange={(e) => updateFamilyMember(member.id, 'relation', e.target.value)}
                      className="border rounded px-2 py-1 text-sm w-24"
                    >
                      <option value="">관계</option>
                      <option value="상주">상주</option>
                      <option value="배우자">배우자</option>
                      <option value="아들">아들</option>
                      <option value="딸">딸</option>
                      <option value="며느리">며느리</option>
                      <option value="사위">사위</option>
                      <option value="손">손</option>
                      <option value="손자">손자</option>
                      <option value="손녀">손녀</option>
                      <option value="형제">형제</option>
                      <option value="자매">자매</option>
                    </select>
                    <input 
                      type="text" 
                      value={member.name}
                      onChange={(e) => updateFamilyMember(member.id, 'name', e.target.value)}
                      placeholder="이름" 
                      className="border rounded px-2 py-1 text-sm flex-1" 
                    />
                    <input
                      type="text"
                      value={member.phone}
                      onChange={(e) => updateFamilyMember(member.id, 'phone', formatPhoneNumber(e.target.value))}
                      placeholder="연락처 (010-0000-0000)"
                      className="border rounded px-2 py-1 text-sm w-36"
                    />
                    {familyMembers.length > 1 && (
                      <button 
                        onClick={() => removeFamilyMember(member.id)}
                        className="text-red-600 hover:text-red-800 text-sm px-2"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold">■ 부의금 계좌정보</div>
                <button 
                  onClick={addBankAccount} 
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  + 계좌 추가
                </button>
              </div>
              <div className="bg-blue-50 p-3 rounded-lg space-y-3">
                {bankAccounts.map((account, index) => (
                  <div key={account.id} className="space-y-2 pb-3 border-b border-blue-200 last:border-b-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-gray-700">
                        계좌 {index + 1}
                      </span>
                      {bankAccounts.length > 1 && (
                        <button 
                          onClick={() => removeBankAccount(account.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <label className="text-sm w-24">은행명</label>
                      <input 
                        type="text" 
                        value={account.bankName} 
                        onChange={(e) => updateBankAccount(account.id, 'bankName', e.target.value)} 
                        className="flex-1 border rounded px-2 py-1 text-sm" 
                        placeholder="예: 농협은행"
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="text-sm w-24">계좌번호</label>
                      <input 
                        type="text" 
                        value={account.accountNumber} 
                        onChange={(e) => updateBankAccount(account.id, 'accountNumber', e.target.value)} 
                        className="flex-1 border rounded px-2 py-1 text-sm" 
                        placeholder="예: 123-4567-8901-23"
                      />
                    </div>
                    <div className="flex gap-2">
                      <label className="text-sm w-24">예금주</label>
                      <input 
                        type="text" 
                        value={account.accountHolder} 
                        onChange={(e) => updateBankAccount(account.id, 'accountHolder', e.target.value)} 
                        className="flex-1 border rounded px-2 py-1 text-sm" 
                        placeholder="예: 홍길동(상주)"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="font-bold mb-2">■ 모바일부고장</div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">사진사용</span>
                <input 
                  type="checkbox" 
                  className="w-4 h-4" 
                  checked={usePhotoInObituary}
                  onChange={(e) => setUsePhotoInObituary(e.target.checked)}
                />
              </div>
              <div><label className="text-sm block mb-1">상주말씀</label><textarea value={chiefMournerMessage} onChange={(e) => setChiefMournerMessage(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" rows={3} placeholder="모바일 부고장에 남길 상주 말씀을 입력하세요."></textarea></div>
            </div>
            <div className="border-t pt-4">
              <div className="font-bold mb-2">■ 업무현황</div>
              <div className="flex gap-4 text-sm items-center mb-3">
                <span className="font-semibold">정보</span>
                <label className="flex items-center gap-1">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>사인</span>
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>진단</span>
                </label>
                <label className="flex items-center gap-1">
                  <input type="checkbox" className="w-4 h-4" />
                  <span>검사</span>
                </label>
              </div>
              <div className="space-y-3">
                <div><label className="text-sm block mb-1">업무비고</label><textarea value={businessNote} onChange={(e) => setBusinessNote(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" rows={2}></textarea></div>
                <div><label className="text-sm block mb-1">장례주관</label><input type="text" value={funeralCompany} onChange={(e) => setFuneralCompany(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" /></div>
                <div><label className="text-sm block mb-1">장례지도사</label><input type="text" value={funeralDirector} onChange={(e) => setFuneralDirector(e.target.value)} className="w-full border rounded px-2 py-1 text-sm" /></div>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <button onClick={handleSaveRoomInfo} className="flex-1 bg-slate-600 text-white py-2 rounded hover:bg-slate-700">저장</button>
              <button onClick={handleReset} className="flex-1 bg-gray-500 text-white py-2 rounded hover:bg-gray-600">초기화</button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 현황판 렌더링 - 개선된 버전
  const renderDashboard = () => {
    // 가족 구성원을 관계별로 그룹화하는 함수
    const groupFamilyByRelation = (familyMembers: any[]) => {
      const grouped: { [key: string]: string[] } = {};
      familyMembers?.forEach((member: any) => {
        if (member.relation && member.name) {
          if (!grouped[member.relation]) {
            grouped[member.relation] = [];
          }
          grouped[member.relation].push(member.name);
        }
      });
      return grouped;
    };

    // 현재 날짜와 시간
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long' 
    });
    const timeStr = currentDate.toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return (
      <div className="bg-gray-900 flex flex-col">
        {/* Top Header */}
        <div className="bg-slate-800 text-white px-8 py-3 shadow-lg">
          <div className="max-w-screen-2xl mx-auto flex justify-between items-center">
            <h1 className="text-2xl font-bold">영동병원장례식장</h1>
            <div className="text-lg">
              {dateStr} {timeStr}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-1">
          <div className="max-w-screen-2xl mx-auto">
            {/* Search Bar */}
            <div className="mb-1 bg-white p-2 rounded-lg shadow-sm">
              <div className="flex items-center gap-4">
                <input 
                  type="text" 
                  placeholder="상주검색" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                  className="border rounded px-3 py-2 text-sm w-64" 
                />
                <button className="bg-slate-700 text-white px-4 py-2 rounded text-sm hover:bg-slate-800">
                  <Search size={16} className="inline mr-1" />
                  검색
                </button>
                <button 
                  onClick={() => loadAllRoomsData()} 
                  className="ml-auto bg-slate-600 text-white px-4 py-2 rounded text-sm hover:bg-slate-700"
                >
                  새로고침
                </button>
                <button 
                  onClick={() => {
                    window.open('/status-board', '_blank', 'fullscreen=yes');
                  }}
                  className="bg-purple-700 text-white px-4 py-2 rounded text-sm hover:bg-purple-800"
                >
                  현황판보기
                </button>
              </div>
            </div>

            {/* 빈소 카드 - 3x2 그리드 (6개 빈소) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {rooms.map(room => {
                const roomKey = `room-${room.id}`;
                const funeralData = roomFunerals[roomKey];
                const isOccupied = !!funeralData;
                const familyGroups = funeralData ? groupFamilyByRelation(funeralData.family_members) : {};
                
                // 현재 시간 (대한민국 표준시)
                const now = new Date();
                const month = now.getMonth() + 1;
                const date = now.getDate();
                const dayNames = ['일','월','화','수','목','금','토'];
                const dayOfWeek = dayNames[now.getDay()];
                const hours = now.getHours();
                const minutes = now.getMinutes();
                const period = hours < 12 ? '오전' : '오후';
                const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
                const dateStr = `${month}월 ${date}일 (${dayOfWeek}) ${period} ${displayHours}:${minutes.toString().padStart(2, '0')}`;

                return (
                  <div
                    key={room.id}
                    className="bg-white rounded-lg overflow-hidden shadow-2xl cursor-pointer"
                    onClick={() => {
                      if (room.floor) {
                        setCurrentPage(`room-${room.id}`);
                        setActiveTab('현황판');
                      }
                    }}
                    style={{ border: '3px solid #475569', minWidth: '520px' }}
                  >
                    {/* Top Header - 컴팩트 */}
                    <div className="bg-slate-700 text-white px-4 py-3 flex justify-between items-center">
                      <div>
                        <div className="text-sm">의료법인 조은의료재단</div>
                        <div className="text-xl font-bold">영동병원장례식장</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-base">{dateStr}</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/status-board?room=room-${room.id}&funeral_home_id=${getFuneralHomeId()}`, '_blank', 'fullscreen=yes');
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors"
                        >
                          현황판
                        </button>
                      </div>
                    </div>
                    
                    {/* Room and Deceased info bar - 컴팩트 */}
                    <div className="bg-slate-600 text-white px-4 py-3.5">
                      <div className="flex items-center gap-4">
                        <div className="bg-purple-900/30 px-5 py-2 rounded">
                          <span className="text-xl font-bold">{room.name} ({room.floor || ''})</span>
                        </div>
                        {isOccupied && funeralData && (
                          <div className="flex items-center gap-2">
                            {funeralData.religion && getReligionSymbol(funeralData.religion) && (
                              <span className="text-red-400 text-xl">{getReligionSymbol(funeralData.religion)}</span>
                            )}
                            <span className="text-xl font-bold">
                              故 {funeralData.deceased_name}
                              {funeralData.religion_title && ` (${funeralData.religion_title})`}
                              {funeralData.age && funeralData.gender && ` (${funeralData.gender}/${funeralData.age}세)`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Main Content - 높이 축소 */}
                    <div className="bg-gray-100">
                      {isOccupied && funeralData ? (
                        <div className="flex">
                          {/* Photo section - 축소 */}
                          <div className="w-48 p-5 bg-white">
                            {funeralData.photo_url ? (
                              <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden shadow-lg">
                                <img 
                                  src={funeralData.photo_url} 
                                  alt="영정사진" 
                                  className="w-full h-full object-cover"
                                />
                            </div>
                            ) : (
                              <div className="w-full h-48 bg-gray-300 rounded-lg flex items-center justify-center">
                                <span className="text-gray-500 text-base">영정사진</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Family info - 컴팩트 */}
                          <div className="flex-1 p-5 bg-white">
                            {Object.keys(familyGroups).length > 0 && (
                              <div className="space-y-3">
                                {Object.entries(familyGroups).map(([relation, names]) => (
                                  <div key={relation} className="flex items-start text-base">
                                    <span className="font-bold min-w-[80px]">{relation}</span>
                                    <span className="text-xl font-bold mx-2">:</span>
                                    <span className="text-gray-800">{names.join(', ')}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-28 bg-white">
                          <div className="text-center">
                            <div className="text-gray-300 text-5xl mb-3">🕊️</div>
                            <p className="text-gray-400 text-xl font-medium">공실</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Schedule section - 컴팩트 */}
                    {isOccupied && funeralData && (
                      <div className="flex border-t-2 border-slate-700">
                        <div className="flex-1 bg-white border-r border-gray-300">
                          <div className="bg-slate-700 text-white text-center py-3">
                            <span className="text-base font-bold">입 관</span>
                          </div>
                          <div className="text-center py-3 text-sm">
                            {funeralData.casket_time ? formatScheduleDate(funeralData.casket_time) : '시간미정'}
                          </div>
                        </div>
                        <div className="flex-1 bg-white border-r border-gray-300">
                          <div className="bg-slate-700 text-white text-center py-3">
                            <span className="text-base font-bold">발 인</span>
                          </div>
                          <div className="text-center py-3 text-sm">
                            {funeralData.funeral_time ? formatScheduleDate(funeralData.funeral_time) : '시간미정'}
                          </div>
                        </div>
                        <div className="flex-1 bg-white">
                          <div className="bg-slate-700 text-white text-center py-3">
                            <span className="text-base font-bold">장 지</span>
                          </div>
                          <div className="text-center py-3 text-sm px-2">
                            {funeralData.burial_type === 'cremation' ? '화장' : (funeralData.burial_location || '미정')}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Bottom Footer - 컴팩트 */}
                    <div className="bg-gray-200 text-gray-700 text-sm">
                      <div className="px-4 py-2">
                        영동병원장례식장: 충청북도 영동군 영동읍 대학로 106 (설계리, 영동병원), 043-743-4499
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="bg-slate-800 text-white px-8 py-3">
          <div className="max-w-screen-2xl mx-auto text-center">
            <p className="text-sm">
              영동병원장례식장 | 충청북도 영동군 영동읍 대학로 106 (설계리, 영동병원) | ☎ 043-743-4493
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex bg-gray-100 min-h-screen">
      <div className="w-64 bg-gray-800 text-white p-4 overflow-y-auto">
        <div className="mb-8">
          <p className="text-xs text-gray-400 mb-2">의료법인 조은의료재단</p>
          <h2 className="text-2xl font-bold mb-1">영동병원</h2>
          <h3 className="text-2xl font-bold">장례식장</h3>
        </div>
        <nav className="space-y-1">
          {/* 대시보드 섹션 */}
          <div className="mb-4">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              📊 대시보드
            </div>
            <button
              onClick={() => {
                setCurrentPage('dashboard');
                setActiveTab('현황판');
              }}
              className={`w-full text-left px-4 py-2 rounded text-sm ${currentPage === 'dashboard' ? 'bg-slate-600' : 'hover:bg-gray-700'}`}
            >
              현황판
            </button>
          </div>

          {/* 빈소 관리 섹션 */}
          <div className="mb-4">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              🏠 빈소 관리
            </div>
            {roomMenuItems.map(room => {
              const roomKey = room.id;
              const hasData = !!roomFunerals[roomKey];
              return (
                <button
                  key={room.id}
                  onClick={() => {
                    setCurrentPage(room.id);
                    setActiveTab('현황판');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2 rounded text-sm ${currentPage === room.id ? 'bg-slate-600' : 'hover:bg-gray-700'}`}
                >
                  <span>{room.label}</span>
                  <span className={`w-2 h-2 rounded-full ${hasData ? 'bg-red-400' : 'bg-green-400'}`}></span>
                </button>
              );
            })}
          </div>

          {/* 안치 관리 섹션 */}
          <div className="mb-4">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              ⚰️ 안치 관리
            </div>
            <button
              onClick={() => {
                setCurrentPage('room-6');
                setActiveTab('현황판');
              }}
              className={`w-full text-left px-4 py-2 rounded text-sm ${currentPage === 'room-6' ? 'bg-slate-600' : 'hover:bg-gray-700'}`}
            >
              예비 (임시등록)
            </button>
            <button
              onClick={() => {
                setCurrentPage('enshrined');
                setActiveTab('안치');
                loadEnshrinedList();
              }}
              className={`w-full text-left px-4 py-2 rounded text-sm ${currentPage === 'enshrined' ? 'bg-slate-600' : 'hover:bg-gray-700'}`}
            >
              안치 (관리)
            </button>
          </div>

          {/* 기록 관리 섹션 */}
          <div className="mb-4">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              📁 기록 관리
            </div>
            <button
              onClick={() => {
                setCurrentPage('saved');
                setActiveTab('현황판');
              }}
              className={`w-full text-left px-4 py-2 rounded text-sm ${currentPage === 'saved' ? 'bg-slate-600' : 'hover:bg-gray-700'}`}
            >
              저장된 장례정보
            </button>
            <button
              onClick={() => {
                setCurrentPage('dashboard');
                setActiveTab('지난상가');
              }}
              className={`w-full text-left px-4 py-2 rounded text-sm ${activeTab === '지난상가' && currentPage === 'dashboard' ? 'bg-slate-600' : 'hover:bg-gray-700'}`}
            >
              지난상가
            </button>
            <button
              onClick={() => setCurrentPage('hygiene')}
              className={`w-full text-left px-4 py-2 rounded text-sm ${currentPage === 'hygiene' ? 'bg-slate-600' : 'hover:bg-gray-700'}`}
            >
              위생처리관리대장
            </button>
          </div>

          {/* 설정 섹션 */}
          <div className="mb-4">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              ⚙️ 설정
            </div>
            <button
              onClick={() => router.push('/settings')}
              className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded text-sm flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              <span>설정</span>
            </button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-700 rounded text-sm">
              환경설정
            </button>
          </div>
        </nav>
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderTabHeader()}
        <div className="flex-1 overflow-y-auto">
          {currentPage === 'hygiene' ? renderHygiene() :
           currentPage === 'saved' ? renderSavedFunerals() :
           currentPage === 'enshrined' ? renderEnshrinedPage() :
           activeTab === '지난상가' ? renderCompletedFunerals() :
           currentPage.startsWith('room-') ? renderRoomDetail(parseInt(currentPage.split('-')[1])) : renderDashboard()}
        </div>
      </div>
      {showDetailModal && renderDetailModal()}
      {selectedFuneralForView && renderFuneralViewModal()}
    </div>
  );
}