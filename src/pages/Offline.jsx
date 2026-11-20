import { useState } from 'react';
import { getOfflineBundle, getProfile } from '../lib/storage.js';
import { DISASTERS, buildOfflineBundle } from '../lib/offline.js';
import { SECTIONS, sortedItems } from '../lib/cardSections.js';
import { formatDistance } from '../lib/shelters.js';
import { useOnline } from '../lib/useOnline.js';

function formatTime(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 인터넷 없이 볼 수 있는 저장된 카드·대피소
export default function Offline() {
  const online = useOnline();
  const [bundle, setBundle] = useState(getOfflineBundle());
  const [type, setType] = useState(null);
  const [building, setBuilding] = useState(false);

  const rebuild = async () => {
    setBuilding(true);
    const b = await buildOfflineBundle(getProfile());
    if (b) setBundle(b);
    setBuilding(false);
  };

  const card = type ? bundle?.cards?.[type] : null;

  return (
    <div>
      <h1>저장된 행동 카드</h1>
      <p className={online ? 'muted' : 'notice'}>
        {online
          ? '인터넷이 끊겨도 이 화면에서 바로 볼 수 있어요. (집에 있을 때 기준)'
          : '📵 인터넷이 끊겼어요. 미리 저장해 둔 카드를 보여 드려요.'}
      </p>

      {!bundle && (
        <div className="notice">
          아직 저장된 카드가 없어요.
          {online ? ' 아래 버튼을 눌러 지금 만들어 두세요.' : ' 인터넷이 연결되면 자동으로 만들어져요.'}
        </div>
      )}

      {online && getProfile() && (
        <button type="button" className="btn-outline" onClick={rebuild} disabled={building}>
          {building ? '카드 만드는 중… (5종)' : bundle ? '🔄 최신 프로필로 다시 저장' : '📦 오프라인 카드 만들기'}
        </button>
      )}

      {bundle && (
        <>
          <p className="muted small offline-meta">저장 시각: {formatTime(bundle.createdAt)}</p>
          <div className="offline-types" role="group" aria-label="재난 종류">
            {DISASTERS.map((d) => (
              <button
                key={d.type}
                type="button"
                className={`place${type === d.type ? ' selected' : ''}`}
                aria-pressed={type === d.type}
                onClick={() => setType(d.type)}
                disabled={!bundle.cards?.[d.type]}
              >
                <span className="place-icon" aria-hidden="true">{d.icon}</span>
                {d.label}
              </button>
            ))}
          </div>
        </>
      )}

      {card && (
        <div className="offline-card">
          {card.fallback && <p className="notice small">기본 안내 카드예요. (저장할 때 맞춤 카드를 못 받았어요)</p>}
          {SECTIONS.map((s) => {
            const items = sortedItems(card, s.key);
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
          <a href="tel:119" className="btn-outline call">📞 119 신고</a>

          {bundle.shelters?.length > 0 && (
            <>
              <h2 className="offline-sub">가까운 대피소 (저장본)</h2>
              <ul className="shelter-list">
                {bundle.shelters.map((s) => (
                  <li key={s.id} className="shelter">
                    <div className="shelter-head">
                      <strong>{s.name}</strong>
                      <span className="shelter-dist">{formatDistance(s.distanceM)}</span>
                    </div>
                    <p className="muted small">{s.address}</p>
                    <div className="shelter-tags">
                      {s.rampAvailable && <span className="badge">♿ 경사로</span>}
                      {s.petAllowed && <span className="badge">🐾 반려동물</span>}
                    </div>
                    {online ? (
                      <a className="btn-primary" href={s.mapUrl} target="_blank" rel="noreferrer">길찾기</a>
                    ) : (
                      <p className="muted small">지도는 인터넷이 연결되면 열 수 있어요. 주소를 보고 이동하세요.</p>
                    )}
                  </li>
                ))}
              </ul>
              <p className="muted small">
                {bundle.shelterBase === 'gps' ? '거리는 저장할 때 위치 기준이에요.' : '거리는 마포구청 기준이에요. (샘플 데이터)'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
