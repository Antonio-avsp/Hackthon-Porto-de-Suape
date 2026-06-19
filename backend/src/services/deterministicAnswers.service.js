// ============================================================
// Respostas determinísticas da A.L.I.A — a partir dos dados reais, sem LLM.
//
// Espelha duas peças do BB: as respostas DIRETAS de ia_routes.py (saudação,
// capacidades, recusa) e o responderLocal do frontend (consultas operacionais
// exatas). Aqui tudo roda no servidor e devolve o contrato consultivo
// { resposta, destaques, acao_sugerida } — o mesmo formato da saída do modelo,
// para a orquestração tratar os dois caminhos de forma uniforme.
//
// Texto PURO (sem HTML): o frontend é o único ponto de escape/render.
// ============================================================

const bullet = (linhas) => linhas.map((s) => `• ${s}`).join('\n');
const r = (resposta, destaques = [], acao_sugerida = '') => ({ resposta, destaques, acao_sugerida, fonte: 'deterministico' });

// --- Respostas diretas (sem dados, sem modelo) ----------------------------
export function respostaDireta(intencao) {
  switch (intencao) {
    case 'saudacao':
      return r(
        'Olá! 👋 Sou a A.L.I.A, sua assistente de gestão e licenciamento ambiental do Porto de Suape. ' +
        'Posso verificar licenças a vencer, condicionantes atrasadas, evidências de campo, demandas críticas, ' +
        'gerar resumos e relatórios de conformidade — ou ler o PDF/imagem de uma licença e cadastrá-la.',
        [],
        'Experimente: "Quais licenças vencem nos próximos 30 dias?"',
      );
    case 'capacidades':
      return r(
        'Posso te ajudar a: acompanhar licenças (a vencer, vencidas, por órgão); monitorar condicionantes ' +
        '(atrasadas, sem evidência, sem protocolo, por licença); consultar evidências georreferenciadas ' +
        '(coordenadas, data e hora); priorizar demandas e responsáveis; e gerar resumo executivo, relatório de ' +
        'conformidade e plano de ação. Também leio PDFs/imagens de licenças e preencho o cadastro automaticamente.',
        [],
        'Peça, por exemplo: "Gere um resumo executivo ambiental".',
      );
    case 'fora_escopo':
      return r(
        'Esse assunto está fora do meu escopo. Sou especialista em gestão ambiental do Porto de Suape e posso ' +
        'ajudar com licenças, condicionantes, prazos, evidências, demandas e conformidade.',
        [],
        'Posso, por exemplo, listar as condicionantes atrasadas.',
      );
    case 'acao_destrutiva':
      return r(
        'Não posso executar ações que alteram o sistema (excluir, editar, protocolar ou aprovar licenças e ' +
        'condicionantes). Posso, no entanto, te mostrar exatamente o que precisa de ação e onde resolver na plataforma.',
        [],
        'Quer que eu liste as pendências que exigem ação?',
      );
    default:
      return null;
  }
}

// --- Respostas operacionais (exatas, a partir dos dados reais) -------------
export function respostaOperacional(intencao, entidades, snap) {
  switch (intencao) {
    case 'licencas_vencendo': {
      const dias = entidades.dias || 30;
      const venc = snap.licencas
        .filter((l) => l._dias != null && l._dias >= 0 && l._dias <= dias)
        .sort((a, b) => a._dias - b._dias);
      if (!venc.length) return r(`Nenhuma licença vence nos próximos ${dias} dias. 👍`, [], 'Quer ver as condicionantes do período?');
      return r(
        `${venc.length} licença(s) vencem nos próximos ${dias} dias:\n` +
          bullet(venc.map((l) => `${l.id} (${l.sigla}/${l.orgao}) — vence ${l.validade}, em ${l._dias} dias · resp. ${l.resp}`)),
        venc.filter((l) => l._dias <= 15).map((l) => `${l.id} vence em ${l._dias} dias`),
        'Priorize o protocolo de renovação das licenças com menor prazo.',
      );
    }
    case 'licencas_vencidas': {
      const venc = snap.vencidas.sort((a, b) => a._dias - b._dias);
      if (!venc.length) return r('Nenhuma licença vencida no momento. ✅', [], '');
      return r(
        `${venc.length} licença(s) vencida(s):\n` +
          bullet(venc.map((l) => `${l.id} (${l.sigla}/${l.orgao}) — venceu ${l.validade}, há ${Math.abs(l._dias)} dias · resp. ${l.resp}`)),
        venc.map((l) => `${l.id} vencida há ${Math.abs(l._dias)} dias`).slice(0, 3),
        'Regularize as licenças vencidas com urgência junto ao órgão emissor.',
      );
    }
    case 'licencas_por_orgao': {
      const pares = Object.entries(snap.porOrgao).sort((a, b) => b[1] - a[1]);
      if (!pares.length) return r('Não há licenças cadastradas.', [], '');
      const [lider] = pares;
      return r(
        `Licenças por órgão emissor:\n` + bullet(pares.map(([o, q]) => `${o}: ${q} licença(s)`)),
        [`${lider[0]} é o órgão com mais licenças (${lider[1]})`],
        '',
      );
    }
    case 'condicionantes_atrasadas': {
      const atr = snap.condAtrasadas;
      if (!atr.length) return r('Nenhuma condicionante atrasada no momento. ✅', [], '');
      return r(
        `${atr.length} condicionante(s) atrasada(s)/crítica(s):\n` +
          bullet(atr.map((c) => `${c.nome} — licença ${c.licenca} (${c.orgao}), ${c.prog}% · resp. ${c.resp}`)),
        [`${atr.length} condicionante(s) exigem ação imediata`],
        'Registre evidências e protocole as condicionantes atrasadas.',
      );
    }
    case 'condicionantes_sem_evidencia': {
      let sem = snap.condSemEvidencia;
      if (entidades.licencaId) sem = sem.filter((c) => c.licenca.toUpperCase() === entidades.licencaId);
      const escopo = entidades.licencaId ? ` da licença ${entidades.licencaId}` : '';
      if (!sem.length) return r(`Todas as condicionantes${escopo} já têm evidência vinculada. ✅`, [], '');
      return r(
        `${sem.length} condicionante(s)${escopo} sem evidência vinculada:\n` +
          bullet(sem.map((c) => `${c.nome} — licença ${c.licenca} · resp. ${c.resp}`)),
        [],
        'Anexe fotos/relatórios georreferenciados às condicionantes sem evidência.',
      );
    }
    case 'condicionantes_sem_protocolo': {
      const sem = snap.condSemProtocolo;
      if (!sem.length) return r('Todas as condicionantes já têm protocolo enviado. ✅', [], '');
      return r(
        `${sem.length} condicionante(s) sem protocolo enviado:\n` +
          bullet(sem.map((c) => `${c.nome} — licença ${c.licenca} · ${c.prog}%`)),
        [],
        'Protocole as comprovações pendentes junto ao órgão.',
      );
    }
    case 'condicionantes_mes': {
      const lista = snap.condAtrasadas.concat(snap.conds.filter((c) => c.st === 'atencao'));
      if (!lista.length) return r('Não há condicionantes em atraso ou em atenção no período. ✅', [], '');
      return r(
        `${lista.length} condicionante(s) requerem atenção:\n` +
          bullet(lista.map((c) => `${c.nome} — licença ${c.licenca}, status ${c.statusLabel} · resp. ${c.resp}`)),
        [],
        'Acompanhe os prazos das condicionantes em atenção.',
      );
    }
    case 'licenca_mais_condicionantes': {
      const cont = {};
      for (const c of snap.conds) cont[c.licenca] = (cont[c.licenca] || 0) + (c.st !== 'concluida' ? 1 : 0);
      const pares = Object.entries(cont).sort((a, b) => b[1] - a[1]);
      if (!pares.length) return r('Não há condicionantes pendentes.', [], '');
      const [lic, q] = pares[0];
      return r(
        `A licença com mais condicionantes pendentes é ${lic}, com ${q} pendência(s).`,
        pares.slice(0, 3).map(([l, n]) => `${l}: ${n} pendente(s)`),
        `Priorize o atendimento das condicionantes de ${lic}.`,
      );
    }
    case 'demandas_criticas': {
      const crit = snap.demandasCriticas;
      if (!crit.length) return r('Nenhuma demanda crítica em aberto. ✅', [], '');
      return r(
        `${crit.length} demanda(s) crítica(s) em aberto:\n` +
          bullet(crit.map((d) => `${d.titulo} (${d.orgao}) — prazo ${d.prazo}, ${d.prio} · resp. ${d.resp}`)),
        [],
        'Responda primeiro às demandas urgentes e vencidas.',
      );
    }
    case 'responsavel_pendencias': {
      const cont = {};
      for (const c of snap.conds) if (c.st !== 'concluida') cont[c.resp] = (cont[c.resp] || 0) + 1;
      for (const d of snap.demandasAbertas) cont[d.resp] = (cont[d.resp] || 0) + 1;
      const pares = Object.entries(cont).sort((a, b) => b[1] - a[1]);
      if (!pares.length) return r('Não há pendências atribuídas no momento. ✅', [], '');
      return r(
        `Responsáveis com mais pendências:\n` + bullet(pares.slice(0, 6).map(([resp, q]) => `${resp}: ${q} pendência(s)`)),
        [`${pares[0][0]} concentra ${pares[0][1]} pendência(s)`],
        '',
      );
    }
    case 'evidencia_consulta': {
      let evs = snap.evidencias;
      if (entidades.licencaId) evs = evs.filter((e) => (e.lic || '').toUpperCase() === entidades.licencaId);
      if (!evs.length) {
        return r(
          entidades.licencaId
            ? `Não há evidências registradas para a licença ${entidades.licencaId}.`
            : 'Não há evidências registradas.',
          [], '',
        );
      }
      return r(
        `${evs.length} evidência(s) registrada(s)${entidades.licencaId ? ` para ${entidades.licencaId}` : ''}:\n` +
          bullet(evs.map((e) => `"${e.nome}" — ${e.cond} (licença ${e.lic}) · coordenadas ${e.lat}, ${e.lng} · ${e.data} ${e.hora} · ${e.resp}`)),
        [],
        'Abra a aba Evidências para ver o mini-mapa georreferenciado.',
      );
    }
    default:
      return null;
  }
}

// --- Fallback analítico (quando o LLM está indisponível) -------------------
export function fallbackAnalitico(intencao, snap) {
  const k = snap.kpis;
  const baseDestaques = [
    `${k.licencas_vencendo_30d} licença(s) vencem em 30 dias` + (k.licencas_vencidas ? `; ${k.licencas_vencidas} vencida(s)` : ''),
    `${k.condicionantes_atrasadas} condicionante(s) atrasada(s); ${k.condicionantes_sem_evidencia} sem evidência`,
    `${k.demandas_criticas} demanda(s) crítica(s) em aberto`,
  ];

  if (intencao === 'plano_acao') {
    const acoes = [];
    snap.vencidas.forEach((l) => acoes.push(`[ALTA] Regularizar ${l.id} (vencida) — resp. ${l.resp}`));
    snap.vencendo30.filter((l) => l._dias <= 15).forEach((l) => acoes.push(`[ALTA] Protocolar renovação de ${l.id} (vence em ${l._dias} dias) — resp. ${l.resp}`));
    snap.condAtrasadas.forEach((c) => acoes.push(`[ALTA] Atender condicionante "${c.nome}" da ${c.licenca} — resp. ${c.resp}`));
    snap.condSemEvidencia.slice(0, 5).forEach((c) => acoes.push(`[MÉDIA] Registrar evidência da condicionante "${c.nome}" (${c.licenca})`));
    snap.demandasCriticas.forEach((d) => acoes.push(`[MÉDIA] Responder demanda "${d.titulo}" (${d.orgao}) até ${d.prazo}`));
    return {
      resposta: `Plano de ação priorizado (score de conformidade ${snap.score.valor}/100 — ${snap.score.saude}):\n` +
        bullet(acoes.length ? acoes : ['Sem pendências críticas no momento. Mantenha o monitoramento das condicionantes recorrentes.']),
      destaques: baseDestaques,
      acao_sugerida: 'Atribua responsáveis e prazos às ações de prioridade alta.',
      fonte: 'deterministico',
    };
  }

  // resumo_executivo / relatorio_conformidade / pergunta_geral
  const titulo = intencao === 'relatorio_conformidade' ? 'Relatório de conformidade' : 'Resumo executivo ambiental';
  return {
    resposta:
      `${titulo} — Porto de Suape (ref. ${snap.refDate.toLocaleDateString('pt-BR')})\n` +
      `Score de conformidade: ${snap.score.valor}/100 (${snap.score.saude}).\n` +
      bullet([
        `${k.licencas_total} licenças cadastradas; ${k.licencas_vencendo_30d} vencem em 30 dias; ${k.licencas_vencidas} vencidas.`,
        `${k.condicionantes_total} condicionantes; ${k.condicionantes_atrasadas} atrasadas; ${k.condicionantes_sem_evidencia} sem evidência; ${k.condicionantes_sem_protocolo} sem protocolo.`,
        `${k.demandas_abertas} demandas abertas (${k.demandas_criticas} críticas); ${k.evidencias_total} evidências registradas.`,
      ]),
    destaques: baseDestaques,
    acao_sugerida: 'Gere um plano de ação para tratar as pendências prioritárias.',
    fonte: 'deterministico',
  };
}

export default { respostaDireta, respostaOperacional, fallbackAnalitico };
