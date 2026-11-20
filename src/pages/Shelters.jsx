import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getProfile } from '../lib/storage.js';
import { loadAlert } from '../lib/alerts.js';
import { loadShelters, formatDistance, DATA_SOURCE } from '../lib/shelters.js';

function getCoords() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 60000 },
    );
  });
}

export default function Shelters() {
  const { state } = useLocation();
  const profile = getProfile();
  const wheelchair = profile?.mobility === 'wheelchair';

  const [result, setResult] = useState(null);
  const [alert, setAlert] = useState(null);
  const [sharing, setSharing] = useState(null); // 공유할 대피소
  const [toast, setToast] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      let coords = state?.location;
      if (coords?.latitude == null) coords = await getCoords();
      const r = await loadShelters({
        lat: coords?.latitude,
        lng: coords?.longitude,
        wheelchair,
      });
      if (alive) setResult(r);
    })();
    if (state?.alertId) {
      loadAlert(state.alertId).then((a) => alive && setAlert(a)).catch(() => {});
    }
    return () => { alive = false; };
  }, [state, wheelchair]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const shareMessage = (s) => {
    const who = profile?.guardian?.name ? `${profile.guardian.name}님, ` : '';
    const why = alert ? ` (${alert.title}, ${alert.area})` : '';
    return `${who}지금 ${s.name}(으)로 대피 중이에요.${why}\n위치: ${s.mapUrl}`;
  };

  const doShare = async () => {
    const text = shareMessage(sharing);
    try {
      if (navigator.share) {
        await navigator.share({ title: '대피 알림', text });
      } else {
        await navigator.clipboard.writeText(text);
        setToast('메시지를 복사했어요. 문자나 카톡에 붙여넣어 주세요.');
      }
      setSharing(null);
    } catch (e) {
      if (e?.name !== 'AbortError') setToast('공유하지 못했어요. 다시 시도해 주세요.');
    }
  };

  return (
    <div className="screen">
      <h1>가까운 대피소</h1>
      {wheelchair && (
        <p className="notice small">
          공공데이터에는 경사로 정보가 없어요.
          이동하기 전에 시설에 꼭 확인하세요.
        </p>
      )}

      {!result && (
        <div className="loading">
          <div className="spinner" />
          <p>대피소를 찾고 있어요…</p>
        </div>
      )}

      {result && (
        <>
          <div className="notice small">
            {result.baseLocation === 'gps'
              ? '현재 위치 기준 거리예요.'
              : '위치를 확인할 수 없어 시흥시 중심 기준으로 보여드려요.'}
            <br />
            <span className="muted">출처: {result.source ?? DATA_SOURCE}</span>
          </div>

          {result.items.length === 0 && (
            <p className="empty">조건에 맞는 대피소가 없습니다. 119에 도움을 요청하세요.</p>
          )}

          <ul className="shelter-list">
            {result.items.map((s) => (
              <li key={s.id} className="shelter">
                <div className="shelter-head">
                  <strong>{s.name}</strong>
                  <span className="shelter-dist">{formatDistance(s.distanceM)}</span>
                </div>
                <p className="muted small">{s.address}</p>
                <div className="shelter-tags">
                  {s.facilityType && <span className="badge">{s.facilityType}</span>}
                  {s.rampAvailable && <span className="badge">♿ 경사로</span>}
                </div>
                <div className="shelter-actions">
                  <a className="btn-primary" href={s.mapUrl} target="_blank" rel="noreferrer">
                    길찾기
                  </a>
                  <button type="button" className="btn-outline" onClick={() => setSharing(s)}>
                    보호자에게 공유
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {sharing && (
        <div className="sheet-backdrop" onClick={() => setSharing(null)}>
          <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h2>이 메시지를 보낼까요?</h2>
            <p className="share-preview">{shareMessage(sharing)}</p>
            {!profile?.guardian?.phone && (
              <p className="muted small">등록된 보호자가 없어요. 공유창에서 받을 사람을 골라 주세요.</p>
            )}
            <button type="button" className="btn-primary" onClick={doShare}>공유하기</button>
            <button type="button" className="btn-text" onClick={() => setSharing(null)}>취소</button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
