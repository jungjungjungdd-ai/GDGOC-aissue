import { createCard } from './api.js';
import { getOfflineBundle } from './storage.js';
import fallbackData from '../../data/fallback-cards.json';

const FALLBACKS = fallbackData.fallbackCards ?? fallbackData;

// 응답 모양을 화면에서 쓰기 좋게 맞춘다
// (예전 형식 shelterSearch.available도 needEvacuation으로 읽음)
function normalize(card, extra = {}) {
  return {
    needEvacuation: card.needEvacuation ?? card.shelterSearch?.available ?? false,
    sections: {
      now: card.sections?.now ?? [],
      within10Minutes: card.sections?.within10Minutes ?? [],
      doNot: card.sections?.doNot ?? [],
    },
    sources: card.sources ?? [],
    fallback: card.fallback ?? false,
    debugReason: card.debugReason, // 로컬 개발에서만 서버가 보내 줌
    ...extra,
  };
}

// 앱에 들어 있는 기본 카드 (서버가 아예 안 될 때)
export function getLocalFallbackCard(disasterType) {
  const key = disasterType === 'heatwave' && !FALLBACKS.heatwave ? 'heat_wave' : disasterType;
  const card = FALLBACKS[key];
  if (!card) return null;
  return normalize(card, { fallback: true });
}

// 행동 카드 가져오기: 서버(AI) → 실패하면 앱의 기본 카드
export async function loadCard(alert, profile, location) {
  // 보호자 연락처는 서버로 보내지 않음 (API 명세서 2-2)
  // 반려동물 항목은 기능에서 제외됨 → 예전에 저장된 값이 있어도 보내지 않음
  // eslint-disable-next-line no-unused-vars
  const { guardian, pets, ...profileToSend } = profile ?? {};
  try {
    const card = await createCard(alert.id, profileToSend, location);
    return normalize(card);
  } catch (error) {
    // 미리 저장해 둔 맞춤 카드가 있으면 그걸 먼저 (오프라인 대비, 이슈 #20)
    const saved = getOfflineBundle()?.cards?.[alert.disasterType];
    if (saved) return { ...saved, offline: true };
    const card = getLocalFallbackCard(alert.disasterType);
    if (card && import.meta.env.DEV) card.debugReason = 'API 요청 실패: ' + (error?.message ?? error);
    return card;
  }
}
