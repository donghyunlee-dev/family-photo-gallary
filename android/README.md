# 찐앨범 Android 앱

이 폴더는 `https://family-photo-gallary.vercel.app` 를 WebView로 감싸는 안드로이드 앱 프로젝트입니다.

## 앱 정보

- 앱 이름: `찐앨범`
- 패키지명: `com.windsoft.familyphotogallery`
- 최소 Android: `7.0 (API 24)`

## 빌드 전 준비

1. Android Studio 설치
2. Android SDK 35 설치
3. 이 `android` 폴더를 Android Studio로 열기

## APK 빌드

1. Android Studio에서 `Build > Build Bundle(s) / APK(s) > Build APK(s)`
2. 생성된 파일 경로:
   `android/app/build/outputs/apk/release/app-release.apk`

## Google Drive 배포

1. `photo/family-photo-gallery/app` 폴더에 `app-release.apk` 업로드
2. 공유 설정을 설치 대상 가족 계정이 접근 가능하도록 변경
3. 파일 ID를 확인한 뒤 다운로드 링크를 아래 형식으로 생성

```text
https://drive.google.com/uc?export=download&id=FILE_ID
```

4. 웹 프로젝트의 `.env.local` 또는 배포 환경 변수에 아래 값 설정

```text
NEXT_PUBLIC_ANDROID_APK_URL=https://drive.google.com/uc?export=download&id=FILE_ID
```
