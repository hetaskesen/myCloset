import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import ClosetPage from './pages/ClosetPage';
import OutfitsPage from './pages/OutfitsPage';
import LogPage from './pages/LogPage';
import InsightsPage from './pages/InsightsPage';
import SettingsPage from './pages/SettingsPage';
import './app.css';

const NAV = [
  { to: '/', icon: '👕', label: 'Closet', end: true },
  { to: '/outfits', icon: '🪄', label: 'Outfits' },
  { to: '/log', icon: '📅', label: 'Daily log' },
  { to: '/insights', icon: '📊', label: 'Insights' },
  { to: '/settings', icon: '⚙️', label: 'Settings' },
];

function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="logo">
        <span className="logo-icon">🪡</span>
        <div>
          <div className="logo-name">my closet</div>
          <div className="logo-sub">your wardrobe, tracked</div>
        </div>
      </div>
      <div className="nav-links">
        {NAV.map(l => (
          <NavLink key={l.to} to={l.to} end={l.end}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <span>{l.icon}</span> {l.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<ClosetPage />} />
            <Route path="/outfits" element={<OutfitsPage />} />
            <Route path="/log" element={<LogPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
