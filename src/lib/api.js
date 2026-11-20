// 서버 호출 함수 모음 (API 명세서 풀버전 10장)
// 화면에서는 fetch를 직접 쓰지 말고 이 함수들만 사용

async function request(path, { method = 'GET', body, query } = {}) {
  const qs = query
    ? '?' +
      new URLSearchParams(
        Object.entries(query).filter(([, v]) => v !== undefined && v !== null)
      ).toString()
    : '';
  const res = await fetch(path + qs, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw data.error;
  return data;
}

export const getAlerts = () => request('/api/alerts');
export const getAlert = (id) => request(`/api/alerts/${id}`);
export const getPublicKey = () => request('/api/push/public-key');
export const sendTestPush = (alertId, subscription) =>
  request('/api/push/test', { method: 'POST', body: { alertId, subscription } });
export const createCard = (alertId, profile, location) =>
  request('/api/card', { method: 'POST', body: { alertId, profile, location } });
export const getShelters = (query) => request('/api/shelters', { query });
export const getOfflineBundle = (profile) =>
  request('/api/offline-bundle', { method: 'POST', body: { profile } });
