import { Navigate } from 'react-router-dom';
import { getProfile } from '../lib/storage.js';

// 프로필이 없으면 온보딩으로 보낸다.
// (화면이 바뀔 때마다 다시 확인하도록 컴포넌트로 분리)
export default function RequireProfile({ children }) {
  return getProfile() ? children : <Navigate to="/onboarding" replace />;
}
