import { getShelters } from './api.js';
import shelterData from '../../data/shelters.json';

// 위치를 못 받았을 때 기준점: 시흥시 민방위대피시설 전체의 평균 위치
export const DEFAULT_CENTER = { lat: 37.3862, lng: 126.7766 };
export const DATA_SOURCE = '경기 시흥시 민방위대피시설 현황(공공데이터)';

export function kakaoMapUrl(name, lat, lng) {
  return `https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`;
}

export function distanceM(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(a)));
}

// API가 없거나 실패하면 앱에 들어 있는 같은 공공데이터로 직접 계산
function localShelters({ lat, lng, wheelchair, pet, limit }) {
  const hasGps = lat != null && lng != null;
  const base = hasGps ? { lat, lng } : DEFAULT_CENTER;
  const items = shelterData
    // 경사로·반려동물 정보가 없는(null) 곳은 빼지 않음
    .filter((s) => (!wheelchair || s.rampAvailable !== false) && (!pet || s.petAllowed !== false))
    .map((s) => ({
      ...s,
      distanceM: distanceM(base.lat, base.lng, s.latitude, s.longitude),
      mapUrl: kakaoMapUrl(s.name, s.latitude, s.longitude),
    }))
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, limit);
  return { dataStatus: 'public', source: DATA_SOURCE, baseLocation: hasGps ? 'gps' : 'default', items };
}

export async function loadShelters({ lat, lng, wheelchair = false, pet = false, limit = 5 }) {
  try {
    const query = { wheelchair, pet, limit };
    if (lat != null && lng != null) Object.assign(query, { lat, lng });
    const data = await getShelters(query);
    if (!Array.isArray(data?.items)) throw new Error('bad response');
    return {
      ...data,
      items: data.items.map((s) => ({
        ...s,
        mapUrl: s.mapUrl || kakaoMapUrl(s.name, s.latitude, s.longitude),
      })),
    };
  } catch {
    return localShelters({ lat, lng, wheelchair, pet, limit });
  }
}

export function formatDistance(m) {
  if (m == null) return '';
  return m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`;
}
