// ============================ Dados de demonstração ============================
// Base fictícia para o protótipo visual da Plataforma de Gestão Ambiental GML.

export const COR = {
  concluida: '#28A745', andamento: '#2E60AD', atencao: '#FCB316',
  atrasada: '#DC3545', critica: '#DC3545', pendente: '#6C757D',
};
export const ST_LABEL = {
  concluida: 'Concluído', andamento: 'Em andamento', atencao: 'Atenção',
  atrasada: 'Atrasado', critica: 'Crítico', pendente: 'Pendente',
};

export const TIPOS = [
  { sigla: 'AUT', nome: 'Autorização Ambiental', cor: '#7C5CBF', desc: 'Documento provisório para atividades específicas ou temporárias (supressão vegetal, pesquisa, intervenções pontuais).', ativas: 15, venc: 1, prox: 3 },
  { sigla: 'LP', nome: 'Licença Prévia', cor: '#2E60AD', desc: 'Aprova a localização e atesta a viabilidade ambiental do empreendimento, sem autorizar obras.', ativas: 8, venc: 0, prox: 2 },
  { sigla: 'LI', nome: 'Licença de Instalação', cor: '#1AA2B8', desc: 'Autoriza a implantação e construção do empreendimento conforme projetos aprovados.', ativas: 12, venc: 0, prox: 1 },
  { sigla: 'LO', nome: 'Licença de Operação', cor: '#28A745', desc: 'Autoriza o início da operação após verificação do cumprimento das exigências ambientais.', ativas: 6, venc: 1, prox: 2 },
  { sigla: 'RLO', nome: 'Renovação da LO', cor: '#159B6B', desc: 'Processo de renovação da Licença de Operação vigente.', ativas: 4, venc: 0, prox: 1 },
  { sigla: 'PLI', nome: 'Prorrogação da LI', cor: '#D98324', desc: 'Amplia o prazo de execução das obras autorizadas pela Licença de Instalação.', ativas: 3, venc: 0, prox: 0 },
  { sigla: 'CP', nome: 'Consulta Prévia', cor: '#6C757D', desc: 'Consulta ao órgão ambiental para verificar viabilidade e exigências do licenciamento.', ativas: 7, venc: 0, prox: 1 },
  { sigla: 'LS', nome: 'Licença Simplificada', cor: '#FCB316', desc: 'Licenciamento simplificado para atividades de pequeno porte e baixo potencial poluidor.', ativas: 10, venc: 1, prox: 2 },
];
export const tipoCor = (s) => (TIPOS.find((t) => t.sigla === s) || {}).cor || '#6C757D';
export const tipoNome = (s) => (TIPOS.find((t) => t.sigla === s) || {}).nome || s;

export const RESP_COR = {
  'Equipes internas': '#2E60AD', 'Áreas internas': '#143A6B',
  'Contratadas': '#28A745', 'Órgãos externos': '#FCB316',
};

export const LICENCAS_INICIAIS = [
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

// Cronograma (Gantt) — eixo de 6 meses (jan→jun)
export const GANTT = [
  { nome: 'Monitoramento de efluentes', lic: 'LO-2023-045', prazo: '05/06', s: 0.2, e: 5.6, st: 'andamento', prog: 62 },
  { nome: 'Relatório de fauna', lic: 'LI-2023-090', prazo: '20/03', s: 1.0, e: 2.4, st: 'concluida', prog: 100 },
  { nome: 'Renovação da LO (protocolo)', lic: 'LO-2023-045', prazo: '07/06', s: 3.2, e: 5.0, st: 'critica', prog: 30 },
  { nome: 'Programa de educação ambiental', lic: 'LI-2023-090', prazo: '30/06', s: 0.5, e: 6.0, st: 'andamento', prog: 50 },
  { nome: 'Compensação ambiental', lic: 'AUT-2024-031', prazo: '10/05', s: 2.0, e: 4.6, st: 'atrasada', prog: 40 },
  { nome: 'Monitoramento de ruído', lic: 'LO-2023-045', prazo: '15/06', s: 4.0, e: 5.2, st: 'atencao', prog: 15 },
];

export const DEMANDAS_INICIAIS = [
  { titulo: 'Esclarecimento sobre efluentes', orgao: 'CPRH', resp: 'Jurídico', prazo: '15/06/2025', prio: 'Urgente', status: 'andamento', tipo: 'Notificação' },
  { titulo: 'Relatório de fauna 1º tri', orgao: 'IBAMA', resp: 'Bioterra', prazo: '20/06/2025', prio: 'Alta', status: 'andamento', tipo: 'Requisição' },
  { titulo: 'Histórico de licenças', orgao: 'MPF', resp: 'Compliance', prazo: '24/06/2025', prio: 'Alta', status: 'pendente', tipo: 'Requisição' },
  { titulo: 'Dados de outorga de água', orgao: 'APAC', resp: 'Engenharia', prazo: '30/06/2025', prio: 'Média', status: 'pendente', tipo: 'Solicitação' },
  { titulo: 'Compensação ambiental — comprovação', orgao: 'CPRH', resp: 'Financeiro', prazo: '10/05/2025', prio: 'Urgente', status: 'atrasada', tipo: 'Exigência' },
  { titulo: 'Protocolo renovação LO', orgao: 'CPRH', resp: 'Jurídico', prazo: '07/02/2025', prio: 'Alta', status: 'concluida', tipo: 'Prazo legal' },
];

export const EVIDENCIAS_INICIAIS = [
  { nome: 'Ponto de coleta — Rio Tatuoca', tipo: 'Foto de campo', lic: 'LO-2023-045', cond: 'Monitoramento de efluentes', resp: 'J. Silva', data: '12/05/2025', hora: '09:41', lat: -8.3956, lng: -34.9712 },
  { nome: 'RT Fauna 1º Trimestre', tipo: 'Relatório técnico', lic: 'LI-2023-090', cond: 'Relatório de fauna', resp: 'Bioterra', data: '18/03/2025', hora: '14:05', lat: -8.3902, lng: -34.9650 },
  { nome: 'Laudo de ruído — limite norte', tipo: 'Laudo', lic: 'LO-2023-045', cond: 'Monitoramento de ruído', resp: 'Acustec', data: '02/05/2025', hora: '11:20', lat: -8.3880, lng: -34.9601 },
  { nome: 'Inspeção de fauna — Trilha 2', tipo: 'Foto de campo', lic: 'LI-2023-090', cond: 'Programa de educação ambiental', resp: 'M. Alves', data: '09/05/2025', hora: '06:32', lat: -8.4010, lng: -34.9588 },
];

// Agenda — junho 2025 (dia 1 = domingo)
export const AGENDA = {
  5: [{ t: 'Relatório efluentes', tipo: 'cond' }],
  7: [{ t: 'Vence LO-2023-045', tipo: 'lic' }],
  10: [{ t: 'Vistoria CPRH', tipo: 'vist' }],
  15: [{ t: 'Vence LP-2024-118', tipo: 'lic' }, { t: 'Monit. ruído', tipo: 'cond' }],
  18: [{ t: 'Auditoria interna', tipo: 'aud' }],
  20: [{ t: 'Demanda IBAMA', tipo: 'dem' }],
  22: [{ t: 'Vence Outorga', tipo: 'lic' }],
  25: [{ t: 'Vistoria de campo', tipo: 'vist' }],
  30: [{ t: 'Educação ambiental', tipo: 'evt' }],
};
export const AG_COR = { lic: '#DC3545', cond: '#2E60AD', dem: '#FCB316', aud: '#7C5CBF', vist: '#28A745', evt: '#234E91' };
export const AG_NOME = { lic: 'Licença', cond: 'Condicionante', dem: 'Demanda', aud: 'Auditoria', vist: 'Vistoria', evt: 'Evento' };

export const NAV = [
  { k: 'dashboard', label: 'Dashboard', sub: 'Visão estratégica da operação' },
  { k: 'licencas', label: 'Licenças', sub: 'Gestão de licenças ambientais' },
  { k: 'prazos', label: 'Prazos e Demandas', sub: 'Controle de prazos, demandas e responsáveis' },
  { k: 'evidencias', label: 'Evidências', sub: 'Comprovações de campo georreferenciadas' },
  { k: 'ia', label: 'Assistente IA', sub: 'Leitura e cadastro de licenças por IA' },
];

// ---- helpers puros ----
export const licStatusInfo = (st) =>
  ({ critica: ['Crítica', '#DC3545'], atencao: ['Atenção', '#FCB316'] }[st]) || ['Válida', '#28A745'];
export const riskColor = (v) => {
  const s = String(v || '');
  return /alto/i.test(s) ? '#DC3545' : /m[eé]d/i.test(s) ? '#FCB316' : '#28A745';
};
