# Deployment Setup (Google Drive + Vercel)

## 1) Local environment setup
1. Create `.env.local` from `.env.example`.
2. Fill all values.
3. Run:

```bash
npm run check:env
```

If any key is missing, the command fails with the missing variable list.

## 2) Google Drive setup
1. Create a Google Cloud project.
2. Enable Google Drive API.
3. Create a Service Account.
4. Generate a JSON key.
5. Create root folder `/family-photo-gallery` in Google Drive.
6. Share the root folder with the Service Account email as `Editor`.
7. Create subfolders:
- `our-family`
- `my-parents-family`
- `wife-parents-family`
8. Copy the root/subfolder IDs into env values:
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- `DRIVE_FOLDER_OUR_FAMILY`
- `DRIVE_FOLDER_MY_PARENTS`
- `DRIVE_FOLDER_WIFE_PARENTS`

## 3) Vercel project setup
1. Push this repository to GitHub.
2. Import project in Vercel.
3. Framework preset: `Next.js`.
4. Build command: `npm run build`.
5. Install command: `npm install`.
6. Output directory: leave default (`.next`).

## 4) Vercel environment variables
Set these in Vercel Project Settings > Environment Variables:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`
- `DRIVE_FOLDER_OUR_FAMILY`
- `DRIVE_FOLDER_MY_PARENTS`
- `DRIVE_FOLDER_WIFE_PARENTS`
- `NEXT_PUBLIC_KAKAO_MAP_KEY`
- `ROOM_CODE_OUR_FAMILY`
- `ROOM_CODE_MY_PARENTS`
- `ROOM_CODE_WIFE_PARENTS`

For `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`, paste the full key with line breaks preserved.

## 5) Deploy and verify
1. Trigger deployment in Vercel.
2. Open deployment URL.
3. Smoke check:
- Entry page renders.
- Wrong 6-digit code is rejected.
- Correct room code moves to room route.

## 6) Iteration workflow
After each phase step:
1. You upload test photos directly to Google Drive.
2. Redeploy from Vercel.
3. Validate behavior on deployed URL.
