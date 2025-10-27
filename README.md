# 장례식장 관리 시스템

Next.js + Supabase 기반 장례식장 관리 시스템입니다.

## 설치 방법

```bash
cd C:\work_station\장례식장\funeral-admin
npm install
```

## 환경 변수 설정

`.env.local` 파일에 Supabase 정보를 입력하세요:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## Supabase 데이터베이스 스키마

```sql
-- Rooms 테이블
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  floor TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  current_funeral_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Funerals 테이블
CREATE TABLE funerals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  deceased_name TEXT NOT NULL,
  deceased_hanja TEXT,
  age INTEGER,
  gender TEXT,
  date_of_death DATE NOT NULL,
  photo_url TEXT,
  religion TEXT,
  room_id UUID REFERENCES rooms(id),
  chief_mourner_name TEXT NOT NULL,
  chief_mourner_phone TEXT NOT NULL,
  chief_mourner_message TEXT,
  funeral_date DATE NOT NULL,
  placement_date TIMESTAMP NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Flower Orders 테이블
CREATE TABLE flower_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funeral_id UUID REFERENCES funerals(id),
  sender_name TEXT NOT NULL,
  sender_phone TEXT NOT NULL,
  flower_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  message TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Donations 테이블
CREATE TABLE donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  funeral_id UUID REFERENCES funerals(id),
  sender_name TEXT NOT NULL,
  sender_phone TEXT,
  amount INTEGER NOT NULL,
  message TEXT,
  payment_status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 실행 방법

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 주요 기능

- 현황판: 빈소 상태 관리
- 고인 관리: 고인 정보 입력 및 관리
- 위생처리관리대장: 위생 처리 기록
- 화환 관리: 화환 주문 관리
- 부의금 관리: 부의금 내역 관리

## 기술 스택

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- Supabase
- Lucide React (아이콘)
