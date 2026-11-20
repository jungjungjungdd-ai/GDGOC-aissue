import { Outlet } from 'react-router-dom';
import BottomTab from './BottomTab.jsx';
import ConnectionBanner from './ConnectionBanner.jsx';

export default function Layout() {
  return (
    <div className="app">
      <ConnectionBanner />
      <main className="content">
        <Outlet />
      </main>
      <BottomTab />
    </div>
  );
}
