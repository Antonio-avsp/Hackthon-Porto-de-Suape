// ============================================================
// Dados de demonstração — fonte de SEED do repositório ambiental.
// Espelha gml-react/src/data.js (LICENCAS/DEMANDAS/EVIDENCIAS_INICIAIS) para
// que, no primeiro run (sem estado persistido), o backend já devolva o mesmo
// cenário que o frontend mostrava localmente. A partir daí, o estado real
// persiste no servidor (ver environmental.repository.js).
// ============================================================

export const LICENCAS_SEED = [
  { id: 'LO-2023-045', sigla: 'LO', orgao: 'CPRH', processo: '2023.045.PE', validade: '07/06/2025', dias: 7, status: 'critica', resp: 'Equipes internas', respDet: 'Meio Ambiente', cond: [
    { nome: 'Monitoramento de efluentes', per: 'Mensal', prog: 62, st: 'andamento' },
    { nome: 'Renovação da LO (protocolo)', per: 'Única', prog: 30, st: 'critica' },
    { nome: 'Monitoramento de ruído', per: 'Semestral', prog: 15, st: 'atencao' },
  ] },
  { id: 'LP-2024-118', sigla: 'LP', orgao: 'CPRH', processo: '2024.118.PE', validade: '15/06/2025', dias: 15, status: 'atencao', resp: 'Áreas internas', respDet: 'Engenharia', cond: [
    { nome: 'Estudo de impacto de vizinhança', per: 'Única', prog: 80, st: 'andamento' },
  ] },
  { id: 'LI-2023-090', sigla: 'LI', orgao: 'IBAMA', processo: '2023.090.PE', validade: '30/09/2025', dias: 120, status: 'andamento', resp: 'Contratadas', respDet: 'Bioterra', cond: [
    { nome: 'Relatório de fauna', per: 'Trimestral', prog: 100, st: 'concluida' },
    { nome: 'Educação ambiental', per: 'Contínua', prog: 50, st: 'andamento' },
  ] },
  { id: 'RLO-2022-007', sigla: 'RLO', orgao: 'APAC', processo: '2022.007.PE', validade: '22/06/2025', dias: 22, status: 'atencao', resp: 'Equipes internas', respDet: 'Jurídico', cond: [
    { nome: 'Renovação da outorga de água', per: 'Única', prog: 20, st: 'andamento' },
  ] },
  { id: 'AUT-2024-031', sigla: 'AUT', orgao: 'IBAMA', processo: '2024.031.PE', validade: '12/08/2025', dias: 78, status: 'andamento', resp: 'Áreas internas', respDet: 'Financeiro', cond: [
    { nome: 'Compensação ambiental', per: 'Única', prog: 40, st: 'atrasada' },
  ] },
  { id: 'PLI-2024-052', sigla: 'PLI', orgao: 'CPRH', processo: '2024.052.PE', validade: '05/07/2025', dias: 42, status: 'andamento', resp: 'Contratadas', respDet: 'Construtora Vita', cond: [
    { nome: 'Cronograma físico de obras', per: 'Mensal', prog: 35, st: 'andamento' },
  ] },
  { id: 'CP-2023-014', sigla: 'CP', orgao: 'Prefeitura', processo: '2023.014.PE', validade: '18/06/2025', dias: 18, status: 'atencao', resp: 'Órgãos externos', respDet: 'Prefeitura', cond: [
    { nome: 'Certidão de uso e ocupação do solo', per: 'Única', prog: 60, st: 'andamento' },
  ] },
  { id: 'LS-2024-077', sigla: 'LS', orgao: 'CPRH', processo: '2024.077.PE', validade: '28/07/2025', dias: 62, status: 'andamento', resp: 'Equipes internas', respDet: 'Operações', cond: [
    { nome: 'Plano de gestão de resíduos', per: 'Mensal', prog: 75, st: 'andamento' },
  ] },
];

export const DEMANDAS_SEED = [
  { titulo: 'Esclarecimento sobre efluentes', orgao: 'CPRH', resp: 'Jurídico', prazo: '15/06/2025', prio: 'Urgente', status: 'andamento', tipo: 'Notificação' },
  { titulo: 'Relatório de fauna 1º tri', orgao: 'IBAMA', resp: 'Bioterra', prazo: '20/06/2025', prio: 'Alta', status: 'andamento', tipo: 'Requisição' },
  { titulo: 'Histórico de licenças', orgao: 'MPF', resp: 'Compliance', prazo: '24/06/2025', prio: 'Alta', status: 'pendente', tipo: 'Requisição' },
  { titulo: 'Dados de outorga de água', orgao: 'APAC', resp: 'Engenharia', prazo: '30/06/2025', prio: 'Média', status: 'pendente', tipo: 'Solicitação' },
  { titulo: 'Compensação ambiental — comprovação', orgao: 'CPRH', resp: 'Financeiro', prazo: '10/05/2025', prio: 'Urgente', status: 'atrasada', tipo: 'Exigência' },
  { titulo: 'Protocolo renovação LO', orgao: 'CPRH', resp: 'Jurídico', prazo: '07/02/2025', prio: 'Alta', status: 'concluida', tipo: 'Prazo legal' },
];

export const EVIDENCIAS_SEED = [
  { nome: 'Ponto de coleta — Rio Tatuoca', tipo: 'Foto de campo', lic: 'LO-2023-045', cond: 'Monitoramento de efluentes', resp: 'J. Silva', data: '12/05/2025', hora: '09:41', lat: -8.3956, lng: -34.9712 },
  { nome: 'RT Fauna 1º Trimestre', tipo: 'Relatório técnico', lic: 'LI-2023-090', cond: 'Relatório de fauna', resp: 'Bioterra', data: '18/03/2025', hora: '14:05', lat: -8.3902, lng: -34.9650 },
  { nome: 'Laudo de ruído — limite norte', tipo: 'Laudo', lic: 'LO-2023-045', cond: 'Monitoramento de ruído', resp: 'Acustec', data: '02/05/2025', hora: '11:20', lat: -8.3880, lng: -34.9601 },
  { nome: 'Inspeção de fauna — Trilha 2', tipo: 'Foto de campo', lic: 'LI-2023-090', cond: 'Programa de educação ambiental', resp: 'M. Alves', data: '09/05/2025', hora: '06:32', lat: -8.4010, lng: -34.9588 },
];

/** Estado inicial completo (cópia profunda para evitar mutação acidental). */
export function seedState() {
  return JSON.parse(JSON.stringify({
    licencas: LICENCAS_SEED,
    demandas: DEMANDAS_SEED,
    evidencias: EVIDENCIAS_SEED,
  }));
}

export default { seedState };
