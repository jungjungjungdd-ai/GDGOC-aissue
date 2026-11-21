import { useState } from 'react';
import { createRemoteLink, resubscribe } from '../lib/push.js';
import { savePushSubscription } from '../lib/storage.js';

// 시연용: PC에서 이 폰으로 테스트 재난 알림을 보낼 수 있는 링크
export default function RemoteLinkPanel() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { ok, text }

  const share = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const url = await createRemoteLink();
      if (navigator.share) {
        await navigator.share({ title: 'PC에서 이 폰으로 재난 알림 보내기', url });
        setStatus({ ok: true, text: '링크를 보냈어요. PC에서 열면 이 폰으로 알림을 보낼 수 있어요.' });
      } else {
        await navigator.clipboard.writeText(url);
        setStatus({ ok: true, text: '링크를 복사했어요. PC로 보내서 열어 주세요.' });
      }
    } catch (e) {
      if (e?.name === 'AbortError') return;
      setStatus({
        ok: false,
        text: e?.message === 'denied' ? '알림을 허용해야 링크를 만들 수 있어요.' : '링크를 만들지 못했어요. 잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setBusy(false);
    }
  };

  // 구독을 새로 만들면 예전 링크는 더 이상 이 폰에 닿지 않음
  const revoke = async () => {
    setBusy(true);
    setStatus(null);
    try {
      savePushSubscription(await resubscribe());
      setStatus({ ok: true, text: '예전 링크를 끊었어요. 이제 그 링크로는 알림이 오지 않아요.' });
    } catch {
      setStatus({ ok: false, text: '링크를 끊지 못했어요. 잠시 후 다시 시도해 주세요.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <h2>💻 PC에서 이 폰으로 보내기 <span className="badge">시연용</span></h2>
      <p className="muted">링크를 PC로 보내서 열면, PC에서 버튼을 눌러 이 폰으로 재난 알림을 보낼 수 있어요.</p>
      <button type="button" className="btn-primary" onClick={share} disabled={busy}>
        {busy ? '준비 중…' : '링크 만들어 보내기'}
      </button>
      <button type="button" className="btn-text" onClick={revoke} disabled={busy}>
        예전 링크 끊기
      </button>
      <p className="muted small">링크를 가진 사람은 이 폰으로 테스트 알림을 보낼 수 있어요. 시연이 끝나면 끊어 주세요.</p>
      {status && (
        <p className={status.ok ? 'toast' : 'error'} role="status">{status.text}</p>
      )}
    </section>
  );
}
