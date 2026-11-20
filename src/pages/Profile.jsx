import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import ProfileForm from '../components/ProfileForm.jsx';
import { getProfile, saveProfile, getDraftLanguage, clearDraftLanguage } from '../lib/storage.js';

// 최초 프로필 등록 화면 (온보딩 → 언어 선택 → 여기)
export default function Profile() {
  const navigate = useNavigate();
  const location = useLocation();

  // 이미 프로필이 있으면 수정은 마이 화면에서
  if (getProfile()) return <Navigate to="/my" replace />;

  const language = location.state?.language ?? getDraftLanguage() ?? 'ko';

  const handleSubmit = (profile) => {
    saveProfile(profile);
    clearDraftLanguage();
    // TODO(웹 푸시 이슈): 알림 권한 요청 화면이 생기면 그쪽으로 이동
    navigate('/', { replace: true });
  };

  return (
    <div className="screen">
      <h1>내 상황을 알려주세요</h1>
      <p className="muted">재난이 났을 때 나에게 맞는 행동을 알려 드리기 위해 필요해요. 이 정보는 내 폰에만 저장돼요.</p>
      <ProfileForm initial={{ language }} submitLabel="저장하고 시작하기" onSubmit={handleSubmit} />
    </div>
  );
}
