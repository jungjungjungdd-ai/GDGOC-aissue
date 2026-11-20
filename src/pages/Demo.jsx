import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import mockAlerts from '../../data/alerts.json';
import { loadAlert } from '../lib/alerts.js';
import { loadCard } from '../lib/card.js';
import { saveProfile } from '../lib/storage.js';
import { SECTIONS, sortedItems } from '../lib/cardSections.js';
import { DEMO_PROFILES } from '../lib/demoProfiles.js';

// 시연용: 같은 재난문자를 프로필 A·B·C로 받았을 때 카드를 나란히 비교
export default function Demo() {
  const navigate = useNavigate();
  const [alertId, setAlertId] = useState(mockAlerts[0].id);
  const [alert, setAlert] = useState(null);
  const [view, setView] = useState('all'); // 'all' | 'A' | 'B' | 'C'
  const [cards, setCards] = useState({}); // { A: card | null | undefined }

  useEffect(() => {
    let cancelled = false;
    setCards({});
    (async () => {
      const a = await loadAlert(alertId);
      if (cancelled || !a) return;
      setAlert(a);
      // 세 프로필을 동시에 요청하고, 오는 대로 화면에 채운다
      DEMO_PROFILES.forEach(async (p) => {
        const card = await loadCard(a, p.profile, p.location);
        if (!cancelled) setCards((prev) => ({ ...prev, [p.id]: card }));
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [alertId]);

  // 이 프로필로 실제 앱 흐름 체험 (프로필 저장 → 카드 화면)
  const tryAsProfile = (p) => {
    saveProfile(p.profile);
    navigate(`/alerts/${alertId}/card`, { state: { location: p.location } });
  };

  const shown = view === 'all' ? DEMO_PROFILES : DEMO_PROFILES.filter((p) => p.id === view);

  return (
    <div className="demo">
      <header className="demo-head">
        <Link to="/" className="back">← 홈</Link>
        <h1>🎬 데모 모드</h1>
        <p className="muted small">같은 재난문자, 다른 사람 → 다른 행동 카드</p>
      </header>

      <div className="chip-group demo-alerts" role="group" aria-label="재난문자 선택">
        {mockAlerts.map((a) => (
          <button
            key={a.id}
            type="button"
            className={`chip${a.id === alertId ? ' selected' : ''}`}
            aria-pressed={a.id === alertId}
            onClick={() => setAlertId(a.id)}
          >
            {a.title}
          </button>
        ))}
      </div>

      {alert && <p className="alert-box demo-message">{alert.message}</p>}

      <div className="demo-switch" role="group" aria-label="프로필 전환">
        <button type="button" className={view === 'all' ? 'on' : ''} onClick={() => setView('all')}>
          전체 비교
        </button>
        {DEMO_PROFILES.map((p) => (
          <button key={p.id} type="button" className={view === p.id ? 'on' : ''} onClick={() => setView(p.id)}>
            {p.emoji} {p.id}
          </button>
        ))}
      </div>

      <div className={`demo-grid${view === 'all' ? '' : ' single'}`}>
        {shown.map((p) => {
          const card = cards[p.id];
          return (
            <article key={p.id} className="demo-col">
              <div className="demo-profile">
                <h2>
                  {p.emoji} {p.id}. {p.label}
                </h2>
                <div className="demo-tags">
                  {p.summary.map((t) => (
                    <span key={t} className="badge">{t}</span>
                  ))}
                </div>
              </div>

              {card === undefined && (
                <div className="loading" role="status">
                  <div className="spinner" aria-hidden="true" />
                  <p className="small muted">카드 만드는 중…</p>
                </div>
              )}
              {card === null && <p className="notice">카드를 불러오지 못했어요.</p>}
              {card && (
                <>
                  {card.fallback && <p className="notice small">기본 안내 (AI 응답 실패)</p>}
                  {SECTIONS.map((s) => {
                    const items = sortedItems(card, s.key);
                    if (!items.length) return null;
                    return (
                      <section key={s.key} className={`action-section ${s.className}`}>
                        <h3>
                          <span aria-hidden="true">{s.icon}</span> {s.title}
                        </h3>
                        <ol>
                          {items.map((it, i) => (
                            <li key={i}>{it.text}</li>
                          ))}
                        </ol>
                      </section>
                    );
                  })}
                  {card.needEvacuation && <p className="demo-evac">🏃 대피 필요 → 대피소 안내</p>}
                </>
              )}

              <button type="button" className="btn-outline" onClick={() => tryAsProfile(p)}>
                이 프로필로 앱 체험
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
