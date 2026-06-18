import React from 'react';
import { COR } from '../data.js';
import { Icon } from '../icons.jsx';
import { StatusTag, PrioTag } from '../ui.jsx';
import { useStore } from '../store.jsx';

const STS = [['all', 'Todos'], ['pendente', 'Pendente'], ['andamento', 'Em andamento'], ['concluida', 'Concluído'], ['atrasada', 'Atrasado']];
const MINI = [['pendente', 'Pendentes'], ['andamento', 'Em andamento'], ['atrasada', 'Atrasados'], ['concluida', 'Concluídos']];

export default function Prazos() {
  const { demandas, deleteDemanda, pdFilter, setPdFilter, openModal, toast } = useStore();
  const list = demandas.filter((d) => pdFilter === 'all' || d.status === pdFilter);
  const counts = { pendente: 0, andamento: 0, concluida: 0, atrasada: 0 };
  demandas.forEach((d) => { if (counts[d.status] != null) counts[d.status]++; });

  return (
    <div className="view grid">
      <div className="kpis">
        {MINI.map(([k, lb]) => (
          <div className="kpi" key={k}>
            <div className="bar" style={{ background: COR[k] }} />
            <div className="lbl">{lb}</div>
            <div className="val" style={{ color: COR[k] }}>{counts[k]}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-head">
          <div><h3>Prazos e demandas</h3><div className="sub">Demandas de órgãos, prazos legais e responsáveis — integrado à agenda e ao cronograma</div></div>
          <button className="btn btn-primary btn-sm" onClick={() => openModal('demForm')}><Icon name="plus" /> Nova demanda / prazo</button>
        </div>
        <div className="filters" style={{ marginBottom: 14 }}>
          {STS.map(([k, lb]) => <button key={k} className={'fbtn' + (pdFilter === k ? ' on' : '')} onClick={() => setPdFilter(k)}>{lb}</button>)}
        </div>
        <table className="tbl">
          <thead><tr><th>Demanda / prazo</th><th>Responsável</th><th>Prazo</th><th>Prioridade</th><th>Status</th><th /></tr></thead>
          <tbody>
            {list.length ? list.map((d) => {
              const idx = demandas.indexOf(d);
              return (
                <tr key={idx}>
                  <td><b>{d.titulo}</b><div className="muted" style={{ fontSize: 11.5 }}>{d.tipo} · {d.orgao}</div></td>
                  <td>{d.resp}</td><td>{d.prazo}</td><td><PrioTag prio={d.prio} /></td><td><StatusTag st={d.status} /></td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost btn-icon" title="Excluir" onClick={() => { deleteDemanda(idx); toast('Item removido'); }}><Icon name="trash" /></button>
                  </td>
                </tr>
              );
            }) : (
              <tr><td colSpan={6} className="muted" style={{ textAlign: 'center', padding: 30 }}>Nada neste filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
