# 🛡️ A.L.I.A — Automação de Licenças e Inteligência Ambiental

> **Desafio GML** — Transformando dificuldades da Gestão Ambiental em soluções digitais · Porto de Suape
>
> *Cumprir é importante. **Comprovar é indispensável.***

**A.L.I.A** (Automação de Licenças e Inteligência Ambiental) automatiza a gestão de licenças,
condicionantes, prazos e evidências ambientais — reduzindo trabalho manual e transformando
informações dispersas em **inteligência operacional**.

A aplicação tem duas partes:

- **Frontend** — app **React (Vite + React 18)** em [`gml-react/`](gml-react/), com leitura de licenças por **IA (OCR/visão)**.
- **Backend** — API **Node.js + Express** em [`backend/`](backend/), que centraliza as chamadas de IA e integra o **Gemini Flash Lite 3.1** com a chave protegida no servidor.

---

## ▶️ Como executar

**Frontend (React):**

```bash
cd gml-react
npm install
npm run dev        # http://localhost:5173
# ou: npm run build && npm run preview
```

**Backend (API + IA):**

```bash
cd backend
npm install
cp .env.example .env   # preencha GEMINI_API_KEY
npm run dev            # http://localhost:3333
```

Detalhes e endpoints: [`backend/README.md`](backend/README.md).

---

## 🧭 Áreas

| Aba | O que faz |
|-----|-----------|
| **Dashboard** | Cronograma Gantt de condicionantes, alertas automáticos, licenças por categoria (AUT, LP, LI, LO, RLO, PLI, CP, LS) e agenda (calendário) |
| **Licenças** | Tabela com responsável e status; clique abre o **modal de detalhe**; cadastro, edição, exclusão e histórico |
| **Prazos e Demandas** | Demandas e prazos unificados, com responsável, prioridade, status e alertas |
| **Evidências** | Upload (imagem/doc/vídeo) e captura no app, com **geolocalização automática** (lat, long, data, hora, usuário) e mini-mapa |
| **Assistente IA** | Chat com anexos: envie o PDF/imagem de uma licença e a IA extrai tipo, órgão, processo, validade e condicionantes, **preenche o cadastro** e **exporta para Excel** |

### 🤖 Assistente A.L.I.A (IA contextual)

O assistente é **conectado automaticamente** — sem nenhuma configuração na interface. A chave
da LLM fica no **backend** (Gemini), nunca no navegador. Ele:

- **Responde sobre seus dados reais** ("Quais licenças vencem este mês?", "Quais condicionantes
  estão atrasadas?", "Quais evidências faltam para a licença X?") — calculado a partir do estado
  da plataforma, e com o contexto do sistema enviado ao Gemini para perguntas abertas.
- **Lê PDF/imagem de licença** (OCR/visão) via backend, extrai tipo, órgão, processo, validade e
  condicionantes, **preenche o cadastro** e **exporta para Excel**.
- **Memória de conversa** persistente — o histórico sobrevive à troca de telas e ao recarregar.

Se o backend estiver fora do ar, o app cai em **modo demonstração** (extração simulada) e avisa.

---

## 🎨 Identidade visual (paleta oficial)

| Cor | HEX | Uso |
|-----|-----|-----|
| 🔵 Azul Governança | `#2E60AD` | Cabeçalhos, menus, botões, KPIs |
| 🟡 Amarelo Estratégico | `#FCB316` | Alertas, atenção, chamadas para ação |
| 🟢 Verde Conformidade | `#28A745` | Itens válidos / concluídos |
| 🔴 Vermelho Crítico | `#DC3545` | Vencimentos, não conformidades |
| ⚪ Branco | `#FFFFFF` | Fundo principal |
| ⚫ Cinza Corporativo | `#6C757D` | Informações secundárias |

Princípios de interface: fundo predominantemente branco, **barra lateral azul institucional**,
cards com bordas suaves, ícones minimalistas e indicadores de risco em **sistema semafórico**
(verde · amarelo · vermelho).

---

## 🗂️ Estrutura

```
gml-react/
├── index.html · vite.config.js · package.json
└── src/
    ├── main.jsx · App.jsx          # bootstrap + shell + router de telas + modais
    ├── store.jsx                   # contexto de estado (licenças, demandas, evidências…)
    ├── data.js · icons.jsx · ui.jsx · styles.css
    ├── components/  Sidebar · Topbar · Toasts · Modal
    ├── screens/     Dashboard · Licencas · Prazos · Evidencias · AssistenteIA
    ├── modals/      LicencaForm · LicencaDetail · Historico · DemandaForm · AIKeyConfig
    └── lib/         ai.js (visão/OCR + Excel) · geo.js (geolocalização)

backend/
└── src/
    ├── server.js · app.js              # bootstrap + configuração do Express
    ├── config/ · routes/ · controllers/
    ├── services/   geminiService · license.service
    ├── integrations/gemini/  geminiClient   # cliente HTTP da LLM
    ├── middlewares/ · models/ · repositories/ · utils/
```

Detalhes: [`gml-react/README.md`](gml-react/README.md) · [`backend/README.md`](backend/README.md).

## 🛠️ Tecnologia

React 18 + Vite. Sem dependências de UI externas — design system próprio em CSS.

> ⚠️ Dados exibidos são **fictícios**, para fins de demonstração do conceito.
