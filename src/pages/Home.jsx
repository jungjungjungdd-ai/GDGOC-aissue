import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAlerts } from '../lib/api.js';
import { getLastReceivedAlert, getProfile } from '../lib/storage.js';
import mockAlerts from '../../data/alerts.json';

// "3분 전" 같은 표시
function timeAgo(iso) {
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  return h < 24 ? `${h}시간 전` : `${Math.floor(h / 24)}일 전`;
}

const LANG = { ko: '한국어', en: 'English', vi: 'Tiếng Việt', zh: '中文' };
const HOUSING = { semi_basement: '반지하', low_floor: '저층', high_floor: '고층' };

export default function Home() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const profile = getProfile();
  const lastReceived = getLastReceivedAlert();

  useEffect(() => {
    getAlerts()
      .then((d) => setAlerts(Array.isArray(d) ? d : d.items ?? d.alerts ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  // 테스트 발송으로 받은 문자가 있으면 그걸 최신으로, 없으면 목록의 첫 번째
  const received = lastReceived
    ? [...alerts, ...mockAlerts].find((a) => a.id === lastReceived.alertId)
    : null;
  const latest = received ?? alerts[0];

  return (
    <div>
      <h1>재난 대응</h1>

      <section className="card">
        <h2>
          최근 재난문자 <span className="badge">목데이터</span>
        </h2>
        {loading && <p className="muted">불러오는 중…</p>}
        {!loading && latest && (
          <Link to={`/alerts/${latest.id}/location`} className="alert">
            {received && (
              <span className="received-at">📩 {timeAgo(lastReceived.receivedAt)} 받은 문자</span>
            )}
            <strong>{latest.title}</strong>
            <p>{latest.message}</p>
          </Link>
        )}
        {!loading && !latest && <p className="muted">받은 재난문자가 없어요.</p>}
        <Link to="/alerts" className="link">전체 보기 →</Link>
      </section>

      <section className="card">
        <h2>내 프로필</h2>
        {profile ? (
          <p>
            언어: {LANG[profile.language] ?? profile.language} · 주거:{' '}
            {HOUSING[profile.housingType] ?? profile.housingType}
          </p>
        ) : (
          <p className="muted">아직 프로필이 없어요.</p>
        )}
        <Link to="/my" className="link">수정하기 →</Link>
      </section>
    </div>
  );
}
