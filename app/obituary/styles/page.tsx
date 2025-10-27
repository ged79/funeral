'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function ObituaryStyleSelector() {
  const [obituaryData, setObituaryData] = useState<any>(null);

  useEffect(() => {
    // SessionStorage에서 데이터 불러오기
    console.log('=== 스타일 선택 페이지 ===');
    try {
      const savedData = sessionStorage.getItem('obituaryPreview');
      console.log('1. SessionStorage 데이터:', savedData ? '있음' : '없음');
      if (savedData) {
        const data = JSON.parse(savedData);
        setObituaryData(data);
        console.log('2. 데이터:', data.deceasedName);
      } else {
        console.warn('⚠️ 스타일 선택 페이지에 데이터 없음!');
      }
    } catch (error) {
      console.error('데이터 불러오기 실패:', error);
    }
  }, []);
  const styles = [
    {
      id: 'modern',
      name: '모던 스타일',
      description: '세련되고 깔끔한 카드형 디자인',
      preview: '/preview-modern.jpg',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'classic',
      name: '클래식 스타일',
      description: '전통적이고 격식있는 디자인',
      preview: '/preview-classic.jpg',
      color: 'from-gray-700 to-gray-900'
    },
    {
      id: 'elegant',
      name: '우아한 스타일',
      description: '부드럽고 따뜻한 감성 디자인',
      preview: '/preview-elegant.jpg',
      color: 'from-amber-600 to-orange-700'
    },
    {
      id: 'minimal',
      name: '미니멀 스타일',
      description: '심플하고 정제된 디자인',
      preview: '/preview-minimal.jpg',
      color: 'from-slate-600 to-slate-800'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">부고장 스타일 선택</h1>
          <p className="text-gray-600">고인을 추모하는 마음을 담아 적합한 디자인을 선택해주세요</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {styles.map((style) => (
            <Link 
              key={style.id} 
              href={`/obituary/${style.id}`}
              onClick={() => {
                // 링크 클릭 시 SessionStorage 데이터 유지 (다음 페이지에서 사용)
                console.log('=== 스타일 선택:', style.id, '===');
                const check = sessionStorage.getItem('obituaryPreview');
                console.log('스타일 클릭 시 데이터 확인:', check ? '데이터 유지됨' : '데이터 없음!');
              }}
            >
              <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer group">
                <div className={`h-48 bg-gradient-to-br ${style.color} flex items-center justify-center relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                  <div className="relative z-10 text-white text-center">
                    <div className="text-6xl mb-4">🕯️</div>
                    <h3 className="text-2xl font-bold">{style.name}</h3>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-gray-600 text-center">{style.description}</p>
                  <div className="mt-4 text-center">
                    <span className="text-blue-600 group-hover:text-blue-700 font-medium">
                      미리보기 →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
