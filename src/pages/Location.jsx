import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { saveLastReceivedAlert } from '../lib/storage.js';
import { loadAlert } from '../lib/alerts.js';
import { checkImpact } from '../lib/region.js';
import PrivacyNote from '../components/PrivacyNote.jsx';

// 장소 선택지 (값은 API 명세서 1-4 placeType)
const PLACES = [
  { value: 'home', label: '집', icon: '🏠' },
  { value: 'indoor', label: '건물 안', icon: '🏢' },
  { value: 'underground', label: '지하·지하철', icon: '🚇' },
  { value: 'outdoors', label: '야외', icon: '🌳' },
  { value: 'vehicle', label: '차 안', icon: '🚗' },
  { value: 'coast', label: '해안가', icon: '🌊' },
];

const GPS_MESSAGE = {
  locating: '📍 현재 위치를 확인하고 있어요…',
  ok: '📍 현재 위치를 확인했어요.',
  denied: '위치 권한이 꺼져 있어요. 아래에서 지금 있는 곳을 골라 주세요.',
  unavailable: '위치를 찾지 못했어요. 아래에서 지금 있는 곳을 골라 주세요.',
};

export default function Location() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const fromPush = searchParams.get('received') === '1';

  // 알림을 눌러 들어온 경우: 이 폰의 '최근 받은 재난문자'로 기록
  useEffect(() => {
    if (fromPush) saveLastReceivedAlert(id);
  }, [fromPush, id]);
  const navigate = useNavigate();
  const [alert, setAlert] = useState(null);
  const [alertLoading, setAlertLoading] = useState(true);
  const [coords, setCoords] = useState(null);
  const [gps, setGps] = useState('locating'); // locating | ok | denied | unavailable

  // 재난문자 원문
  useEffect(() => {
    loadAlert(id).then((a) => {
      setAlert(a);
      setAlertLoading(false);
    });
  }, [id]);

  // GPS 위치 요청
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setGps('unavailable');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setGps('ok');
      },
      (err) => setGps(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  // 재난 지역과 현재 위치 비교 (좌표가 있을 때만)
  const impact = alert && coords ? checkImpact(alert.area, coords) : null;

  // 장소를 누르면 바로 행동 카드 화면으로 (좌표는 있으면 같이 전달)
  const choose = (placeType) => {
    navigate(`/alerts/${id}/card`, {
      state: { location: { placeType, ...(coords ?? {}) } },
    });
  };

  return (
    <div className="screen">
      <Link to="/" className="back">← 홈</Link>

      {alertLoading && <p className="muted">재난문자를 불러오는 중…</p>}
      {!alertLoading && alert && (
        <section className="alert-box">
          <span className="badge">목데이터</span>
          <h2>{alert.title}</h2>
          <p>{alert.message}</p>
          <p className="alert-meta">{alert.area}</p>
        </section>
      )}
      {!alertLoading && !alert && <p className="error">재난문자를 찾을 수 없어요.</p>}

      <h1>지금 어디에 있나요?</h1>
      <p className={gps === 'ok' || gps === 'locating' ? 'muted' : 'notice'}>{GPS_MESSAGE[gps]}</p>
      {impact?.status === 'outside' && (
        <div className="notice area-notice" role="status">
          <strong>지금 위치는 재난 지역({alert.area}) 밖이에요.</strong>
          <br />
          약 {(impact.distanceM / 1000).toFixed(1)}km 떨어져 있어요. 그 지역으로 가는 중이거나 가족이 그곳에 있다면
          아래에서 장소를 골라 행동 요령을 확인하세요.
        </div>
      )}

      <div className="place-grid">
        {PLACES.map((p) => (
          <button key={p.value} type="button" className="place" onClick={() => choose(p.value)} disabled={!alert}>
            <span className="place-icon" aria-hidden="true">{p.icon}</span>
            {p.label}
          </button>
        ))}
      </div>

      <PrivacyNote variant="location" />
    </div>
  );
}
