import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Onboarding from './pages/Onboarding.jsx';
import Profile from './pages/Profile.jsx';
import Alerts from './pages/Alerts.jsx';
import Location from './pages/Location.jsx';
import Card from './pages/Card.jsx';
import Shelters from './pages/Shelters.jsx';
import My from './pages/My.jsx';
import RequireProfile from './components/RequireProfile.jsx';

export default function App() {
  return (
    <Routes>
      {/* 하단 탭이 있는 화면 */}
      <Route element={<Layout />}>
        <Route path="/" element={<RequireProfile><Home /></RequireProfile>} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="/shelters" element={<Shelters />} />
        <Route path="/my" element={<My />} />
      </Route>

      {/* 하단 탭이 없는 화면 (온보딩, 재난 상황) */}
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/alerts/:id/location" element={<Location />} />
      <Route path="/alerts/:id/card" element={<Card />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
