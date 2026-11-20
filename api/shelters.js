import fs from 'fs';
import path from 'path';

// GET /api/shelters : 조건별 대피소 (거리순) - 명세서 6-1

// 좌표가 없을 때 기준점: 시흥시 민방위대피시설 전체의 평균 위치
const DEFAULT_CENTER = { latitude: 37.3862, longitude: 126.7766 };
const DATA_SOURCE = '경기 시흥시 민방위대피시설 현황(공공데이터)';
const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

// 오류 응답 (명세서 1-2 형식)
function sendError(res, status, code, message, field) {
  const error = { code, message };
  if (field) error.field = field;
  return res.status(status).json({ error });
}

// 두 좌표 사이 거리(m) - 하버사인 공식
function getDistanceM(lat1, lng1, lat2, lng2) {
  const R = 6371000; // 지구 반지름(m)
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// "true" / "false" 글자를 참·거짓으로 (없으면 false, 이상한 값이면 null)
function parseBoolean(value) {
  if (value === undefined || value === '') return false;
  if (value === 'true') return true;
  if (value === 'false') return false;
  return null;
}

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return sendError(res, 405, 'METHOD_NOT_ALLOWED', 'GET 요청만 가능합니다.');
  }

  const { lat, lng, wheelchair, pet, limit } = req.query;

  // 1. 위치 확인: lat, lng는 둘 다 있거나 둘 다 없어야 함
  const hasLat = lat !== undefined && lat !== '';
  const hasLng = lng !== undefined && lng !== '';

  if (hasLat !== hasLng) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'lat과 lng는 함께 보내야 합니다.', hasLat ? 'lng' : 'lat');
  }

  let base = DEFAULT_CENTER;
  let baseLocation = 'default';

  if (hasLat && hasLng) {
    const latNum = Number(lat);
    const lngNum = Number(lng);
    if (Number.isNaN(latNum) || latNum < -90 || latNum > 90) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'lat 값이 올바르지 않습니다.', 'lat');
    }
    if (Number.isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'lng 값이 올바르지 않습니다.', 'lng');
    }
    base = { latitude: latNum, longitude: lngNum };
    baseLocation = 'gps';
  }

  // 2. 조건 확인
  const needRamp = parseBoolean(wheelchair);
  if (needRamp === null) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'wheelchair는 true 또는 false여야 합니다.', 'wheelchair');
  }
  const needPet = parseBoolean(pet);
  if (needPet === null) {
    return sendError(res, 400, 'VALIDATION_ERROR', 'pet은 true 또는 false여야 합니다.', 'pet');
  }

  // 3. 개수 확인 (기본 5, 최대 10)
  let maxCount = DEFAULT_LIMIT;
  if (limit !== undefined && limit !== '') {
    const limitNum = Number(limit);
    if (!Number.isInteger(limitNum) || limitNum < 1) {
      return sendError(res, 400, 'VALIDATION_ERROR', 'limit은 1 이상의 정수여야 합니다.', 'limit');
    }
    maxCount = Math.min(limitNum, MAX_LIMIT);
  }

  try {
    const filePath = path.join(process.cwd(), 'data', 'shelters.json');
    const shelters = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const items = shelters
      // 공공데이터에는 경사로·반려동물 정보가 없음(null) → '없음(false)'으로 확인된 곳만 제외
      .filter((s) => !needRamp || s.rampAvailable !== false)
      .filter((s) => !needPet || s.petAllowed !== false)
      .map((s) => ({
        ...s,
        distanceM: Math.round(getDistanceM(base.latitude, base.longitude, s.latitude, s.longitude)),
        mapUrl: `https://map.kakao.com/link/to/${encodeURIComponent(s.name)},${s.latitude},${s.longitude}`,
      }))
      .sort((a, b) => a.distanceM - b.distanceM) // 가까운 순
      .slice(0, maxCount);                       // limit 개수만

    return res.status(200).json({ dataStatus: 'public', source: DATA_SOURCE, baseLocation, items });
  } catch (e) {
    return sendError(res, 500, 'SERVER_ERROR', '대피소 정보를 불러오지 못했습니다.');
  }
}