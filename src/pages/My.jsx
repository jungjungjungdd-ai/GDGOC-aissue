import { useState } from 'react';
import { Link } from 'react-router-dom';
import PrivacyNote from '../components/PrivacyNote.jsx';
import ProfileForm from '../components/ProfileForm.jsx';
import { getProfile, saveProfile } from '../lib/storage.js';
import TestPushPanel from '../components/TestPushPanel.jsx';
import { buildOfflineBundle } from '../lib/offline.js';

// 마이 화면: 프로필 확인·수정
export default function My() {
  const [profile, setProfile] = useState(getProfile());
  const [saved, setSaved] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = (next) => {
    saveProfile(next);
    buildOfflineBundle(next); // 바뀐 프로필로 오프라인 카드 다시 만들기
    setProfile(next);
    setSaved(true);
    setFormKey((k) => k + 1);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1>마이</h1>
      <p className="muted">프로필은 내 폰에만 저장되고 서버에 남지 않아요.</p>
      {saved && <p className="toast" role="status">저장됐어요 ✓</p>}
      <ProfileForm key={formKey} initial={profile ?? undefined} showLanguage submitLabel="수정 내용 저장" onSubmit={handleSubmit} />
      <Link to="/offline" className="btn-outline">📦 저장된 오프라인 카드 보기</Link>
      <PrivacyNote variant="profile" />
            <TestPushPanel />
      <Link to="/demo" className="link demo-link">🎬 데모 모드 (프로필별 카드 비교)</Link>
    </div>
  );
}
