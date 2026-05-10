# ✅ 가족사진관 — 작업 체크리스트 (tasks.md)

> 세션 시작 시 이 파일을 먼저 확인하여 현재 진행 상태를 파악한다.  
> 완료된 작업은 `- [x]`로 변경하고, 진행 중 작업은 `- [~]`로 표시한다.

---

## 현재 활성 Phase: Phase 1

---

## 🚀 Phase 1 — 프로젝트 셋업 & 디자인 시스템

**상태:** 🟨 진행중

### 환경 셋업
- [x] Next.js 14 프로젝트 생성 (App Router, TypeScript, Tailwind)
- [x] pnpm 의존성 설치 (framer-motion, zustand, @tanstack/react-query)
- [x] googleapis 설치
- [x] vitest, playwright 개발 의존성 설치
- [~] `.env.local` 파일 생성 및 구조 정의
- [ ] `.gitignore` 확인 (`.env.local` 포함)

### 디자인 시스템
- [ ] `src/styles/globals.css` — CSS Variables 전체 정의
  - [ ] 컬러 팔레트 변수
  - [ ] 타이포그래피 변수
  - [ ] 스페이싱/radius/shadow 변수
- [ ] `tailwind.config.ts` 확장
  - [ ] 커스텀 컬러 (primary, accent, film-border 등)
  - [ ] 커스텀 폰트 패밀리
  - [ ] 커스텀 shadow, radius
- [ ] Google Fonts 설정 (`next/font/google`)
  - [ ] Cormorant Garamond (400, 500, 600)
  - [ ] Noto Serif KR (400, 500)
  - [ ] DM Mono (400)

### 공통 컴포넌트
- [ ] `src/components/ui/Button.tsx`
  - [ ] primary / secondary / ghost variants
  - [ ] loading state (스피너 표시)
  - [ ] disabled state
- [ ] `src/components/ui/Card.tsx`
  - [ ] 기본 카드 (warm shadow, rounded-xl)
  - [ ] 클릭 가능 variant (hover 효과)
- [ ] `src/components/ui/BottomSheet.tsx`
  - [ ] Framer Motion 드래그 가능 시트
  - [ ] 배경 오버레이 클릭 닫기
  - [ ] safe-area-bottom 처리
- [ ] `src/components/ui/LoadingSpinner.tsx`
  - [ ] 따뜻한 primary 컬러
  - [ ] 크기 variant (sm, md, lg)
- [ ] `src/components/ui/ErrorMessage.tsx`
  - [ ] 부드러운 오류 표시
  - [ ] 재시도 버튼 optional

### 레이아웃
- [ ] `src/components/layout/MobileLayout.tsx`
  - [ ] max-width: 430px, mx-auto
  - [ ] min-height: 100dvh
  - [ ] 배경 grain texture
- [ ] `src/components/layout/PageTransition.tsx`
  - [ ] Framer Motion AnimatePresence 래퍼
  - [ ] fade + slideY 효과

### 검증
- [ ] 디자인 토큰 `/design-system` 테스트 페이지 생성
- [ ] 모바일 375px 기준 레이아웃 확인
- [ ] `pnpm build` 에러 없음 확인

**Phase 1 완료 체크:** 위 항목 모두 완료 시 tasks.md 상태를 ✅로 업데이트

---

## 🔐 Phase 2 — 입장 화면

**상태:** ⬜ 대기

### API
- [ ] `src/lib/room/config.ts` — 사진방 설정 정의
  - [ ] ROOM_CODES 상수 (환경변수 기반)
  - [ ] RoomKey 타입 정의
  - [ ] roomId → 사진방 이름 매핑
- [ ] `src/app/api/auth/verify/route.ts`
  - [ ] POST 핸들러 구현
  - [ ] 환경변수로 번호 검증 (하드코딩 금지)
  - [ ] 성공: `{ roomId, roomName }` 반환
  - [ ] 실패: 401 + `{ error: "잘못된 번호입니다" }`
  - [ ] Rate limiting 고려 (MVP: 단순 딜레이)

### 컴포넌트
- [ ] `src/components/ui/PinInput.tsx`
  - [ ] 6자리 개별 input 렌더링
  - [ ] inputMode="numeric" 설정
  - [ ] 자동 포커스 이동 (입력 시)
  - [ ] Backspace → 이전 칸 이동
  - [ ] 붙여넣기 처리 (6자리 자동 분배)
  - [ ] 완성 시 onComplete 콜백
  - [ ] 오류 시 shake 애니메이션 (Framer Motion)
  - [ ] 시각 디자인: 큰 원형 인풋, 필름 느낌

### 페이지
- [ ] `src/app/page.tsx` — 입장 화면
  - [ ] 배경: grain texture + 크림화이트
  - [ ] 상단: 필름 퍼포레이션 장식 (CSS)
  - [ ] 서비스명 "가족사진관" (Cormorant Garamond)
  - [ ] 부제 텍스트
  - [ ] 안내 문구
  - [ ] PinInput 컴포넌트 통합
  - [ ] 입장하기 버튼 (6자리 완성 시 활성화)
  - [ ] 로딩 상태 처리
  - [ ] 오류 메시지 표시
  - [ ] 성공 시 `/[roomId]` 라우팅

### 검증
- [ ] 올바른 번호 (123456) → `/our-family` 이동
- [ ] 잘못된 번호 → shake 애니메이션 + 오류 메시지
- [ ] 모바일에서 숫자 키패드 확인
- [ ] 5자리까지 입장 버튼 비활성화 확인

---

## 🔌 Phase 3 — Google Drive API 연동

**상태:** ⬜ 대기

### Google Drive 설정
- [ ] Google Cloud Console Service Account 생성 (문서화)
- [ ] Drive API 활성화
- [ ] Service Account 키 JSON 다운로드
- [ ] Google Drive 루트 폴더 생성 & 권한 부여
- [ ] 환경변수 `.env.local` 설정

### 코어 서비스
- [ ] `src/lib/drive/types.ts` — 타입 정의
- [ ] `src/lib/drive/DriveService.ts`
  - [ ] GoogleAuth 초기화
  - [ ] `getRoomFolderId()` 구현
  - [ ] `listFolders()` 구현 (최근순 정렬)
  - [ ] `listPhotos()` 구현 (이미지만, 최근순)
  - [ ] `listRecentPhotos()` 구현 (모든 하위 폴더 포함)
  - [ ] `createFolder()` 구현
  - [ ] `uploadPhoto()` 구현 (Resumable Upload)
  - [ ] `getThumbnailUrl()` 구현
- [ ] `src/lib/drive/DriveCache.ts`
  - [ ] 폴더 목록 캐시 (60초)
  - [ ] 최근 사진 캐시 (30초)
  - [ ] 업로드 후 캐시 무효화

### API Routes
- [ ] `GET /api/drive/folders?roomId=`
- [ ] `GET /api/drive/photos?folderId=&limit=`
- [ ] `GET /api/drive/recent?roomId=&limit=`
- [ ] `POST /api/drive/upload`
- [ ] `POST /api/drive/folder`

### 검증
- [ ] 폴더 목록 API 응답 확인
- [ ] 최근 사진 API 응답 확인
- [ ] 이미지 URL 접근 가능 확인
- [ ] 테스트 파일 업로드 성공
- [ ] 폴더 생성 Drive 반영 확인

---

## 🖼️ Phase 4 — 사진방 홈 & 감성 갤러리

**상태:** ⬜ 대기

### 갤러리 컴포넌트
- [ ] `src/components/gallery/PhotoCard.tsx` — 기본 사진 카드
- [ ] `src/components/gallery/PolaroidCard.tsx`
  - [ ] 폴라로이드 흰 여백 디자인
  - [ ] 랜덤 기울기 (-1.5 ~ 1.5deg)
  - [ ] 상단 테이프 장식
- [ ] `src/components/gallery/FilmStrip.tsx`
  - [ ] 가로 스크롤 스트립
  - [ ] 필름 퍼포레이션 상/하단 장식
- [ ] `src/components/gallery/MagazineGrid.tsx`
  - [ ] 레이아웃 A (대형 왼쪽)
  - [ ] 레이아웃 B (대형 오른쪽)
  - [ ] CSS Grid 비대칭 구성
- [ ] `src/components/gallery/GalleryLayout.tsx`
  - [ ] 사진 수에 따라 레이아웃 선택 로직
  - [ ] Framer Motion staggered 진입 애니메이션

### 훅
- [ ] `src/hooks/useRecentPhotos.ts` — SWR/React Query
- [ ] `src/hooks/useFolders.ts`

### 페이지
- [ ] `src/app/[roomId]/page.tsx`
  - [ ] roomId 검증 (없으면 `/` 리다이렉트)
  - [ ] 사진방 이름 표시
  - [ ] 최근 사진 갤러리 섹션
  - [ ] 폴더 목차 섹션 (Phase 5 컴포넌트 사용)
  - [ ] FAB 버튼 (하단 우측 고정)
  - [ ] FAB BottomSheet (사진올리기/폴더만들기/지도보기)

### 검증
- [ ] 3가지 갤러리 레이아웃 렌더링 확인
- [ ] 사진 스태거 애니메이션 확인
- [ ] FAB 클릭 → BottomSheet 열림
- [ ] 모바일 스크롤 성능 확인

---

## 📚 Phase 5 — 폴더 목차

**상태:** ⬜ 대기

- [ ] `src/components/folder/FolderCard.tsx`
  - [ ] 썸네일 3장 겹치기 표시
  - [ ] 자동 보조 문구 생성
  - [ ] 사진 수 + 날짜 표시
  - [ ] 카드 hover 효과
- [ ] `src/components/folder/FolderList.tsx`
  - [ ] FolderCard 목록 렌더링
  - [ ] 빈 폴더 빈 상태(empty state) 처리
- [ ] `src/lib/folder/subtitleGenerator.ts`
  - [ ] 폴더명 파싱 로직
  - [ ] 보조 문구 생성 로직

### 검증
- [ ] 폴더 목록 카드 렌더링
- [ ] 보조 문구 자동 생성 확인
- [ ] 카드 클릭 → 폴더 상세 이동

---

## 📤 Phase 6 — 사진 업로드

**상태:** ⬜ 대기

- [ ] `src/components/upload/FolderSelector.tsx`
- [ ] `src/components/upload/ProgressBar.tsx`
- [ ] `src/components/upload/UploadSheet.tsx`
  - [ ] 폴더 선택 UI
  - [ ] 파일 input (multiple, accept="image/*")
  - [ ] 선택 파일 미리보기 (최대 5장 표시)
  - [ ] 업로드 진행바
  - [ ] 완료 애니메이션
- [ ] `src/hooks/useUpload.ts`
  - [ ] 병렬 업로드 (최대 3개 동시)
  - [ ] 진행률 계산
  - [ ] 실패 재시도 로직

### 검증
- [ ] 폴더 선택 → 사진 선택기 열림
- [ ] 복수 사진 선택 동작
- [ ] 진행바 실시간 업데이트
- [ ] 완료 후 갤러리 리프레시

---

## 📁 Phase 7 — 폴더 생성

**상태:** ⬜ 대기

- [ ] `src/components/folder/CreateFolderSheet.tsx`
  - [ ] 폴더명 입력 (크고 단순한 필드)
  - [ ] 예시 칩 (클릭 시 자동 입력)
  - [ ] 최근 폴더명 참고
  - [ ] 만들기 버튼
  - [ ] 생성 후 "이 앨범에 사진 올리기" 옵션
- [ ] `src/hooks/useCreateFolder.ts`

### 검증
- [ ] 폴더 생성 → Drive 반영
- [ ] 예시 칩 자동 입력
- [ ] 생성 후 업로드 시트 연결

---

## 🖼️ Phase 8 — 폴더 상세 & 사진 상세

**상태:** ⬜ 대기

- [ ] `src/app/[roomId]/folder/[folderId]/page.tsx`
  - [ ] 히어로 이미지 (블러 배경)
  - [ ] 사진 그리드 (3열)
- [ ] `src/components/gallery/PhotoGrid.tsx`
- [ ] `src/components/gallery/LightboxViewer.tsx`
  - [ ] 전체 화면 모달
  - [ ] 좌우 스와이프 (터치 제스처)
  - [ ] 인디케이터
  - [ ] 닫기 (X, 배경 클릭, 스와이프 다운)

### 검증
- [ ] 폴더 내 사진 그리드
- [ ] 라이트박스 열기/닫기
- [ ] 터치 스와이프 전환

---

## 🗺️ Phase 9 — KakaoMap 지도

**상태:** ⬜ 대기

- [ ] `src/lib/map/placeExtractor.ts`
  - [ ] 폴더명 파싱
  - [ ] 지명 키워드 감지 (50개 주요 지명)
  - [ ] KakaoMap Geocoding API fallback
- [ ] `src/lib/map/kakaoLoader.ts`
  - [ ] SDK 동적 스크립트 로드
- [ ] `src/components/map/KakaoMap.tsx`
- [ ] `src/components/map/AlbumMarker.tsx`
  - [ ] 폴라로이드 썸네일 마커
- [ ] `src/components/map/PlaceCard.tsx`
- [ ] `src/app/[roomId]/map/page.tsx`

### 검증
- [ ] 지도 렌더링
- [ ] 마커 표시 (장소 추출된 폴더)
- [ ] 마커 클릭 → 폴더 이동
- [ ] 하단 카드 스크롤

---

## 🚢 Phase 10 — 통합 테스트 & 배포

**상태:** ⬜ 대기

- [ ] E2E 테스트 전체 플로우 실행
- [ ] 이미지 최적화 (Next.js Image, sizes 설정)
- [ ] Lighthouse 모바일 측정 (목표: 80+)
- [ ] Vercel 프로젝트 생성
- [ ] 환경변수 Vercel 설정
- [ ] 첫 배포 & 동작 확인
- [ ] iOS Safari 테스트
- [ ] Android Chrome 테스트
- [ ] 도메인 연결 (선택)

---

## 📊 전체 진행 현황

| Phase | 이름 | 작업 수 | 완료 | 상태 |
|-------|------|---------|------|------|
| 1 | 프로젝트 셋업 & 디자인 시스템 | 28 | 0 | ⬜ |
| 2 | 입장 화면 | 16 | 0 | ⬜ |
| 3 | Google Drive API | 20 | 0 | ⬜ |
| 4 | 사진방 홈 & 갤러리 | 18 | 0 | ⬜ |
| 5 | 폴더 목차 | 8 | 0 | ⬜ |
| 6 | 사진 업로드 | 12 | 0 | ⬜ |
| 7 | 폴더 생성 | 6 | 0 | ⬜ |
| 8 | 폴더 상세 & 사진 뷰어 | 10 | 0 | ⬜ |
| 9 | KakaoMap 지도 | 12 | 0 | ⬜ |
| 10 | 통합 테스트 & 배포 | 10 | 0 | ⬜ |

---

*버전: v1.0.0 | 작성: 2026-05-10*
