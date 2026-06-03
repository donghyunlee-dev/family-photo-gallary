# Family Photo Gallary

가족 전용 비공개 사진 갤러리 웹앱입니다. 로그인 화면에서 안드로이드용 `찐앨범` APK 다운로드 진입도 함께 제공합니다.

## Web app

```bash
npm run dev
```

- 운영 주소: `https://family-photo-gallary.vercel.app`
- APK 다운로드 링크 환경 변수:

```text
NEXT_PUBLIC_ANDROID_APK_URL=https://drive.google.com/uc?export=download&id=FILE_ID
```

## Android wrapper

- 위치: `android/`
- 앱 이름: `찐앨범`
- 패키지명: `com.windsoft.familyphotogallery`
- 동작: Vercel 사이트를 `WebView` 로 감싸 실행

자세한 빌드와 Google Drive 배포 절차는 `android/README.md` 를 참고하세요.
