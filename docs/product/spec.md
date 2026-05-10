# 🔬 가족사진관 — 구현 스펙 (spec.md)

> 각 Phase별 상세 구현 스펙. 개발 세션 시작 시 해당 Phase 스펙을 참조한다.

---

## ⚡ Phase 1 — 프로젝트 셋업 & 디자인 시스템

### 목표
Next.js 프로젝트 초기화, 디자인 시스템 구축, 공통 컴포넌트 기반 마련.

### 셋업 커맨드

```bash
pnpm create next-app@latest family-photo-gallery \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*"

cd family-photo-gallery
pnpm add framer-motion zustand @tanstack/react-query
pnpm add googleapis
pnpm add -D vitest @vitejs/plugin-react playwright @playwright/test
```

### 구현 항목

**globals.css — 디자인 토큰**
- CSS Variables 전체 정의 (PRD 디자인 시스템 참조)
- Google Fonts 임포트: Cormorant Garamond, Noto Serif KR, DM Mono
- Tailwind config 확장: 커스텀 컬러, 폰트, radius, shadow

**기본 UI 컴포넌트**
- `Button` — primary / secondary / ghost variants, loading state
- `Card` — 포토북 스타일, warm shadow
- `BottomSheet` — 모바일 하단 슬라이드 업 시트
- `LoadingSpinner` — 따뜻한 컬러 스피너
- `ErrorMessage` — 부드러운 오류 표시

**레이아웃**
- `MobileLayout` — max-width 430px, 중앙 정렬, 하단 safe-area 처리
- `PageTransition` — Framer Motion fade + slide

### 완료 기준
- [ ] `pnpm dev` 실행 후 디자인 토큰 적용 확인
- [ ] Storybook 없이 `/design-system` 테스트 페이지에서 컴포넌트 확인
- [ ] 모바일 뷰포트 (375px) 기준 레이아웃 확인

---

## ⚡ Phase 2 — 입장 화면

### 목표
6자리 번호 입력 UI, 서버 검증, 사진방 라우팅.

### 파일

```
src/app/page.tsx                     ← 입장 화면
src/app/api/auth/verify/route.ts     ← 번호 검증 API
src/lib/room/config.ts               ← 사진방 설정
src/components/ui/PinInput.tsx       ← 6자리 PIN 입력 컴포넌트
```

### PinInput 컴포넌트 스펙

```typescript
interface PinInputProps {
  length: number          // 6
  onComplete: (value: string) => void
  error?: string
  disabled?: boolean
}
```

- 각 자리수를 개별 input으로 구성 (접근성)
- `inputMode="numeric"` — 모바일 숫자 키패드
- 자동 포커스 이동 (숫자 입력 시 다음 칸으로)
- Backspace 처리 (이전 칸으로 포커스 이동)
- 붙여넣기 지원 (6자리 숫자 자동 분배)
- 잘못된 번호: shake 애니메이션 + 오류 메시지

### API Route 스펙

```typescript
// POST /api/auth/verify
// Body: { code: string }
// Response: { roomId: RoomKey } | { error: string }

// 서버에서 환경변수로 번호 검증
// 성공 시 sessionStorage에 roomId 저장 (클라이언트)
// 라우팅: /[roomId]
```

### 입장 화면 UI 스펙

```
화면 구성 (세로 중앙 정렬):
  [상단 여백 20%]
  [서비스명: 가족사진관 — 큰 세리프 폰트]
  [부제: 따뜻한 가족 앨범 — 작은 텍스트]
  [구분선]
  [안내 문구: "가족에게 공유받은 6자리 번호를 입력하세요"]
  [PinInput 컴포넌트]
  [입장하기 버튼 — 6자리 모두 입력 시 활성화]
  [하단: 작은 안내 문구]
```

**배경:** 미세한 grain texture, 크림화이트 (#FAF7F2)  
**카메라 필름 느낌:** 상단에 얇은 필름 퍼포레이션 장식 (CSS로 구현)

### 완료 기준
- [ ] 올바른 번호 입력 → 해당 사진방으로 이동
- [ ] 잘못된 번호 → 오류 메시지 + shake 애니메이션
- [ ] 모바일에서 숫자 키패드 자동 표시
- [ ] 6자리 미완성 시 입장 버튼 비활성화

---

## ⚡ Phase 3 — Google Drive API 연동 레이어

### 목표
서버사이드 Google Drive 서비스 구현. UI 없음. 순수 API 레이어.

### 파일

```
src/lib/drive/DriveService.ts        ← 핵심 서비스 클래스
src/lib/drive/DriveCache.ts          ← In-memory 캐시 (Next.js 빌드 캐시 활용)
src/lib/drive/types.ts               ← 드라이브 타입 정의
src/app/api/drive/folders/route.ts   ← GET /api/drive/folders?roomId=
src/app/api/drive/photos/route.ts    ← GET /api/drive/photos?folderId=&limit=
src/app/api/drive/upload/route.ts    ← POST /api/drive/upload (multipart)
src/app/api/drive/folder/route.ts    ← POST /api/drive/folder (폴더 생성)
```

### DriveService 구현 스펙

```typescript
// Service Account 인증
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/drive'],
})

// 파일 쿼리 기준
// - mimeType: image/jpeg, image/png, image/heic, image/webp
// - 정렬: modifiedTime desc (최근순)
// - 썸네일: files.get thumbnailLink 또는 ?sz=w400 파라미터
```

### 캐싱 전략

```typescript
// Next.js fetch cache 활용
// revalidate: 60초 (폴더 목록)
// revalidate: 30초 (최근 사진)
// 업로드 후 해당 폴더 캐시 무효화
```

### 업로드 API 스펙

```typescript
// POST /api/drive/upload
// Content-Type: multipart/form-data
// FormData: { file: File, folderId: string }
// Response: { fileId: string, name: string }
// 
// 청크 업로드: Resumable Upload API 사용 (대용량 대응)
// 진행률: Server-Sent Events 또는 클라이언트 폴링
```

### 완료 기준
- [ ] 폴더 목록 API 응답 정상 확인
- [ ] 최근 사진 목록 API 응답 정상 확인
- [ ] 테스트 파일 업로드 성공
- [ ] 폴더 생성 후 Drive에서 확인

---

## ⚡ Phase 4 — 사진방 홈 & 감성 갤러리

### 목표
사진방의 핵심 화면. 최근 사진을 감성적 레이아웃으로 표현.

### 파일

```
src/app/[roomId]/page.tsx
src/components/gallery/GalleryLayout.tsx    ← 레이아웃 오케스트레이터
src/components/gallery/PolaroidCard.tsx     ← 폴라로이드 스타일
src/components/gallery/FilmStrip.tsx        ← 필름 스트립 스타일
src/components/gallery/MagazineGrid.tsx     ← 잡지형 콜라주
src/components/gallery/PhotoCard.tsx        ← 기본 사진 카드
src/hooks/useRecentPhotos.ts
```

### 갤러리 레이아웃 선택 로직

```typescript
// 최근 사진 수에 따라 레이아웃 선택
// 1-2장: 단일 대형 카드 (Polaroid)
// 3-5장: FilmStrip (가로 스크롤)
// 6-9장: MagazineGrid (비대칭 콜라주)
// 10장+: MagazineGrid 상단 + 작은 그리드 하단

// 매 진입마다 레이아웃 변형을 랜덤 선택 (고정 시드 없음)
```

### PolaroidCard 스펙

```typescript
// 사진 아래 흰 여백 영역에 폴더명 or 날짜 표시
// 살짝 기울어진 각도 (rotate: -1.5deg ~ 1.5deg 랜덤)
// 상단 테이프 장식 (CSS pseudo-element)
// 호버 시 scale(1.03) + 그림자 강화
```

### MagazineGrid 스펙

```
레이아웃 A:
  [  대형 사진 (col-span-2)  ] [ 작은 사진 ]
  [   작은 사진   ] [   작은 사진   ]

레이아웃 B:
  [ 작은 ] [  대형 사진 (row-span-2) ]
  [ 작은 ]
```

### 사진방 홈 전체 구조

```
[헤더: 사진방 이름 + 부제]
[최근 사진 감성 갤러리]
[섹션 제목: "앨범 목록"]
[폴더 카드 목차 — 스크롤]
[FAB 버튼 — 하단 우측 고정]
  └─ 눌리면 BottomSheet 열림
       ├─ 📷 사진 올리기
       ├─ 📁 새 폴더 만들기
       └─ 🗺️ 지도 보기
```

### 완료 기준
- [ ] 사진방 이름 정상 표시
- [ ] 최근 사진 갤러리 3가지 레이아웃 렌더링
- [ ] FAB 버튼 클릭 시 BottomSheet 열림
- [ ] 사진 클릭 시 상세 화면 진입
- [ ] 모바일 스크롤 부드러움 확인

---

## ⚡ Phase 5 — 폴더 목차 화면

### 목표
파일 탐색기가 아닌 앨범 챕터 느낌의 폴더 목차.

### 파일

```
src/components/folder/FolderCard.tsx        ← 앨범 카드
src/components/folder/FolderList.tsx        ← 폴더 목록 컨테이너
src/hooks/useFolders.ts
```

### FolderCard 스펙

```typescript
interface FolderCardProps {
  folder: DriveFolder
  thumbnails: string[]   // 최근 사진 최대 3장 URL
  photoCount: number
  subtitle?: string      // 자동 생성 보조 문구
}
```

**레이아웃:**
```
┌────────────────────────────────────┐
│  [썸네일 3장 — 살짝 겹치게]          │
│                                    │
│  2026-08-강릉여행                   │
│  바다 앞에서 남긴 여름의 장면들       │ ← 자동 생성 문구
│  사진 42장 · 2026년 8월             │
└────────────────────────────────────┘
```

**자동 보조 문구 생성 로직:**
```typescript
// 폴더명 파싱: YYYY-MM-[행사명]
// 계절별: 봄(3-5월), 여름(6-8월), 가을(9-11월), 겨울(12-2월)
// 여행 키워드 감지: 여행, 나들이, 방문
// 가족 행사 키워드: 생신, 명절, 어버이날, 크리스마스

const subtitleTemplates = {
  travel: '함께 떠난 여행의 순간들',
  birthday: '소중한 날을 함께한 기억',
  holiday: '가족이 모인 따뜻한 하루',
  default: '함께 남긴 소중한 장면들',
}
```

### 완료 기준
- [ ] 폴더 카드 목록 정상 렌더링
- [ ] 썸네일 3장 표시
- [ ] 카드 클릭 시 폴더 상세 진입
- [ ] 자동 보조 문구 생성 확인

---

## ⚡ Phase 6 — 모바일 사진 업로드

### 목표
엄지손가락 친화적 업로드 UX. BottomSheet 기반.

### 파일

```
src/components/upload/UploadSheet.tsx       ← 업로드 하단 시트
src/components/upload/FolderSelector.tsx    ← 폴더 선택기
src/components/upload/ProgressBar.tsx       ← 업로드 진행바
src/hooks/useUpload.ts
```

### 업로드 플로우 UX

```
FAB 클릭 → BottomSheet 열림
→ "사진 올리기" 선택
→ UploadSheet 열림:
    [폴더 선택 — 카드형 목록]
    [선택 후: "이 폴더에 올리기" 버튼]
→ 기기 사진 선택기 열림 (multiple 허용)
→ 선택된 사진 미리보기 + 개수 표시
→ "올리기" 버튼
→ 진행바 표시 (파일별 / 전체)
→ 완료 애니메이션
→ 시트 닫힘 + 갤러리 리프레시
```

### useUpload 훅 스펙

```typescript
interface UseUploadReturn {
  upload: (files: File[], folderId: string) => Promise<void>
  progress: number           // 0-100
  status: 'idle' | 'uploading' | 'success' | 'error'
  uploadedCount: number
  totalCount: number
  error: string | null
  retry: () => void
}
```

### 업로드 제약

- 파일 타입: image/* 만 허용
- 파일 크기: 단일 20MB 제한 (MVP)
- 동시 업로드: 3개 병렬
- 실패 시: 개별 파일 재시도 가능

### 완료 기준
- [ ] 폴더 선택 후 사진 선택기 정상 열림
- [ ] 복수 사진 선택 가능
- [ ] 업로드 진행바 실시간 업데이트
- [ ] 완료 후 갤러리 리프레시
- [ ] 실패 시 재시도 가능

---

## ⚡ Phase 7 — 폴더 생성

### 목표
자연스러운 폴더 생성 UX. 입력 후 즉시 업로드로 이어지는 흐름.

### 파일

```
src/components/folder/CreateFolderSheet.tsx
src/hooks/useCreateFolder.ts
```

### 폴더 생성 BottomSheet 스펙

```
[시트 상단: "새 앨범 만들기"]
[입력 필드: 크고 단순, placeholder "2026-08-강릉여행"]
[권장 예시 칩:
  2026-05-어린이날  2026-08-강릉여행  2026-09-추석
]
[최근 폴더 참고:
  최근에 만든 앨범: 2026-05-어린이날
]
[만들기 버튼]
```

### 생성 후 플로우

```typescript
// 폴더 생성 완료 후 선택지:
// 1. "이 앨범에 사진 올리기" → UploadSheet 열림 (해당 폴더 선택된 상태)
// 2. "완료" → 시트 닫힘
```

### 완료 기준
- [ ] 폴더명 입력 후 생성 정상 동작
- [ ] 예시 칩 클릭 시 입력 필드 자동 입력
- [ ] 생성 직후 업로드 시트로 이어지기
- [ ] 폴더 목록 즉시 갱신

---

## ⚡ Phase 8 — 폴더 상세 & 사진 상세 보기

### 목표
폴더 내 사진 목록 및 라이트박스 사진 뷰어.

### 파일

```
src/app/[roomId]/folder/[folderId]/page.tsx
src/components/gallery/LightboxViewer.tsx   ← 사진 상세 모달
src/components/gallery/PhotoGrid.tsx        ← 폴더 내 사진 그리드
```

### 폴더 상세 화면 스펙

```
[헤더: ← 뒤로가기 | 폴더명]
[대표 사진 히어로 이미지 — 전체 너비, 블러 배경]
[폴더 정보: 사진 N장 · 날짜]
[PhotoGrid: 3열 정사각형 그리드]
```

### LightboxViewer 스펙

- 사진 클릭 시 전체 화면 모달
- 좌우 스와이프 (터치 제스처)
- 좌우 화살표 버튼
- 상단: 폴더명 + 날짜
- 하단: `N / 전체N` 인디케이터
- 닫기: X 버튼 + 배경 클릭 + 스와이프 다운
- Framer Motion AnimatePresence로 전환 애니메이션

### 완료 기준
- [ ] 폴더 내 사진 그리드 렌더링
- [ ] 사진 클릭 시 라이트박스 열림
- [ ] 좌우 스와이프 전환 동작
- [ ] 닫기 동작 정상

---

## ⚡ Phase 9 — KakaoMap 지도 보기

### 목표
여행지를 감성적 마커로 지도에 표시하고 앨범 카드와 연결.

### 파일

```
src/app/[roomId]/map/page.tsx
src/components/map/KakaoMap.tsx             ← 지도 컴포넌트
src/components/map/AlbumMarker.tsx          ← 커스텀 마커
src/components/map/PlaceCard.tsx            ← 하단 장소 카드
src/lib/map/placeExtractor.ts               ← 폴더명 → 장소 추출
src/lib/map/kakaoLoader.ts                  ← SDK 동적 로드
```

### AlbumMarker 스펙

```typescript
// 기본 핀 대신 미니 폴라로이드 마커
// 마커 내: 대표 사진 썸네일 (40x40)
// 마커 하단: 장소명
// 선택 시 확대 + 팝오버
```

### 지도 화면 레이아웃

```
[헤더: ← | 우리가족 여행지]
[KakaoMap — 화면 상단 60%]
  [AlbumMarker들 — 장소별]
[하단 카드 영역 — 가로 스크롤]
  [PlaceCard: 장소명 · 날짜 · 사진N장]
```

### 장소 추출 우선순위

```typescript
1. 폴더명에서 지명 키워드 감지 (고정 목록)
2. KakaoMap Places API로 검색 (fallback)
3. 추출 불가: 지도에서 제외 (표시 안 함)
```

### 완료 기준
- [ ] 지도 정상 렌더링
- [ ] 폴더명에서 장소 추출 동작
- [ ] 마커 클릭 시 해당 폴더로 이동
- [ ] 하단 카드 가로 스크롤 동작

---

## ⚡ Phase 10 — 최종 통합 & 배포

### 목표
전체 흐름 E2E 검증, 성능 최적화, Vercel 배포.

### 체크리스트

- [ ] 전체 사용자 플로우 E2E 테스트 통과
- [ ] 이미지 최적화: Next.js Image + `sizes` 적절 설정
- [ ] Lighthouse 모바일 Performance 80+
- [ ] 환경변수 Vercel 설정 완료
- [ ] 도메인 설정
- [ ] iOS Safari, Android Chrome 크로스브라우저 테스트

---

*버전: v1.0.0 | 작성: 2026-05-10*
