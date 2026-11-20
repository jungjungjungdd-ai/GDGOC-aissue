import { getAlert } from './api.js';
import mockAlerts from '../../data/alerts.json';

// 재난문자 1건 가져오기
// 서버(API)가 안 될 때는 앱에 들어 있는 목데이터로 대신 보여준다 (시연 안전장치)
export async function loadAlert(id) {
  try {
    const d = await getAlert(id);
    return d.alert ?? null;
  } catch {
    return mockAlerts.find((a) => a.id === id) ?? null;
  }
}
