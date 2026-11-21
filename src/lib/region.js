import { distanceM } from './shelters.js';

// 재난문자 지역(area) → 중심 좌표와 영향 반경
// 지금은 목데이터 지역만 넣어 둠. 지역이 늘면 여기에 추가.
const AREAS = {
  // 시흥시: 민방위대피시설 전체의 평균 위치, 반경은 시 전체를 덮는 12km
  '경기도 시흥시': { lat: 37.3862, lng: 126.7766, radiusM: 12000 },
  '서울특별시 마포구': { lat: 37.5663, lng: 126.9019, radiusM: 5000 },
  서울특별시: { lat: 37.5665, lng: 126.978, radiusM: 20000 },
};

// 반환: { status: 'inside' | 'outside' | 'unknown', distanceM? }
export function checkImpact(area, coords) {
  const center = AREAS[area?.trim()];
  if (!center || coords?.latitude == null || coords?.longitude == null) {
    return { status: 'unknown' };
  }
  const d = distanceM(center.lat, center.lng, coords.latitude, coords.longitude);
  return { status: d > center.radiusM ? 'outside' : 'inside', distanceM: d };
}
