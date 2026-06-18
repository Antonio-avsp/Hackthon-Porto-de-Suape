# 🛰️ GML Backend — API + Integração Gemini Flash Lite 3.1

Backend da **Plataforma de Gestão Ambiental GML** (Porto de Suape). Expõe uma API
REST que centraliza as chamadas de **IA** — substituindo a integração que hoje é
feita direto do navegador (e expõe a chave). O frontend passa a falar com o
Gemini através deste serviço:

```
Frontend → API Backend → geminiService → Gemini Flash Lite 3.1 → Backend → Frontend
```

## 🧱 Stack

- **Node.js ≥ 18.17** (usa `fetch` nativo) · **Express 4** (ESM)
- **Helmet · CORS · express-rate-limit** — segurança básica
- **Multer** — upload de PDF/imagem em memória
- **Morgan** + logger próprio — logs estruturados
- **Google Gemini** (`gemini-3.1-flash-lite`) — via REST, sem lock-in de SDK

## 🗂️ Arquitetura (separação de responsabilidades)

```
backend/
├── src/
│   ├── server.js                 # bootstrap + ciclo de vida do processo
│   ├── app.js                    # configuração do Express (middlewares, rotas)
│   ├── config/                   # env.js — configuração validada (única fonte de verdade)
│   ├── routes/                   # definição de endpoints (health, ai)
│   ├── controllers/              # orquestram requisição → service → resposta
│   ├── services/
│   │   ├── geminiService.js      # camada exclusiva da LLM (prompts/orquestração)
│   │   └── license.service.js    # regra de negócio: leitura de licenças
│   ├── integrations/gemini/
│   │   └── geminiClient.js       # cliente HTTP de baixo nível (timeout, retry)
│   ├── repositories/             # persistência (conversas — em memória, plugável)
│   ├── middlewares/              # auth, validação, upload, rate-limit, erros
│   ├── models/                   # license.schema.js — schema + adaptação de saída
│   └── utils/                    # logger, ApiError, ApiResponse, asyncHandler
├── .env.example
├── package.json
└── README.md
```

**Por que essa divisão?** O *controller* não conhece a LLM; o *service* não conhece
HTTP; o *client* não conhece regra de negócio. Trocar de modelo/provedor exige mexer
**apenas** em `integrations/gemini/geminiClient.js`.

---

## ⚙️ Configuração do ambiente

1. Copie o arquivo de exemplo e preencha a chave:

   ```bash
   cd backend
   cp .env.example .env
   ```

2. Variáveis principais (`.env`):

   | Variável            | Descrição                                              | Padrão                    |
   |---------------------|--------------------------------------------------------|---------------------------|
   | `PORT`              | Porta do servidor                                      | `3333`                    |
   | `CORS_ORIGIN`       | Origens liberadas (vírgula) ou `*`                     | `http://localhost:5173`   |
   | `GEMINI_API_KEY`    | **Chave da API** ([Google AI Studio][key])             | —                         |
   | `GEMINI_MODEL`      | Modelo usado                                           | `gemini-3.1-flash-lite`   |
   | `GEMINI_TIMEOUT_MS` | Timeout das chamadas à IA                              | `30000`                   |
   | `GEMINI_MAX_RETRIES`| Retentativas em erro transitório                       | `2`                       |
   | `API_KEY`           | (Opcional) protege as rotas via header `x-api-key`     | —                         |
   | `DATABASE_URL`      | (Placeholder) reservado para persistência futura       | —                         |

[key]: https://aistudio.google.com/app/apikey

---

## ▶️ Instalação e execução

```bash
cd backend
npm install
npm run dev      # com --watch (recarrega ao salvar)
# ou
npm start        # produção
```

Saída esperada:

```
🚀 GML Backend rodando em http://localhost:3333 (development)
   IA: gemini-3.1-flash-lite via Google Gemini
```

> Sem `GEMINI_API_KEY`, o servidor sobe normalmente, mas as rotas de IA respondem
> **503** com mensagem clara — ótimo para validar a infra antes de ter a chave.

---

## 🔌 Endpoints

Todas as respostas seguem o envelope padrão:

```jsonc
// sucesso
{ "success": true, "data": { /* ... */ }, "meta": { "timestamp": "..." } }
// erro
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "..." }, "meta": { "timestamp": "..." } }
```

### `GET /api/health`
Status do serviço e disponibilidade da IA.

```bash
curl http://localhost:3333/api/health
```

### `POST /api/ai/chat`
Conversa de texto com o assistente.

```bash
curl -X POST http://localhost:3333/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "O que é uma condicionante de licença de operação?",
    "history": [
      { "role": "user", "text": "Olá" },
      { "role": "assistant", "text": "Olá! Como posso ajudar?" }
    ]
  }'
```

Resposta: `{ "success": true, "data": { "conversationId": "...", "reply": "..." } }`

### `POST /api/ai/licenses/extract`
Lê um **PDF/imagem** de licença (campo `file`) e devolve os dados estruturados
prontos para o cadastro do frontend.

```bash
curl -X POST http://localhost:3333/api/ai/licenses/extract \
  -F "file=@/caminho/Licenca_Operacao.pdf"
```

Resposta (`data.license`):

```json
{
  "sigla": "LO",
  "tipo": "Licença de Operação",
  "orgao": "CPRH",
  "processo": "2023.045.PE",
  "validade": "07/06/2025",
  "risco": "Alto",
  "riscoCor": "#DC3545",
  "resumo": "Operação de terminal de granéis em Suape/PE...",
  "cond": [
    { "descricao": "Monitoramento mensal de efluentes", "periodicidade": "Mensal", "prazo": "05/06/2025", "risco": "Alto", "cor": "#DC3545" }
  ]
}
```

### `POST /api/ai/licenses/extract-text`
Mesma extração, a partir de **texto bruto** (campo `text`) — útil quando o OCR é
feito antes.

```bash
curl -X POST http://localhost:3333/api/ai/licenses/extract-text \
  -H "Content-Type: application/json" \
  -d '{ "text": "LICENÇA DE OPERAÇÃO Nº ... CPRH ..." }'
```

---

## 🔗 Como conectar o frontend (gml-react)

A integração atual (`gml-react/src/lib/ai.js`) chama a Anthropic direto do
navegador. Para usar este backend, troque a chamada por:

```js
export async function extractLicense(file) {
  const form = new FormData();
  form.append('file', file);
  const resp = await fetch('http://localhost:3333/api/ai/licenses/extract', {
    method: 'POST',
    body: form,
  });
  const json = await resp.json();
  if (!json.success) throw new Error(json.error.message);
  return json.data.license; // já no formato do cartão/cadastro
}
```

Defina `CORS_ORIGIN=http://localhost:5173` no `.env` para liberar o Vite.

---

## 🔒 Segurança

- **Helmet** (cabeçalhos), **CORS** restrito por origem, **rate-limit** (30 req/min/IP nas rotas de IA).
- **Chave da IA só no servidor** — nunca exposta ao navegador.
- Autenticação opcional por `x-api-key` (ative definindo `API_KEY`).
- Upload limitado a 15 MB e a tipos PDF/imagem.

## 🧪 Teste rápido (sem chave)

```bash
npm start
curl http://localhost:3333/api/health     # { "ai": { "available": false } }
```

Com a `GEMINI_API_KEY` configurada, `available` passa a `true` e os endpoints de IA funcionam.
