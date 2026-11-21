import { useEffect, useState } from 'react';
import { getAlerts } from '../lib/api.js';
import { getPermission, isPushSupported, sendTestAlert } from '../lib/push.js';
import mockAlerts from '../../data/alerts.json';
import { saveLastReceivedAlert } from '../lib/storage.js';

// 오류를 사용자에게 보여줄 문장으로 바꾸기
function toMessage(err) {
  const reason = err?.message;
  if (reason === 'denied') return '알림이 허용되지 않았어요. 브라우저 설정 → 사이트 설정 → 알림에서 이 사이트를 허용해 주세요.';
  if (reason === 'unsupported') return '이 브라우저는 알림을 지원하지 않아요.';
  if (reason === 'no-sw') return '앱 준비가 아직 안 됐어요. 새로고침한 뒤 다시 시도해 주세요.';
  if (err?.code === 'SERVER_ERROR') return '알림을 보내지 못했어요. 재난 알림 목록에서 확인해 주세요.';
  return '알림을 보내지 못했어요. 잠시 후 다시 시도해 주세요.';
}

// 시연용: 재난 종류를 골라 이 폰으로 테스트 알림 보내기 (#12, #13)
export default function TestPushPanel() {
  const [alerts, setAlerts] = useState([]);
  const [alertId, setAlertId] = useState('');
  const [permission, setPermission] = useState(getPermission());
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { ok: true/false, text }

  // 재난문자 목록 불러오기 (서버가 안 되면 앱에 든 목데이터로)
  useEffect(() => {
    getAlerts()
      .then((d) => d.items ?? [])
      .catch(() => mockAlerts)
      .then((items) => {
        setAlerts(items);
        if (items[0]) setAlertId(items[0].id);
      });
  }, []);

  const handleSend = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await sendTestAlert(alertId);
      saveLastReceivedAlert(alertId); // 홈의 '최근 재난문자'에 이 문자가 뜨게
      setStatus({ ok: true, text: '알림을 보냈어요! 잠시 후 알림이 와요.' });
    } catch (err) {
      setStatus({ ok: false, text: toMessage(err) });
    } finally {
      setPermission(getPermission());
      setBusy(false);
    }
  };

  if (!isPushSupported()) {
    return (
      <section className="card">
        <h2>🧪 테스트 재난 발송 <span className="badge">시연용</span></h2>
        <p className="muted">이 브라우저는 알림을 지원하지 않아요. 아이폰은 홈 화면에 추가한 뒤에 쓸 수 있어요.</p>
      </section>
    );
  }

  return (
    <section className="card">
      <h2>🧪 테스트 재난 발송 <span className="badge">시연용</span></h2>
      <p className="muted">재난 종류를 고르고 버튼을 누르면 이 폰으로 알림이 와요.</p>

      {permission === 'denied' && (
        <p className="error">알림이 차단되어 있어요. 브라우저 설정 → 사이트 설정 → 알림에서 허용으로 바꿔 주세요.</p>
      )}

      <select
        value={alertId}
        onChange={(e) => setAlertId(e.target.value)}
        style={{ width: '100%', padding: 14, fontSize: 18, borderRadius: 10, marginTop: 8 }}
      >
        {alerts.map((a) => (
          <option key={a.id} value={a.id}>{a.title}</option>
        ))}
      </select>

      <button
        type="button"
        className="btn-primary"
        onClick={handleSend}
        disabled={busy || !alertId || permission === 'denied'}
      >
        {busy ? '보내는 중…' : '테스트 재난 발송'}
      </button>

      {status && (
        <p className={status.ok ? 'toast' : 'error'} role="status" style={{ marginTop: 12 }}>
          {status.text}
        </p>
      )}
    </section>
  );
}