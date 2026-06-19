// ============================================================
// Schema de extração de licenças ambientais.
// Espelha o contrato consumido pelo frontend (gml-react/src/lib/ai.js),
// garantindo que a resposta da LLM chegue no formato esperado.
// ============================================================

export const SIGLAS_VALIDAS = ['AUT', 'LP', 'LI', 'LO', 'RLO', 'PLI', 'CP', 'LS'];
export const RISCOS_VALIDOS = ['Baixo', 'Médio', 'Alto'];

// Mapa de cores (sistema semafórico) usado pelo frontend.
const RISK_COLORS = { Alto: '#DC3545', 'Médio': '#FCB316', Baixo: '#28A745' };

/** Cor associada a um nível de risco (fallback cinza corporativo). */
export function riskColor(risco) {
  return RISK_COLORS[risco] || '#6C757D';
}

/**
 * JSON Schema (responseSchema do Gemini) para forçar a saída estruturada.
 * O Gemini usa um subconjunto do OpenAPI 3.0 Schema.
 */
export const LICENSE_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    tipo: { type: 'string' },
    sigla: { type: 'string', enum: SIGLAS_VALIDAS },
    orgao: { type: 'string' },
    numero: { type: 'string' },          // N° da licença/autorização
    processo: { type: 'string' },        // N° do processo administrativo
    protocolo: { type: 'string' },       // N° de protocolo / solicitação
    data_emissao: { type: 'string' },    // Data de emissão
    validade: { type: 'string' },
    objeto: { type: 'string' },          // Objeto / empreendimento / razão social
    endereco: { type: 'string' },        // Endereço / logradouro
    municipio: { type: 'string' },       // Município / UF
    cep: { type: 'string' },             // CEP
    cnpj_cpf: { type: 'string' },        // CNPJ ou CPF do empreendedor/requerente
    localizacao: { type: 'string' },     // Localização do empreendimento
    classificacao_risco: { type: 'string', enum: RISCOS_VALIDOS },
    resumo: { type: 'string' },
    condicionantes: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          descricao: { type: 'string' },
          periodicidade: { type: 'string' },
          prazo: { type: 'string' },
          risco: { type: 'string', enum: RISCOS_VALIDOS },
        },
        required: ['descricao', 'periodicidade', 'prazo', 'risco'],
      },
    },
  },
  required: ['tipo', 'sigla', 'orgao', 'processo', 'validade', 'classificacao_risco', 'resumo', 'condicionantes'],
};

/**
 * Normaliza/sanitiza o JSON devolvido pela LLM para o formato final do frontend,
 * acrescentando as cores do sistema semafórico.
 * @param {Record<string, any>} raw
 */
export function adaptLicenseExtract(raw = {}) {
  const condicionantes = Array.isArray(raw.condicionantes) ? raw.condicionantes : [];
  return {
    sigla: SIGLAS_VALIDAS.includes(raw.sigla) ? raw.sigla : 'LO',
    tipo: raw.tipo || '—',
    orgao: raw.orgao || '—',
    numero: raw.numero || '—',
    processo: raw.processo || '—',
    protocolo: raw.protocolo || '—',
    dataEmissao: raw.data_emissao || '—',
    objeto: raw.objeto || '—',
    endereco: raw.endereco || '—',
    municipio: raw.municipio || '—',
    cep: raw.cep || '—',
    cnpjCpf: raw.cnpj_cpf || '—',
    localizacao: raw.localizacao || '—',
    descricao: raw.descricao || raw.resumo || '—',
    validade: raw.validade || '—',
    risco: RISCOS_VALIDOS.includes(raw.classificacao_risco) ? raw.classificacao_risco : '—',
    riscoCor: riskColor(raw.classificacao_risco),
    resumo: raw.resumo || '—',
    cond: condicionantes.map((c) => ({
      descricao: c?.descricao || '—',
      periodicidade: c?.periodicidade || '—',
      prazo: c?.prazo || '—',
      risco: c?.risco || '—',
      cor: riskColor(c?.risco),
    })),
  };
}
