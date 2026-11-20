import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAlerts } from '../lib/api.js';
import { getProfile } from '../lib/storage.js';

const LANG = { ko: '한국어', en: 'English', vi: 'Tiếng Việt', zh: '中文' };
const HOUSING = { semi_basement: '반지하', low_floor: '저층', high_floor: '고층' };

export default function Home() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const profile = getProfile();

  useEffect(() => {
    getAlerts()
      .then((d) => setAlerts(Array.isArray(d) ? d : d.items ?? d.alerts ?? []))
      .catch(() => setAlerts([]))
      .finally(() => setLoading(false));
  }, []);

  const latest = alerts[0];

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
