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
- **Fase 3 — Fonte única no backend** (próximo): mover `data.js` para um `repository` no servidor,
  com persistência (`DATABASE_URL` já reservado em `env.js`), para a memória sobreviver também a
  **nova sessão/dispositivo**.
- **Fase 4 — OCR → cadastro com validação** (próximo): aplicar `validar_e_normalizar` à extração de
  licença antes de preencher o cadastro (datas/órgãos coerentes), espelhando o BB.
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
**`POST /api/ai/assist`**
```jsonc
// request
{ "prompt": "Quais licenças vencem nos próximos 30 dias?",
  "estado": { "licencas": [...], "demandas": [...], "evidencias": [...] },
  "history": [{ "role": "user|assistant", "text": "..." }],
  "refDate": "12/06/2025" }            // opcional (default: hoje)
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

> **Nota de design:** o estado de domínio ainda é editado no frontend (onde o usuário cria licenças
> via OCR, registra evidências, etc.) e é enviado ao backend a cada pergunta — assim **toda a
> derivação de KPIs/contexto roda no servidor** (padrão BB) sem exigir, nesta fase, a migração
> completa da camada de dados (Fase 3).
