// 시연용 샘플 프로필 (같은 재난문자 → 다른 카드)
export const DEMO_PROFILES = [
  {
    id: 'A',
    label: '휠체어 · 반지하',
    emoji: '♿',
    summary: ['휠체어 사용', '혼자 거주', '반지하', '집'],
    profile: {
      language: 'ko',
      mobility: 'wheelchair',
      sensory: [],
      livesAlone: true,
      dependents: [],
      housingType: 'semi_basement',
    },
    location: { placeType: 'home' },
  },
  {
    id: 'B',
    label: '베트남 유학생 · 지하철',
    emoji: '🇻🇳',
    summary: ['베트남어', '혼자 거주', '고층', '지하철'],
    profile: {
      language: 'vi',
      mobility: 'none',
      sensory: [],
      livesAlone: true,
      dependents: [],
      housingType: 'high_floor',
    },
    location: { placeType: 'underground' },
  },
  {
    id: 'C',
    label: '청각 제약 · 영유아 가구',
    emoji: '👶',
    summary: ['청각 제약', '영유아와 거주', '저층', '집'],
    profile: {
      language: 'ko',
      mobility: 'none',
      sensory: ['hearing'],
      livesAlone: false,
      dependents: ['infant'],
      housingType: 'low_floor',
    },
    location: { placeType: 'home' },
  },
];
