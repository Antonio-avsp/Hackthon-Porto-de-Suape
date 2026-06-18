import React, { useRef } from 'react';
import { Icon } from '../icons.jsx';
import { useStore } from '../store.jsx';
import { geoThen } from '../lib/geo.js';

function MiniMap() {
  return (
    <svg className="map" viewBox="0 0 300 150" preserveAspectRatio="none">
      <rect width="300" height="150" fill="#dce8f7" />
      <path d="M0 95 Q70 70 150 88 T300 80 V150 H0 Z" fill="#bcd6c4" />
      <path d="M0 60 Q90 50 180 64 T300 58" stroke="#9fc2e8" strokeWidth="6" fill="none" />
      <line x1="40" y1="0" x2="40" y2="150" stroke="#cdd9ea" strokeWidth="1" />
      <line x1="150" y1="0" x2="150" y2="150" stroke="#cdd9ea" strokeWidth="1" />
      <line x1="250" y1="0" x2="250" y2="150" stroke="#cdd9ea" strokeWidth="1" />
      <g transform="translate(150 72)">
        <path d="M0 -16c7 0 12 5 12 12 0 9-12 18-12 18S-12 5-12 -4c0-7 5-12 12-12z" fill="#DC3545" />
        <circle cy="-4" r="4" fill="#fff" />
      </g>
    </svg>
  );
}

export default function Evidencias() {
  const { evidencias, addEvidencia } = useStore();
  const fileRef = useRef(null);

  const onUpload = (e) => {
    if (!e.target.files.length) return;
    const name = e.target.files[0].name;
    e.target.value = '';
    geoThen((la, ln) => addEvidencia(name, la, ln));
  };

  return (
    <div className="view">
      <input type="file" ref={fileRef} className="hidden" accept="image/*" onChange={onUpload} />
      <div className="card">
        <div className="card-head">
          <div><h3>Evidências de campo</h3><div className="sub">{evidencias.length} comprovações georreferenciadas · vinculadas a licenças e condicionantes</div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()}><Icon name="clip" /> Upload (imagem / doc / vídeo)</button>
            <button className="btn btn-green btn-sm" onClick={() => geoThen((la, ln) => addEvidencia('Captura de campo — 12/06/2025', la, ln))}><Icon name="cam" /> Capturar no app</button>
          </div>
        </div>
        <div className="ev-grid">
          {evidencias.map((e, i) => (
            <div className="ev-card" key={i}>
              <div className="ev-photo">
                <MiniMap />
                <div style={{ position: 'relative', zIndex: 1, background: 'rgba(255,255,255,.88)', borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 800, color: '#234E91', display: 'flex', gap: 5, alignItems: 'center' }}>
                  <Icon name="pin" /> {e.lat.toFixed(4)}, {e.lng.toFixed(4)}
                </div>
              </div>
              <div className="ev-body">
                <b>{e.nome}</b>
                <div className="geo"><Icon name="check" /> {e.tipo}</div>
                <div className="ev-meta">
                  <div><span className="k">Licença:</span> {e.lic}</div>
                  <div><span className="k">Condicionante:</span> {e.cond}</div>
                  <div><span className="k">Responsável:</span> {e.resp}</div>
                  <div><span className="k">Registro:</span> {e.data} às {e.hora}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
