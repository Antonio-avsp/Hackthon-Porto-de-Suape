import React from 'react';

// Overlay genérico. `cls` adiciona variante (ex.: "lic" para o detalhe de licença).
export default function Modal({ cls = '', onClose, children }) {
  return (
    <div className="overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={'modal ' + cls}>{children}</div>
    </div>
  );
}
