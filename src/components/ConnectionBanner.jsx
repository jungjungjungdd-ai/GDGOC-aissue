import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOnline } from '../lib/useOnline.js';
import { getProfile } from '../lib/storage.js';
import {
  buildOfflineBundle,
  clearPendingShare,
  getPendingShare,
  isBundleFresh,
} from '../lib/offline.js';

// 오프라인 안내 + 연결 복구 시 보호자 공유 재시도
export default function ConnectionBanner() {
  const online = useOnline();
  const [pending, setPending] = useState(getPendingShare());

  // 온라인인데 오프라인 카드가 없거나 예전 프로필 기준이면 미리 만들어 둔다
  useEffect(() => {
    const profile = getProfile();
    if (online && profile && !isBundleFresh(profile)) buildOfflineBundle(profile);
    if (online) setPending(getPendingShare());
  }, [online]);

  const resend = async () => {
    try {
      if (navigator.share) await navigator.share({ title: '대피 알림', text: pending });
      else await navigator.clipboard.writeText(pending);
      clearPendingShare();
      setPending(null);
    } catch (e) {
      if (e?.name !== 'AbortError') console.warn('공유 재시도 실패', e);
    }
  };

  if (!online) {
    return (
      <Link to="/offline" className="conn-banner offline" role="status">
        📵 인터넷이 끊겼어요 · <strong>저장된 행동 카드 보기 →</strong>
      </Link>
    );
  }

  if (pending) {
    return (
      <div className="conn-banner pending" role="status">
        <span>📶 다시 연결됐어요. 보호자에게 대피 소식을 다시 보낼까요?</span>
        <div className="conn-actions">
          <button type="button" onClick={resend}>보내기</button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              clearPendingShare();
              setPending(null);
            }}
          >
            괜찮아요
          </button>
        </div>
      </div>
    );
  }

  return null;
}
