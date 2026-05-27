export type MockPhoto = {
  id: string;
  name: string;
};

export type MockFolder = {
  id: string;
  name: string;
};

export const MOCK_ROOM_PHOTOS: MockPhoto[] = [
  { id: "mock-photo-1", name: "여름 수영장" },
  { id: "mock-photo-2", name: "놀이공원 펭귄" },
  { id: "mock-photo-3", name: "안경 셀피" },
  { id: "mock-photo-4", name: "라벤더 드레스" },
  { id: "mock-photo-5", name: "캠핑 저녁" },
  { id: "mock-photo-6", name: "가을 산책" },
  { id: "mock-photo-7", name: "주방 브런치" },
  { id: "mock-photo-8", name: "겨울 눈사람" },
];

export const MOCK_ROOM_FOLDERS: MockFolder[] = [
  { id: "mock-folder-1", name: "안동" },
  { id: "mock-folder-2", name: "제주 여름" },
  { id: "mock-folder-3", name: "서울 주말" },
  { id: "mock-folder-4", name: "생일 파티" },
];

export const MOCK_FOLDER_PHOTOS: MockPhoto[] = [
  { id: "mock-folder-photo-1", name: "안동 하회마을" },
  { id: "mock-folder-photo-2", name: "노을 산책" },
  { id: "mock-folder-photo-3", name: "한옥 창문" },
  { id: "mock-folder-photo-4", name: "간식 타임" },
  { id: "mock-folder-photo-5", name: "저녁 식탁" },
];

export const MOCK_CHILD_FOLDERS: MockFolder[] = [
  { id: "mock-child-1", name: "숙소" },
  { id: "mock-child-2", name: "산책" },
  { id: "mock-child-3", name: "먹거리" },
];

const MOCK_PALETTES = [
  ["#f4d7c1", "#d38b5d"],
  ["#d7e4f4", "#6b89b5"],
  ["#efe3d0", "#826242"],
  ["#d9ead7", "#4d7a57"],
  ["#f0d7e7", "#a8648e"],
  ["#e8e0f7", "#7762b4"],
];

export function getMockPhotoDataUrl(name: string, index: number) {
  const [base, accent] = MOCK_PALETTES[index % MOCK_PALETTES.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${base}" />
          <stop offset="100%" stop-color="${accent}" />
        </linearGradient>
      </defs>
      <rect width="1200" height="1500" fill="url(#bg)" />
      <rect x="72" y="72" width="1056" height="1356" rx="44" fill="rgba(255,255,255,0.18)" />
      <circle cx="930" cy="380" r="180" fill="rgba(255,255,255,0.20)" />
      <path d="M0 1180C220 1020 360 980 550 1020C760 1060 900 1160 1200 980V1500H0Z" fill="rgba(44,33,24,0.15)" />
      <text x="96" y="1260" fill="#fffaf4" font-size="72" font-family="Georgia, serif">${name}</text>
      <text x="96" y="1340" fill="rgba(255,250,244,0.82)" font-size="28" font-family="Arial, sans-serif">Family editorial archive</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}
