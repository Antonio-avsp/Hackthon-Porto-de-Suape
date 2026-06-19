# A.L.I.A — Arquitetura de IA inspirada no Consultor do Banco do Brasil

> **Objetivo:** fazer a A.L.I.A (Automação de Licenças e Inteligência Ambiental — Porto de Suape)
> funcionar **como a IA do Banco do Brasil em termos de arquitetura, experiência e inteligência
> operacional**, porém especializada em **gestão e licenciamento ambiental**.
>
> Este documento contém: (1) engenharia reversa da solução BB, (2) análise do estado atual da
> A.L.I.A e *gap analysis*, (3) arquitetura-alvo, (4) plano de migração e (5) o **núcleo já
> implementado** (com exemplos reais testados).

---

## 1. Sumário executivo

A IA do Banco do Brasil **não é** "mandar a pergunta para o LLM". É uma **orquestração
determinística** em que o modelo (`gemini-3.1-flash-lite`) é apenas a *camada de linguagem
natural* sobre um **núcleo determinístico e auditável**:

```
Pergunta → [Intenção determinística] → [Dados reais escopados] → [Prompt estruturado]
         → [LLM em modo JSON] → [Validação contra os dados] → [Fallback determinístico]
```

A A.L.I.A já tinha boas peças isoladas (OCR estruturado de licenças, respostas locais), mas a
**inteligência estava fragmentada no frontend** e o `/chat` do backend era um **proxy "cego"** do
Gemini (sem dados de domínio). Reconstruímos o núcleo **no backend**, espelhando 1:1 o padrão do
BB, adaptado ao domínio ambiental.

| Conceito BB | Arquivo BB (Python/FastAPI) | Equivalente A.L.I.A (Node/Express) — implementado |
|---|---|---|
| Classificação de intenção determinística | `app/services/intent.py` | `backend/src/services/intent.service.js` |
| Contexto/snapshot de dados reais | `app/services/finance_context.py` | `backend/src/services/environmentalContext.service.js` |
| Engenharia de prompt (V5) + anti-injeção | `app/core/prompts.py` | `backend/src/services/prompts.js` |
| Respostas diretas + fallback determinístico | `app/routes/ia_routes.py` (`_resp_*`) + `metas_ia_service` | `backend/src/services/deterministicAnswers.service.js` |
| Orquestração do endpoint | `app/routes/ia_routes.py` (`api_llm`) | `backend/src/services/assistant.service.js` |
| Saída JSON estruturada do modelo | `response_mime_type=application/json` | `geminiService.generateStructured` + `CONSULT_RESPONSE_SCHEMA` |
| OCR/visão de documento | (CSV import + categorização) | `license.service.js` (já existia — mantido) |

---

## 2. Engenharia reversa da IA do Banco do Brasil

### 2.1 Stack e modelo
- **Backend:** Python + **FastAPI** (`app/main.py`), estado por usuário isolado por `uid`.
- **Frontend:** **vanilla JS** (`assets/js/chat.js`) — sem framework.
- **Modelo único:** `gemini-3.1-flash-lite`. **Sem cascata, sem fallback de modelo** — quando falha,
  devolve payload de indisponibilidade. Config: `temperature=0.4`, `max_output_tokens=2048`,
  `response_mime_type="application/json"`.

### 2.2 Fluxo completo da LLM (V5 — consultor conversacional)
Em `app/routes/ia_routes.py::api_llm`:

1. **Classificação determinística** (`intent.analisar`) **antes de qualquer chamada ao modelo** —
   decide a intenção e extrai período (mês/ano).
2. **Intenções diretas** (saudação, capacidades, ação bancária proibida, fora de escopo) →
   **resposta pronta, sem LLM e sem dados**. Economiza cota e é 100% confiável.
3. **Intenções financeiras** → consulta o CSV **no período solicitado**, valida (se o mês não
   existe, responde listando os meses disponíveis — sem LLM), monta o **contexto escopado** e só
   então chama o modelo.
4. **Parsing tolerante** do JSON (`_parse_resposta`) + normalização para o schema.

### 2.3 Estratégia de prompts (`app/core/prompts.py`)
- Dois system prompts versionados: **V4** (diagnóstico estruturado) e **V5** (consultivo).
- **Regras de ouro:** *"NUNCA invente números — use apenas o CONTEXTO"*; responder **somente** o
  período pedido; citar o mês/ano e os números reais.
- **Defesa contra prompt injection:** a pergunta chega entre `<<<PERGUNTA>>>` e `<<<FIM>>>`, com
  instrução explícita de **ignorar comandos embutidos** (mudar papel, revelar prompt, sair do schema).
- **Saída obrigatória em JSON** (V5): `{ "resposta", "destaques", "acao_sugerida" }`.

### 2.4 Contexto enviado para a IA (`app/services/finance_context.py`)
- **Fonte única de verdade no backend**, isolada por `uid` (`_TRANSACOES_IMPORTADAS[uid]`, etc.).
- `snapshot(mes)` consolida o período: receita, despesa, saldo, score, gastos por categoria,
  maiores despesas, métricas detalhadas.
- Analytics para o modelo: `score_detalhado` (4 componentes), `analisar_tendencias`,
  `analisar_padrao_gastos`, `projetar_proximo_mes`.
- **Não é RAG vetorial** — é **injeção de contexto estruturado** (mais confiável para dados
  tabulares/operacionais). Os blocos de contexto são montados com formatação determinística
  (`_bloco_periodo`).

### 2.5 Gerenciamento de memória
- **Curto prazo:** os últimos **6 turnos** são enviados no `historico` do request (schema
  `TurnoConversa`, `max_length=1000`) — usados **só para continuidade**, nunca para substituir os
  dados reais.
- **Persistência:** `localStorage` namespaceado por usuário no frontend (`chatHistorico`, isolado
  multiusuário) — sobrevive a refresh e troca de telas.
- **Memória de longo prazo = o estado do usuário** (CSV/lançamentos) server-side, por `uid`.

### 2.6 "Function calling", RAG e agentes — o que o BB realmente faz
- **Function calling nativo:** ❌ não usa *tools* do Gemini. Usa **endpoints dedicados** como
  "ferramentas" determinísticas (`/api/metas/suggest-with-ai`, `/api/metas/alertas`,
  `/api/previsoes`).
- **RAG:** ❌ não há *embeddings*. Há **recuperação determinística** de dados estruturados (snapshot).
- **Agentes:** ❌ não há multiagente. Há um **orquestrador determinístico** (intenção → handler).
- **Padrão-chave** (`metas_ia_service.py`): IA gera → **`validar_e_normalizar`** ajusta os valores à
  capacidade real do cliente (ex.: meta não pode exceder o teto financeiro) → **`metas_fallback`**
  determinístico quando o modelo falha. **O modelo nunca é a fonte da verdade.**

### 2.7 Tratamento de documentos (o análogo do OCR)
O BB não faz OCR, mas a A.L.I.A **já tem** o equivalente correto: `license.service.js` usa
`generateStructured` com **`responseSchema`** (subconjunto OpenAPI) para forçar extração estruturada
de PDF/imagem — exatamente a estratégia que o BB usa para *forçar JSON*. **Mantivemos e reaproveitamos.**

### 2.8 Segurança (herdada na A.L.I.A)
- Bearer/`x-api-key` nas rotas de IA; **rate-limit**; limite de tamanho do prompt (schema).
- **Anti-injeção** por delimitadores; saída tratada como **texto puro** e escapada **uma única vez**
  no frontend (evita *double-encoding*).

---

## 3. Estado atual da A.L.I.A e *gap analysis*

| Aspecto | BB | A.L.I.A (antes) | Lacuna |
|---|---|---|---|
| Camada de intenção | Backend, determinística e testável | Frontend (`responderLocal`), limitada | Inteligência fora do servidor |
| Contexto p/ o modelo | Backend, escopado, fonte única | Frontend (`buildContext`) despeja tudo | `/chat` do backend **não conhecia os dados** |
| Saída do modelo | JSON estruturado + parsing tolerante | Texto cru | Sem `destaques`/`acao_sugerida`/validação |
| Anti-injeção | `<<<PERGUNTA>>>`+regras | Ausente | Risco de *prompt injection* |
| Validação vs dados reais | `validar_e_normalizar` + fallback | Ausente | Modelo podia "alucinar" sem rede de segurança |
| Memória | localStorage + histórico no request | localStorage (`gml_chat_messages`) | OK (mantido e melhorado) |
| Data de referência | `[DATA ATUAL]` calculada | "12/06/2025" *hardcoded* no front | Centralizada no backend (`refDate`) |
| OCR de documento | — | `generateStructured` + schema | ✅ já correto |

---

## 4. Arquitetura-alvo da A.L.I.A

```
┌────────────────────────── FRONTEND (gml-react) ──────────────────────────┐
│ AssistenteIA.jsx → lib/api.js::assistAI(prompt, estado, history)          │
│   • envia o ESTADO REAL { licencas, demandas, evidencias }                │
│   • renderiza { resposta, destaques, acao_sugerida }                      │
│   • memória persistente em localStorage (sobrevive refresh/troca de tela) │
│   • fallback OFFLINE: responderLocal (mesmos dados reais)                 │
└───────────────────────────────────┬───────────────────────────────────────┘
                                     │  POST /api/ai/assist
┌───────────────────────────────────▼─────────── BACKEND (Express) ─────────┐
│ assistant.service.js  (espelha ia_routes.api_llm)                          │
│  1. intent.service.analisar(prompt)        → intenção + entidades          │
│  2. INTENÇÃO DIRETA   → deterministicAnswers.respostaDireta (sem dados/LLM)│
│  3. environmentalContext.snapshot(estado)  → KPIs + score determinísticos  │
│  4. INTENÇÃO OPERACIONAL → respostaOperacional (EXATA, sem LLM)            │
│  5. INTENÇÃO ANALÍTICA   → prompts.construirPromptConsultivo               │
│                          → geminiService.generateStructured (JSON, t=0.4)  │
│                          → normaliza → (falhou?) fallbackAnalitico         │
│  → { resposta, destaques, acao_sugerida, intencao, fonte, kpis, score }    │
└───────────────────────────────────┬───────────────────────────────────────┘
                                     │ (só intenções analíticas)
                          ┌──────────▼──────────┐
                          │ Gemini Flash Lite 3.1│  (chave só no servidor)
                          └──────────────────────┘
```

**Princípio herdado do BB:** *a inteligência mora no backend*; o modelo só entra quando agrega
linguagem natural; **todo número vem de dado real**; **sempre há fallback determinístico**.

---

## 5. Plano de migração

- **Fase 0 — Engenharia reversa** ✅ (este documento).
- **Fase 1 — Núcleo cognitivo no backend** ✅ (implementado, ver §6): intenção, contexto/KPIs,
  prompt anti-injeção, saída JSON, validação, fallback, endpoint `/assist`, testes.
- **Fase 2 — Frontend consome o núcleo** ✅: `assistAI`, renderização estruturada, fallback offline.
- **Fase 3 — Fonte única no backend** ✅ (implementado, ver §6.6): o estado de domínio passou a
  viver no servidor (`environmental.repository.js`), persistido em arquivo JSON e **semeado** no
  primeiro acesso. O frontend **hidrata** do backend e faz **write-through** das mutações; o
  `/assist` lê desse estado. A memória operacional sobrevive a **refresh, nova sessão e novo
  dispositivo**. Seam pronto para trocar por `DATABASE_URL` sem mexer nos consumidores.
- **Fase 4 — OCR → cadastro com validação** ✅ (implementado, ver §6.7): `licenseValidation.js`
  valida e normaliza a extração (datas → DD/MM/AAAA, órgão canônico, nº de processo no formato,
  periodicidade canônica, enums) **antes** de virar cadastro, devolvendo `validacao.avisos`
  auditáveis — espelhando o `validar_e_normalizar` do BB.
- **Automação anexar → ler → planilha** ✅ (implementado, ver §6.8): `/ai/licenses/ingest` extrai +
  valida + cadastra (auto se limpo; revisão de 1 clique se houver avisos) e
  `GET /spreadsheet/controle.xlsx` devolve a planilha do cliente preenchida.
- **Fase 6 — Persistência Supabase Postgres** (deploy): trocar o store de arquivo por Postgres via
  `DATABASE_URL` (interface do repositório já pronta) — necessário em produção no Render (disco efêmero).
- **Fase 5 — Relatórios ricos via LLM** (próximo): resumo executivo / relatório de conformidade /
  plano de ação narrados pelo modelo sobre o snapshot (com o fallback determinístico já pronto).

---

## 6. Núcleo implementado nesta entrega

### 6.1 Arquivos novos (backend)
- `src/services/intent.service.js` — normalização sem acentos, classificação de intenção e extração
  de entidades (dias, mês, **órgão**, **sigla**, **id de licença**).
- `src/services/environmentalContext.service.js` — `snapshot(estado, refDate)`, `flattenCondicionantes`,
  **`scoreConformidade`** (0–100 em 4 componentes) e `buildContext` escopado por intenção.
- `src/services/prompts.js` — `SYSTEM_PROMPT_ALIA` (especialista ambiental, anti-injeção, JSON),
  `construirPromptConsultivo` e `CONSULT_RESPONSE_SCHEMA`.
- `src/services/deterministicAnswers.service.js` — respostas diretas, **operacionais exatas** e
  **fallback analítico** (resumo/relatório/plano).
- `src/services/assistant.service.js` — o orquestrador (espelha `api_llm`).
- `test/intent.test.js` + `test/context.test.js` — 25 testes determinísticos (`npm test`).

### 6.2 Arquivos alterados
- `controllers/ai.controller.js` (+`assist`), `routes/ai.routes.js` (+`POST /assist`),
  `middlewares/validate.js` (+`validateAssist`), `services/geminiService.js` (temperatura
  parametrizável), `package.json` (`test`).
- Frontend: `lib/api.js` (+`assistAI`), `screens/AssistenteIA.jsx` (backend-centric + render estruturado).

### 6.3 Contrato do endpoint
**`POST /api/ai/assist`** — *após a Fase 3, lê o estado da fonte única no servidor; o cliente só envia a pergunta e o histórico.*
```jsonc
// request
{ "prompt": "Quais licenças vencem nos próximos 30 dias?",
  "history": [{ "role": "user|assistant", "text": "..." }],
  "refDate": "12/06/2025" }            // opcional (default: env.referenceDate)
// response.data
{ "resposta": "1 licença(s) vencem nos próximos 30 dias: • LO-2023-045 ...",
  "destaques": ["LO-2023-045 vence em 7 dias"],
  "acao_sugerida": "Priorize o protocolo de renovação ...",
  "intencao": "licencas_vencendo", "fonte": "deterministico",
  "kpis": { ... }, "score": { "valor": 29, "saude": "crítica", "componentes": {...} } }
```

### 6.4 Mapeamento das capacidades pedidas
| Pergunta do usuário | Intenção | Como é atendida |
|---|---|---|
| Quais licenças vencem nos próximos 30 dias? | `licencas_vencendo` | Determinístico (exato) |
| Quais licenças estão vencidas? | `licencas_vencidas` | Determinístico |
| Quais órgãos emitiram mais licenças? | `licencas_por_orgao` | Determinístico |
| Quais condicionantes estão atrasadas? | `condicionantes_atrasadas` | Determinístico |
| Quais vencem este mês? | `condicionantes_mes` | Determinístico |
| Qual licença tem mais condicionantes pendentes? | `licenca_mais_condicionantes` | Determinístico |
| Coordenadas/data/hora de uma evidência | `evidencia_consulta` | Determinístico (lat/lng/data/hora) |
| Quais demandas críticas estão abertas? | `demandas_criticas` | Determinístico |
| Quais responsáveis têm mais pendências? | `responsavel_pendencias` | Determinístico |
| Resumo executivo / relatório de conformidade | `resumo_executivo` / `relatorio_conformidade` | LLM + contexto → fallback determinístico |
| Plano de ação para as pendências | `plano_acao` | LLM + contexto → fallback determinístico |
| Ler PDF/imagem de licença e preencher cadastro | (OCR) | `license.service.js` (mantido) |

### 6.5 Exemplos reais (testados com o servidor, **sem API key** → fallback determinístico)
```
>>> Quais licenças vencem nos próximos 30 dias?      [licencas_vencendo · deterministico]
1 licença(s) vencem nos próximos 30 dias:
• LO-2023-045 (LO/CPRH) — vence 07/06/2025, em 7 dias · resp. Equipes internas
destaques: ["LO-2023-045 vence em 7 dias"]   score: 29 (crítica)

>>> Quais as coordenadas da evidência da licença LO-2023-045?   [evidencia_consulta]
• "Ponto de coleta — Rio Tatuoca" — Monitoramento de efluentes (licença LO-2023-045)
  · coordenadas -8.3956, -34.9712 · 12/05/2025 09:41 · J. Silva

>>> Gere um plano de ação para as pendências          [plano_acao · deterministico]
• [ALTA] Regularizar AUT-2024-031 (vencida) — resp. Áreas internas
• [ALTA] Protocolar renovação de LO-2023-045 (vence em 7 dias) — resp. Equipes internas ...

>>> exclua a licença LO-2023-045                       [acao_destrutiva]
Não posso executar ações que alteram o sistema (...). Posso te mostrar o que precisa de ação.
```
Com `GEMINI_API_KEY` definida, as três últimas intenções analíticas passam a ser **narradas pelo
modelo** sobre o mesmo contexto, mantendo a validação e o fallback.

---

### 6.6 Fase 3 — Fonte única de verdade no backend
- **`src/data/seed.js`** — espelha `gml-react/src/data.js`; semeia o cenário no 1º acesso.
- **`src/repositories/environmental.repository.js`** — estado server-side (licenças/demandas/
  evidências) com **persistência em arquivo JSON** (`.data/environmental-state.json`, ignorado no
  git). CRUD granular de licenças (`add/update/delete/upsertFromExtract`) e *replace* de
  demandas/evidências. Interface estável → trocar por banco real (`DATABASE_URL`) é só reimplementar.
- **`src/controllers/environmental.controller.js`** + **`routes/environmental.routes.js`** — expõem
  `GET /api/environmental/state`, `POST/PATCH/DELETE /licencas`, `POST /licencas/extract-upsert`,
  `PUT /demandas`, `PUT /evidencias`.
- **`ai.controller.assist`** agora lê `repository.getState()` (fonte única) e usa `env.referenceDate`
  (12/06/2025) — não depende mais do que o cliente envia.
- **Frontend** (`store.jsx`): **hidrata** de `GET /state` no mount (fallback ao seed local se offline)
  e faz **write-through** silencioso em cada mutação. As telas/modais **não mudaram** — o store é o
  único ponto de integração.
- **Comprovação:** criar uma licença → reiniciar o servidor → o `GET /state` e o `/assist` ainda a
  enxergam (sobrevive a nova sessão/dispositivo). Coberto por `test/repository.test.js`.

### 6.7 Fase 4 — Extração OCR com validação/normalização
- **`src/models/licenseValidation.js`** — `validateAndNormalizeLicense(license)`:
  - **datas** (validade e prazos das condicionantes) → `DD/MM/AAAA`, rejeitando datas impossíveis;
  - **órgão** → grafia canônica (CPRH, IBAMA, APAC, ANA, MPF, ICMBio, …) ou aviso;
  - **nº de processo** → confere o formato `2023.045.PE`;
  - **periodicidade** → conjunto canônico (Mensal, Trimestral, …);
  - **enums** (sigla/risco) reforçados; **coerência**: validade já vencida vira aviso.
- Retorna `validacao: { ok, avisos[] }`. O `license.service.js` aplica isso após `adaptLicenseExtract`;
  o `AssistenteIA.jsx` mostra os avisos no chat antes de "Preencher cadastro".
- Coberto por `test/licenseValidation.test.js`. **Fase 3 + 4 conectadas:** OCR → extração validada →
  "Preencher cadastro" → `upsertFromExtract` persistido no backend.

### 6.8 Automação: anexar → ler → planilha (sem trabalho manual)
Fluxo ponta a ponta, com a regra **auto quando limpo / revisão de 1 clique quando há aviso**:

```
Anexa PDF/imagem → /ai/licenses/ingest
   → extractFromFile (Gemini, JSON por schema) → validateAndNormalizeLicense (Fase 4)
   → validacao.ok ?  SIM → upsertFromExtract (fonte única, persistido)  → status "ingested"
                      NÃO → devolve extração + avisos                    → status "review"
                            → /ai/licenses/ingest/confirm (1 clique)     → grava
   → GET /spreadsheet/controle.xlsx  → planilha do cliente preenchida (projeção do estado)
```

- **`spreadsheet.service.js`** — usa o **template do cliente** (`src/templates/…xlsx`) e **ANEXA** as
  licenças num bloco rotulado, mapeando cada campo para a **coluna certa por cabeçalho** (B..AD).
  Decisão validada empiricamente: **não reescrevemos o arquivo-mestre** (o writer corrompe a
  formatação condicional → Excel pede "reparar"); removemos a formatação condicional na cópia e
  **nunca sobrescrevemos** dados/seções existentes. Fallback `buildFresh` (workbook limpo, mesmas
  colunas) se o template faltar.
- **`spreadsheet.controller.js` + route** — `GET /api/spreadsheet/controle.xlsx` gera do estado real.
- **Extração estendida** (`license.schema.js`/`license.service.js`) — agora também extrai `numero`
  (nº da licença), `data_emissao`, `objeto`, `localizacao` — as colunas que o documento alimenta. As
  colunas internas de processo (área demandante, ofício SUAPE, prazos internos, SEI…) ficam em branco
  por design (não estão no documento).
- **Frontend** — `AssistenteIA.jsx` usa `/ingest` (auto/revisão), mostra os avisos e oferece
  **"Baixar planilha de controle"**; após cadastrar, `reloadState` re-sincroniza o estado.
- **Testes** — `test/spreadsheet*.test.js` leem o `.xlsx` de volta e validam colunas, preservação
  dos dados do cliente e o modo limpo (43 testes no total).

> **Persistência em produção (Render):** o disco é efêmero → o estado em `.data/` se perde no deploy.
> A planilha é uma **projeção** do estado, então a verdade precisa morar num banco: defina
> `DATABASE_URL` (Supabase Postgres). A interface do repositório já isola a persistência — só falta a
> implementação do adapter Postgres (Fase 6). Até lá, funciona com o store de arquivo (ótimo para dev/demo).

## 7. Como rodar e testar

```bash
# Backend
cd backend && npm install
npm test                       # 25 testes determinísticos (sem rede)
cp .env.example .env           # defina GEMINI_API_KEY p/ as intenções analíticas
npm run dev                    # http://localhost:3333

# Exercitar o assistente
curl -s -X POST http://localhost:3333/api/ai/assist -H 'Content-Type: application/json' \
  -d '{"prompt":"Gere um resumo executivo ambiental","estado":{...},"refDate":"12/06/2025"}'

# Frontend
cd ../gml-react && npm install && npm run dev   # http://localhost:5173
```

> **Nota de design (pós-Fase 3):** o estado de domínio é a **fonte única no servidor**
> (`environmental.repository.js`, persistido em `.data/`). O frontend hidrata dele e faz
> write-through das mutações; o `/assist` lê dele. Assim a memória operacional sobrevive a refresh,
> nova sessão e novo dispositivo, e **toda a derivação de KPIs/contexto roda no servidor** (padrão
> BB). Para produção, trocar o store de arquivo por um banco real via `DATABASE_URL` é só
> reimplementar a interface do repositório.
