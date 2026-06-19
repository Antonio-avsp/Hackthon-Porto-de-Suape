import React from 'react';
import { TIPOS, GANTT, COR, AGENDA, AG_COR, AG_NOME, tipoNome } from '../data.js';
import { Icon } from '../icons.jsx';
import { Dot, InfoTip } from '../ui.jsx';
import { useStore } from '../store.jsx';
import { flattenCondicionantes, COND_INDICADORES } from '../lib/insights.js';

const COND_TIP = {
  total: 'Total de obrigações legais (condicionantes) vinculadas às licenças ativas.',
  andamento: 'Condicionantes sendo executadas dentro do prazo.',
  proximas: 'Condicionantes cujo prazo de atendimento se aproxima e exigem atenção.',
  vencidas: 'Condicionantes com prazo vencido ou em risco — exigem ação imediata.',
  concluidas: 'Condicionantes já cumpridas e comprovadas.',
  sem_evidencia: 'Condicionantes que ainda não possuem evidência (foto/relatório) vinculada.',
  sem_protocolo: 'Condicionantes cujo protocolo de comprovação ainda não foi enviado ao órgão.',
};

const ALERTS = [
  { ic: 'warn', c: '#DC3545', b: '1 licença vence em 7 dias', s: 'LO-2023-045 · Licença de Operação · CPRH' },
  { ic: 'clock', c: '#DC3545', b: '1 condicionante atrasada', s: 'Compensação ambiental · vencida em 10/05' },
  { ic: 'clock', c: '#FCB316', b: '2 condicionantes a vencer', s: 'Renovação da LO e Monitoramento de ruído' },
  { ic: 'doc', c: '#FCB316', b: '2 demandas pendentes', s: 'MPF e APAC aguardando resposta' },
  { ic: 'bell', c: '#2E60AD', b: '1 evidência pendente de envio', s: 'ART-9921 · Renovação da LO' },
];

function Calendar() {
  const dow = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const cells = [];
  for (let d = 1; d <= 30; d++) {
    cells.push(
      <div className={'cal-cell' + (d === 12 ? ' today' : '')} key={d}>
        <div className="d">{d}</div>
        {(AGENDA[d] || []).map((e, i) => (
          <div className="cal-ev" key={i} style={{ background: AG_COR[e.tipo] }} title={`${AG_NOME[e.tipo]}: ${e.t}`}>
            <span className="t">{e.t}</span>
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="cal-grid">
      {dow.map((d) => <div className="cal-dow" key={d}>{d}</div>)}
      {cells}
    </div>
  );
}

export default function Dashboard() {
  const { setScreen, licencas, evidencias, openModal } = useStore();
  const totalAtivas = TIPOS.reduce((a, t) => a + t.ativas, 0);
  const conds = flattenCondicionantes(licencas, evidencias);
  return (
    <div className="view grid">
      <div className="card">
        <div className="card-head">
          <div><h3>Licenças por categoria</h3><div className="sub">{totalAtivas} licenças ativas no total</div></div>
          <button className="btn btn-ghost btn-sm" onClick={() => setScreen('licencas')}>Ver licenças</button>
        </div>
        <div className="kpis">
          {TIPOS.map((t) => (
            <div className="kpi" key={t.sigla}>
              <div className="bar" style={{ background: t.cor }} />
              <InfoTip text={`${tipoNome(t.sigla)} — ${t.desc}`} />
              <div className="lbl">{t.sigla}</div>
              <div className="val" style={{ color: t.cor }}>{t.ativas}</div>
              <div className="meta">
                <span className="chip muted">ativas</span>
                {t.venc ? <span className="chip" style={{ color: 'var(--vermelho)' }}>● {t.venc} vencida{t.venc > 1 ? 's' : ''}</span> : null}
                {t.prox ? <span className="chip" style={{ color: 'var(--amarelo)' }}>● {t.prox} a vencer</span> : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div><h3>Condicionantes</h3><div className="sub">Controle inteligente — clique num indicador para ver os registros</div></div>
          <span className="tag" style={{ background: '#2E60AD1f', color: '#2E60AD' }}>{conds.length} no total</span>
        </div>
        <div className="kpis" style={{ gridTemplateColumns: 'repeat(7,1fr)' }}>
          {COND_INDICADORES.map((ind) => (
            <div className="kpi click" key={ind.key} onClick={() => openModal('condList', ind.key)}>
              <div className="bar" style={{ background: ind.cor }} />
              <InfoTip text={COND_TIP[ind.key]} />
              <div className="lbl">{ind.label}</div>
              <div className="val" style={{ color: ind.cor }}>{conds.filter(ind.pred).length}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1.55fr 1fr' }}>
        <div className="card">
          <div className="card-head">
            <div><h3>Cronograma de condicionantes</h3><div className="sub">Gantt · jan a jun 2025</div></div>
            <div className="legend">
              <span><Dot color={COR.concluida} /> Concluído</span>
              <span><Dot color={COR.andamento} /> Em andamento</span>
              <span><Dot color={COR.atrasada} /> Atrasado</span>
            </div>
          </div>
          <div className="gantt-axis">
            <div />
            <div className="gantt-months"><span>Jan</span><span>Fev</span><span>Mar</span><span>Abr</span><span>Mai</span><span>Jun</span></div>
            <div />
          </div>
          {GANTT.map((g, i) => (
            <div className="gantt-row" key={i}>
              <div className="gantt-name">{g.nome}<small>{g.lic} · prazo {g.prazo}</small></div>
              <div className="gantt-track">
                <div className="gantt-bar" style={{ left: (g.s / 6 * 100).toFixed(1) + '%', width: ((g.e - g.s) / 6 * 100).toFixed(1) + '%', background: COR[g.st] }}>
                  <i style={{ right: 0, width: (100 - g.prog) + '%' }} />
                </div>
              </div>
              <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 12, color: COR[g.st] }}>{g.prog}%</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-head">
            <div><h3>Alertas</h3><div className="sub">Ações preventivas automáticas</div></div>
            <span className="tag" style={{ background: '#DC35451f', color: '#DC3545' }}>5 ativos</span>
          </div>
          {ALERTS.map((a, i) => (
            <div className="alert" key={i}>
              <div className="ic" style={{ background: a.c }}><Icon name={a.ic} /></div>
              <div><b>{a.b}</b><span>{a.s}</span></div>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div><h3>Agenda</h3><div className="sub">Junho 2025 · vencimentos, demandas, auditorias e vistorias</div></div>
          <div className="legend">
            {Object.keys(AG_NOME).map((k) => <span key={k}><Dot color={AG_COR[k]} /> {AG_NOME[k]}</span>)}
          </div>
        </div>
        <Calendar />
      </div>
    </div>
  );
}
