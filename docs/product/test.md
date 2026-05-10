# 🧪 가족사진관 — 테스트 케이스 & 결과 (test.md)

> 각 Phase 완료 후 테스트 결과를 이 파일에 기록한다.  
> 자동화 테스트 명령어와 수동 테스트 체크리스트 포함.

---

## 테스트 환경 정의

```yaml
단위 테스트: Vitest
E2E 테스트: Playwright
테스트 브라우저: Chromium (데스크탑), Mobile Chrome (375px)
Node.js: 20 LTS
```

### 테스트 명령어

```bash
# 단위 테스트 실행
pnpm test

# 단위 테스트 감시 모드
pnpm test:watch

# E2E 테스트 실행
pnpm test:e2e

# 전체 테스트
pnpm test:all

# Lighthouse 측정
pnpm lighthouse
```

---

## 🔬 Phase 1 — 디자인 시스템 테스트

**테스트 일자:** 미실행  
**결과:** ⬜ 미실행

### 단위 테스트

```typescript
// src/components/ui/__tests__/Button.test.tsx
describe('Button', () => {
  it('primary variant 렌더링', () => {})
  it('loading 상태에서 스피너 표시', () => {})
  it('disabled 상태에서 클릭 불가', () => {})
})

// src/components/ui/__tests__/BottomSheet.test.tsx
describe('BottomSheet', () => {
  it('open prop true 시 시트 표시', () => {})
  it('배경 클릭 시 onClose 호출', () => {})
})
```

### 수동 테스트

| # | 항목 | 기대 결과 | 결과 | 비고 |
|---|------|----------|------|------|
| 1 | 디자인 토큰 페이지 접근 | CSS Variables 적용 확인 | ⬜ | |
| 2 | Button 컴포넌트 3가지 variant | 각 스타일 정상 렌더링 | ⬜ | |
| 3 | BottomSheet 열기/닫기 | 드래그 가능, 배경 클릭 닫힘 | ⬜ | |
| 4 | 모바일 375px 레이아웃 | max-width, safe-area 적용 | ⬜ | |
| 5 | 폰트 로드 확인 | 세리프 폰트 정상 표시 | ⬜ | |

---

## 🔐 Phase 2 — 입장 화면 테스트

**테스트 일자:** 미실행  
**결과:** ⬜ 미실행

### 단위 테스트

```typescript
// src/components/ui/__tests__/PinInput.test.tsx
describe('PinInput', () => {
  it('6자리 입력 필드 렌더링', () => {
    // 6개의 input 엘리먼트 존재 확인
  })
  
  it('숫자 입력 시 다음 칸으로 포커스 이동', async () => {
    // userEvent.type으로 순차 입력 테스트
  })
  
  it('Backspace 입력 시 이전 칸으로 포커스 이동', async () => {})
  
  it('6자리 완성 시 onComplete 콜백 호출', async () => {
    // onComplete mock 함수 호출 확인
  })
  
  it('붙여넣기 시 6자리 자동 분배', async () => {
    // clipboard paste 이벤트 테스트
  })
  
  it('오류 prop 전달 시 shake 애니메이션 클래스 적용', () => {})
})

// src/app/api/auth/__tests__/verify.test.ts
describe('POST /api/auth/verify', () => {
  it('올바른 번호 → 200 + roomId 반환', async () => {})
  it('잘못된 번호 → 401 + error 반환', async () => {})
  it('빈 번호 → 400 반환', async () => {})
  it('6자리 미만 → 400 반환', async () => {})
})
```

### E2E 테스트

```typescript
// e2e/entry.spec.ts
test('입장 화면 기본 렌더링', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('가족사진관')).toBeVisible()
  await expect(page.getByRole('button', { name: '입장하기' })).toBeDisabled()
})

test('올바른 번호 입력 → 사진방 이동', async ({ page }) => {
  await page.goto('/')
  // PinInput에 '123456' 입력
  await page.getByRole('button', { name: '입장하기' }).click()
  await expect(page).toHaveURL('/our-family')
})

test('잘못된 번호 → 오류 표시', async ({ page }) => {
  await page.goto('/')
  // '999999' 입력
  await page.getByRole('button', { name: '입장하기' }).click()
  await expect(page.getByText('잘못된 번호입니다')).toBeVisible()
})

test('모바일: 숫자 키패드 표시', async ({ page, context }) => {
  // inputMode="numeric" 확인
})
```

### 수동 테스트

| # | 항목 | 기대 결과 | 결과 | 비고 |
|---|------|----------|------|------|
| 1 | 입장 화면 배경 grain texture | 크림화이트 + 미세 텍스처 | ⬜ | |
| 2 | 서비스명 폰트 | Cormorant Garamond 세리프 | ⬜ | |
| 3 | 6자리 PinInput 렌더링 | 6개 원형 인풋 박스 | ⬜ | |
| 4 | 5자리까지 입장 버튼 비활성화 | 버튼 disabled 상태 | ⬜ | |
| 5 | 올바른 번호 (123456) | /our-family 이동 | ⬜ | |
| 6 | 올바른 번호 (234567) | /my-parents-family 이동 | ⬜ | |
| 7 | 올바른 번호 (345678) | /wife-parents-family 이동 | ⬜ | |
| 8 | 잘못된 번호 (000000) | shake 애니메이션 + 오류 메시지 | ⬜ | |
| 9 | iOS Safari 숫자 키패드 | 숫자 전용 키패드 표시 | ⬜ | |
| 10 | Android Chrome 숫자 키패드 | 숫자 전용 키패드 표시 | ⬜ | |

---

## 🔌 Phase 3 — Google Drive API 테스트

**테스트 일자:** 미실행  
**결과:** ⬜ 미실행

### 단위 테스트

```typescript
// src/lib/drive/__tests__/DriveService.test.ts
describe('DriveService', () => {
  // Service Account mock 사용
  
  it('listFolders — 올바른 parentId로 폴더 목록 반환', async () => {})
  it('listFolders — 결과 최근순 정렬 확인', async () => {})
  it('listPhotos — 이미지 파일만 필터링', async () => {})
  it('listPhotos — limit 파라미터 적용', async () => {})
  it('createFolder — 올바른 이름으로 폴더 생성', async () => {})
  it('getThumbnailUrl — 올바른 URL 형식 반환', async () => {})
})

// src/app/api/drive/__tests__/folders.test.ts
describe('GET /api/drive/folders', () => {
  it('roomId 파라미터 필수 검증', async () => {})
  it('잘못된 roomId → 400', async () => {})
  it('올바른 roomId → 폴더 목록 반환', async () => {})
})
```

### API 수동 테스트 (curl)

```bash
# 폴더 목록
curl "http://localhost:3000/api/drive/folders?roomId=our-family"

# 최근 사진
curl "http://localhost:3000/api/drive/recent?roomId=our-family&limit=10"

# 폴더 생성
curl -X POST "http://localhost:3000/api/drive/folder" \
  -H "Content-Type: application/json" \
  -d '{"name": "2026-05-테스트", "roomId": "our-family"}'
```

### 수동 테스트

| # | 항목 | 기대 결과 | 결과 | 비고 |
|---|------|----------|------|------|
| 1 | Service Account 인증 | 인증 오류 없음 | ⬜ | |
| 2 | 폴더 목록 API | 폴더 배열 반환, 최근순 정렬 | ⬜ | |
| 3 | 최근 사진 API | 이미지 파일만 반환 | ⬜ | |
| 4 | 썸네일 URL 접근 | 이미지 로드 성공 | ⬜ | |
| 5 | 폴더 생성 API | Drive에서 폴더 확인 | ⬜ | |
| 6 | 파일 업로드 API | Drive에서 파일 확인 | ⬜ | |
| 7 | 캐시 동작 | 동일 요청 재사용 확인 | ⬜ | |

---

## 🖼️ Phase 4 — 사진방 홈 테스트

**테스트 일자:** 미실행  
**결과:** ⬜ 미실행

### 단위 테스트

```typescript
// src/components/gallery/__tests__/GalleryLayout.test.tsx
describe('GalleryLayout', () => {
  it('사진 1-2장 → PolaroidCard 레이아웃', () => {})
  it('사진 3-5장 → FilmStrip 레이아웃', () => {})
  it('사진 6장 이상 → MagazineGrid 레이아웃', () => {})
})

describe('PolaroidCard', () => {
  it('폴라로이드 스타일 렌더링', () => {})
  it('기울기 각도가 -1.5 ~ 1.5 범위', () => {})
})
```

### E2E 테스트

```typescript
// e2e/gallery.spec.ts
test('사진방 홈 접근', async ({ page }) => {
  // 번호 입력 후 홈 접근
  await expect(page.getByText('우리가족 사진방')).toBeVisible()
})

test('갤러리 사진 클릭 → 상세 보기', async ({ page }) => {
  // 첫 번째 사진 클릭
  // 라이트박스 모달 표시 확인
})

test('FAB 클릭 → BottomSheet 열림', async ({ page }) => {
  await page.getByRole('button', { name: '메뉴' }).click()
  await expect(page.getByText('사진 올리기')).toBeVisible()
})
```

### 수동 테스트

| # | 항목 | 기대 결과 | 결과 | 비고 |
|---|------|----------|------|------|
| 1 | 사진방 홈 진입 | 사진방 이름 + 갤러리 표시 | ⬜ | |
| 2 | Polaroid 레이아웃 | 폴라로이드 스타일 카드 | ⬜ | |
| 3 | FilmStrip 레이아웃 | 가로 스크롤 필름 형태 | ⬜ | |
| 4 | MagazineGrid 레이아웃 | 비대칭 콜라주 형태 | ⬜ | |
| 5 | 스태거 애니메이션 | 순차 fade-up 진입 | ⬜ | |
| 6 | FAB 버튼 표시 | 하단 우측 고정 버튼 | ⬜ | |
| 7 | FAB BottomSheet | 3개 메뉴 표시 | ⬜ | |
| 8 | 파일 탐색기 느낌 없음 | 앨범 감성 확인 | ⬜ | |

---

## 📚 Phase 5 — 폴더 목차 테스트

**테스트 일자:** 미실행  
**결과:** ⬜ 미실행

### 단위 테스트

```typescript
// src/lib/folder/__tests__/subtitleGenerator.test.ts
describe('subtitleGenerator', () => {
  it('"강릉여행" → 여행 관련 문구 반환', () => {})
  it('"어버이날" → 가족 행사 문구 반환', () => {})
  it('"추석" → 명절 문구 반환', () => {})
  it('알 수 없는 키워드 → 기본 문구 반환', () => {})
})
```

### 수동 테스트

| # | 항목 | 기대 결과 | 결과 | 비고 |
|---|------|----------|------|------|
| 1 | 폴더 카드 렌더링 | 앨범 카드 스타일 | ⬜ | |
| 2 | 썸네일 3장 표시 | 겹치는 형태로 표시 | ⬜ | |
| 3 | 보조 문구 자동 생성 | 맥락에 맞는 문구 | ⬜ | |
| 4 | 카드 클릭 → 폴더 상세 | 해당 폴더 페이지 이동 | ⬜ | |
| 5 | 파일 목록 느낌 없음 | 앨범 챕터 느낌 확인 | ⬜ | |

---

## 📤 Phase 6 — 업로드 테스트

**테스트 일자:** 미실행  
**결과:** ⬜ 미실행

### 단위 테스트

```typescript
// src/hooks/__tests__/useUpload.test.ts
describe('useUpload', () => {
  it('업로드 시작 시 status: uploading', async () => {})
  it('진행률 0-100 정상 계산', async () => {})
  it('완료 시 status: success', async () => {})
  it('실패 시 status: error + error 메시지', async () => {})
  it('retry 호출 시 재업로드', async () => {})
})
```

### 수동 테스트

| # | 항목 | 기대 결과 | 결과 | 비고 |
|---|------|----------|------|------|
| 1 | FAB → 사진 올리기 | UploadSheet 열림 | ⬜ | |
| 2 | 폴더 선택 | 카드형 폴더 목록 | ⬜ | |
| 3 | 사진 선택기 열림 | 모바일 갤러리 | ⬜ | |
| 4 | 복수 사진 선택 | 여러 장 선택 가능 | ⬜ | |
| 5 | 업로드 진행바 | 실시간 % 업데이트 | ⬜ | |
| 6 | 업로드 완료 | Drive에서 파일 확인 | ⬜ | |
| 7 | 갤러리 리프레시 | 업로드된 사진 표시 | ⬜ | |
| 8 | 업로드 실패 재시도 | 재시도 버튼 동작 | ⬜ | |
| 9 | 20MB 초과 파일 | 오류 메시지 표시 | ⬜ | |

---

## 📁 Phase 7 — 폴더 생성 테스트

**테스트 일자:** 미실행  
**결과:** ⬜ 미실행

### 수동 테스트

| # | 항목 | 기대 결과 | 결과 | 비고 |
|---|------|----------|------|------|
| 1 | FAB → 새 폴더 만들기 | CreateFolderSheet 열림 | ⬜ | |
| 2 | 예시 칩 클릭 | 입력 필드 자동 입력 | ⬜ | |
| 3 | 폴더명 입력 후 만들기 | Drive에 폴더 생성 | ⬜ | |
| 4 | 폴더 목록 즉시 갱신 | 새 폴더 목차에 표시 | ⬜ | |
| 5 | 생성 후 업로드 연결 | UploadSheet 연속 열림 | ⬜ | |

---

## 🖼️ Phase 8 — 사진 뷰어 테스트

**테스트 일자:** 미실행  
**결과:** ⬜ 미실행

### 수동 테스트

| # | 항목 | 기대 결과 | 결과 | 비고 |
|---|------|----------|------|------|
| 1 | 폴더 상세 진입 | 히어로 + 그리드 표시 | ⬜ | |
| 2 | 사진 클릭 | 라이트박스 전체화면 | ⬜ | |
| 3 | 좌우 터치 스와이프 | 사진 전환 | ⬜ | |
| 4 | 좌우 화살표 버튼 | 사진 전환 | ⬜ | |
| 5 | N/전체N 인디케이터 | 정확한 순서 표시 | ⬜ | |
| 6 | X 버튼 닫기 | 라이트박스 닫힘 | ⬜ | |
| 7 | 배경 클릭 닫기 | 라이트박스 닫힘 | ⬜ | |
| 8 | 스와이프 다운 닫기 | 라이트박스 닫힘 | ⬜ | |

---

## 🗺️ Phase 9 — 지도 테스트

**테스트 일자:** 미실행  
**결과:** ⬜ 미실행

### 단위 테스트

```typescript
// src/lib/map/__tests__/placeExtractor.test.ts
describe('placeExtractor', () => {
  it('"2026-08-강릉여행" → { name: "강릉", lat, lng }', () => {})
  it('"2026-10-부산가족모임" → 부산 좌표', () => {})
  it('"2026-09-추석" → null (지명 없음)', () => {})
  it('"2025-12-할머니집" → null (지명 불명확)', () => {})
})
```

### 수동 테스트

| # | 항목 | 기대 결과 | 결과 | 비고 |
|---|------|----------|------|------|
| 1 | 지도 화면 진입 | KakaoMap 렌더링 | ⬜ | |
| 2 | 여행 폴더 마커 표시 | 폴라로이드 마커 | ⬜ | |
| 3 | 마커 클릭 | 팝오버 표시 | ⬜ | |
| 4 | 팝오버 → 폴더 이동 | 해당 폴더 상세 | ⬜ | |
| 5 | 하단 카드 가로 스크롤 | 부드러운 스크롤 | ⬜ | |
| 6 | 카드 클릭 → 폴더 이동 | 해당 폴더 상세 | ⬜ | |

---

## 🚢 Phase 10 — 통합 & 성능 테스트

**테스트 일자:** 미실행  
**결과:** ⬜ 미실행

### E2E 전체 플로우

```typescript
// e2e/full-flow.spec.ts
test('전체 사용 시나리오: 사진 감상', async ({ page }) => {
  // 1. 입장 화면 접근
  // 2. 6자리 번호 입력
  // 3. 사진방 홈 진입
  // 4. 최근 사진 갤러리 확인
  // 5. 폴더 목차 확인
  // 6. 폴더 카드 클릭
  // 7. 폴더 상세 화면
  // 8. 사진 클릭 → 라이트박스
  // 9. 스와이프 전환
  // 10. 닫기
})

test('전체 사용 시나리오: 폴더 생성 + 업로드', async ({ page }) => {
  // 1. 입장
  // 2. FAB → 새 폴더 만들기
  // 3. 폴더명 입력
  // 4. 생성 완료
  // 5. 이 폴더에 사진 올리기
  // 6. 사진 선택 (테스트 이미지)
  // 7. 업로드 완료
  // 8. 갤러리 갱신 확인
})
```

### 성능 테스트

| # | 지표 | 목표 | 결과 | 비고 |
|---|------|------|------|------|
| 1 | Lighthouse Performance (모바일) | 80+ | ⬜ | |
| 2 | Lighthouse Accessibility | 90+ | ⬜ | |
| 3 | LCP (Largest Contentful Paint) | < 2.5s | ⬜ | |
| 4 | CLS (Cumulative Layout Shift) | < 0.1 | ⬜ | |
| 5 | FID (First Input Delay) | < 100ms | ⬜ | |

### 크로스브라우저 테스트

| # | 환경 | 항목 | 결과 |
|---|------|------|------|
| 1 | iOS 16+ Safari | 전체 플로우 | ⬜ |
| 2 | iOS 16+ Safari | 파일 업로드 | ⬜ |
| 3 | iOS 16+ Safari | 터치 스와이프 | ⬜ |
| 4 | Android Chrome | 전체 플로우 | ⬜ |
| 5 | Android Chrome | 파일 업로드 | ⬜ |
| 6 | Android Chrome | 숫자 키패드 | ⬜ |
| 7 | 데스크탑 Chrome | 전체 플로우 | ⬜ |
| 8 | 데스크탑 Safari | 전체 플로우 | ⬜ |

---

## 📋 버그 트래킹

> 발견된 버그는 여기에 기록한다.

| ID | Phase | 심각도 | 설명 | 상태 | 해결일 |
|----|-------|--------|------|------|--------|
| - | - | - | 아직 없음 | - | - |

### 심각도 정의
- 🔴 Critical: 기능 동작 불가
- 🟠 High: 주요 기능 손상
- 🟡 Medium: 기능은 동작하나 UX 불량
- 🟢 Low: 미관상 문제

---

*버전: v1.0.0 | 작성: 2026-05-10*
