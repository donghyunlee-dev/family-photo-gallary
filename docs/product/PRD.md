# 🏠 가족사진관 — Product Requirements Document (PRD)

> AI 개발 에이전트를 위한 마스터 문서. 이 파일을 기준으로 매 세션 개발 컨텍스트를 복원한다.

---

## 📌 제품 개요

**제품명:** 가족사진관  
**목적:** 가족이 Google Drive 기반 사진 공간에 사진을 올리고, 감성적 갤러리로 함께 감상하는 모바일 중심 웹사이트  
**MVP 정의:** 3개 사진방 운영, 6자리 번호 입장, Google Drive 연동, 감성 갤러리, KakaoMap 지도 보기

### 핵심 철학

> 관리가 아닌 공유와 감상.  
> 파일 탐색기가 아닌 가족 앨범.  
> 로그인이 아닌 6자리 번호.

---

## 🗂️ 현재 개발 진행 상태

| 단계 | 이름 | 상태 |
|------|------|------|
| Phase 1 | 프로젝트 셋업 & 디자인 시스템 | ⬜ 대기 |
| Phase 2 | 입장 화면 (6자리 번호) | ⬜ 대기 |
| Phase 3 | Google Drive API 연동 레이어 | ⬜ 대기 |
| Phase 4 | 사진방 홈 & 감성 갤러리 | ⬜ 대기 |
| Phase 5 | 폴더 목차 화면 | ⬜ 대기 |
| Phase 6 | 사진 업로드 (모바일 최적화) | ⬜ 대기 |
| Phase 7 | 폴더 생성 | ⬜ 대기 |
| Phase 8 | 폴더 상세 & 사진 상세 보기 | ⬜ 대기 |
| Phase 9 | KakaoMap 지도 보기 | ⬜ 대기 |
| Phase 10 | 최종 통합 테스트 & 배포 | ⬜ 대기 |

> 각 Phase 완료 시 상태를 ✅ 완료로 업데이트한다.

---

## 🔐 사진방 정의

| 번호 | 사진방 이름 | Google Drive 폴더 |
|------|------------|------------------|
| 123456 | 우리가족 사진방 | `/family-photo-gallery/our-family` |
| 234567 | 나의 부모님 가족 사진방 | `/family-photo-gallery/my-parents-family` |
| 345678 | 처의 부모님 가족 사진방 | `/family-photo-gallery/wife-parents-family` |

---

## 🏗️ 기술 스택

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + CSS Variables (디자인 시스템)
- **Animation:** Framer Motion
- **State:** Zustand
- **Map:** KakaoMap JavaScript SDK

### Backend / API
- **Runtime:** Next.js API Routes (Serverless)
- **Google Drive:** Google Drive API v3 (googleapis SDK)
- **Auth:** Service Account (사용자 로그인 없음)
- **Session:** 번호 입장은 sessionStorage + 서버 검증

### 인프라
- **배포:** Vercel
- **환경변수:** Vercel Environment Variables
- **파일 저장:** Google Drive (직접 저장, DB 없음)

### 개발 도구
- **Package Manager:** pnpm
- **Linter:** ESLint + Prettier
- **Test:** Vitest + Playwright (E2E)
- **Node.js:** 20 LTS

---

## 🎨 디자인 시스템 정의

### 디자인 철학: "따뜻한 필름 앨범"

포토부스, 필름 카메라, 오래된 가족 앨범에서 영감을 받은 따뜻하고 감성적인 디자인.  
디지털이지만 아날로그 감성을 품은 UI.

### 컬러 팔레트

```css
/* 기본 배경 */
--color-bg-base: #FAF7F2;        /* 오래된 종이 느낌의 크림화이트 */
--color-bg-card: #FFFFFF;
--color-bg-overlay: rgba(250, 247, 242, 0.92);

/* 주 컬러 */
--color-primary: #8B6F5C;        /* 따뜻한 갈색 (나무, 앨범) */
--color-primary-light: #B8967E;
--color-primary-dark: #6B4F3C;

/* 액센트 */
--color-accent: #C4956A;         /* 골든 앰버 (빛이 드는 느낌) */
--color-accent-soft: #E8D5C0;

/* 텍스트 */
--color-text-primary: #2C1810;   /* 따뜻한 짙은 갈색 */
--color-text-secondary: #7A6055;
--color-text-muted: #A89285;
--color-text-on-primary: #FAF7F2;

/* 감성 포인트 */
--color-film-border: #D4B896;    /* 폴라로이드 테두리 */
--color-shadow-warm: rgba(139, 111, 92, 0.15);

/* 상태 */
--color-error: #C0392B;
--color-success: #5D8A5E;
```

### 타이포그래피

```css
/* 영문 폰트: Cormorant Garamond — 고급스럽고 따뜻한 세리프 */
--font-display: 'Cormorant Garamond', Georgia, serif;

/* 한글 폰트: Noto Serif KR — 감성적인 명조체 */
--font-body-kr: 'Noto Serif KR', serif;

/* 모노: 날짜/번호 등 */
--font-mono: 'DM Mono', monospace;

/* 사이즈 스케일 */
--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
--text-4xl: 2.25rem;
```

### 스페이싱 & 형태

```css
--radius-sm: 8px;
--radius-md: 16px;
--radius-lg: 24px;
--radius-xl: 32px;
--radius-full: 9999px;

--shadow-card: 0 2px 16px var(--color-shadow-warm);
--shadow-hover: 0 8px 32px var(--color-shadow-warm);
--shadow-photo: 0 4px 24px rgba(0,0,0,0.12);
```

### 애니메이션 원칙

- **진입:** 사진은 아래에서 부드럽게 fade-up (staggered delay)
- **호버:** scale(1.02) + shadow 강화
- **페이지 전환:** fade + slight slide
- **업로드:** 진행 바 + 완료 시 부드러운 체크

---

## 📐 화면 구조 (페이지 맵)

```
/ (입장 화면)
  └─ /[roomId] (사진방 홈)
       ├─ /[roomId]/map (지도 보기)
       ├─ /[roomId]/folder/[folderId] (폴더 상세)
       │    └─ /[roomId]/folder/[folderId]/photo/[photoId] (사진 상세 — modal)
       ├─ /[roomId]/upload (업로드 — bottom sheet)
       └─ /[roomId]/new-folder (폴더 생성 — bottom sheet)
```

---

## 🔌 Google Drive API 인터페이스 정의

### Service Account 권한 구조

```
Google Drive Service Account
  └─ Editor 권한: /family-photo-gallery (루트 폴더)
```

### API Wrapper 인터페이스

```typescript
interface DriveService {
  // 사진방 폴더 ID 조회
  getRoomFolderId(room: RoomKey): Promise<string>
  
  // 폴더 목록 조회
  listFolders(parentId: string): Promise<DriveFolder[]>
  
  // 파일(사진) 목록 조회 (최근순)
  listPhotos(folderId: string, limit?: number): Promise<DrivePhoto[]>
  
  // 최근 사진 전체 조회 (모든 하위 폴더 포함)
  listRecentPhotos(roomFolderId: string, limit: number): Promise<DrivePhoto[]>
  
  // 폴더 생성
  createFolder(name: string, parentId: string): Promise<DriveFolder>
  
  // 파일 업로드
  uploadPhoto(file: File, folderId: string, onProgress: (pct: number) => void): Promise<DrivePhoto>
  
  // 파일 썸네일 URL
  getThumbnailUrl(fileId: string, size: number): string
}
```

### 데이터 모델

```typescript
type RoomKey = 'our-family' | 'my-parents-family' | 'wife-parents-family'

interface DriveFolder {
  id: string
  name: string           // 예: "2026-08-강릉여행"
  createdAt: string      // ISO 날짜
  modifiedAt: string
  photoCount?: number    // lazy load
  thumbnailIds?: string[] // 최근 3장
}

interface DrivePhoto {
  id: string
  name: string
  mimeType: string
  createdAt: string
  modifiedAt: string
  width?: number
  height?: number
  folderId: string
  folderName: string
}
```

---

## 🗺️ KakaoMap 연동 정의

### 장소 추출 로직

폴더명에서 장소를 자동 추출한다. 패턴: `YYYY-MM-[지명/행사명]`

```typescript
// 지명 키워드 → 좌표 매핑 (MVP 고정 목록)
const PLACE_KEYWORDS: Record<string, { lat: number; lng: number }> = {
  '강릉': { lat: 37.7519, lng: 128.8762 },
  '부산': { lat: 35.1796, lng: 129.0756 },
  '제주': { lat: 33.4996, lng: 126.5312 },
  '여수': { lat: 34.7604, lng: 127.6622 },
  // ... 확장 가능
}
```

사용자가 장소를 등록할 수 없는 경우 KakaoMap Geocoding API로 폴더명 검색.

---

## 📁 프로젝트 디렉토리 구조

```
family-photo-gallery/
├── docs/
│   ├── PRD.md          ← 이 파일 (마스터)
│   ├── spec.md         ← Phase별 상세 스펙
│   ├── tasks.md        ← 작업 체크리스트
│   └── test.md         ← 테스트 케이스 & 결과
├── src/
│   ├── app/            ← Next.js App Router
│   │   ├── page.tsx    ← 입장 화면
│   │   ├── [roomId]/
│   │   │   ├── page.tsx
│   │   │   ├── map/page.tsx
│   │   │   └── folder/[folderId]/page.tsx
│   │   └── api/
│   │       └── drive/
│   │           ├── folders/route.ts
│   │           ├── photos/route.ts
│   │           └── upload/route.ts
│   ├── components/
│   │   ├── ui/         ← 기본 디자인 시스템 컴포넌트
│   │   ├── gallery/    ← 갤러리 레이아웃 컴포넌트
│   │   ├── folder/     ← 폴더 관련 컴포넌트
│   │   ├── upload/     ← 업로드 관련 컴포넌트
│   │   └── map/        ← 지도 관련 컴포넌트
│   ├── lib/
│   │   ├── drive/      ← Google Drive API 서비스
│   │   ├── map/        ← KakaoMap 유틸
│   │   └── room/       ← 사진방 설정
│   ├── hooks/          ← 커스텀 훅
│   ├── stores/         ← Zustand 상태
│   └── styles/
│       └── globals.css ← 디자인 시스템 변수
├── public/
├── .env.local
└── package.json
```

---

## 🔒 환경변수 정의

```bash
# Google Drive Service Account
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY=
GOOGLE_DRIVE_ROOT_FOLDER_ID=

# Google Drive 폴더 ID (서비스 계정 세팅 후 채움)
DRIVE_FOLDER_OUR_FAMILY=
DRIVE_FOLDER_MY_PARENTS=
DRIVE_FOLDER_WIFE_PARENTS=

# KakaoMap
NEXT_PUBLIC_KAKAO_MAP_KEY=

# 입장 번호 (서버에서만 접근)
ROOM_CODE_OUR_FAMILY=123456
ROOM_CODE_MY_PARENTS=234567
ROOM_CODE_WIFE_PARENTS=345678
```

---

## ✅ MVP 완료 기준 체크리스트

- [ ] 6자리 번호 입장 동작
- [ ] 모바일 사진 업로드 정상 동작
- [ ] 폴더 생성 후 즉시 업로드 이어지기
- [ ] 사진방 홈이 앨범 느낌으로 보임
- [ ] 폴더 목차가 디자인된 앨범 목록처럼 보임
- [ ] 지도에서 여행지와 사진 폴더 연결
- [ ] 모바일 (iOS Safari, Android Chrome) 정상 동작
- [ ] Lighthouse 모바일 점수 80 이상

---

## 📎 관련 문서

| 문서 | 경로 | 용도 |
|------|------|------|
| PRD | `docs/PRD.md` | 마스터 요구사항 & 기술 설계 |
| Spec | `docs/spec.md` | Phase별 구현 스펙 상세 |
| Tasks | `docs/tasks.md` | 작업 진행 체크리스트 |
| Test | `docs/test.md` | 테스트 케이스 & 결과 기록 |

---

*최초 작성: 2026-05-10 | 버전: v1.0.0*
