import React from 'react';
import { COR, ST_LABEL, RESP_COR, licStatusInfo } from './data.js';

export const Dot = ({ color, style }) => (
  <span className="dotmark" style={{ background: color, ...style }} />
);

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
