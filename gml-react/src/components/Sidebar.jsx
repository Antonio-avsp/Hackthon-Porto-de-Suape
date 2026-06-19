import React from 'react';
import { NAV } from '../data.js';
import { Icon } from '../icons.jsx';
import { useStore } from '../store.jsx';

export default function Sidebar() {
  const { screen, setScreen } = useStore();
  return (
    <aside className="side">
      <div className="brand">
        <div className="mark">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M5 19c0-7 5-12 14-13-1 9-6 13-13 13Z" fill="#28A745" />
            <path d="M6 18c3-5 7-8 11-9" stroke="#2E60AD" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
        <div><b>A.L.I.A</b><span>Inteligência Ambiental</span></div>
      </div>
      <nav className="menu">
        {NAV.map((n) => (
          <div
            key={n.k}
            className={'nav-item' + (screen === n.k ? ' active' : '')}
            onClick={() => setScreen(n.k)}
          >
            <Icon name={n.k} />{n.label}
          </div>
        ))}
      </nav>
      <div className="side-foot">
        <div className="avatar">MA</div>
        <div><b>Marina Alves</b><span>Analista Ambiental</span></div>
      </div>
    </aside>
  );
}
