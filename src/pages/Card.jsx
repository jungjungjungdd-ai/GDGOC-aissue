import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { loadAlert } from '../lib/alerts.js';
import { loadCard } from '../lib/card.js';
import { getProfile } from '../lib/storage.js';

const SECTIONS = [
  { key: 'now', title: '지금 바로', icon: '🚨', className: 'sec-now' },
  { key: 'within10Minutes', title: '10분 안에', icon: '⏱️', className: 'sec-soon' },
  { key: 'doNot', title: '하지 마세요', icon: '❌', className: 'sec-dont' },
];

export default function Card() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const place = state?.location;

  const [alert, setAlert] = useState(null);
  const [card, setCard] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | done | error

  useEffect(() => {
    if (!place) return;
    let cancelled = false;
    (async () => {
      const a = await loadAlert(id);
      if (cancelled) return;
      setAlert(a);
      if (!a) {
        setStatus('error');
        return;
      }
      const c = await loadCard(a, getProfile(), place);
      if (cancelled) return;
      setCard(c);
      setStatus(c ? 'done' : 'error');
    })();
    return () => {
      cancelled = true;
    };
  }, [id, place]);

  // 장소를 고르지 않고 바로 들어오면 위치 확인 화면으로
  if (!place) return <Navigate to={`/alerts/${id}/location`} replace />;

  if (status === 'loading') {
    return (
      <div className="screen loading-screen" role="status" aria-live="polite">
        <div className="spinner" aria-hidden="true" />
        <h1>나에게 맞는 행동을<br />정리하고 있어요</h1>
        <p className="muted">잠시만 기다려 주세요…</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="screen">
        <Link to="/" className="back">← 홈</Link>
        <h1>카드를 불러오지 못했어요</h1>
        <p>침착하게 주변의 안내 방송을 따르고, 위급하면 바로 119에 신고하세요.</p>
        <a href="tel:119" className="btn-primary call">📞 119 신고</a>
      </div>
    );
  }

  return (
    <div className="screen card-screen">
      <Link to={`/alerts/${id}/location`} className="back">← 장소 다시 고르기</Link>

      {alert && (
        <p className="card-alert">
          <strong>{alert.title}</strong> · {alert.area}
        </p>
      )}
      {card.fallback && (
        <p className="notice">기본 안내를 보여 드리고 있어요. (맞춤 안내를 불러오지 못했어요)</p>
      )}

      {SECTIONS.map((s) => {
        const items = [...card.sections[s.key]].sort((a, b) => (a.priority ?? 9) - (b.priority ?? 9));
        if (!items.length) return null;
        return (
          <section key={s.key} className={`action-section ${s.className}`}>
            <h2>
              <span aria-hidden="true">{s.icon}</span> {s.title}
            </h2>
            <ol>
              {items.map((it, i) => (
                <li key={i}>{it.text}</li>
              ))}
            </ol>
          </section>
        );
      })}

      {card.needEvacuation && (
        <button
          type="button"
          className="btn-primary"
          onClick={() => navigate('/shelters', { state: { location: place, alertId: id } })}
        >
          🏃 갈 수 있는 대피소 보기
        </button>
      )}
      <a href="tel:119" className="btn-outline call">📞 119 신고</a>

      {card.sources.length > 0 && (
        <footer className="sources">
          출처: {card.sources.map((src) => [src.title, src.section].filter(Boolean).join(' · ')).join(', ')}
          <br />
          행정안전부 국민행동요령
        </footer>
      )}
    </div>
  );
}
