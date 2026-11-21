import { useEffect, useMemo, useState } from 'react';
import { getAlerts, sendTestPush } from '../lib/api.js';
import { readRemoteSubscription } from '../lib/push.js';
import mockAlerts from '../../data/alerts.json';

// PC용 원격 발송 화면: 폰이 만들어 준 링크(/remote#s=...)로 들어와서 그 폰으로 알림 보내기
export default function Remote() {
  const subscription = useMemo(() => readRemoteSubscription(window.location.hash), []);
  const [alerts, setAlerts] = useState([]);
  const [alertId, setAlertId] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getAlerts()
      .then((d) => d.items ?? d.alerts ?? [])
      .catch(() => mockAlerts)
      .then((items) => {
        const list = items.length ? items : mockAlerts;
        setAlerts(list);
        setAlertId(list[0]?.id ?? '');
      });
  }, []);

  const send = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await sendTestPush(alertId, subscription);
      const title = alerts.find((a) => a.id === alertId)?.title ?? '재난 알림';
      setStatus({ ok: true, text: `「${title}」 알림을 폰으로 보냈어요.` });
    } catch (e) {
      setStatus({
        ok: false,
        text:
          e?.code === 'SUBSCRIPTION_EXPIRED'
            ? '이 링크는 끊겼어요. 폰에서 링크를 다시 만들어 주세요.'
            : '알림을 보내지 못했어요. 잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="screen">
      <h1>💻 폰으로 재난 알림 보내기</h1>
      <span className="badge">시연용</span>

      {!subscription ? (
        <p className="error" style={{ marginTop: 16 }}>
          링크가 올바르지 않아요. 폰의 마이 → "PC에서 이 폰으로 보내기"에서 링크를 다시 만들어 주세요.
        </p>
      ) : (
        <>
          <p className="muted" style={{ marginTop: 12 }}>재난 종류를 고르고 버튼을 누르면 링크를 만든 폰으로 알림이 가요.</p>
          <div className="remote-list" role="radiogroup" aria-label="재난 종류">
            {alerts.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={a.id === alertId}
                className={`option${a.id === alertId ? ' selected' : ''}`}
                onClick={() => setAlertId(a.id)}
              >
                <strong>{a.title}</strong>
                <span className="muted small">{a.message}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn-primary" onClick={send} disabled={busy || !alertId}>
            {busy ? '보내는 중…' : '폰으로 재난 알림 보내기'}
          </button>
          {status && (
            <p className={status.ok ? 'toast' : 'error'} role="status" style={{ marginTop: 12 }}>
              {status.text}
            </p>
          )}
        </>
      )}
    </div>
  );
}
