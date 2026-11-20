import mockAlerts from '../../data/alerts.json';
import { loadCard } from './card.js';
import { loadShelters } from './shelters.js';
import { getOfflineBundle, saveOfflineBundle } from './storage.js';

// 오프라인 사전 카드: 재난 5종 카드 + 대피소 목록을 미리 만들어 폰에 저장
export const DISASTERS = [
  { type: 'heavy_rain', label: '호우', icon: '🌧️' },
  { type: 'typhoon', label: '태풍', icon: '🌀' },
  { type: 'earthquake', label: '지진', icon: '🫨' },
  { type: 'fire', label: '화재', icon: '🔥' },
  { type: 'heatwave', label: '폭염', icon: '🌡️' },
];

// 오프라인 카드는 "집에 있을 때" 기준으로 만든다
const OFFLINE_PLACE = { placeType: 'home' };

// 프로필이 바뀌었는지 비교용 (보호자 연락처는 카드와 무관하니 제외)
function profileKey(profile) {
  // eslint-disable-next-line no-unused-vars
  const { guardian, ...rest } = profile ?? {};
  return JSON.stringify(rest);
}

export function isBundleFresh(profile) {
  const bundle = getOfflineBundle();
  if (!bundle || bundle.profileKey !== profileKey(profile)) return false;
  // 기본 카드(AI 실패)가 섞여 있으면 10분 뒤 다시 만들어 본다
  const hasFallback = Object.values(bundle.cards ?? {}).some((c) => c.fallback);
  const ageMs = Date.now() - new Date(bundle.createdAt).getTime();
  return !(hasFallback && ageMs > 10 * 60 * 1000);
}

let building = null; // 동시에 여러 번 만들지 않도록

export function buildOfflineBundle(profile) {
  if (!profile || !navigator.onLine) return Promise.resolve(null);
  if (building) return building;

  building = (async () => {
    const cards = {};
    await Promise.all(
      DISASTERS.map(async (d) => {
        const alert = mockAlerts.find((a) => a.disasterType === d.type);
        if (!alert) return;
        const card = await loadCard(alert, profile, OFFLINE_PLACE);
        if (card) cards[d.type] = { ...card, alertTitle: alert.title };
      }),
    );
    const shelters = await loadShelters({
      wheelchair: profile.mobility === 'wheelchair',
      limit: 5,
    });
    const bundle = {
      version: 1,
      profileKey: profileKey(profile),
      createdAt: new Date().toISOString(),
      cards,
      shelters: shelters.items,
      shelterBase: shelters.baseLocation,
    };
    saveOfflineBundle(bundle);
    return bundle;
  })().finally(() => {
    building = null;
  });

  return building;
}

export function getOfflineCard(disasterType) {
  const card = getOfflineBundle()?.cards?.[disasterType];
  return card ? { ...card, offline: true } : null;
}

// 연결이 끊겼을 때 못 보낸 보호자 공유 메시지
const PENDING_SHARE = 'aissue.pendingShare';
export const getPendingShare = () => localStorage.getItem(PENDING_SHARE);
export const savePendingShare = (text) => localStorage.setItem(PENDING_SHARE, text);
export const clearPendingShare = () => localStorage.removeItem(PENDING_SHARE);
