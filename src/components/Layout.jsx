import { Outlet } from 'react-router-dom';
import BottomTab from './BottomTab.jsx';

export default function Layout() {
  return (
    <div className="app">
      <main className="content">
        <Outlet />
      </main>
      <BottomTab />
    </div>
  );
}
