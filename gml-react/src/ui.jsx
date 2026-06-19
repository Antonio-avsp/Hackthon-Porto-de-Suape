import React, { useState } from 'react';
import { COR, ST_LABEL, RESP_COR, licStatusInfo } from './data.js';
import { Icon } from './icons.jsx';

export const Dot = ({ color, style }) => (
  <span className="dotmark" style={{ background: color, ...style }} />
);

// Ajuda contextual: ícone "( i )" que mostra um tooltip ao passar o mouse
// (desktop) ou ao tocar (mobile, via clique que alterna a visibilidade).
export function InfoTip({ text, style }) {
  const [open, setOpen] = useState(false);
  return (
    <span
      className={'infotip' + (open ? ' open' : '')}
      style={style}
      tabIndex={0}
      role="button"
      aria-label="Ajuda"
      onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      onBlur={() => setOpen(false)}
      onMouseLeave={() => setOpen(false)}
    >
      <Icon name="info" />
      <span className="tip" role="tooltip">{text}</span>
    </span>
  );
}

export const Sigla = ({ sigla, color, style }) => (
  <span className="sigla" style={{ background: color, ...style }}>{sigla}</span>
);

export function StatusTag({ st }) {
  const c = COR[st] || '#6C757D';
  return (
    <span className="tag" style={{ background: c + '1f', color: c }}>
      <Dot color={c} /> {ST_LABEL[st] || st}
    </span>
  );
}

export function PrioTag({ prio }) {
  const c = { Urgente: '#DC3545', Alta: '#FCB316', Média: '#2E60AD', Baixa: '#6C757D' }[prio] || '#6C757D';
  return <span className="tag" style={{ background: c + '1f', color: c }}>{prio}</span>;
}

export function LicBadge({ st }) {
  const [label, c] = licStatusInfo(st);
  return <span className="badge" style={{ background: c, color: st === 'atencao' ? '#1B2A4A' : '#fff' }}>{label}</span>;
}

export function RespChip({ resp, respDet }) {
  const c = RESP_COR[resp] || '#6C757D';
  return (
    <span className="rchip"><Dot color={c} />{resp}{respDet ? ' · ' + respDet : ''}</span>
  );
}
