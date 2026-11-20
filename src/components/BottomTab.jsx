import { NavLink } from 'react-router-dom';

const tabs = [
  { to: '/', label: '홈' },
  { to: '/shelters', label: '대피소' },
  { to: '/my', label: '마이' },
];

export default function BottomTab() {
  return (
    <nav className="bottom-tab">
      {tabs.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end
          className={({ isActive }) => (isActive ? 'tab active' : 'tab')}
        >
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
