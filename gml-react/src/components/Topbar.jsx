import React from 'react';
import { NAV } from '../data.js';
import { useStore } from '../store.jsx';

export default function Topbar() {
  const { screen } = useStore();
  const n = NAV.find((x) => x.k === screen) || NAV[0];
  return (
    <header className="topbar">
      <div>
        <h1>{n.label}</h1>
        <p>{n.sub}</p>
      </div>
      <div className="search">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3-3" />
        </svg>
        <input placeholder="Buscar licença, prazo, evidência…" />
      </div>
      <div className="pill">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        12 jun 2025
      </div>
      <div className="bell">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        <span className="dot">5</span>
      </div>
    </header>
  );
}
