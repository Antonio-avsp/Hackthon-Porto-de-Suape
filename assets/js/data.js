/* ============================================================
   SENTINELA — Base de dados de demonstração (Porto de Suape)
   Dados fictícios usados nos protótipos de tela.
   ============================================================ */

const TODAY = new Date('2026-06-17T00:00:00');

const ORGAOS = {
  CPRH:      { nome:'CPRH', desc:'Agência Estadual de Meio Ambiente (PE)' },
  IBAMA:     { nome:'IBAMA', desc:'Instituto Brasileiro do Meio Ambiente' },
  APAC:      { nome:'APAC', desc:'Agência Pernambucana de Águas e Clima' },
  MPF:       { nome:'MPF', desc:'Ministério Público Federal' },
  ANTAQ:     { nome:'ANTAQ', desc:'Agência Nacional de Transportes Aquaviários' },
  PREFEITURA:{ nome:'Prefeitura', desc:'Prefeitura do Cabo de Santo Agostinho' },
  VIGILANCIA:{ nome:'Vig. Sanitária', desc:'Vigilância Sanitária' },
};

/* ---- Licenças ---- */
const LICENCAS = [
  { id:'LO-2231', tipo:'Licença de Operação',      objeto:'Terminal de Granéis Líquidos (TGL)',      orgao:'CPRH',  emissao:'2021-09-01', validade:'2026-08-12', cond:8, resp:'Ana Carvalho', status:'atencao' },
  { id:'LI-1187', tipo:'Licença de Instalação',     objeto:'Dragagem de Aprofundamento do Canal',     orgao:'IBAMA', emissao:'2023-03-15', validade:'2026-06-28', cond:6, resp:'Bruno Lima',   status:'atencao' },
  { id:'OUT-540', tipo:'Outorga de Recursos Hídricos',objeto:'Captação de Água – Estação SE-02',       orgao:'APAC',  emissao:'2022-05-20', validade:'2027-05-19', cond:3, resp:'Ana Carvalho', status:'valida'  },
  { id:'LO-2310', tipo:'Licença de Operação',       objeto:'Pátio de Contêineres – Terminal Tecon',   orgao:'CPRH',  emissao:'2020-11-10', validade:'2026-05-30', cond:5, resp:'Daniel Rocha', status:'vencida' },
  { id:'ASV-077', tipo:'Autorização Supressão Veg.', objeto:'Ampliação Retroárea – Setor Norte',       orgao:'CPRH',  emissao:'2024-02-01', validade:'2026-12-01', cond:4, resp:'Marcos Pinto',  status:'valida'  },
  { id:'LP-0098', tipo:'Licença Prévia',            objeto:'Ampliação do Cais de Múltiplo Uso',       orgao:'CPRH',  emissao:'2025-01-22', validade:'2027-01-21', cond:7, resp:'Carla Souza',  status:'renovacao' },
  { id:'PEI-013', tipo:'Plano de Emergência (PEI)',  objeto:'Plano de Emergência Individual',          orgao:'IBAMA', emissao:'2022-08-30', validade:'2026-07-05', cond:2, resp:'Bruno Lima',   status:'atencao' },
];

/* ---- Condicionantes ---- */
const CONDICIONANTES = [
  { id:'C-118', licenca:'LO-2231', desc:'Monitoramento trimestral da qualidade da água',        period:'Trimestral', prazo:'2026-06-20', resp:'Ana Carvalho', area:'Meio Ambiente', ev:3, prog:85, risco:0.55, status:'atencao'  },
  { id:'C-119', licenca:'LO-2231', desc:'Relatório anual de gestão de resíduos sólidos',         period:'Anual',      prazo:'2026-09-30', resp:'Daniel Rocha', area:'Compliance',    ev:5, prog:40, risco:0.30, status:'andamento'},
  { id:'C-204', licenca:'LI-1187', desc:'Monitoramento de fauna aquática (mensal)',              period:'Mensal',     prazo:'2026-06-18', resp:'Bruno Lima',   area:'Operações',     ev:2, prog:60, risco:0.80, status:'atencao'  },
  { id:'C-205', licenca:'LI-1187', desc:'Relatório de turbidez da pluma de dragagem',            period:'Quinzenal',  prazo:'2026-06-14', resp:'Bruno Lima',   area:'Operações',     ev:0, prog:20, risco:0.92, status:'atrasada' },
  { id:'C-330', licenca:'OUT-540', desc:'Aferição de vazão de captação',                         period:'Trimestral', prazo:'2026-07-12', resp:'Marcos Pinto', area:'Engenharia',    ev:4, prog:70, risco:0.25, status:'andamento'},
  { id:'C-401', licenca:'LO-2310', desc:'Programa de Educação Ambiental – relatório anual',       period:'Anual',      prazo:'2026-05-30', resp:'Daniel Rocha', area:'Compliance',    ev:1, prog:30, risco:0.88, status:'atrasada' },
  { id:'C-402', licenca:'LO-2310', desc:'Monitoramento de ruído ambiental',                       period:'Trimestral', prazo:'2026-08-05', resp:'Ana Carvalho', area:'Meio Ambiente', ev:6, prog:100,risco:0.10, status:'cumprida' },
  { id:'C-455', licenca:'ASV-077', desc:'Plano de Recuperação de Área Degradada (PRAD)',          period:'Semestral',  prazo:'2026-07-28', resp:'Marcos Pinto', area:'Engenharia',    ev:2, prog:55, risco:0.45, status:'andamento'},
  { id:'C-501', licenca:'PEI-013', desc:'Simulado de resposta a emergências',                     period:'Anual',      prazo:'2026-06-25', resp:'Bruno Lima',   area:'Operações',     ev:1, prog:50, risco:0.60, status:'atencao'  },
  { id:'C-118b',licenca:'LO-2231', desc:'Relatório consolidado de efluentes (CPRH)',             period:'Mensal',     prazo:'2026-06-10', resp:'Ana Carvalho', area:'Meio Ambiente', ev:3, prog:100,risco:0.08, status:'cumprida' },
  { id:'C-512', licenca:'LP-0098', desc:'Estudo de fauna e flora – complementação MPF',          period:'Pontual',    prazo:'2026-07-02', resp:'Carla Souza',  area:'Jurídico',      ev:2, prog:35, risco:0.70, status:'atencao'  },
  { id:'C-513', licenca:'LP-0098', desc:'Audiência pública – protocolo de evidências',           period:'Pontual',    prazo:'2026-08-22', resp:'Carla Souza',  area:'Jurídico',      ev:0, prog:15, risco:0.35, status:'andamento'},
];

/* ---- Evidências ---- */
const EVIDENCIAS = [
  { id:'EV-901', tipo:'Foto de campo',    titulo:'Ponto de coleta PM-03 — Canal de Suape',     cond:'C-118', data:'2026-06-10', autor:'Bruno Lima',   geo:'8°23′S 34°57′W', fmt:'JPG', status:'validada' },
  { id:'EV-902', tipo:'Relatório técnico',titulo:'Monitoramento de Água — 2º Trimestre',       cond:'C-118', data:'2026-06-11', autor:'AmbServ Ltda', geo:'—',              fmt:'PDF', status:'analise'  },
  { id:'EV-903', tipo:'ART',              titulo:'ART nº 2026/4471 — Resp. Técnico Hídrico',   cond:'C-330', data:'2026-05-29', autor:'Marcos Pinto', geo:'—',              fmt:'PDF', status:'validada' },
  { id:'EV-904', tipo:'Laudo',            titulo:'Laudo de Fauna — Campanha de Maio',          cond:'C-204', data:'2026-06-02', autor:'AmbServ Ltda', geo:'8°24′S 34°58′W', fmt:'PDF', status:'validada' },
  { id:'EV-905', tipo:'Protocolo',        titulo:'Protocolo SEI 0124.2026 — Envio CPRH',       cond:'C-118b',data:'2026-06-12', autor:'Ana Carvalho', geo:'—',              fmt:'XML', status:'enviada'  },
  { id:'EV-906', tipo:'Mapa',             titulo:'Mapa georreferenciado — Área de Supressão',  cond:'C-455', data:'2026-05-20', autor:'Marcos Pinto', geo:'8°21′S 35°00′W', fmt:'SHP', status:'validada' },
  { id:'EV-907', tipo:'Ofício',           titulo:'Ofício resposta MPF nº 332/2026',            cond:'C-512', data:'2026-06-08', autor:'Carla Souza',  geo:'—',              fmt:'PDF', status:'analise'  },
  { id:'EV-908', tipo:'Foto de campo',    titulo:'Simulado PEI — Doca 2',                      cond:'C-501', data:'2026-06-09', autor:'Bruno Lima',   geo:'8°23′S 34°56′W', fmt:'JPG', status:'validada' },
];

/* ---- Status maps ---- */
const COND_STATUS = {
  cumprida:  { label:'Cumprida',    badge:'badge--green', dot:'green' },
  andamento: { label:'Em andamento',badge:'badge--blue',  dot:'blue'  },
  atencao:   { label:'Atenção',     badge:'badge--amber', dot:'amber' },
  atrasada:  { label:'Atrasada',    badge:'badge--red',   dot:'red'   },
};
const LIC_STATUS = {
  valida:    { label:'Válida',          badge:'badge--green' },
  atencao:   { label:'Próx. vencimento',badge:'badge--amber' },
  vencida:   { label:'Vencida',         badge:'badge--red'   },
  renovacao: { label:'Em renovação',    badge:'badge--blue'  },
};

/* ---- Helpers ---- */
function fmtDate(iso){
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y}`;
}
function daysTo(iso){
  const dt = new Date(iso + 'T00:00:00');
  return Math.round((dt - TODAY) / 86400000);
}
function prazoLabel(iso){
  const d = daysTo(iso);
  if (d < 0)  return `Vencido há ${Math.abs(d)}d`;
  if (d === 0) return 'Vence hoje';
  if (d === 1) return 'Vence amanhã';
  return `Faltam ${d} dias`;
}
function riscoLabel(v){
  if (v >= 0.75) return 'Crítico';
  if (v >= 0.5)  return 'Alto';
  if (v >= 0.25) return 'Médio';
  return 'Baixo';
}
