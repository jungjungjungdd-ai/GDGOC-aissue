import { useState } from 'react';
import ProfileForm from '../components/ProfileForm.jsx';
import { getProfile, saveProfile } from '../lib/storage.js';

// 마이 화면: 프로필 확인·수정
export default function My() {
  const [profile, setProfile] = useState(getProfile());
  const [saved, setSaved] = useState(false);
  const [formKey, setFormKey] = useState(0);

  const handleSubmit = (next) => {
    saveProfile(next);
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
    </div>
  );
}
