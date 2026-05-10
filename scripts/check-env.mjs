const required = [
  "GOOGLE_SERVICE_ACCOUNT_EMAIL",
  "GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY",
  "GOOGLE_DRIVE_ROOT_FOLDER_ID",
  "DRIVE_FOLDER_OUR_FAMILY",
  "DRIVE_FOLDER_MY_PARENTS",
  "DRIVE_FOLDER_WIFE_PARENTS",
  "ROOM_CODE_OUR_FAMILY",
  "ROOM_CODE_MY_PARENTS",
  "ROOM_CODE_WIFE_PARENTS",
];

const publicRequired = ["NEXT_PUBLIC_KAKAO_MAP_KEY"];

const missing = required.filter((key) => !process.env[key] || !process.env[key].trim());
const missingPublic = publicRequired.filter(
  (key) => !process.env[key] || !process.env[key].trim(),
);

if (missing.length === 0 && missingPublic.length === 0) {
  console.log("ENV OK: all required variables are set.");
  process.exit(0);
}

if (missing.length > 0) {
  console.error("Missing server env vars:");
  for (const key of missing) console.error(`- ${key}`);
}

if (missingPublic.length > 0) {
  console.error("Missing public env vars:");
  for (const key of missingPublic) console.error(`- ${key}`);
}

process.exit(1);
